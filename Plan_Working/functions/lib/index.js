import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as functions from "firebase-functions";
import { cities, getCity } from "./config/cities/index.js";
import { GeminiPlanner } from "./services/GeminiPlanner.js";
import { PlacesService } from "./services/PlacesService.js";
const CONFIG = {
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || functions.config()?.planner?.google_places_api_key || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || functions.config()?.planner?.gemini_api_key || "",
    CORS_ORIGIN: process.env.CORS_ORIGIN || functions.config()?.planner?.cors_origin || ""
};
const app = express();
app.use(express.json());
// Trust proxy for rate limiting behind Firebase Hosting
app.set('trust proxy', 1);
// CORS
const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];
const configuredOrigins = (CONFIG.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultAllowedOrigins;
app.use(cors({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.includes(origin))
            return cb(null, true);
        return cb(null, true); // allow by default when deployed behind same-origin hosting rewrite
    },
    credentials: false
}));
// No-store for API responses
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
// Health
app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
// Cities
app.get("/api/cities", (_req, res) => {
    res.status(200).json(cities.map((c) => ({ slug: c.slug, name: c.name, timezone: c.timezone })));
});
// Rate limit plan endpoint
const planLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});
app.post("/api/plan", planLimiter, async (req, res) => {
    const { query, date, startTime, citySlug } = req.body || {};
    if (!query || !date || !startTime || !citySlug) {
        return res.status(400).json({
            error: "Missing required fields: query, date, startTime, citySlug"
        });
    }
    const city = getCity(String(citySlug));
    if (!city) {
        return res.status(400).json({ error: "Unsupported city" });
    }
    const gemini = new GeminiPlanner(CONFIG.GEMINI_API_KEY);
    const places = new PlacesService(CONFIG.GOOGLE_PLACES_API_KEY);
    try {
        const activities = await gemini.planActivities({
            query: String(query),
            city,
            date: String(date),
            startTime: String(startTime)
        });
        console.log("Gemini activities:", activities);
        const scheduledTimes = buildScheduleTimes(activities.length, String(startTime));
        const venues = [];
        const itineraryPlaces = [];
        const usedPlaceIds = new Set();
        for (let i = 0; i < activities.length; i++) {
            const activity = activities[i];
            try {
                console.log(`Resolving activity ${i + 1}:`, activity);
                const candidate = await places.textSearch(activity, city);
                console.log(`Places candidate:`, candidate);
                if (!candidate?.placeId) {
                    console.log(`No placeId for activity ${i + 1}`);
                    continue;
                }
                // Skip if we already used this place
                if (usedPlaceIds.has(candidate.placeId)) {
                    console.log(`Skipping duplicate place: ${candidate.name}`);
                    continue;
                }
                usedPlaceIds.add(candidate.placeId);
                // Use candidate directly since it has all the data we need
                const time = normalizeTime(activity.time) || scheduledTimes[i] || scheduledTimes[0];
                venues.push({
                    name: candidate.name,
                    time,
                    address: candidate.address,
                    categories: (candidate.types || []).slice(0, 3)
                });
                itineraryPlaces.push({
                    placeId: candidate.placeId,
                    name: candidate.name,
                    address: candidate.address,
                    location: candidate.location,
                    scheduledTime: time,
                    details: { rating: candidate.rating, types: candidate.types }
                });
            }
            catch (innerErr) {
                console.error("Places resolution failed for activity", i + 1, innerErr);
                continue;
            }
        }
        // Ensure at least 3 venues if possible by trimming or fallback
        let ensuredVenues = venues.slice(0, 1);
        let ensuredPlaces = itineraryPlaces.slice(0, 1);
        // If none resolved, create generic item
        if (ensuredVenues.length === 0) {
            ensuredVenues = buildGenericVenues(String(query), city, scheduledTimes, 1);
            ensuredPlaces = [];
        }
        const response = {
            id: generateId(),
            title: buildTitle(String(query), city.name, String(date)),
            planDate: String(date),
            city: city.slug,
            venues: ensuredVenues,
            places: ensuredPlaces,
            travelInfo: [],
            travelTimes: []
        };
        return res.status(200).json(response);
    }
    catch (err) {
        console.error("/api/plan failed", err);
        const scheduledTimes = buildScheduleTimes(3, String(startTime));
        const minimal = {
            id: generateId(),
            title: buildTitle(String(query), city.name, String(date)),
            planDate: String(date),
            city: city.slug,
            venues: buildGenericVenues(String(query), city, scheduledTimes, 1),
            places: [],
            travelInfo: [],
            travelTimes: []
        };
        return res.status(200).json(minimal);
    }
});
function buildScheduleTimes(count, startHHmm) {
    const result = [];
    const [hStr, mStr] = (startHHmm || "09:00").split(":");
    let minutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    for (let i = 0; i < Math.max(3, Math.min(5, count || 3)); i++) {
        const hh = Math.floor(minutes / 60) % 24;
        const mm = minutes % 60;
        result.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
        minutes += 90;
    }
    return result;
}
function normalizeTime(t) {
    if (!t)
        return undefined;
    const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(t);
    if (match)
        return `${match[1].padStart(2, "0")}:${match[2]}`;
    return undefined;
}
function buildTitle(query, cityName, date) {
    return `${capitalizeFirst(query)} in ${cityName} (${date})`;
}
function capitalizeFirst(s) {
    if (!s)
        return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export const api = functions.https.onRequest(app);
function buildGenericVenues(query, city, times, count) {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push({
            name: capitalizeFirst(query),
            time: times[i] || times[0] || "12:00",
            address: `${city.defaultArea}, ${city.name}`,
            categories: []
        });
    }
    return items;
}
