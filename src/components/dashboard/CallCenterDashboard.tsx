import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead, Communication, CallOutcome } from '../../types';
import { Phone, PhoneCall, Clock, Target, TrendingUp, Calendar, Mail, MessageSquare, User as UserIcon, MapPin, Plus } from 'lucide-react';
import CallLogModal from '../calls/CallLogModal';

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

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'interested'>('all');

  useEffect(() => {
    fetchLeads();
  }, [user.organizationId]);

  const fetchLeads = async () => {
    try {
      const q = query(
        collection(db, 'leads'),
        where('organizationId', '==', user.organizationId)
      );
      const snapshot = await getDocs(q);
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Lead));
      
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (lead: Lead) => {
    setSelectedLead(lead);
    setShowCallModal(true);
  };

  const handleCallLog = async (callData: {
    outcome: CallOutcome;
    duration?: number;
    notes?: string;
  }) => {
    if (!selectedLead) return;

    try {
      // Add communication record
      const communication: Omit<Communication, 'id'> = {
        type: 'call',
        direction: 'outbound',
        outcome: callData.outcome,
        duration: callData.duration,
        content: callData.notes,
        createdBy: user.id,
        createdAt: new Date()
      };

      // Update lead with new communication
      const updatedCommunications = [...(selectedLead.communications || []), communication];
      
      // Update lead status based on call outcome
      let newStatus = selectedLead.status;
      if (callData.outcome.picked) {
        switch (callData.outcome.result) {
          case 'interested':
            newStatus = 'interested';
            break;
          case 'meeting_setup':
            newStatus = 'meeting_scheduled';
            break;
          case 'not_interested':
            newStatus = 'closed';
            break;
          default:
            newStatus = 'contacted';
        }
      } else {
        newStatus = 'contacted';
      }

      await updateDoc(doc(db, 'leads', selectedLead.id), {
        communications: updatedCommunications,
        status: newStatus,
        updatedAt: new Date(),
        assignedTo: user.id
      });

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === selectedLead.id 
          ? { ...lead, communications: updatedCommunications, status: newStatus, assignedTo: user.id }
          : lead
      ));

      setShowCallModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };

  const handleSMS = (lead: Lead) => {
    // Implement SMS functionality
    window.open(`sms:${lead.phone}`, '_blank');
  };

  const handleEmail = (lead: Lead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'meeting_scheduled': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastCommunication = (lead: Lead) => {
    if (!lead.communications || lead.communications.length === 0) return null;
    return lead.communications[lead.communications.length - 1];
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const priorityLeads = filteredLeads.filter(lead => 
    lead.status === 'new' || lead.status === 'interested' || 
    (lead.assignedTo === user.id && lead.status === 'contacted')
  );

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
        <h1 className="text-3xl font-bold text-gray-800">Call Center Dashboard</h1>
        <p className="text-gray-600">Track your daily calling performance and manage leads</p>
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

      {/* Lead Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter leads:</span>
          <div className="flex items-center space-x-2">
            {[
              { key: 'all', label: 'All Leads', count: leads.length },
              { key: 'new', label: 'New', count: leads.filter(l => l.status === 'new').length },
              { key: 'contacted', label: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
              { key: 'interested', label: 'Interested', count: leads.filter(l => l.status === 'interested').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Leads Section */}
      {priorityLeads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Priority Leads</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityLeads.slice(0, 6).map((lead) => {
              const lastComm = getLastCommunication(lead);
              return (
                <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{lead.name}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-3 h-3 mr-2" />
                      {lead.phone}
                    </div>
                    {lead.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-3 h-3 mr-2" />
                        {lead.email}
                      </div>
                    )}
                    {lead.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-3 h-3 mr-2" />
                        {lead.address.substring(0, 30)}...
                      </div>
                    )}
                  </div>

                  {lastComm && (
                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3">
                      Last: {lastComm.type} - {lastComm.outcome?.picked ? 'Picked' : 'Not picked'} 
                      ({new Date(lastComm.createdAt).toLocaleDateString()})
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCall(lead)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={() => handleSMS(lead)}
                      className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>
                    {lead.email && (
                      <button
                        onClick={() => handleEmail(lead)}
                        className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Leads Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          All Leads ({filteredLeads.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const lastComm = getLastCommunication(lead);
            return (
              <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{lead.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-3 h-3 mr-2" />
                    {lead.phone}
                  </div>
                  {lead.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-3 h-3 mr-2" />
                      {lead.email}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Source: {lead.source} • Created: {lead.createdAt?.toLocaleDateString()}
                  </div>
                </div>

                {lastComm && (
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3">
                    Last: {lastComm.type} - {lastComm.outcome?.picked ? 'Picked' : 'Not picked'} 
                    ({new Date(lastComm.createdAt).toLocaleDateString()})
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCall(lead)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => handleSMS(lead)}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                  {lead.email && (
                    <button
                      onClick={() => handleEmail(lead)}
                      className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call Log Modal */}
      {showCallModal && selectedLead && (
        <CallLogModal
          lead={selectedLead}
          onClose={() => {
            setShowCallModal(false);
            setSelectedLead(null);
          }}
          onSave={handleCallLog}
        />
      )}
    </div>
  );
};

export default CallCenterDashboard;