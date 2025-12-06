import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Meeting, Lead } from '../../types';
import { MapPin, Users, Calendar, CheckCircle, Filter, Search, Navigation, Layers, Eye, EyeOff } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AdminMapViewProps {
  user: User;
}

interface MapData {
  meetings: Meeting[];
  leads: Lead[];
  fieldAgents: User[];
}

interface MapFilters {
  showMeetings: boolean;
  showLeads: boolean;
  showFieldAgents: boolean;
  meetingStatus: 'all' | 'scheduled' | 'in_progress' | 'completed';
  dateRange: 'today' | 'week' | 'month' | 'all';
}

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminMapView: React.FC<AdminMapViewProps> = ({ user }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [mapData, setMapData] = useState<MapData>({
    meetings: [],
    leads: [],
    fieldAgents: []
  });

  const [filters, setFilters] = useState<MapFilters>({
    showMeetings: true,
    showLeads: true,
    showFieldAgents: false,
    meetingStatus: 'all',
    dateRange: 'all'
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>(null);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    completedMeetings: 0,
    activeFieldAgents: 0,
    totalLeads: 0
  });

  useEffect(() => {
    fetchMapData();
  }, [user.organizationId]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      updateMapMarkers();
    }
  }, [mapData, filters, searchTerm]);

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView([9.0320, 38.7469], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);

      // Fetch meetings
      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('organizationId', '==', user.organizationId)
      );
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        checkIn: doc.data().checkIn ? {
          ...doc.data().checkIn,
          timestamp: doc.data().checkIn.timestamp?.toDate()
        } : undefined
      } as Meeting));

      // Fetch leads
      const leadsQuery = query(
        collection(db, 'leads'),
        where('organizationId', '==', user.organizationId)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      const leadsData = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Lead));

      // Fetch field agents
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', user.organizationId),
        where('role', '==', 'field_agent')
      );
      const usersSnapshot = await getDocs(usersQuery);
      const fieldAgentsData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as User));

      setMapData({
        meetings: meetingsData,
        leads: leadsData.filter(lead => lead.latitude && lead.longitude),
        fieldAgents: fieldAgentsData
      });

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setStats({
        totalMeetings: meetingsData.length,
        completedMeetings: meetingsData.filter(m => m.status === 'completed').length,
        activeFieldAgents: fieldAgentsData.filter(a => a.isActive).length,
        totalLeads: leadsData.length
      });

    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds: L.LatLngBoundsExpression[] = [];

    // Add meeting markers
    if (filters.showMeetings) {
      const filteredMeetings = mapData.meetings.filter(meeting => {
        if (!meeting.checkIn) return false;

        const matchesStatus = filters.meetingStatus === 'all' || meeting.status === filters.meetingStatus;
        const matchesSearch = !searchTerm ||
          meeting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
      });

      filteredMeetings.forEach(meeting => {
        if (meeting.checkIn) {
          const { latitude, longitude } = meeting.checkIn.location;

          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="flex items-center justify-center w-10 h-10 rounded-full ${
              meeting.status === 'completed' ? 'bg-green-500' :
              meeting.status === 'in_progress' ? 'bg-yellow-500' :
              'bg-blue-500'
            } shadow-lg border-2 border-white">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          });

          const marker = L.marker([latitude, longitude], { icon })
            .bindPopup(createMeetingPopup(meeting))
            .on('click', () => setSelectedItem({ type: 'meeting', data: meeting }))
            .addTo(mapRef.current!);

          markersRef.current.push(marker);
          bounds.push([latitude, longitude]);
        }
      });
    }

    // Add lead markers
    if (filters.showLeads) {
      const filteredLeads = mapData.leads.filter(lead => {
        const matchesSearch = !searchTerm ||
          (lead.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.address?.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch && lead.latitude && lead.longitude;
      });

      filteredLeads.forEach(lead => {
        if (lead.latitude && lead.longitude) {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${
              lead.status === 'converted' ? 'bg-emerald-500' :
              lead.status === 'interested' ? 'bg-green-500' :
              lead.status === 'contacted' ? 'bg-yellow-500' :
              'bg-gray-500'
            } shadow-lg border-2 border-white">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          const marker = L.marker([lead.latitude, lead.longitude], { icon })
            .bindPopup(createLeadPopup(lead))
            .on('click', () => setSelectedItem({ type: 'lead', data: lead }))
            .addTo(mapRef.current!);

          markersRef.current.push(marker);
          bounds.push([lead.latitude, lead.longitude]);
        }
      });
    }

    // Fit map to show all markers
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const createMeetingPopup = (meeting: Meeting): string => {
    return `
      <div class="p-3 min-w-[200px]">
        <div class="flex items-center space-x-2 mb-2">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
            meeting.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }">
            ${meeting.status.replace('_', ' ')}
          </span>
        </div>
        <p class="font-semibold text-gray-800 mb-1">${meeting.location}</p>
        <p class="text-sm text-gray-600">Scheduled: ${meeting.scheduledAt.toLocaleString()}</p>
        ${meeting.checkIn ? `
          <p class="text-sm text-gray-600">Check-in: ${meeting.checkIn.timestamp.toLocaleString()}</p>
          ${meeting.checkIn.photos.length > 0 ? `
            <p class="text-sm text-green-600 font-medium">${meeting.checkIn.photos.length} photo(s) uploaded</p>
          ` : ''}
        ` : ''}
        ${meeting.notes ? `<p class="text-sm text-gray-500 mt-2">${meeting.notes}</p>` : ''}
      </div>
    `;
  };

  const createLeadPopup = (lead: Lead): string => {
    return `
      <div class="p-3 min-w-[200px]">
        <p class="font-semibold text-gray-800 mb-1">${lead.companyName || lead.name || 'Unknown'}</p>
        <div class="flex items-center space-x-2 mb-2">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            lead.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
            lead.status === 'interested' ? 'bg-green-100 text-green-800' :
            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }">
            ${lead.status.replace('_', ' ')}
          </span>
        </div>
        ${lead.managerName ? `<p class="text-sm text-gray-600">Manager: ${lead.managerName}</p>` : ''}
        ${lead.managerPhone ? `<p class="text-sm text-gray-600">Phone: ${lead.managerPhone}</p>` : ''}
        ${lead.sector ? `<p class="text-sm text-gray-500">Sector: ${lead.sector}</p>` : ''}
        ${lead.address ? `<p class="text-sm text-gray-500 mt-2">${lead.address}</p>` : ''}
      </div>
    `;
  };

  const centerOnLocation = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition((position) => {
        mapRef.current?.setView(
          [position.coords.latitude, position.coords.longitude],
          15
        );
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Field Operations Map</h1>
        <p className="text-gray-600">Real-time view of field agent activities and lead locations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMeetings}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedMeetings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeFieldAgents}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mapped Leads</p>
              <p className="text-2xl font-bold text-gray-900">{mapData.leads.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search locations, companies, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFilters(prev => ({ ...prev, showMeetings: !prev.showMeetings }))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  filters.showMeetings
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {filters.showMeetings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm font-medium">Meetings</span>
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, showLeads: !prev.showLeads }))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  filters.showLeads
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {filters.showLeads ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm font-medium">Leads</span>
              </button>

              <button
                onClick={centerOnLocation}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span className="text-sm font-medium">My Location</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <select
              value={filters.meetingStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, meetingStatus: e.target.value as any }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Meetings</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div
          ref={mapContainerRef}
          className="w-full h-[600px]"
        />
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mt-6">
        <div className="flex items-center space-x-2 mb-3">
          <Layers className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Map Legend</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Completed Meeting</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">In Progress Meeting</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Scheduled Meeting</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Converted Lead</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Interested Lead</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Contacted Lead</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-500"></div>
            <span className="text-sm text-gray-600">New Lead</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMapView;
