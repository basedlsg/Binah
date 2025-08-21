# Plan (Day Planner) — Firebase + React

Lean day planning app with real Google Places and Gemini. Hosting on Firebase, Functions 1st Gen (Node 18 runtime to ensure compatibility). No service worker, strict no-store for API.

Project layout:

- `client/` — Vite + React (TypeScript); builds to `www/`
- `functions/` — Express app with endpoints and services
- `www/` — built SPA output (generated)
- `firebase.json` — hosting rewrites and headers

API

- `GET /api/health` → `{ ok: true }`
- `GET /api/cities` → `[{ slug, name, timezone }]`
- `POST /api/plan` body: `{ query, date, startTime, citySlug }`
  - returns:
```
{
  id: string,
  title: string,
  planDate: string,
  city: string,
  venues: [{ name, time, address, categories: string[] }],
  places: [{ placeId, name, address, location, scheduledTime, details }],
  travelInfo: [],
  travelTimes: []
}
```

Environment (Functions config)

- `planner.google_places_api_key`
- `planner.gemini_api_key`
- optional `planner.cors_origin` (comma-separated list)

Local dev

1. Install deps:
   - `npm --prefix functions ci && npm --prefix client ci`
2. Build client to `www/`:
   - `npm --prefix client run build`
3. Emulate:
   - `npm --prefix functions run serve`

Deploy

1. Login and select project:
   - `firebase login`
   - `firebase use <PROJECT_ID>`
2. Set secrets:
   - `firebase functions:config:set planner.google_places_api_key="<KEY>" planner.gemini_api_key="<KEY>" planner.cors_origin="https://<SITE>.web.app"`
3. Deploy:
   - `firebase deploy --only functions,hosting`

Notes

- API responses set `Cache-Control: no-store`.
- No service worker; `index.html` and `sw.js` served with `no-cache` headers.
- Rate limit: 30 req / 15 min per IP on `/api/plan`.

