import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead, Commission } from '../../types';
import { Users, UserCheck, DollarSign, TrendingUp, Phone, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    totalCommissions: 0,
    conversionRate: 0,
    totalCalls: 0,
    scheduledMeetings: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.organizationId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const usersQuery = query(collection(db, 'users'), where('organizationId', '==', user.organizationId));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Fetch leads
      const leadsQuery = query(collection(db, 'leads'), where('organizationId', '==', user.organizationId));
      const leadsSnapshot = await getDocs(leadsQuery);
      
      // Fetch commissions
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
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
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
            <div className="bg-indigo-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
    </div>
  );
};

export default AdminDashboard;