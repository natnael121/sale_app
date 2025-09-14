import React, { useState } from 'react';
import { Lead, CallOutcome } from '../../types';
import { Phone, X, Clock, CheckCircle, XCircle, Calendar, PhoneOff } from 'lucide-react';

interface CallLogModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (callData: {
    outcome: CallOutcome;
    duration?: number;
    notes?: string;
  }) => void;
}

const CallLogModal: React.FC<CallLogModalProps> = ({ lead, onClose, onSave }) => {
  const [picked, setPicked] = useState<boolean | null>(null);
  const [result, setResult] = useState<CallOutcome['result'] | ''>('');
  const [duration, setDuration] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [nextAction, setNextAction] = useState('');

  const handleSave = () => {
    if (picked === null || !result) return;

    const outcome: CallOutcome = {
      picked,
      result: result as CallOutcome['result'],
      nextAction: nextAction || undefined,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined
    };

    onSave({
      outcome,
      duration: duration > 0 ? duration : undefined,
      notes: notes || undefined
    });
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
          {(result === 'call_later' || result === 'interested') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Action
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What should be done next?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Action Date
                </label>
                <input
                  type="datetime-local"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
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