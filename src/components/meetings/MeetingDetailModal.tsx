import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Meeting, Lead } from '../../types';
import { X, Calendar, MapPin, Clock, User as UserIcon, Phone, Mail, MessageSquare, CheckCircle, XCircle, AlertCircle, Navigation } from 'lucide-react';

interface MeetingDetailModalProps {
  meeting: Meeting;
  user: User;
  onClose: () => void;
}

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({ meeting, user, onClose }) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [scheduledByUser, setScheduledByUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meeting]);

  const fetchMeetingDetails = async () => {
    try {
      // Fetch lead details
      const leadDoc = await getDoc(doc(db, 'leads', meeting.leadId));
      if (leadDoc.exists()) {
        const leadData = {
          id: leadDoc.id,
          ...leadDoc.data(),
          createdAt: leadDoc.data().createdAt?.toDate(),
          updatedAt: leadDoc.data().updatedAt?.toDate()
        } as Lead;
        setLead(leadData);
      }

      // Fetch assigned user details
      const assignedUserDoc = await getDoc(doc(db, 'users', meeting.assignedTo));
      if (assignedUserDoc.exists()) {
        setAssignedUser({
          id: assignedUserDoc.id,
          ...assignedUserDoc.data()
        } as User);
      }

      // Fetch scheduled by user details
      const scheduledByUserDoc = await getDoc(doc(db, 'users', meeting.scheduledBy));
      if (scheduledByUserDoc.exists()) {
        setScheduledByUser({
          id: scheduledByUserDoc.id,
          ...scheduledByUserDoc.data()
        } as User);
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
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

  const getOutcomeIcon = (outcome: any) => {
    if (!outcome) return <Phone className="w-4 h-4 text-gray-400" />;
    
    if (outcome.picked) {
      switch (outcome.result) {
        case 'interested': return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'meeting_setup': return <Calendar className="w-4 h-4 text-blue-600" />;
        case 'not_interested': return <XCircle className="w-4 h-4 text-red-600" />;
        case 'call_later': return <Clock className="w-4 h-4 text-yellow-600" />;
        default: return <CheckCircle className="w-4 h-4 text-green-600" />;
      }
    } else {
      switch (outcome.result) {
        case 'switched_off': return <Phone className="w-4 h-4 text-gray-600" />;
        case 'no_answer': return <Phone className="w-4 h-4 text-orange-600" />;
        case 'wrong_number': return <XCircle className="w-4 h-4 text-red-600" />;
        default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meeting details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Meeting Details</h2>
              <p className="text-gray-600">Complete interaction history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Meeting Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Meeting Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Scheduled Date & Time</p>
                      <p className="font-medium">{meeting.scheduledAt.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{meeting.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Assigned To</p>
                      <p className="font-medium">
                        {assignedUser ? `${assignedUser.name} (${assignedUser.role.replace('_', ' ')})` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Scheduled By</p>
                      <p className="font-medium">
                        {scheduledByUser ? `${scheduledByUser.name} (${scheduledByUser.role.replace('_', ' ')})` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {meeting.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Meeting Notes</p>
                <p className="text-gray-800">{meeting.notes}</p>
              </div>
            )}
          </div>

          {/* Check-in Information */}
          {meeting.checkIn && (
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Check-in Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Check-in Time</p>
                  <p className="font-medium">{meeting.checkIn.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">
                    {meeting.checkIn.location.latitude.toFixed(6)}, {meeting.checkIn.location.longitude.toFixed(6)}
                  </p>
                </div>
                {meeting.checkIn.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Check-in Notes</p>
                    <p className="font-medium">{meeting.checkIn.notes}</p>
                  </div>
                )}
                {meeting.checkIn.photos.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Photos ({meeting.checkIn.photos.length})</p>
                    <div className="flex space-x-2 mt-2">
                      {meeting.checkIn.photos.map((photo, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-500">Photo {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lead Information */}
          {lead && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-lg">{lead.name}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{lead.phone}</p>
                      </div>
                    </div>
                    {lead.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{lead.email}</p>
                        </div>
                      </div>
                    )}
                    {lead.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{lead.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'interested' ? 'bg-green-100 text-green-800' :
                        lead.status === 'meeting_scheduled' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Source</p>
                      <p className="font-medium">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{lead.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium">{lead.updatedAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Communication History */}
          {lead && lead.communications && lead.communications.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Complete Communication History</h3>
              <div className="space-y-4">
                {lead.communications.map((comm, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getOutcomeIcon(comm.outcome)}
                        <div>
                          <p className="font-medium text-gray-800 capitalize">
                            {comm.type} - {comm.direction}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(comm.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {comm.duration && (
                        <div className="text-sm text-gray-600">
                          Duration: {comm.duration} min
                        </div>
                      )}
                    </div>
                    
                    {comm.outcome && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          {comm.outcome.picked ? 'Call Answered' : 'Call Not Answered'} - {comm.outcome.result.replace('_', ' ')}
                        </p>
                        {comm.outcome.nextAction && (
                          <p className="text-sm text-blue-600">
                            Next Action: {comm.outcome.nextAction}
                            {comm.outcome.nextActionDate && (
                              <span className="text-gray-600">
                                {' '}on {new Date(comm.outcome.nextActionDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {comm.content && (
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-800">{comm.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Notes */}
          {lead && lead.notes && lead.notes.length > 0 && (
            <div className="bg-white border rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Notes</h3>
              <div className="space-y-3">
                {lead.notes.map((note, index) => (
                  <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        note.type === 'note' ? 'bg-blue-100 text-blue-800' :
                        note.type === 'call_log' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {note.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-800">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailModal;