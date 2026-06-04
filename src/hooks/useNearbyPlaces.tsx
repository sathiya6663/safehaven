import { useState, useCallback } from 'react';

export type GeolocationCoords = {
  latitude: number;
  longitude: number;
};

export type NearbyPlace = {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'shelter';
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  distance: number;
  available24x7?: boolean;
};

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    phone?: string;
    'opening_hours'?: string;
    operator?: string;
    amenity?: string;
    healthcare?: string;
    office?: string;
    police?: string;
    'social_facility'?: string;
  };
};

type OverpassResponse = {
  elements: OverpassElement[];
};

/** Haversine distance in km */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Overpass QL query — JSON output, around-radius, Indian OSM tags */
function buildOverpassQuery(latitude: number, longitude: number, radiusMeters: number): string {
  const r = radiusMeters;
  const c = `${latitude},${longitude}`;
  return `[out:json][timeout:30];
(
  node["amenity"="hospital"](around:${r},${c});
  node["amenity"="clinic"](around:${r},${c});
  node["amenity"="doctors"](around:${r},${c});
  node["healthcare"="hospital"](around:${r},${c});
  node["healthcare"="clinic"](around:${r},${c});
  way["amenity"="hospital"](around:${r},${c});
  way["amenity"="clinic"](around:${r},${c});
  way["healthcare"="hospital"](around:${r},${c});
  relation["amenity"="hospital"](around:${r},${c});
  node["amenity"="police"](around:${r},${c});
  node["office"="police"](around:${r},${c});
  node["police"="station"](around:${r},${c});
  way["amenity"="police"](around:${r},${c});
  way["office"="police"](around:${r},${c});
  relation["amenity"="police"](around:${r},${c});
  node["amenity"="shelter"](around:${r},${c});
  node["social_facility"="shelter"](around:${r},${c});
  node["amenity"="refuge"](around:${r},${c});
  way["amenity"="shelter"](around:${r},${c});
  relation["amenity"="shelter"](around:${r},${c});
);
out center;`;
}

/**
 * Fetch Overpass data.
 * - Production (Vercel): calls /api/overpass proxy first (avoids CORS),
 *   falls back to direct mirrors if proxy fails.
 * - Development: calls mirrors directly.
 */
async function fetchOverpass(query: string): Promise<OverpassResponse> {
  const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  // Try Vercel proxy first in production
  if (import.meta.env.PROD) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch('/api/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        // Verify it's actually an Overpass response (not HTML fallback)
        if (data && Array.isArray(data.elements)) {
          return data as OverpassResponse;
        }
      }
    } catch (_) {
      clearTimeout(timer);
      // proxy failed — fall through to direct mirrors below
    }
  }

  // Direct mirrors (dev always, prod as fallback)
  let lastErr: Error = new Error('All Overpass mirrors failed');
  for (const endpoint of MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) { lastErr = new Error(`${endpoint} → ${res.status}`); continue; }
      const data = await res.json();
      if (data && Array.isArray(data.elements)) return data as OverpassResponse;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr;
}

export function useNearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyPlaces = useCallback(
    async (coords: GeolocationCoords, radiusMeters = 10000) => {
      setLoading(true);
      setError(null);

      try {
        const query = buildOverpassQuery(coords.latitude, coords.longitude, radiusMeters);
        const data = await fetchOverpass(query);

        const placesList: NearbyPlace[] = data.elements
          .map((element): NearbyPlace | null => {
            const lat = element.lat ?? element.center?.lat;
            const lon = element.lon ?? element.center?.lon;
            if (lat == null || lon == null) return null;

            const name = element.tags?.name?.trim() || 'Unnamed';
            const phone = element.tags?.phone;
            const openingHours = element.tags?.['opening_hours'];
            const { amenity, healthcare, office, police: policetag } = element.tags ?? {};
            const socialFacility = element.tags?.['social_facility'];

            let type: NearbyPlace['type'] = 'shelter';
            if (
              amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors' ||
              healthcare === 'hospital' || healthcare === 'clinic'
            ) {
              type = 'hospital';
            } else if (amenity === 'police' || office === 'police' || policetag === 'station') {
              type = 'police';
            } else if (
              amenity === 'shelter' || amenity === 'refuge' || amenity === 'social_facility' ||
              socialFacility === 'shelter'
            ) {
              type = 'shelter';
            }

            const distance = calculateDistance(coords.latitude, coords.longitude, lat, lon);
            if (distance > 10) return null;

            return {
              id: `${element.id}-${type}`,
              name,
              type,
              latitude: lat,
              longitude: lon,
              address: name,
              phone,
              distance: Math.round(distance * 10) / 10,
              available24x7:
                !openingHours ||
                openingHours.includes('24/7') ||
                openingHours.includes('Mo-Su'),
            };
          })
          .filter((p): p is NearbyPlace => p !== null);

        placesList.sort((a, b) => a.distance - b.distance);
        setPlaces(placesList);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch nearby places';
        setError(msg);
        console.error('Nearby places error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getGoogleMapsNavigationUrl = (place: NearbyPlace): string =>
    `https://www.google.com/maps/search/${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`;

  const getOpenStreetMapUrl = (place: NearbyPlace): string =>
    `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}&zoom=18`;

  return { places, loading, error, fetchNearbyPlaces, getGoogleMapsNavigationUrl, getOpenStreetMapUrl };
}
