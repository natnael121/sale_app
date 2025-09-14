import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead, Commission } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Phone, Calendar, DollarSign, Target, Award, Activity } from 'lucide-react';

interface AnalyticsProps {
  user: User;
}

const Analytics: React.FC<AnalyticsProps> = ({ user }) => {
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    totalCalls: 0,
    totalMeetings: 0,
    conversionRate: 0,
    totalCommissions: 0,
    activeUsers: 0,
    callPickupRate: 0,
    meetingSuccessRate: 0
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [user.organizationId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch leads
      const leadsQuery = query(collection(db, 'leads'), where('organizationId', '==', user.organizationId));
      const leadsSnapshot = await getDocs(leadsQuery);
      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));

      // Fetch users
      const usersQuery = query(collection(db, 'users'), where('organizationId', '==', user.organizationId));
      const usersSnapshot = await getDocs(usersQuery);

      // Fetch commissions
      const commissionsQuery = query(collection(db, 'commissions'), where('organizationId', '==', user.organizationId));
      const commissionsSnapshot = await getDocs(commissionsQuery);
      const commissions = commissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));

      // Calculate metrics
      const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
      const totalCalls = leads.reduce((sum, lead) => sum + (lead.communications?.length || 0), 0);
      const totalMeetings = leads.reduce((sum, lead) => sum + (lead.meetings?.length || 0), 0);
      const totalCommissions = commissions.reduce((sum, comm) => sum + comm.amount, 0);

      setAnalytics({
        totalLeads: leads.length,
        totalCalls,
        totalMeetings,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
        totalCommissions,
        activeUsers: usersSnapshot.size,
        callPickupRate: 75, // Mock data
        meetingSuccessRate: 68 // Mock data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesFunnelData = [
    { stage: 'Leads', count: analytics.totalLeads, color: '#3B82F6' },
    { stage: 'Contacted', count: Math.floor(analytics.totalLeads * 0.8), color: '#10B981' },
    { stage: 'Interested', count: Math.floor(analytics.totalLeads * 0.6), color: '#F59E0B' },
    { stage: 'Meetings', count: analytics.totalMeetings, color: '#8B5CF6' },
    { stage: 'Converted', count: Math.floor(analytics.totalLeads * (analytics.conversionRate / 100)), color: '#EF4444' }
  ];

  const performanceData = [
    { month: 'Jan', leads: 45, conversions: 12, calls: 320 },
    { month: 'Feb', leads: 52, conversions: 18, calls: 380 },
    { month: 'Mar', leads: 61, conversions: 22, calls: 420 },
    { month: 'Apr', leads: 48, conversions: 15, calls: 350 },
    { month: 'May', leads: 67, conversions: 28, calls: 480 },
    { month: 'Jun', leads: 74, conversions: 32, calls: 520 }
  ];

  const teamPerformanceData = [
    { name: 'Call Center', performance: 85, target: 90 },
    { name: 'Field Agents', performance: 78, target: 80 },
    { name: 'Supervisors', performance: 92, target: 95 }
  ];

  const conversionTrendData = [
    { week: 'W1', rate: 15.2 },
    { week: 'W2', rate: 18.5 },
    { week: 'W3', rate: 22.1 },
    { week: 'W4', rate: 19.8 },
    { week: 'W5', rate: 25.3 },
    { week: 'W6', rate: 28.7 }
  ];

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive performance insights and metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalLeads}</p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalCalls}</p>
              <p className="text-sm text-green-600">+8% from last month</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meetings Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMeetings}</p>
              <p className="text-sm text-green-600">+15% from last month</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-green-600">+3.2% from last month</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">${analytics.totalCommissions.toLocaleString()}</p>
              <p className="text-sm text-green-600">+18% from last month</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Call Pickup Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.callPickupRate}%</p>
              <p className="text-sm text-green-600">+2.1% from last month</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meeting Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.meetingSuccessRate}%</p>
              <p className="text-sm text-green-600">+5.3% from last month</p>
            </div>
            <div className="bg-pink-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeUsers}</p>
              <p className="text-sm text-gray-600">All roles</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-full">
              <Award className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesFunnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={conversionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="rate" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" name="Leads" />
              <Line type="monotone" dataKey="conversions" stroke="#22C55E" name="Conversions" />
              <Line type="monotone" dataKey="calls" stroke="#F59E0B" name="Calls" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance vs Targets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="performance" fill="#3B82F6" name="Performance" />
              <Bar dataKey="target" fill="#E5E7EB" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;