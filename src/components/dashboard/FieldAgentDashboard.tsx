import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Meeting, Lead } from '../../types';
import { MapPin, Calendar, Camera, CheckCircle, Clock, Target, Phone, UserCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FieldAgentDashboardProps {
  user: User;
}

const FieldAgentDashboard: React.FC<FieldAgentDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayMeetings: 0,
    completedMeetings: 0,
    pendingCheckIns: 0,
    monthlyConversions: 0,
    monthlyTarget: 25,
    totalCommission: 0,
    myLeads: 0
  });

  const [todaySchedule, setTodaySchedule] = useState<Meeting[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user.id, user.organizationId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch meetings assigned to this field agent
      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('organizationId', '==', user.organizationId),
        where('assignedTo', '==', user.id),
        orderBy('scheduledAt', 'asc')
      );
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetings = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        checkIn: doc.data().checkIn ? {
          ...doc.data().checkIn,
          timestamp: doc.data().checkIn.timestamp?.toDate()
        } : undefined
      } as Meeting));

      // Filter today's meetings
      const todayMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.scheduledAt);
        meetingDate.setHours(0, 0, 0, 0);
        return meetingDate.getTime() === today.getTime();
      });

      setTodaySchedule(todayMeetings);

      // Fetch leads assigned to or created by this field agent
      const leadsQuery = query(
        collection(db, 'leads'),
        where('organizationId', '==', user.organizationId),
        orderBy('createdAt', 'desc')
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      const allLeads = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Lead));

      // Filter leads for this field agent
      const fieldAgentLeads = allLeads.filter(lead =>
        lead.assignedTo === user.id || lead.createdBy === user.id
      );

      setMyLeads(fieldAgentLeads);

      // Calculate stats
      const completedToday = todayMeetings.filter(m => m.status === 'completed').length;
      const pendingCheckIns = todayMeetings.filter(m => m.status === 'scheduled' && !m.checkIn).length;

      // Get month start date
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyConversions = fieldAgentLeads.filter(lead =>
        lead.status === 'converted' &&
        lead.updatedAt >= monthStart
      ).length;

      setStats({
        todayMeetings: todayMeetings.length,
        completedMeetings: completedToday,
        pendingCheckIns,
        monthlyConversions,
        monthlyTarget: 25,
        totalCommission: monthlyConversions * 200,
        myLeads: fieldAgentLeads.length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string, checkedIn: boolean) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'in_progress') return <Clock className="w-5 h-5 text-blue-600" />;
    if (checkedIn) return <MapPin className="w-5 h-5 text-green-600" />;
    return <Calendar className="w-5 h-5 text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Field Agent Dashboard</h1>
        <p className="text-gray-600">Manage your field visits and track performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myLeads}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayMeetings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedMeetings}</p>
              <p className="text-sm text-gray-500">of {stats.todayMeetings} scheduled</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCheckIns}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Conversions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyConversions}</p>
              <p className="text-sm text-gray-500">of {stats.monthlyTarget} target</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (stats.monthlyConversions / stats.monthlyTarget) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalCommission.toLocaleString()}</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/my-leads"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-between group"
          >
            <div>
              <h3 className="font-semibold text-lg mb-1">View My Leads</h3>
              <p className="text-blue-100 text-sm">{stats.myLeads} leads</p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/meetings"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-between group"
          >
            <div>
              <h3 className="font-semibold text-lg mb-1">My Meetings</h3>
              <p className="text-green-100 text-sm">{stats.todayMeetings} today</p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/commissions"
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-between group"
          >
            <div>
              <h3 className="font-semibold text-lg mb-1">Commissions</h3>
              <p className="text-orange-100 text-sm">${stats.totalCommission.toLocaleString()}</p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Today's Schedule</h3>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No meetings scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaySchedule.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full">
                    {getStatusIcon(meeting.status, !!meeting.checkIn)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{meeting.location}</p>
                    <p className="text-sm text-gray-500">Lead ID: {meeting.leadId.slice(-6)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status.replace('_', ' ')}
                      </span>
                      {meeting.checkIn && (
                        <span className="text-xs text-green-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          Checked in
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium text-gray-800">{meeting.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  {meeting.notes && (
                    <p className="text-xs text-gray-500 mt-1">{meeting.notes.substring(0, 30)}...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">My Recent Leads</h3>
          <Link to="/my-leads" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </Link>
        </div>

        {myLeads.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No leads assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{lead.companyName || lead.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{lead.managerPhone || lead.companyPhone || lead.phone || 'No phone'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                  lead.status === 'interested' ? 'bg-blue-100 text-blue-800' :
                  lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldAgentDashboard;