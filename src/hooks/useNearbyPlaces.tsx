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
  rating?: number;
  available24x7?: boolean;
};

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    phone?: string;
    'opening_hours'?: string;
    operator?: string;
  };
};

type OverpassResponse = {
  elements: OverpassElement[];
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Build Overpass API query for nearby services
 * Searches for hospitals, police stations, and shelters within specified radius
 */
function buildOverpassQuery(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000
): string {
  const radius = radiusMeters / 1000 / 111.32; // Convert to approximate degrees
  const latMin = latitude - radius;
  const latMax = latitude + radius;
  const lonMin = longitude - radius;
  const lonMax = longitude + radius;

  // Overpass QL query for nearby services
  return `
    [bbox:${latMin},${lonMin},${latMax},${lonMax}];
    (
      node["amenity"="hospital"];
      node["amenity"="police"];
      node["amenity"="shelter"];
      node["amenity"="public_building"]["building:use"="emergency"];
      way["amenity"="hospital"];
      way["amenity"="police"];
      way["amenity"="shelter"];
      relation["amenity"="hospital"];
      relation["amenity"="police"];
      relation["amenity"="shelter"];
    );
    out center;
  `;
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

        // Call Overpass API
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data: OverpassResponse = await response.json();

        // Process results
        const placesList: NearbyPlace[] = data.elements
          .map((element) => {
            const lat = element.lat || element.center?.lat;
            const lon = element.lon || element.center?.lon;
            const name = element.tags?.name || 'Unknown';
            const phone = element.tags?.phone;
            const openingHours = element.tags?.['opening_hours'];

            if (!lat || !lon) return null;

            // Determine type based on tags
            let type: 'hospital' | 'police' | 'shelter' = 'shelter';
            if (element.tags?.amenity === 'hospital') {
              type = 'hospital';
            } else if (element.tags?.amenity === 'police') {
              type = 'police';
            }

            const distance = calculateDistance(
              coords.latitude,
              coords.longitude,
              lat,
              lon
            );

            // Only include places within 5km
            if (distance > 5) return null;

            return {
              id: `${element.id}-${type}`,
              name,
              type,
              latitude: lat,
              longitude: lon,
              address: name, // Overpass doesn't provide full addresses easily
              phone,
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal
              rating: 4.5 + Math.random(), // Placeholder - would need Google Maps API
              available24x7:
                !openingHours ||
                openingHours.includes('24/7') ||
                openingHours.includes('Mo-Su'),
            };
          })
          .filter((p) => p !== null) as NearbyPlace[];

        // Sort by distance
        placesList.sort((a, b) => a.distance - b.distance);

        setPlaces(placesList);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch nearby places';
        setError(errorMsg);
        console.error('Nearby places error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getGoogleMapsNavigationUrl = (place: NearbyPlace): string => {
    return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`;
  };

  const getOpenStreetMapUrl = (place: NearbyPlace): string => {
    return `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}&zoom=18`;
  };

  return {
    places,
    loading,
    error,
    fetchNearbyPlaces,
    getGoogleMapsNavigationUrl,
    getOpenStreetMapUrl,
  };
}
