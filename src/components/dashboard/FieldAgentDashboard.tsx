import React, { useState } from 'react';
import { User } from '../../types';
import { MapPin, Calendar, Camera, CheckCircle, Clock, Target } from 'lucide-react';

interface FieldAgentDashboardProps {
  user: User;
}

const FieldAgentDashboard: React.FC<FieldAgentDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    todayMeetings: 5,
    completedMeetings: 3,
    pendingCheckIns: 2,
    monthlyConversions: 18,
    monthlyTarget: 25,
    totalCommission: 2850
  });

  const todaySchedule = [
    { 
      id: 1, 
      client: 'Jennifer Adams', 
      time: '9:00 AM', 
      address: '123 Main St, Downtown',
      status: 'completed',
      checkedIn: true
    },
    { 
      id: 2, 
      client: 'Mark Thompson', 
      time: '11:00 AM', 
      address: '456 Oak Ave, Midtown',
      status: 'completed',
      checkedIn: true
    },
    { 
      id: 3, 
      client: 'Lisa Rodriguez', 
      time: '2:00 PM', 
      address: '789 Pine St, Uptown',
      status: 'in_progress',
      checkedIn: false
    },
    { 
      id: 4, 
      client: 'David Kim', 
      time: '4:00 PM', 
      address: '321 Elm Dr, Suburbs',
      status: 'scheduled',
      checkedIn: false
    }
  ];

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
              <p className="text-sm font-medium text-gray-600">Today's Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayMeetings}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
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
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCheckIns}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-yellow-600" />
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
            <div className="bg-purple-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.monthlyConversions / stats.monthlyTarget) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalCommission}</p>
              <p className="text-sm text-green-600">+$350 this week</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Photos Uploaded</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Camera className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
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
        
        <div className="space-y-4">
          {todaySchedule.map((meeting) => (
            <div key={meeting.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full">
                  {getStatusIcon(meeting.status, meeting.checkedIn)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{meeting.client}</p>
                  <p className="text-sm text-gray-500">{meeting.address}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                      {meeting.status.replace('_', ' ')}
                    </span>
                    {meeting.checkedIn && (
                      <span className="text-xs text-green-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Checked in
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-medium text-gray-800">{meeting.time}</p>
                {meeting.status === 'scheduled' && !meeting.checkedIn && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 mt-1">
                    Check In
                  </button>
                )}
                {meeting.status === 'in_progress' && (
                  <button className="text-sm text-green-600 hover:text-green-700 mt-1">
                    Complete Visit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FieldAgentDashboard;