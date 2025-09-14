import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Phone, PhoneCall, Clock, Target, TrendingUp, Calendar } from 'lucide-react';

interface CallCenterDashboardProps {
  user: User;
}

const CallCenterDashboard: React.FC<CallCenterDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    callsToday: 42,
    callsAnswered: 38,
    meetingsScheduled: 12,
    conversionRate: 15.5,
    dailyTarget: 50,
    avgCallDuration: 4.2
  });

  const recentCalls = [
    { id: 1, name: 'John Smith', phone: '+1 234-567-8901', outcome: 'interested', time: '10:30 AM' },
    { id: 2, name: 'Sarah Wilson', phone: '+1 234-567-8902', outcome: 'meeting', time: '10:15 AM' },
    { id: 3, name: 'Mike Johnson', phone: '+1 234-567-8903', outcome: 'not_interested', time: '9:45 AM' },
    { id: 4, name: 'Emily Davis', phone: '+1 234-567-8904', outcome: 'callback', time: '9:30 AM' }
  ];

  const todayMeetings = [
    { id: 1, client: 'Robert Brown', time: '2:00 PM', location: 'Downtown Office' },
    { id: 2, client: 'Lisa Anderson', time: '3:30 PM', location: 'Client Site' },
    { id: 3, client: 'David Miller', time: '4:15 PM', location: 'Coffee Shop' }
  ];

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'interested': return 'text-green-600 bg-green-100';
      case 'meeting': return 'text-blue-600 bg-blue-100';
      case 'not_interested': return 'text-red-600 bg-red-100';
      case 'callback': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Call Center Dashboard</h1>
        <p className="text-gray-600">Track your daily calling performance and schedule</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.callsToday}</p>
              <p className="text-sm text-gray-500">of {stats.dailyTarget} target</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (stats.callsToday / stats.dailyTarget) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Answered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.callsAnswered}</p>
              <p className="text-sm text-gray-500">{((stats.callsAnswered / stats.callsToday) * 100).toFixed(1)}% pickup rate</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <PhoneCall className="w-6 h-6 text-green-600" />
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
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Call Duration</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgCallDuration} min</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Target Progress</p>
              <p className="text-2xl font-bold text-gray-900">{((stats.callsToday / stats.dailyTarget) * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Calls</h3>
          <div className="space-y-4">
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{call.name}</p>
                    <p className="text-sm text-gray-500">{call.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(call.outcome)}`}>
                    {call.outcome.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{call.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Today's Meetings</h3>
          <div className="space-y-4">
            {todayMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{meeting.client}</p>
                    <p className="text-sm text-gray-500">{meeting.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">{meeting.time}</p>
                  <p className="text-sm text-blue-600">View Details</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallCenterDashboard;