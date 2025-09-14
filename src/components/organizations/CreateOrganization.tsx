import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, OrganizationSettings } from '../../types';
import { Building2, X } from 'lucide-react';

interface CreateOrganizationProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrganization: React.FC<CreateOrganizationProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    commissionPerMeeting: 50,
    commissionPerConversion: 200,
    commissionPercentagePerOrder: 5,
    callsPerDay: 50,
    meetingsPerWeek: 10,
    conversionsPerMonth: 25
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const settings: OrganizationSettings = {
        commissionRates: {
          perMeeting: formData.commissionPerMeeting,
          perConversion: formData.commissionPerConversion,
          percentagePerOrder: formData.commissionPercentagePerOrder
        },
        targets: {
          callsPerDay: formData.callsPerDay,
          meetingsPerWeek: formData.meetingsPerWeek,
          conversionsPerMonth: formData.conversionsPerMonth
        }
      };

      // Create organization
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: formData.name,
        createdAt: new Date(),
        settings
      });

      // Update user with organization ID
      await updateDoc(doc(db, 'users', user.id), {
        organizationId: orgRef.id
      });

      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('commission') || name.includes('calls') || name.includes('meetings') || name.includes('conversions')
        ? Number(value)
        : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Create Organization</h2>
              <p className="text-gray-600">Set up your sales organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter organization name"
              required
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Meeting ($)
                </label>
                <input
                  type="number"
                  name="commissionPerMeeting"
                  value={formData.commissionPerMeeting}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Conversion ($)
                </label>
                <input
                  type="number"
                  name="commissionPerConversion"
                  value={formData.commissionPerConversion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Percentage (%)
                </label>
                <input
                  type="number"
                  name="commissionPercentagePerOrder"
                  value={formData.commissionPercentagePerOrder}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Targets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calls per Day
                </label>
                <input
                  type="number"
                  name="callsPerDay"
                  value={formData.callsPerDay}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meetings per Week
                </label>
                <input
                  type="number"
                  name="meetingsPerWeek"
                  value={formData.meetingsPerWeek}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversions per Month
                </label>
                <input
                  type="number"
                  name="conversionsPerMonth"
                  value={formData.conversionsPerMonth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>
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
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganization;