import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead, Communication, CallOutcome } from '../../types';
import { Phone, PhoneCall, Clock, User as UserIcon, MapPin, Mail, Play, Pause, SkipForward, CheckCircle, XCircle, Calendar, AlertCircle } from 'lucide-react';
import CallLogModal from './CallLogModal';

interface CallingInterfaceProps {
  user: User;
}

const CallingInterface: React.FC<CallingInterfaceProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [stats, setStats] = useState({
    totalCalls: 0,
    callsAnswered: 0,
    meetingsScheduled: 0,
    followUps: 0
  });

  useEffect(() => {
    fetchCallableLeads();
    fetchAvailableUsers();
    const interval = setInterval(() => {
      if (callStartTime) {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user.organizationId, callStartTime]);

  const fetchAvailableUsers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('organizationId', '==', user.organizationId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        role: doc.data().role
      }));
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };
  const fetchCallableLeads = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'leads'),
        where('organizationId', '==', user.organizationId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const allLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Lead));

      // Filter leads based on calling rules
      const callableLeads = allLeads.filter(lead => {
        // Don't show leads that are already converted, closed, or have meetings scheduled
        if (lead.status === 'converted' || lead.status === 'closed' ||
            lead.status === 'meeting_scheduled' || lead.status === 'meeting_completed') {
          return false;
        }

        // Don't show leads that are currently being called by another agent
        if (lead.currentlyCallingBy && lead.currentlyCallingBy !== user.id) {
          // Check if the call session is still active (within last 30 minutes)
          if (lead.currentlyCallingAt) {
            const callingTime = new Date(lead.currentlyCallingAt).getTime();
            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;
            if (now - callingTime < thirtyMinutes) {
              return false;
            }
          }
        }

        // Check if lead has recent communications
        const lastComm = lead.communications?.[lead.communications.length - 1];
        if (lastComm) {
          const lastCommDate = new Date(lastComm.createdAt);
          const daysSinceLastComm = Math.floor((Date.now() - lastCommDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // If last call was busy/switched off/no answer, wait 1 day
          if (lastComm.outcome && !lastComm.outcome.picked && 
              (lastComm.outcome.result === 'switched_off' || 
               lastComm.outcome.result === 'no_answer') &&
              daysSinceLastComm < 1) {
            return false;
          }

          // Don't show leads marked as not interested or wrong number
          if (lastComm.outcome && 
              (lastComm.outcome.result === 'not_interested' || 
               lastComm.outcome.result === 'wrong_number')) {
            return false;
          }
          // If there's a follow-up scheduled for today or earlier, include it
          if (lastComm.outcome?.nextActionDate) {
            const nextActionDate = new Date(lastComm.outcome.nextActionDate);
            nextActionDate.setHours(0, 0, 0, 0);
            return nextActionDate <= today;
          }

          // If lead was marked as "call later", check if it's time
          if (lastComm.outcome?.result === 'call_later') {
            return daysSinceLastComm >= 1; // Wait at least 1 day
          }
        }

        return true;
      });

      // Sort by priority: follow-ups first, then new leads, then others
      callableLeads.sort((a, b) => {
        const aLastComm = a.communications?.[a.communications.length - 1];
        const bLastComm = b.communications?.[b.communications.length - 1];
        
        // Prioritize follow-ups
        const aIsFollowUp = aLastComm?.outcome?.nextActionDate ? 1 : 0;
        const bIsFollowUp = bLastComm?.outcome?.nextActionDate ? 1 : 0;
        
        if (aIsFollowUp !== bIsFollowUp) {
          return bIsFollowUp - aIsFollowUp;
        }

        // Then prioritize new leads
        const aIsNew = a.status === 'new' ? 1 : 0;
        const bIsNew = b.status === 'new' ? 1 : 0;
        
        if (aIsNew !== bIsNew) {
          return bIsNew - aIsNew;
        }

        // Finally sort by creation date
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setLeads(callableLeads);
      
      // Calculate stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayCalls = allLeads.reduce((count, lead) => {
        return count + (lead.communications?.filter(comm => 
          comm.type === 'call' && new Date(comm.createdAt) >= todayStart
        ).length || 0);
      }, 0);

      const todayAnswered = allLeads.reduce((count, lead) => {
        return count + (lead.communications?.filter(comm => 
          comm.type === 'call' && 
          new Date(comm.createdAt) >= todayStart &&
          comm.outcome?.picked
        ).length || 0);
      }, 0);

      const todayMeetings = allLeads.reduce((count, lead) => {
        return count + (lead.communications?.filter(comm => 
          comm.type === 'call' && 
          new Date(comm.createdAt) >= todayStart &&
          comm.outcome?.result === 'meeting_setup'
        ).length || 0);
      }, 0);

      const followUps = callableLeads.filter(lead => {
        const lastComm = lead.communications?.[lead.communications.length - 1];
        return lastComm?.outcome?.nextActionDate;
      }).length;

      setStats({
        totalCalls: todayCalls,
        callsAnswered: todayAnswered,
        meetingsScheduled: todayMeetings,
        followUps
      });

    } catch (error) {
      console.error('Error fetching callable leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCalling = async () => {
    if (leads.length === 0) return;

    // Mark the first lead as currently being called
    const firstLead = leads[0];
    if (firstLead) {
      try {
        await updateDoc(doc(db, 'leads', firstLead.id), {
          currentlyCallingBy: user.id,
          currentlyCallingAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error marking lead as being called:', error);
      }
    }

    setIsCallActive(true);
    setCallStartTime(new Date());
    setCallDuration(0);
  };

  const stopCalling = async () => {
    // Clear the currently calling marker from the current lead
    if (currentLead) {
      try {
        await updateDoc(doc(db, 'leads', currentLead.id), {
          currentlyCallingBy: null,
          currentlyCallingAt: null
        });
      } catch (error) {
        console.error('Error clearing calling marker:', error);
      }
    }

    setIsCallActive(false);
    setCallStartTime(null);
    setCallDuration(0);
  };

  const handleCall = () => {
    if (leads.length === 0) return;
    setShowCallModal(true);
  };

  const handleCallLog = async (callData: {
    outcome: CallOutcome;
    duration?: number;
    notes?: string;
    meetingDate?: Date;
    assignedTo?: string;
    callbackDate?: Date;
  }) => {
    const currentLead = leads[currentLeadIndex];
    if (!currentLead) return;

    try {
      // Add communication record with generated ID and Timestamp conversion
      const communicationId = `${currentLead.id}_${Date.now()}`;
      const communication = {
        id: communicationId,
        type: 'call',
        direction: 'outbound',
        outcome: {
          picked: callData.outcome.picked,
          result: callData.outcome.result,
          nextAction: callData.outcome.nextAction || null,
          nextActionDate: callData.outcome.nextActionDate ? Timestamp.fromDate(callData.outcome.nextActionDate) : null
        },
        duration: callData.duration || null,
        content: callData.notes || null,
        createdBy: user.id,
        createdAt: Timestamp.now()
      };

      // Update lead with new communication
      const updatedCommunications = [...(currentLead.communications || []), communication];

      // Update lead status based on call outcome
      let newStatus = currentLead.status;
      let assignedTo = currentLead.assignedTo;

      if (callData.outcome.picked) {
        switch (callData.outcome.result) {
          case 'interested':
            newStatus = 'interested';
            assignedTo = user.id;
            break;
          case 'meeting_setup':
            newStatus = 'meeting_scheduled';
            assignedTo = user.id;
            break;
          case 'not_interested':
            newStatus = 'closed'; // This will exclude it from future calls
            break;
          default:
            newStatus = 'contacted';
            assignedTo = user.id;
        }
      } else {
        // For not picked calls, keep current status unless it's wrong number
        if (callData.outcome.result === 'wrong_number') {
          newStatus = 'closed'; // This will exclude it from future calls
        } else {
          newStatus = 'contacted';
        }
      }

      // Create meeting if meeting was set up
      if (callData.outcome.result === 'meeting_setup' && callData.meetingDate && callData.assignedTo) {
        const leadName = currentLead.companyName || currentLead.name || 'Unknown';
        const leadPhone = currentLead.managerPhone || currentLead.companyPhone || currentLead.phone || 'N/A';
        await addDoc(collection(db, 'meetings'), {
          leadId: currentLead.id,
          organizationId: user.organizationId,
          scheduledBy: user.id,
          assignedTo: callData.assignedTo,
          scheduledAt: Timestamp.fromDate(callData.meetingDate),
          status: 'scheduled',
          location: currentLead.address || 'To be determined',
          notes: `Meeting scheduled via call center. Company: ${leadName}, Phone: ${leadPhone}`,
          createdAt: Timestamp.now()
        });
      }

      // Prepare update data - only include assignedTo if it's not undefined/null
      const updateData: any = {
        communications: updatedCommunications,
        status: newStatus,
        currentlyCallingBy: null,
        currentlyCallingAt: null,
        updatedAt: Timestamp.now()
      };

      // Only add assignedTo if it has a valid value
      if (assignedTo !== undefined && assignedTo !== null) {
        updateData.assignedTo = assignedTo;
      }

      await updateDoc(doc(db, 'leads', currentLead.id), updateData);

      // Move to next lead
      const nextIndex = currentLeadIndex + 1;
      if (nextIndex < leads.length) {
        setCurrentLeadIndex(nextIndex);
        // Mark the next lead as being called
        const nextLead = leads[nextIndex];
        if (nextLead) {
          try {
            await updateDoc(doc(db, 'leads', nextLead.id), {
              currentlyCallingBy: user.id,
              currentlyCallingAt: Timestamp.now()
            });
          } catch (error) {
            console.error('Error marking next lead as being called:', error);
          }
        }
      } else {
        // Refresh leads list when done with current batch
        await fetchCallableLeads();
        setCurrentLeadIndex(0);
      }

      setShowCallModal(false);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalCalls: prev.totalCalls + 1,
        callsAnswered: callData.outcome.picked ? prev.callsAnswered + 1 : prev.callsAnswered,
        meetingsScheduled: callData.outcome.result === 'meeting_setup' ? prev.meetingsScheduled + 1 : prev.meetingsScheduled
      }));

    } catch (error) {
      console.error('Error logging call:', error);
      alert('Error saving call log. Please try again.');
    }
  };

  const skipLead = async () => {
    // Clear the currently calling marker from the current lead
    if (currentLead) {
      try {
        await updateDoc(doc(db, 'leads', currentLead.id), {
          currentlyCallingBy: null,
          currentlyCallingAt: null
        });
      } catch (error) {
        console.error('Error clearing calling marker on skip:', error);
      }
    }

    const nextIndex = currentLeadIndex + 1;
    if (nextIndex < leads.length) {
      setCurrentLeadIndex(nextIndex);
      // Mark the next lead as being called
      const nextLead = leads[nextIndex];
      if (nextLead) {
        try {
          await updateDoc(doc(db, 'leads', nextLead.id), {
            currentlyCallingBy: user.id,
            currentlyCallingAt: Timestamp.now()
          });
        } catch (error) {
          console.error('Error marking next lead as being called on skip:', error);
        }
      }
    } else {
      setCurrentLeadIndex(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLead = leads[currentLeadIndex];
  const lastComm = currentLead?.communications?.[currentLead.communications.length - 1];
  const isFollowUp = lastComm?.outcome?.nextActionDate;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Calling Interface</h1>
        <p className="text-gray-600">Systematic lead calling with smart prioritization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Answered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.callsAnswered}</p>
              <p className="text-sm text-gray-500">
                {stats.totalCalls > 0 ? Math.round((stats.callsAnswered / stats.totalCalls) * 100) : 0}% pickup rate
              </p>
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
              <p className="text-sm font-medium text-gray-600">Follow-ups Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.followUps}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Calling Interface */}
      <div className="bg-white rounded-xl shadow-sm border">
        {!isCallActive ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Calling?</h2>
            <p className="text-gray-600 mb-6">
              {leads.length > 0 
                ? `You have ${leads.length} leads ready to call today`
                : 'No leads available for calling right now'
              }
            </p>
            {leads.length > 0 ? (
              <button
                onClick={startCalling}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-3 mx-auto text-lg font-medium"
              >
                <Play className="w-6 h-6" />
                <span>Start Calling</span>
              </button>
            ) : (
              <div className="text-gray-500">
                <p>All leads have been called or are scheduled for later.</p>
                <p className="text-sm mt-2">Check back later for follow-ups and new leads.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8">
            {/* Call Session Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Calling Session Active</h2>
                  <p className="text-gray-600">
                    Lead {currentLeadIndex + 1} of {leads.length} • Duration: {formatDuration(callDuration)}
                  </p>
                </div>
              </div>
              <button
                onClick={stopCalling}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Calling</span>
              </button>
            </div>

            {/* Current Lead Card */}
            {currentLead ? (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {currentLead.companyName || currentLead.name || 'No Name'}
                      </h3>
                      {currentLead.managerName && (
                        <p className="text-gray-600">Manager: {currentLead.managerName}</p>
                      )}
                      <p className="text-gray-600">Status: {currentLead.status.replace('_', ' ')}</p>
                      {isFollowUp && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-600 font-medium">Follow-up Call</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {currentLead.sector && (
                      <p className="text-sm text-gray-500">Sector: {currentLead.sector}</p>
                    )}
                    <p className="text-sm text-gray-500">Source: {currentLead.source}</p>
                    <p className="text-sm text-gray-500">Created: {currentLead.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {currentLead.managerPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Manager Phone</p>
                        <span className="font-medium">{currentLead.managerPhone}</span>
                      </div>
                    </div>
                  )}
                  {currentLead.companyPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Company Phone</p>
                        <span className="font-medium">{currentLead.companyPhone}</span>
                      </div>
                    </div>
                  )}
                  {currentLead.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{currentLead.phone}</span>
                    </div>
                  )}
                  {currentLead.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{currentLead.email}</span>
                    </div>
                  )}
                  {currentLead.address && (
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{currentLead.address}</span>
                    </div>
                  )}
                </div>

                {/* Previous Communications */}
                {currentLead.communications && currentLead.communications.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Previous Communications</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {currentLead.communications.slice(-3).map((comm, index) => (
                        <div key={index} className="bg-white p-3 rounded border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{comm.type}</span>
                            <span className="text-gray-500">{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                          {comm.outcome && (
                            <p className="text-gray-600 mt-1">
                              {comm.outcome.picked ? 'Picked' : 'Not picked'} - {comm.outcome.result.replace('_', ' ')}
                            </p>
                          )}
                          {comm.content && (
                            <p className="text-gray-600 mt-1">{comm.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleCall}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 font-medium"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Make Call</span>
                  </button>
                  <button
                    onClick={skipLead}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <SkipForward className="w-5 h-5" />
                    <span>Skip Lead</span>
                  </button>
                  <div className="text-sm text-gray-500">
                    Press Tab to skip, Enter to call
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">All Done!</h3>
                <p className="text-gray-600">You've completed all available leads for today.</p>
                <button
                  onClick={stopCalling}
                  className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Finish Session
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call Log Modal */}
      {showCallModal && currentLead && (
        <CallLogModal
          lead={currentLead}
          onClose={() => setShowCallModal(false)}
          onSave={handleCallLog}
          availableUsers={availableUsers}
        />
      )}
    </div>
  );
};

export default CallingInterface;