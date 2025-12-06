export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface LocationWithAddress extends Location {
  address?: Address;
}

export interface MapMarker {
  id: string;
  location: Location;
  title: string;
  description?: string;
  type?: 'lead' | 'meeting' | 'user' | 'custom';
  metadata?: Record<string, any>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  scrollWheelZoom?: boolean;
  dragging?: boolean;
  touchZoom?: boolean;
  doubleClickZoom?: boolean;
  zoomControl?: boolean;
}

export interface GeolocationError {
  code: number;
  message: string;
}
