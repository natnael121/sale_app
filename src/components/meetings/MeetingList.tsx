import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Meeting, Lead } from '../../types';
import { Calendar, MapPin, Clock, CheckCircle, Camera, Navigation, User as UserIcon, Plus, Search, Filter, Eye, Phone, Mail, MessageSquare } from 'lucide-react';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingDetailModal from './MeetingDetailModal';

interface MeetingListProps {
  user: User;
}

interface MeetingWithLead extends Meeting {
  leadDetails?: Lead;
}

const MeetingList: React.FC<MeetingListProps> = ({ user }) => {
  const [meetings, setMeetings] = useState<MeetingWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, [user.organizationId]);

  const fetchMeetings = async () => {
    try {
      let q = query(
        collection(db, 'meetings'),
        where('organizationId', '==', user.organizationId),
        orderBy('scheduledAt', 'desc')
      );

      // Filter by assigned meetings for field agents
      if (user.role === 'field_agent') {
        q = query(
          collection(db, 'meetings'),
          where('organizationId', '==', user.organizationId),
          where('assignedTo', '==', user.id),
          orderBy('scheduledAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const meetingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        checkIn: doc.data().checkIn ? {
          ...doc.data().checkIn,
          timestamp: doc.data().checkIn.timestamp?.toDate()
        } : undefined
      } as Meeting));

      // Fetch lead details for each meeting
      const meetingsWithLeads = await Promise.all(
        meetingsData.map(async (meeting) => {
          try {
            const leadDoc = await getDocs(query(collection(db, 'leads'), where('__name__', '==', meeting.leadId)));
            if (!leadDoc.empty) {
              const leadData = leadDoc.docs[0].data();
              return {
                ...meeting,
                leadDetails: {
                  id: leadDoc.docs[0].id,
                  ...leadData,
                  createdAt: leadData.createdAt?.toDate(),
                  updatedAt: leadData.updatedAt?.toDate()
                } as Lead
              };
            }
            return meeting;
          } catch (error) {
            console.error('Error fetching lead details:', error);
            return meeting;
          }
        })
      );

      setMeetings(meetingsWithLeads);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await updateDoc(doc(db, 'meetings', meetingId), {
            status: 'in_progress',
            checkIn: {
              timestamp: new Date(),
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              photos: [],
              notes: 'Checked in via GPS'
            }
          });
          fetchMeetings();
        } catch (error) {
          console.error('Error checking in:', error);
        }
      });
    }
  };

  const handlePhotoUpload = (meetingId: string) => {
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

  const handleCompleteMeeting = async (meetingId: string) => {
    try {
      await updateDoc(doc(db, 'meetings', meetingId), {
        status: 'completed'
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error completing meeting:', error);
    }
  };

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowDetailModal(true);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const leadName = meeting.leadDetails?.companyName || meeting.leadDetails?.name || '';
    const leadPhone = meeting.leadDetails?.managerPhone || meeting.leadDetails?.companyPhone || meeting.leadDetails?.phone || '';
    const matchesSearch = meeting.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leadPhone.includes(searchTerm) ||
                         meeting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (meeting.notes && meeting.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Meetings</h1>
          <p className="text-gray-600">Manage your scheduled field visits</p>
        </div>
        {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'call_center') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by company name, phone, location, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Meetings Grid */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No meetings found</h3>
          <p className="text-gray-500 mb-6">
            {user.role === 'field_agent' 
              ? 'No meetings have been assigned to you yet'
              : 'Start by scheduling your first meeting'
            }
          </p>
          {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'call_center') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Your First Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">Meeting #{meeting.id.slice(-6)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                      {meeting.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meeting Info */}
              <div className="space-y-2 mb-3">
                {meeting.leadDetails && (
                  <>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="truncate font-medium text-gray-800">
                        {meeting.leadDetails.companyName || meeting.leadDetails.name || 'Unknown Lead'}
                      </span>
                    </div>
                    {(meeting.leadDetails.managerPhone || meeting.leadDetails.companyPhone || meeting.leadDetails.phone) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {meeting.leadDetails.managerPhone || meeting.leadDetails.companyPhone || meeting.leadDetails.phone}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{meeting.scheduledAt.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{meeting.location}</span>
                </div>
              </div>

              {/* Notes */}
              {meeting.notes && (
                <div className="text-xs text-gray-500 mb-3">
                  <div className="truncate">{meeting.notes}</div>
                </div>
              )}

              {/* Check-in Status */}
              {meeting.checkIn && (
                <div className="bg-green-50 p-2 rounded text-xs text-gray-600 mb-3">
                  <div className="flex items-center space-x-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-green-800">Checked In</span>
                  </div>
                  <div>{meeting.checkIn.timestamp.toLocaleTimeString()}</div>
                  {meeting.checkIn.photos.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Camera className="w-3 h-3 text-gray-500" />
                      <span>{meeting.checkIn.photos.length} photos</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                {meeting.status === 'scheduled' && !meeting.checkIn && (
                  <>
                    <button
                      onClick={() => handleCheckIn(meeting.id)}
                      className="flex-1 bg-blue-600 text-white px-2 py-2 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Check In</span>
                    </button>
                    <button className="bg-gray-600 text-white px-2 py-2 rounded text-xs hover:bg-gray-700 transition-colors">
                      <MapPin className="w-3 h-3" />
                    </button>
                  </>
                )}

                {meeting.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handlePhotoUpload(meeting.id)}
                      className="bg-green-600 text-white px-2 py-2 rounded text-xs hover:bg-green-700 transition-colors"
                      title="Upload Photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCompleteMeeting(meeting.id)}
                      className="flex-1 bg-blue-600 text-white px-2 py-2 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Complete</span>
                    </button>
                  </>
                )}

                {meeting.status === 'completed' && (
                  <button className="flex-1 bg-gray-100 text-gray-700 px-2 py-2 rounded text-xs hover:bg-gray-200 transition-colors">
                    View Results
                  </button>
                )}

                <button
                  onClick={() => handleViewDetails(meeting)}
                  className="bg-purple-600 text-white px-2 py-2 rounded text-xs hover:bg-purple-700 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchMeetings();
          }}
        />
      )}

      {/* Meeting Detail Modal */}
      {showDetailModal && selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          user={user}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMeeting(null);
          }}
        />
      )}
    </div>
  );
};

export default MeetingList;