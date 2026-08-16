import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';

const BASE_URL = process.env.PADDLING_API_BASE_URL ?? 'https://paddling.pl/api';
const TRIPS_API_URL = `${BASE_URL}/trips`;
const TRIP_AVAILABILITY_API_URL = `${BASE_URL}/trip-availability`;
const TRIP_AVAILABLE_RESOURCES_API_URL = `${BASE_URL}/trip-available-resources`;

const VOIVODESHIPS = [
  'DOLNOSLASKIE',
  'KUJAWSKO_POMORSKIE',
  'LUBELSKIE',
  'LUBUSKIE',
  'LODZKIE',
  'MALOPOLSKIE',
  'MAZOWIECKIE',
  'OPOLSKIE',
  'PODKARPACKIE',
  'PODLASKIE',
  'POMORSKIE',
  'SLASKIE',
  'SWIETOKRZYSKIE',
  'WARMINSKO_MAZURSKIE',
  'WIELKOPOLSKIE',
  'ZACHODNIOPOMORSKIE',
  'ZAGRANICA',
];

type Amenity = {
  type: string;
  name: string;
  free: boolean;
  description: string | null;
  price: number | null;
};

type Trip = {
  id: string;
  tripName: string;
  tripSlug: string;
  riverName: string;
  startLocation: string;
  endLocation: string;
  distance: string;
  duration: string;
  durationMinutes: number;
  durationUnit: 'HOURS' | 'DAYS';
  difficulty: string;
  startTime: string;
  shortDescription: string;
  amenities: Amenity[];
  rentalName: string;
  rentalSlug: string;
  rentalRating: number | null;
  rentalLogo: { url: string } | null;
  priceFrom: number;
  imageUrl: string;
  voivodeship: string;
  featured: boolean;
  hasGroupPricing: boolean;
};

type TripsResponse = {
  data: Trip[];
  page: { number: number; size: number; totalElements: number; totalPages: number };
};

const AMENITY_LABELS: Record<string, string> = {
  pets_allowed: 'pets allowed',
  parking: 'parking',
  camp_site: 'camp site',
  toilet: 'toilet',
  campfire: 'campfire',
  shelter: 'shelter',
  child_friendly: 'child friendly',
  transport: 'transport',
  electricity: 'electricity',
  kitchen: 'kitchen',
  wifi: 'wifi',
  shower: 'shower',
};

function formatAmenity(amenity: Amenity): string {
  const label = AMENITY_LABELS[amenity.type] ?? amenity.type;
  if (amenity.free) return `${label} (free)`;
  return `${label} (${amenity.price?.toFixed(2) ?? 'paid'})`;
}

function summarizeTrip(trip: Trip): string {
  const tripUrl = `https://paddling.pl/trips/${trip.rentalSlug}/${trip.tripSlug}`;
  const lines = [
    `- ${trip.tripName} (id: ${trip.id})`,
    `  Link: ${tripUrl}`,
    `  River: ${trip.riverName} | Difficulty: ${trip.difficulty} | Voivodeship: ${trip.voivodeship}`,
    `  Route: ${trip.startLocation} → ${trip.endLocation}`,
    `  Distance: ${trip.distance} | Duration: ${trip.duration} | Start: ${trip.startTime}`,
    `  Price from: ${trip.priceFrom.toFixed(2)} PLN | Rental: ${trip.rentalName}`,
    `  Amenities: ${trip.amenities.length > 0 ? trip.amenities.map(formatAmenity).join(', ') : 'none'}`,
    `  Featured: ${trip.featured} | Group pricing: ${trip.hasGroupPricing}`,
    `  Image: ${trip.imageUrl}`,
    `  ${trip.shortDescription}`,
  ];
  return lines.join('\n');
}

// Throttle outgoing requests to the paddling.pl API (~3 req/s), to avoid
// hammering the public endpoint with bursts.
const MIN_INTERVAL_MS = 333;
let lastRequestAt = 0;
async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  return fn();
}

async function fetchJson(url: string): Promise<unknown> {
  return throttled(async () => {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`paddling.pl API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  });
}

// Drift detector. The paddling.pl API is unofficial and may change without
// notice. If critical fields disappear (renamed/removed in the backend), fail
// loudly with an actionable hint instead of returning a silent, mangled result.
// Only CRITICAL fields are checked; a cosmetic contract change must not break
// the server. An empty result (e.g. no trips, no dates) is NOT drift.
const API_CHANGED_HINT =
  'The paddling.pl API response does not match the known contract (captured 2026-08) - ' +
  'the backend has likely changed. Report it: ' +
  'https://github.com/sultan-programistow/paddling-pl-mcp-server/issues';

function tripDriftError(resp: unknown): string | null {
  if (typeof resp !== 'object' || resp === null) {
    return 'the trips response is not a JSON object';
  }
  const r = resp as TripsResponse;
  if (!Array.isArray(r.data)) {
    return "the trips response is missing the 'data' array";
  }
  if (r.data.length === 0) return null; // empty result is not drift
  const t = r.data[0];
  for (const key of ['id', 'tripName', 'tripSlug', 'rentalSlug', 'priceFrom'] as const) {
    if (t[key] === undefined) {
      return `the trips results are missing the critical field '${key}'`;
    }
  }
  return null;
}

function availabilityDriftError(resp: unknown): string | null {
  if (typeof resp !== 'object' || resp === null) {
    return 'the availability response is not a JSON object';
  }
  const r = resp as { dates: string[] };
  if (!Array.isArray(r.dates)) {
    return "the availability response is missing the 'dates' array";
  }
  return null;
}

function resourcesDriftError(resp: unknown): string | null {
  if (typeof resp !== 'object' || resp === null) {
    return 'the resources response is not a JSON object';
  }
  const r = resp as {
    resources: Array<{ resourceTypeId: string; name: string; personCapacity: number; available: number }>;
  };
  if (!Array.isArray(r.resources)) {
    return "the resources response is missing the 'resources' array";
  }
  if (r.resources.length === 0) return null; // empty result is not drift
  const resource = r.resources[0];
  for (const key of ['resourceTypeId', 'name', 'personCapacity', 'available'] as const) {
    if (resource[key] === undefined) {
      return `the resources results are missing the critical field '${key}'`;
    }
  }
  return null;
}

function driftError(drift: string | null): Error | null {
  if (!drift) return null;
  return new Error(`${drift}. ${API_CHANGED_HINT}`);
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_trips',
      {
        title: 'Search Trips',
        description:
          'Lists kayaking trips available on paddling.pl. Returns a summarized overview of each trip including river, route, distance, duration, difficulty, price, voivodeship, amenities, and the trip image URL, as well as a direct link to the trip on paddling.pl (format: https://paddling.pl/trips/{rentalSlug}/{tripSlug}). When the user asks for links to specific trips, provide the link field. Can filter by one or more voivodeships (regions), a date range (dateFrom/dateTo), and a minimum group size (minPersons). Supports pagination: use page/size to navigate the full catalog. Note: the summary is not authoritative about real equipment availability — to confirm whether specific equipment (e.g. SUPs) is actually available, call get_trip_resources, which is the source of truth.',
        inputSchema: z.object({
          voivodeships: z
            .array(z.enum(VOIVODESHIPS))
            .optional()
            .describe(
              'Filter trips to these voivodeships (regions). Leave empty to return trips from all regions.',
            ),
          dateFrom: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe('Only trips available on or after this date, formatted as YYYY-MM-DD.'),
          dateTo: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe('Only trips available on or before this date, formatted as YYYY-MM-DD.'),
          minPersons: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Only trips that can accommodate at least this many persons.'),
          page: z.number().int().min(0).default(0).describe('Page number, 0-indexed.'),
          size: z
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20)
            .describe('Number of trips per page (max 100).'),
        }),
      },
      async ({ voivodeships, dateFrom, dateTo, minPersons, page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        for (const voivodeship of voivodeships ?? []) {
          params.append('voivodeship', voivodeship);
        }
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (minPersons) params.set('minPersons', String(minPersons));
        params.set('page', String(page));
        params.set('size', String(size));
        const url = `${TRIPS_API_URL}?${params.toString()}`;
        const result = (await fetchJson(url)) as TripsResponse;
        const drift = driftError(tripDriftError(result));
        if (drift) throw drift;

        const lines = result.data.length > 0
          ? result.data.map(summarizeTrip)
          : ['No trips found for this page.'];

        lines.push(
          '',
          `Page ${result.page.number} of ${result.page.totalPages} | ` +
            `${result.page.totalElements} trips total. ` +
            `Use search_trips with page/size to browse more.`,
        );

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        };
      },
    );

    server.registerTool(
      'get_trip_availability',
      {
        title: 'Get Trip Availability',
        description:
          'Returns the available dates for a specific paddling.pl trip. The tripId is the id field returned by search_trips. Dates are formatted as YYYY-MM-DD.',
        inputSchema: z.object({
          tripId: z
            .string()
            .uuid()
            .describe('The id of the trip (from search_trips).'),
        }),
      },
      async ({ tripId }) => {
        const url = `${TRIP_AVAILABILITY_API_URL}?tripId=${tripId}`;
        const result = (await fetchJson(url)) as { dates: string[] };
        const drift = driftError(availabilityDriftError(result));
        if (drift) throw drift;

        const lines =
          result.dates.length > 0
            ? [`Available dates for trip ${tripId}:`, ...result.dates.map((d) => `- ${d}`)]
            : [`No available dates for trip ${tripId}.`];

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        };
      },
    );

    server.registerTool(
      'get_trip_resources',
      {
        title: 'Get Trip Resources',
        description:
          'Returns the available equipment resources (e.g. kayaks by capacity) and how many units are still free for a specific paddling.pl trip on a given date. This tool is the source of truth for real equipment availability: information in the trip description from search_trips (e.g. amenities) is not authoritative and may be outdated or incomplete. Always call this tool to confirm whether specific equipment (e.g. SUPs) is actually available, even if the search_trips description suggests otherwise. The tripId is the id field returned by search_trips; the date should be one of the available dates returned by get_trip_availability, formatted as YYYY-MM-DD.',
        inputSchema: z.object({
          tripId: z
            .string()
            .uuid()
            .describe('The id of the trip (from search_trips).'),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .describe('The date to check availability for, formatted as YYYY-MM-DD.'),
        }),
      },
      async ({ tripId, date }) => {
        const url = `${TRIP_AVAILABLE_RESOURCES_API_URL}?tripId=${tripId}&date=${date}`;
        const result = (await fetchJson(url)) as {
          resources: Array<{
            resourceTypeId: string;
            name: string;
            personCapacity: number;
            available: number;
          }>;
        };
        const drift = driftError(resourcesDriftError(result));
        if (drift) throw drift;

        if (result.resources.length === 0) {
          return {
            content: [{ type: 'text', text: `No available resources for trip ${tripId} on ${date}.` }],
          };
        }

        const lines = [`Available resources for trip ${tripId} on ${date}:`];
        let totalCapacity = 0;
        let totalAvailable = 0;
        for (const resource of result.resources) {
          lines.push(
            `- ${resource.name} (id: ${resource.resourceTypeId}): ` +
              `${resource.available} available, seats ${resource.personCapacity} person(s)`,
          );
          totalCapacity += resource.personCapacity * resource.available;
          totalAvailable += resource.available;
        }
        lines.push(
          '',
          `Total: ${totalAvailable} units, seating up to ${totalCapacity} people.`,
        );

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        };
      },
    );
  },
  {
    serverInfo: {
      name: 'paddling-pl-mcp-server',
      version: '0.1.0',
    },
  },
);

export { handler as GET, handler as POST };