import React, { useState } from 'react';
import { User, Meeting } from '../../types';
import { Calendar, MapPin, Clock, CheckCircle, Camera, Navigation } from 'lucide-react';

interface MeetingListProps {
  user: User;
}

const MeetingList: React.FC<MeetingListProps> = ({ user }) => {
  const [meetings] = useState<Meeting[]>([
    {
      id: '1',
      leadId: 'lead1',
      organizationId: user.organizationId,
      scheduledBy: 'scheduler1',
      assignedTo: user.id,
      scheduledAt: new Date('2024-01-15T10:00:00'),
      status: 'scheduled',
      location: '123 Business Ave, Downtown',
      notes: 'Initial consultation meeting'
    },
    {
      id: '2',
      leadId: 'lead2',
      organizationId: user.organizationId,
      scheduledBy: 'scheduler1',
      assignedTo: user.id,
      scheduledAt: new Date('2024-01-15T14:00:00'),
      status: 'in_progress',
      location: '456 Corporate St, Midtown',
      checkIn: {
        timestamp: new Date('2024-01-15T13:55:00'),
        location: { latitude: 40.7128, longitude: -74.0060 },
        photos: ['photo1.jpg'],
        notes: 'Arrived at client office'
      }
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCheckIn = (meetingId: string) => {
    // Implement GPS check-in functionality
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log('Check-in location:', position.coords);
        // Update meeting with check-in data
      });
    }
  };

  const handlePhotoUpload = (meetingId: string) => {
    // Implement photo upload functionality
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Photo uploaded:', file.name);
        // Handle photo upload
      }
    };
    input.click();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meetings</h1>
        <p className="text-gray-600">Manage your scheduled field visits</p>
      </div>

      <div className="grid gap-6">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Meeting #{meeting.id}</p>
                  <p className="text-sm text-gray-500">Lead ID: {meeting.leadId}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meeting.status)}`}>
                {meeting.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{meeting.scheduledAt.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{meeting.location}</span>
              </div>
            </div>

            {meeting.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{meeting.notes}</p>
              </div>
            )}

            {meeting.checkIn && (
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Checked In</span>
                  <span className="text-sm text-gray-600">
                    {meeting.checkIn.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {meeting.checkIn.notes && (
                  <p className="text-sm text-gray-600">{meeting.checkIn.notes}</p>
                )}
                {meeting.checkIn.photos.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {meeting.checkIn.photos.length} photos uploaded
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3">
              {meeting.status === 'scheduled' && !meeting.checkIn && (
                <>
                  <button
                    onClick={() => handleCheckIn(meeting.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Check In</span>
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    Get Directions
                  </button>
                </>
              )}

              {meeting.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => handlePhotoUpload(meeting.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Complete Meeting
                  </button>
                </>
              )}

              {meeting.status === 'completed' && (
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  View Results
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingList;