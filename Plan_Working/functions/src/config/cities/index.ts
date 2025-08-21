import { CityConfig } from "../../types.js";

export const cities: CityConfig[] = [
  {
    slug: "nyc",
    name: "New York City",
    timezone: "America/New_York",
    center: { lat: 40.7128, lng: -74.006 },
    defaultArea: "Manhattan",
    knownAreas: [
      "Manhattan",
      "Brooklyn",
      "Queens",
      "Chelsea",
      "SoHo",
      "Williamsburg",
      "Greenwich Village",
      "Upper East Side",
      "Upper West Side"
    ]
  },
  {
    slug: "london",
    name: "London",
    timezone: "Europe/London",
    center: { lat: 51.5074, lng: -0.1278 },
    defaultArea: "Soho",
    knownAreas: [
      "Soho",
      "Shoreditch",
      "Covent Garden",
      "South Bank",
      "Kensington",
      "Notting Hill"
    ]
  },
  {
    slug: "boston",
    name: "Boston",
    timezone: "America/New_York",
    center: { lat: 42.3601, lng: -71.0589 },
    defaultArea: "Back Bay",
    knownAreas: [
      "Back Bay",
      "Beacon Hill",
      "North End",
      "Seaport",
      "Cambridge"
    ]
  },
  {
    slug: "austin",
    name: "Austin",
    timezone: "America/Chicago",
    center: { lat: 30.2672, lng: -97.7431 },
    defaultArea: "Downtown",
    knownAreas: [
      "Downtown",
      "South Congress",
      "East Austin",
      "Rainey Street",
      "Zilker"
    ]
  }
];

export function getCity(slug: string): CityConfig | undefined {
  return cities.find((c) => c.slug === slug);
}

