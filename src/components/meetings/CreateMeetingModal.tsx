import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Lead } from '../../types';
import { Calendar, X, User as UserIcon, MapPin, Clock, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CreateMeetingModalProps {
  user: User;
  lead?: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

interface MeetingFormData {
  leadId?: string;
  assignedTo: string;
  scheduledAt: string;
  location: string;
  notes?: string;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ user, lead, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<MeetingFormData>();

  useEffect(() => {
    fetchAvailableUsers();
    if (!lead) {
      fetchLeads();
    } else {
      setValue('leadId', lead.id);
      setValue('location', lead.address || '');
    }
  }, [lead, setValue]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all users in the organization (including current user)
      const q = query(
        collection(db, 'users'),
        where('organizationId', '==', user.organizationId)
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unknown User',
        role: doc.data().role || 'user'
      }));

      console.log('Fetched available users:', users);
      setAvailableUsers(users);

      if (users.length === 0) {
        console.warn('No users found in organization:', user.organizationId);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setError('Failed to load team members');
    } finally {
      setLoadingUsers(false);
    }
  };

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
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setLoading(true);
    setError('');

    try {
      const selectedLead = lead || leads.find(l => l.id === data.leadId);
      if (!selectedLead) {
        setError('Please select a lead');
        return;
      }

      await addDoc(collection(db, 'meetings'), {
        leadId: selectedLead.id,
        organizationId: user.organizationId,
        scheduledBy: user.id,
        assignedTo: data.assignedTo,
        scheduledAt: new Date(data.scheduledAt),
        status: 'scheduled',
        location: data.location,
        notes: data.notes || `Meeting for ${selectedLead.name} - ${selectedLead.phone}`,
        createdAt: new Date()
      });

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Schedule Meeting</h2>
              <p className="text-gray-600">
                {lead ? `For ${lead.name}` : 'Create a new meeting'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!lead && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Lead *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  {...register('leadId', { required: 'Please select a lead' })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Choose a lead...</option>
                  {leads.map((leadOption) => (
                    <option key={leadOption.id} value={leadOption.id}>
                      {leadOption.name} - {leadOption.phone}
                    </option>
                  ))}
                </select>
              </div>
              {errors.leadId && (
                <p className="text-red-600 text-sm mt-1">{errors.leadId.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                {...register('assignedTo', { required: 'Please assign to a team member' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={loadingUsers}
              >
                <option value="">
                  {loadingUsers ? 'Loading team members...' : 'Select team member...'}
                </option>
                {availableUsers.map((userOption) => (
                  <option key={userOption.id} value={userOption.id}>
                    {userOption.name} ({userOption.role.replace('_', ' ')})
                    {userOption.id === user.id ? ' (You)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.assignedTo && (
              <p className="text-red-600 text-sm mt-1">{errors.assignedTo.message}</p>
            )}
            {!loadingUsers && availableUsers.length === 0 && (
              <p className="text-yellow-600 text-sm mt-1">No team members found in your organization</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Date & Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="datetime-local"
                {...register('scheduledAt', { required: 'Please select date and time' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {errors.scheduledAt && (
              <p className="text-red-600 text-sm mt-1">{errors.scheduledAt.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                {...register('location', { required: 'Please enter meeting location' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter meeting location"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about this meeting..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;