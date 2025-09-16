import React, { useState } from 'react';
import { Lead, CallOutcome } from '../../types';
import { Phone, X, Clock, CheckCircle, XCircle, Calendar, PhoneOff, User, Users } from 'lucide-react';

interface CallLogModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (callData: {
    outcome: CallOutcome;
    duration?: number;
    notes?: string;
    meetingDate?: Date;
    assignedTo?: string;
    callbackDate?: Date;
  }) => void;
  availableUsers?: { id: string; name: string; role: string }[];
}

const CallLogModal: React.FC<CallLogModalProps> = ({ lead, onClose, onSave, availableUsers = [] }) => {
  const [picked, setPicked] = useState<boolean | null>(null);
  const [result, setResult] = useState<CallOutcome['result'] | ''>('');
  const [duration, setDuration] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSave = () => {
    if (picked === null || !result) return;

    // Validate required fields based on result
    if (result === 'meeting_setup' && (!meetingDate || !assignedTo)) {
      alert('Please select meeting date and assign a user for meeting setup');
      return;
    }
    
    if ((result === 'interested' || result === 'call_later') && !callbackDate) {
      alert('Please select a callback date');
      return;
    }

    const outcome: CallOutcome = {
      picked,
      result: result as CallOutcome['result'],
      nextAction: getNextActionText(result as CallOutcome['result']),
      nextActionDate: getNextActionDate()
    };

    function getNextActionText(result: CallOutcome['result']): string | undefined {
      switch (result) {
        case 'interested': return 'Follow up call - lead showed interest';
        case 'call_later': return 'Callback as requested by lead';
        case 'meeting_setup': return 'Meeting scheduled';
        case 'switched_off': return 'Retry call - phone was switched off';
        case 'no_answer': return 'Retry call - no answer';
        default: return undefined;
      }
    }

    function getNextActionDate(): Date | undefined {
      switch (result) {
        case 'interested':
        case 'call_later':
          return callbackDate ? new Date(callbackDate) : undefined;
        case 'meeting_setup':
          return meetingDate ? new Date(meetingDate) : undefined;
        case 'switched_off':
        case 'no_answer':
          // Next day by default
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0); // 9 AM next day
          return tomorrow;
        default:
          return undefined;
      }
    }
    onSave({
      outcome,
      duration: duration > 0 ? duration : undefined,
      notes: notes || undefined,
      meetingDate: meetingDate ? new Date(meetingDate) : undefined,
      assignedTo: assignedTo || undefined,
      callbackDate: callbackDate ? new Date(callbackDate) : undefined
    });
    
    // Reset form
    setPicked(null);
    setResult('');
    setDuration(0);
    setNotes('');
    setCallbackDate('');
    setMeetingDate('');
    setAssignedTo('');
  };

  const pickedOptions = [
    { value: 'interested', label: 'Interested', icon: CheckCircle, color: 'text-green-600' },
    { value: 'not_interested', label: 'Not Interested', icon: XCircle, color: 'text-red-600' },
    { value: 'meeting_setup', label: 'Meeting Setup', icon: Calendar, color: 'text-blue-600' },
    { value: 'call_later', label: 'Call Later', icon: Clock, color: 'text-yellow-600' }
  ];

  const notPickedOptions = [
    { value: 'switched_off', label: 'Switched Off', icon: PhoneOff, color: 'text-gray-600' },
    { value: 'no_answer', label: 'No Answer', icon: Phone, color: 'text-orange-600' },
    { value: 'wrong_number', label: 'Wrong Number', icon: XCircle, color: 'text-red-600' }
  ];

  const currentOptions = picked ? pickedOptions : notPickedOptions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Log Call</h2>
              <p className="text-gray-600">{lead.name} - {lead.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Call Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Call Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPicked(true);
                  setResult('');
                }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  picked === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Picked</span>
              </button>
              <button
                onClick={() => {
                  setPicked(false);
                  setResult('');
                }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  picked === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <XCircle className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Not Picked</span>
              </button>
            </div>
          </div>

          {/* Call Outcome */}
          {picked !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Call Outcome *
              </label>
              <div className="space-y-2">
                {currentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setResult(option.value as CallOutcome['result'])}
                    className={`w-full p-3 rounded-lg border-2 transition-colors flex items-center space-x-3 ${
                      result === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Call Duration */}
          {picked && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter duration in minutes"
                min="0"
                step="0.5"
              />
            </div>
          )}

          {/* Next Action */}
          {(result === 'interested' || result === 'call_later') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Callback Date & Time *</span>
                </label>
                <input
                  type="datetime-local"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {result === 'interested' ? 'Schedule follow-up call for interested lead' : 'Schedule callback as requested'}
                </p>
              </div>
            </>
          )}

          {/* Meeting Setup */}
          {result === 'meeting_setup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Meeting Date & Time *</span>
                </label>
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Assign Meeting To *</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Select team member...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose who will handle this meeting
                </p>
              </div>
            </>
          )}

          {/* Automatic Next Day Info */}
          {(result === 'switched_off' || result === 'no_answer') && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Automatic Retry</span>
              </div>
              <p className="text-sm text-blue-700">
                This lead will automatically appear in tomorrow's call list at 9:00 AM
              </p>
            </div>
          )}

          {/* Removal Warning */}
          {(result === 'not_interested' || result === 'wrong_number') && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Lead Removal</span>
              </div>
              <p className="text-sm text-red-700">
                {result === 'not_interested' 
                  ? 'This lead will be moved to the "Not Interested" list and removed from calling queue'
                  : 'This lead will be removed from the calling queue due to wrong number'
                }
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about this call..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={picked === null || !result}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Call Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallLogModal;