import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';

const BASE_URL = process.env.PADDLING_API_BASE_URL ?? 'https://paddling.pl/api';
const TRIPS_API_URL = `${BASE_URL}/trips`;
const TRIP_AVAILABILITY_API_URL = `${BASE_URL}/trip-availability`;
const TRIP_AVAILABLE_RESOURCES_API_URL = `${BASE_URL}/trip-available-resources`;

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
  const lines = [
    `- ${trip.tripName} (id: ${trip.id})`,
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

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_trips',
      {
        title: 'Search Trips',
        description:
          'Lists kayaking trips available on paddling.pl. Returns a summarized overview of each trip including river, route, distance, duration, difficulty, price, voivodeship, amenities, and the trip image URL. Supports pagination: use page/size to navigate the full catalog.',
        inputSchema: z.object({
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
      async ({ page = 0, size = 20 }) => {
        const url = `${TRIPS_API_URL}?page=${page}&size=${size}`;
        const response = await fetch(url, { headers: { accept: 'application/json' } });

        if (!response.ok) {
          throw new Error(`paddling.pl API error: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as TripsResponse;

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
        const response = await fetch(url, { headers: { accept: 'application/json' } });

        if (!response.ok) {
          throw new Error(`paddling.pl API error: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as { dates: string[] };

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
          'Returns the available equipment resources (e.g. kayaks by capacity) and how many units are still free for a specific paddling.pl trip on a given date. The tripId is the id field returned by search_trips; the date should be one of the available dates returned by get_trip_availability, formatted as YYYY-MM-DD.',
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
        const response = await fetch(url, { headers: { accept: 'application/json' } });

        if (!response.ok) {
          throw new Error(`paddling.pl API error: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as {
          resources: Array<{
            resourceTypeId: string;
            name: string;
            personCapacity: number;
            available: number;
          }>;
        };

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