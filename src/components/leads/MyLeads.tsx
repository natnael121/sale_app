import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead } from '../../types';
import { Search, Filter, Phone, Mail, MapPin, Calendar, MessageSquare, User as UserIcon, Plus } from 'lucide-react';
import CreateLeadModal from './CreateLeadModal';
import CreateMeetingModal from '../meetings/CreateMeetingModal';

interface MyLeadsProps {
  user: User;
}

const MyLeads: React.FC<MyLeadsProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchMyLeads();
  }, [user.organizationId, user.id]);

  const fetchMyLeads = async () => {
    try {
      let q;
      
      if (user.role === 'call_center') {
        // Call center agents see leads they created or are assigned to
        q = query(
          collection(db, 'leads'),
          where('organizationId', '==', user.organizationId),
          orderBy('createdAt', 'desc')
        );
      } else if (user.role === 'field_agent') {
        // Field agents see only leads assigned to them
        q = query(
          collection(db, 'leads'),
          where('organizationId', '==', user.organizationId),
          where('assignedTo', '==', user.id),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Other roles see all leads
        q = query(
          collection(db, 'leads'),
          where('organizationId', '==', user.organizationId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Lead));

      // Filter for call center agents to show only their leads or unassigned ones
      if (user.role === 'call_center') {
        const filteredLeads = leadsData.filter(lead => 
          lead.createdBy === user.id || 
          lead.assignedTo === user.id || 
          !lead.assignedTo
        );
        setLeads(filteredLeads);
      } else {
        setLeads(leadsData);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'meeting_scheduled': return 'bg-purple-100 text-purple-800';
      case 'meeting_completed': return 'bg-indigo-100 text-indigo-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCall = (lead: Lead) => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleSMS = (lead: Lead) => {
    window.open(`sms:${lead.phone}`, '_blank');
  };

  const handleEmail = (lead: Lead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank');
    }
  };

  const handleScheduleMeeting = (lead: Lead) => {
    setSelectedLead(lead);
    setShowCreateMeetingModal(true);
  };

  const getLastCommunication = (lead: Lead) => {
    if (!lead.communications || lead.communications.length === 0) return null;
    return lead.communications[lead.communications.length - 1];
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-800">
            {user.role === 'field_agent' ? 'My Leads' : 'My Leads'}
          </h1>
          <p className="text-gray-600">
            {user.role === 'field_agent' 
              ? 'Leads assigned to you for field visits' 
              : 'Leads you\'ve created or are working on'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {(user.role === 'call_center' || user.role === 'field_agent') && (
            <button
              onClick={() => setShowCreateLeadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search leads by name, phone, or email..."
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
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="meeting_completed">Meeting Completed</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Leads Grid */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No leads found</h3>
          <p className="text-gray-500 mb-6">
            {user.role === 'field_agent' 
              ? 'No leads have been assigned to you yet'
              : 'Start by adding your first lead'
            }
          </p>
          {user.role === 'call_center' && (
            <button
              onClick={() => setShowCreateLeadModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Lead
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLeads.map((lead) => {
            const lastComm = getLastCommunication(lead);
            return (
              <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm truncate">{lead.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{lead.address}</span>
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="text-xs text-gray-500 mb-3">
                  <div>Source: {lead.source}</div>
                  <div>Created: {lead.createdAt?.toLocaleDateString()}</div>
                </div>

                {/* Last Communication */}
                {lastComm && (
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3">
                    <div className="font-medium">Last: {lastComm.type}</div>
                    <div>
                      {lastComm.outcome?.picked ? 'Picked' : 'Not picked'} - {lastComm.outcome?.result?.replace('_', ' ')}
                    </div>
                    <div>{new Date(lastComm.createdAt).toLocaleDateString()}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleCall(lead)}
                    className="flex-1 bg-blue-600 text-white px-2 py-2 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    title="Call"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => handleSMS(lead)}
                    className="bg-green-600 text-white px-2 py-2 rounded text-xs hover:bg-green-700 transition-colors"
                    title="SMS"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                  {lead.email && (
                    <button
                      onClick={() => handleEmail(lead)}
                      className="bg-purple-600 text-white px-2 py-2 rounded text-xs hover:bg-purple-700 transition-colors"
                      title="Email"
                    >
                      <Mail className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleScheduleMeeting(lead)}
                    className="bg-orange-600 text-white px-2 py-2 rounded text-xs hover:bg-orange-700 transition-colors"
                    title="Schedule Meeting"
                  >
                    <Calendar className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateLeadModal && (
        <CreateLeadModal
          user={user}
          onClose={() => setShowCreateLeadModal(false)}
          onSuccess={() => {
            setShowCreateLeadModal(false);
            fetchMyLeads();
          }}
        />
      )}

      {showCreateMeetingModal && selectedLead && (
        <CreateMeetingModal
          user={user}
          lead={selectedLead}
          onClose={() => {
            setShowCreateMeetingModal(false);
            setSelectedLead(null);
          }}
          onSuccess={() => {
            setShowCreateMeetingModal(false);
            setSelectedLead(null);
            fetchMyLeads();
          }}
        />
      )}
    </div>
  );
};

export default MyLeads;