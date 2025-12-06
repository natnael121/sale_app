import { useEffect, useRef, useState, useCallback } from 'react';
import * as L from 'leaflet';
import { mapService } from '../services/mapService';
import { Location, MapMarker, MapOptions, GeolocationError } from '../types/location';

interface UseMapReturn {
  mapRef: React.RefObject<HTMLDivElement>;
  map: L.Map | null;
  isLoading: boolean;
  error: string | null;
  currentLocation: Location | null;
  addMarker: (marker: MapMarker, options?: any) => L.Marker | null;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
  centerMap: (lat: number, lng: number, zoom?: number) => void;
  getCurrentLocation: () => Promise<void>;
  fitMarkersInView: () => void;
}

export const useMap = (
  containerId: string,
  options?: MapOptions
): UseMapReturn => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      const mapInstance = mapService.initializeMap(containerId, options);
      setMap(mapInstance);

      mapService.invalidateSize(containerId);
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }

    return () => {
      mapService.destroyMap(containerId);
      setMap(null);
    };
  }, [containerId]);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await mapService.getCurrentLocation();
      setCurrentLocation(location);

      if (map) {
        mapService.centerMap(containerId, location.latitude, location.longitude, 15);
      }
    } catch (err) {
      const geoError = err as GeolocationError;
      setError(geoError.message || 'Failed to get current location');
      console.error('Geolocation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [containerId, map]);

  const addMarker = useCallback(
    (marker: MapMarker, options?: any) => {
      return mapService.addMarker(containerId, marker, options);
    },
    [containerId]
  );

  const removeMarker = useCallback(
    (markerId: string) => {
      mapService.removeMarker(containerId, markerId);
    },
    [containerId]
  );

  const clearMarkers = useCallback(() => {
    mapService.clearMarkers(containerId);
  }, [containerId]);

  const centerMap = useCallback(
    (lat: number, lng: number, zoom?: number) => {
      mapService.centerMap(containerId, lat, lng, zoom);
    },
    [containerId]
  );

  const fitMarkersInView = useCallback(() => {
    mapService.fitMarkersInView(containerId);
  }, [containerId]);

  return {
    mapRef,
    map,
    isLoading,
    error,
    currentLocation,
    addMarker,
    removeMarker,
    clearMarkers,
    centerMap,
    getCurrentLocation,
    fitMarkersInView,
  };
};

interface UseGeolocationReturn {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  watchLocation: () => void;
  stopWatching: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number>(-1);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loc = await mapService.getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      const geoError = err as GeolocationError;
      setError(geoError.message || 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const watchLocation = useCallback(() => {
    setError(null);

    watchIdRef.current = mapService.watchLocation(
      (loc) => {
        setLocation(loc);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    setIsLoading(true);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== -1) {
      mapService.clearWatch(watchIdRef.current);
      watchIdRef.current = -1;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    watchLocation,
    stopWatching,
  };
};
