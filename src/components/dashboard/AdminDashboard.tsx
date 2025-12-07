import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead, Commission, Meeting } from '../../types';
import { Users, UserCheck, DollarSign, TrendingUp, Phone, Calendar, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AdminDashboardProps {
  user: User;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    totalCommissions: 0,
    conversionRate: 0,
    totalCalls: 0,
    scheduledMeetings: 0
  });

  const [mapData, setMapData] = useState({
    meetings: [] as Meeting[],
    leads: [] as Lead[]
  });

  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchMapData();
  }, [user.organizationId]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && !mapInitialized) {
      const timer = setTimeout(() => {
        initializeMap();
        setMapInitialized(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mapInitialized]);

  useEffect(() => {
    if (mapRef.current && mapInitialized) {
      updateMapMarkers();
    }
  }, [mapData, mapInitialized]);

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current).setView([9.0320, 38.7469], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const fetchMapData = async () => {
    try {
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

      setMapData({
        meetings: meetingsData,
        leads: leadsData.filter(lead => lead.latitude && lead.longitude)
      });
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
  };

  const updateMapMarkers = () => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds: L.LatLngBoundsExpression[] = [];

    mapData.meetings.forEach(meeting => {
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

        const marker = L.marker([latitude, longitude], { icon }).addTo(mapRef.current!);
        markersRef.current.push(marker);
        bounds.push([latitude, longitude]);
      }
    });

    mapData.leads.forEach(lead => {
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

        const marker = L.marker([lead.latitude, lead.longitude], { icon }).addTo(mapRef.current!);
        markersRef.current.push(marker);
        bounds.push([lead.latitude, lead.longitude]);
      }
    });

    if (bounds.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), where('organizationId', '==', user.organizationId));
      const usersSnapshot = await getDocs(usersQuery);

      const leadsQuery = query(collection(db, 'leads'), where('organizationId', '==', user.organizationId));
      const leadsSnapshot = await getDocs(leadsQuery);

      const commissionsQuery = query(collection(db, 'commissions'), where('organizationId', '==', user.organizationId));
      const commissionsSnapshot = await getDocs(commissionsQuery);

      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      const commissions = commissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));

      const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
      const totalCalls = leads.reduce((sum, lead) => sum + (lead.communications?.length || 0), 0);
      const scheduledMeetings = leads.reduce((sum, lead) => sum + (lead.meetings?.length || 0), 0);

      setStats({
        totalUsers: usersSnapshot.size,
        totalLeads: leadsSnapshot.size,
        totalCommissions: commissions.reduce((sum, comm) => sum + comm.amount, 0),
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
        totalCalls,
        scheduledMeetings
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesData = [
    { month: 'Jan', leads: 45, conversions: 12 },
    { month: 'Feb', leads: 52, conversions: 18 },
    { month: 'Mar', leads: 61, conversions: 22 },
    { month: 'Apr', leads: 48, conversions: 15 },
    { month: 'May', leads: 67, conversions: 28 },
    { month: 'Jun', leads: 74, conversions: 32 }
  ];

  const performanceData = [
    { name: 'Converted', value: 32, color: '#22C55E' },
    { name: 'In Progress', value: 28, color: '#F59E0B' },
    { name: 'Not Interested', value: 15, color: '#EF4444' },
    { name: 'New', value: 25, color: '#3B82F6' }
  ];

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your organization's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Phone className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.scheduledMeetings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
              <Bar dataKey="conversions" fill="#22C55E" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Field Operations Map */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Field Operations Map</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div
            ref={mapContainerRef}
            className="w-full h-[400px]"
            style={{ backgroundColor: '#f0f0f0' }}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="w-5 h-5 text-gray-600" />
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
    </div>
  );
};

export default AdminDashboard;
