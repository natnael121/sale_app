import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead } from '../../types';
import { Users, Phone, Calendar, Target, TrendingUp, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SupervisorDashboardProps {
  user: User;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    teamSize: 0,
    totalCalls: 0,
    meetingsScheduled: 0,
    conversionRate: 0,
    targetProgress: 75,
    teamPerformance: 85
  });

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.organizationId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch team members
      const usersQuery = query(
        collection(db, 'users'), 
        where('organizationId', '==', user.organizationId),
        where('role', 'in', ['call_center', 'field_agent'])
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setTeamMembers(users);

      // Fetch leads for performance calculation
      const leadsQuery = query(collection(db, 'leads'), where('organizationId', '==', user.organizationId));
      const leadsSnapshot = await getDocs(leadsQuery);
      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));

      const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
      const totalCalls = leads.reduce((sum, lead) => sum + (lead.communications?.length || 0), 0);
      const meetingsScheduled = leads.reduce((sum, lead) => sum + (lead.meetings?.length || 0), 0);

      setStats({
        teamSize: users.length,
        totalCalls,
        meetingsScheduled,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
        targetProgress: 75,
        teamPerformance: 85
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = [
    { day: 'Mon', calls: 45, meetings: 12 },
    { day: 'Tue', calls: 52, meetings: 18 },
    { day: 'Wed', calls: 48, meetings: 15 },
    { day: 'Thu', calls: 61, meetings: 22 },
    { day: 'Fri', calls: 55, meetings: 19 },
    { day: 'Sat', calls: 31, meetings: 8 },
    { day: 'Sun', calls: 25, meetings: 6 }
  ];

  const topPerformers = [
    { name: 'Sarah Johnson', role: 'Call Center', conversions: 28, commission: 1450 },
    { name: 'Mike Chen', role: 'Field Agent', conversions: 24, commission: 1280 },
    { name: 'Emily Davis', role: 'Call Center', conversions: 22, commission: 1150 },
    { name: 'James Wilson', role: 'Field Agent', conversions: 19, commission: 980 }
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
        <h1 className="text-3xl font-bold text-gray-800">Supervisor Dashboard</h1>
        <p className="text-gray-600">Monitor and manage your team's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">{stats.teamSize}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.meetingsScheduled}</p>
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
              <p className="text-sm font-medium text-gray-600">Target Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.targetProgress}%</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.targetProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Performance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.teamPerformance}%</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Award className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.teamPerformance}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#3B82F6" name="Calls" />
              <Line type="monotone" dataKey="meetings" stroke="#22C55E" name="Meetings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calls" fill="#3B82F6" name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Performers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Conversions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Commission</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((performer, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium text-sm">
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      {performer.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{performer.role}</td>
                  <td className="py-3 px-4 font-medium">{performer.conversions}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">${performer.commission}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (performer.conversions / 30) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.min(100, Math.round((performer.conversions / 30) * 100))}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;