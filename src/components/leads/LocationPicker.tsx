import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Check } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  onLocationSelect: (latitude: number, longitude: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLatitude, initialLongitude }) => {
  const [latitude, setLatitude] = useState<number | null>(initialLatitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [9.0320, 38.7469];
    const map = L.map(mapContainerRef.current).setView(defaultCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitude(lat);
      setLongitude(lng);
      onLocationSelect(lat, lng);

      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      markerRef.current = L.marker([lat, lng]).addTo(map);
    });

    mapRef.current = map;
    setMapReady(true);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && initialLatitude && initialLongitude) {
      mapRef.current.setView([initialLatitude, initialLongitude], 15);

      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }

      markerRef.current = L.marker([initialLatitude, initialLongitude]).addTo(mapRef.current);
      setLatitude(initialLatitude);
      setLongitude(initialLongitude);
    }
  }, [initialLatitude, initialLongitude, mapReady]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);
        onLocationSelect(lat, lng);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);

          if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
          }

          markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        }

        setLoading(false);
      },
      (error) => {
        setError('Unable to get your location. Please try again or select on the map.');
        setLoading(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Client Location
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Getting location...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {latitude !== null && longitude !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-800">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Location Selected</span>
          </div>
          <div className="text-sm text-green-700 mt-1">
            Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}
          </div>
        </div>
      )}

      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="flex items-center space-x-2 text-gray-700 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Click on the map to set location</span>
        </div>
        <div
          ref={mapContainerRef}
          className="w-full h-64 rounded-lg border border-gray-300 bg-white"
        />
      </div>
    </div>
  );
};

export default LocationPicker;
