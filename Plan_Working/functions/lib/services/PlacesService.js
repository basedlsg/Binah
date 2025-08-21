import axios from "axios";
const BASE_URL = "https://places.googleapis.com/v1";
function buildTextQuery(activity, city) {
    const keywords = activity.category ?? activity.description;
    const area = activity.area || city.defaultArea || city.name;
    // Make the query more specific to get better variety
    return `${keywords} ${area} ${city.name}`.trim();
}
export class PlacesService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async textSearch(activity, city) {
        const query = buildTextQuery(activity, city);
        // Bias around city center, small radius if area specified
        const hasArea = Boolean(activity.area);
        const radius = hasArea ? 4000 : 15000; // meters
        const url = `${BASE_URL}/places:searchText`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.types,places.location'
        };
        const body = {
            textQuery: query,
            locationBias: {
                circle: {
                    center: {
                        latitude: city.center.lat,
                        longitude: city.center.lng
                    },
                    radius: radius
                }
            }
        };
        try {
            const { data } = await axios.post(url, body, { headers });
            const candidates = data?.places ?? [];
            // Sort by rating descending
            candidates.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
            if (candidates.length === 0)
                return undefined;
            const candidate = candidates[0];
            return {
                placeId: candidate.id,
                name: candidate.displayName?.text || 'Unknown',
                address: candidate.formattedAddress,
                rating: candidate.rating,
                types: candidate.types,
                location: candidate.location ? { lat: candidate.location.latitude, lng: candidate.location.longitude } : { lat: 0, lng: 0 }
            };
        }
        catch (error) {
            console.error('Places API error:', error);
            return undefined;
        }
    }
    async details(placeId) {
        const url = `${BASE_URL}/places/${placeId}`;
        const headers = {
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,types,location'
        };
        try {
            const { data } = await axios.get(url, { headers });
            return {
                placeId: data.id,
                name: data.displayName?.text || 'Unknown',
                address: data.formattedAddress || 'Unknown address',
                location: {
                    lat: data.location?.latitude ?? 0,
                    lng: data.location?.longitude ?? 0
                },
                rating: data.rating,
                types: data.types
            };
        }
        catch (error) {
            console.error('Places details error:', error);
            return undefined;
        }
    }
}
