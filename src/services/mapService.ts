import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, LocationWithAddress, Address, MapMarker, MapBounds, MapOptions, GeolocationError } from '../types/location';

// Fix for default marker icons in Leaflet with Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

class MapService {
  private maps: Map<string, L.Map> = new Map();
  private markers: Map<string, Map<string, L.Marker>> = new Map();

  initializeMap(
    containerId: string,
    options: MapOptions = {}
  ): L.Map {
    if (this.maps.has(containerId)) {
      return this.maps.get(containerId)!;
    }

    const defaultCenter: [number, number] = [
      options.center?.lat || 9.0320,
      options.center?.lng || 38.7469
    ];

    const map = L.map(containerId, {
      center: defaultCenter,
      zoom: options.zoom || 13,
      minZoom: options.minZoom || 2,
      maxZoom: options.maxZoom || 18,
      scrollWheelZoom: options.scrollWheelZoom !== false,
      dragging: options.dragging !== false,
      touchZoom: options.touchZoom !== false,
      doubleClickZoom: options.doubleClickZoom !== false,
      zoomControl: options.zoomControl !== false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    this.maps.set(containerId, map);
    this.markers.set(containerId, new Map());

    return map;
  }

  getMap(containerId: string): L.Map | undefined {
    return this.maps.get(containerId);
  }

  destroyMap(containerId: string): void {
    const map = this.maps.get(containerId);
    if (map) {
      this.clearMarkers(containerId);
      map.remove();
      this.maps.delete(containerId);
      this.markers.delete(containerId);
    }
  }

  getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 0,
          message: 'Geolocation is not supported by this browser.'
        } as GeolocationError);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: new Date(position.timestamp),
          });
        },
        (error) => {
          reject({
            code: error.code,
            message: error.message
          } as GeolocationError);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  watchLocation(
    callback: (location: Location) => void,
    errorCallback?: (error: GeolocationError) => void
  ): number {
    if (!navigator.geolocation) {
      if (errorCallback) {
        errorCallback({
          code: 0,
          message: 'Geolocation is not supported by this browser.'
        });
      }
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: new Date(position.timestamp),
        });
      },
      (error) => {
        if (errorCallback) {
          errorCallback({
            code: error.code,
            message: error.message
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  clearWatch(watchId: number): void {
    if (navigator.geolocation && watchId !== -1) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<Address> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      return {
        street: data.address?.road || data.address?.street,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state || data.address?.region,
        country: data.address?.country,
        postalCode: data.address?.postcode,
        formattedAddress: data.display_name
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  addMarker(
    containerId: string,
    marker: MapMarker,
    options?: {
      draggable?: boolean;
      icon?: L.Icon;
      onClick?: () => void;
    }
  ): L.Marker | null {
    const map = this.maps.get(containerId);
    if (!map) {
      console.error(`Map with ID ${containerId} not found`);
      return null;
    }

    const leafletMarker = L.marker(
      [marker.location.latitude, marker.location.longitude],
      {
        draggable: options?.draggable || false,
        icon: options?.icon,
        title: marker.title,
      }
    ).addTo(map);

    if (marker.description) {
      leafletMarker.bindPopup(marker.description);
    }

    if (options?.onClick) {
      leafletMarker.on('click', options.onClick);
    }

    const mapMarkers = this.markers.get(containerId);
    if (mapMarkers) {
      mapMarkers.set(marker.id, leafletMarker);
    }

    return leafletMarker;
  }

  removeMarker(containerId: string, markerId: string): void {
    const mapMarkers = this.markers.get(containerId);
    if (mapMarkers) {
      const marker = mapMarkers.get(markerId);
      if (marker) {
        marker.remove();
        mapMarkers.delete(markerId);
      }
    }
  }

  clearMarkers(containerId: string): void {
    const mapMarkers = this.markers.get(containerId);
    if (mapMarkers) {
      mapMarkers.forEach(marker => marker.remove());
      mapMarkers.clear();
    }
  }

  updateMarkerPosition(
    containerId: string,
    markerId: string,
    location: Location
  ): void {
    const mapMarkers = this.markers.get(containerId);
    if (mapMarkers) {
      const marker = mapMarkers.get(markerId);
      if (marker) {
        marker.setLatLng([location.latitude, location.longitude]);
      }
    }
  }

  centerMap(containerId: string, latitude: number, longitude: number, zoom?: number): void {
    const map = this.maps.get(containerId);
    if (map) {
      map.setView([latitude, longitude], zoom || map.getZoom());
    }
  }

  fitBounds(containerId: string, bounds: MapBounds, padding?: [number, number]): void {
    const map = this.maps.get(containerId);
    if (map) {
      const leafletBounds = L.latLngBounds(
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      );
      map.fitBounds(leafletBounds, { padding: padding || [50, 50] });
    }
  }

  fitMarkersInView(containerId: string): void {
    const map = this.maps.get(containerId);
    const mapMarkers = this.markers.get(containerId);

    if (map && mapMarkers && mapMarkers.size > 0) {
      const group = L.featureGroup(Array.from(mapMarkers.values()));
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  addCircle(
    containerId: string,
    latitude: number,
    longitude: number,
    radius: number,
    options?: {
      color?: string;
      fillColor?: string;
      fillOpacity?: number;
    }
  ): L.Circle | null {
    const map = this.maps.get(containerId);
    if (!map) {
      return null;
    }

    return L.circle([latitude, longitude], {
      color: options?.color || '#3B82F6',
      fillColor: options?.fillColor || '#3B82F6',
      fillOpacity: options?.fillOpacity || 0.2,
      radius: radius,
    }).addTo(map);
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const point1 = L.latLng(lat1, lon1);
    const point2 = L.latLng(lat2, lon2);
    return point1.distanceTo(point2);
  }

  createCustomIcon(
    iconUrl: string,
    options?: {
      iconSize?: [number, number];
      iconAnchor?: [number, number];
      popupAnchor?: [number, number];
    }
  ): L.Icon {
    return L.icon({
      iconUrl,
      iconSize: options?.iconSize || [25, 41],
      iconAnchor: options?.iconAnchor || [12, 41],
      popupAnchor: options?.popupAnchor || [1, -34],
    });
  }

  invalidateSize(containerId: string): void {
    const map = this.maps.get(containerId);
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }
}

export const mapService = new MapService();
export default mapService;
