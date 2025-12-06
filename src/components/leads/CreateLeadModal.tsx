import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { UserPlus, X, Phone, Building2, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import LocationPicker from './LocationPicker';

interface CreateLeadModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

interface LeadFormData {
  companyName: string;
  managerName: string;
  managerPhone: string;
  companyPhone: string;
  sector: string;
  source: string;
  notes?: string;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormData>();

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    setError('');

    try {
      const leadData: any = {
        ...data,
        organizationId: user.organizationId,
        status: 'new',
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: data.notes ? [{
          id: Date.now().toString(),
          content: data.notes,
          createdBy: user.id,
          createdAt: new Date(),
          type: 'note'
        }] : [],
        communications: [],
        meetings: []
      };

      if (latitude !== null && longitude !== null) {
        leadData.latitude = latitude;
        leadData.longitude = longitude;
      }

      await addDoc(collection(db, 'leads'), leadData);

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create lead');
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
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Add New Lead</h2>
              <p className="text-gray-600">Enter company and manager details</p>
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

          {/* 1. Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                {...register('companyName', { required: 'Company name is required' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>
            {errors.companyName && (
              <p className="text-red-600 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          {/* 2. Manager Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Name *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                {...register('managerName', { required: 'Manager name is required' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter manager name"
              />
            </div>
            {errors.managerName && (
              <p className="text-red-600 text-sm mt-1">{errors.managerName.message}</p>
            )}
          </div>

          {/* 3. Manager Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                {...register('managerPhone', { required: 'Manager phone number is required' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter manager phone number"
              />
            </div>
            {errors.managerPhone && (
              <p className="text-red-600 text-sm mt-1">{errors.managerPhone.message}</p>
            )}
          </div>

          {/* 4. Company Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                {...register('companyPhone')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company phone number"
              />
            </div>
          </div>

          {/* 5. Sector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sector *
            </label>
            <input
              type="text"
              {...register('sector', { required: 'Sector is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter business sector (e.g., FMCG, Construction)"
            />
            {errors.sector && (
              <p className="text-red-600 text-sm mt-1">{errors.sector.message}</p>
            )}
          </div>

          {/* 6. Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Source *
            </label>
            <select
              {...register('source', { required: 'Lead source is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select source</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="cold_call">Cold Call</option>
              <option value="advertisement">Advertisement</option>
              <option value="trade_show">Trade Show</option>
              <option value="other">Other</option>
            </select>
            {errors.source && (
              <p className="text-red-600 text-sm mt-1">{errors.source.message}</p>
            )}
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about this lead..."
            />
          </div>

          {/* 8. Location Picker */}
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLatitude={latitude || undefined}
            initialLongitude={longitude || undefined}
          />

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
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal;
