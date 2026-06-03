import { useState, useCallback, useRef } from 'react';

export type GeolocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

/**
 * Maps GeolocationPositionError codes to user-friendly messages.
 */
function parseGeoError(err: GeolocationPositionError): string {
  switch (err.code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Location permission denied. Please enable it in your browser or device settings.';
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Your location is currently unavailable. Check that GPS/location services are enabled on your device.';
    case GeolocationPositionError.TIMEOUT:
      return 'Location request timed out. Move to an area with better signal and try again.';
    default:
      return err.message || 'An unknown location error occurred.';
  }
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  /**
   * One-shot location request. Wrapped in useCallback so its reference is
   * stable across renders — safe to include in useEffect dependency arrays.
   */
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(parseGeoError(err));
        setIsLoading(false);
      },
      GEO_OPTIONS,
    );
  }, []);

  /**
   * Continuous location watch. Calls the provided callback on every update.
   * Clears any existing watch before starting a new one.
   * Returns the watchId so the caller can cancel if needed.
   */
  const watchLocation = useCallback((callback: (coords: GeolocationCoords) => void) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser or device.');
      return null;
    }

    // Clear any existing watch first
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coords: GeolocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };
        setLocation(coords);
        setError(null);
        callback(coords);
      },
      (err) => {
        setError(parseGeoError(err));
      },
      GEO_OPTIONS,
    );

    watchIdRef.current = id;
    return id;
  }, []);

  /** Stop an active position watch. */
  const clearWatch = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
    if (watchIdRef.current === watchId) {
      watchIdRef.current = null;
    }
  }, []);

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  };
}
