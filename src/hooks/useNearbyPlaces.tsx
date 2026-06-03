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
  distance: number; // in kilometers
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
  };
};

type OverpassResponse = {
  elements: OverpassElement[];
};

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometres.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/**
 * Build an Overpass QL query that:
 *  - outputs JSON  ([out:json] — critical, otherwise Overpass returns XML)
 *  - uses `around:radius,lat,lon` for accurate radial search
 *  - requests center coordinates for way/relation results
 */
function buildOverpassQuery(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000
): string {
  const r = radiusMeters;
  const c = `${latitude},${longitude}`;
  return `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${r},${c});
  node["amenity"="police"](around:${r},${c});
  node["amenity"="shelter"](around:${r},${c});
  way["amenity"="hospital"](around:${r},${c});
  way["amenity"="police"](around:${r},${c});
  way["amenity"="shelter"](around:${r},${c});
  relation["amenity"="hospital"](around:${r},${c});
  relation["amenity"="police"](around:${r},${c});
  relation["amenity"="shelter"](around:${r},${c});
);
out center;
  `.trim();
}

export function useNearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyPlaces = useCallback(
    async (coords: GeolocationCoords, radiusMeters: number = 5000) => {
      setLoading(true);
      setError(null);

      try {
        const query = buildOverpassQuery(coords.latitude, coords.longitude, radiusMeters);

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
          throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
        }

        const data: OverpassResponse = await response.json();

        const placesList: NearbyPlace[] = data.elements
          .map((element) => {
            // Nodes have lat/lon directly; ways/relations use center
            const lat = element.lat ?? element.center?.lat;
            const lon = element.lon ?? element.center?.lon;
            if (lat == null || lon == null) return null;

            const name = element.tags?.name?.trim() || 'Unnamed';
            const phone = element.tags?.phone;
            const openingHours = element.tags?.['opening_hours'];
            const amenity = element.tags?.amenity;

            let type: 'hospital' | 'police' | 'shelter' = 'shelter';
            if (amenity === 'hospital') type = 'hospital';
            else if (amenity === 'police') type = 'police';

            const distance = calculateDistance(coords.latitude, coords.longitude, lat, lon);
            if (distance > 5) return null;

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
            } satisfies NearbyPlace;
          })
          .filter((p): p is NearbyPlace => p !== null);

        placesList.sort((a, b) => a.distance - b.distance);
        setPlaces(placesList);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch nearby places';
        setError(errorMsg);
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

  return {
    places,
    loading,
    error,
    fetchNearbyPlaces,
    getGoogleMapsNavigationUrl,
    getOpenStreetMapUrl,
  };
}
