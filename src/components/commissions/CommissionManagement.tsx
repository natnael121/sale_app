import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Commission } from '../../types';
import { DollarSign, CheckCircle, Clock, XCircle, Filter, Search, Download, Award } from 'lucide-react';

interface CommissionManagementProps {
  user: User;
}

const CommissionManagement: React.FC<CommissionManagementProps> = ({ user }) => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCommissions();
  }, [user.organizationId]);

  const fetchCommissions = async () => {
    try {
      const q = query(
        collection(db, 'commissions'),
        where('organizationId', '==', user.organizationId)
      );
      const snapshot = await getDocs(q);
      const commissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate()
      } as Commission));
      
      setCommissions(commissionsData);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommission = async (commissionId: string) => {
    try {
      await updateDoc(doc(db, 'commissions', commissionId), {
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date()
      });
      
      setCommissions(prev => prev.map(comm => 
        comm.id === commissionId 
          ? { ...comm, status: 'approved' as const, approvedBy: user.id, approvedAt: new Date() }
          : comm
      ));
    } catch (error) {
      console.error('Error approving commission:', error);
    }
  };

  const handleRejectCommission = async (commissionId: string) => {
    try {
      await updateDoc(doc(db, 'commissions', commissionId), {
        status: 'rejected',
        approvedBy: user.id,
        approvedAt: new Date()
      });
      
      setCommissions(prev => prev.map(comm => 
        comm.id === commissionId 
          ? { ...comm, status: 'rejected' as const, approvedBy: user.id, approvedAt: new Date() }
          : comm
      ));
    } catch (error) {
      console.error('Error rejecting commission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'conversion': return 'bg-green-100 text-green-800';
      case 'order_percentage': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    const matchesType = typeFilter === 'all' || commission.type === typeFilter;
    const matchesSearch = commission.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.amount.toString().includes(searchTerm);
    return matchesStatus && matchesType && matchesSearch;
  });

  const totalCommissions = commissions.reduce((sum, comm) => sum + comm.amount, 0);
  const pendingCommissions = commissions.filter(comm => comm.status === 'pending').reduce((sum, comm) => sum + comm.amount, 0);
  const approvedCommissions = commissions.filter(comm => comm.status === 'approved').reduce((sum, comm) => sum + comm.amount, 0);
  const paidCommissions = commissions.filter(comm => comm.status === 'paid').reduce((sum, comm) => sum + comm.amount, 0);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-800">Commission Management</h1>
          <p className="text-gray-600">Track and manage team commissions</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">${totalCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">${pendingCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">${approvedCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900">${paidCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by user ID or amount..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="all">All Types</option>
          <option value="meeting">Meeting</option>
          <option value="conversion">Conversion</option>
          <option value="order_percentage">Order Percentage</option>
        </select>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredCommissions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No commissions found</h3>
            <p className="text-gray-500">Commissions will appear here as they are earned</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">User</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Type</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Created</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-xs">
                            {commission.userId.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{commission.userId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(commission.type)}`}>
                        {commission.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">${commission.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(commission.status)}`}>
                        {getStatusIcon(commission.status)}
                        <span>{commission.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {commission.createdAt?.toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      {commission.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproveCommission(commission.id)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectCommission(commission.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {commission.status === 'approved' && (
                        <span className="text-sm text-gray-500">Ready for payment</span>
                      )}
                      {commission.status === 'paid' && (
                        <span className="text-sm text-green-600">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionManagement;