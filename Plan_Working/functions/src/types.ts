export type CityConfig = {
  slug: string;
  name: string;
  timezone: string;
  center: { lat: number; lng: number };
  defaultArea: string;
  knownAreas: string[];
};

export type PlannedActivity = {
  description: string;
  area?: string;
  time?: string; // HH:mm
  category?: string;
};

export type ItineraryVenue = {
  name: string;
  time: string; // HH:mm
  address: string;
  categories: string[];
};

export type ItineraryPlace = {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  scheduledTime: string; // ISO string or HH:mm
  details?: Record<string, unknown>;
};

export type PlanResponse = {
  id: string;
  title: string;
  planDate: string;
  city: string;
  venues: ItineraryVenue[];
  places: ItineraryPlace[];
  travelInfo: unknown[];
  travelTimes: unknown[];
};

