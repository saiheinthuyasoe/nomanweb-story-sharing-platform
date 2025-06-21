'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Clock, CheckCircle, XCircle, Trash2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminInvitation {
  id: string;
  email: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  notes?: string;
  invitedByName: string;
  invitedByEmail: string;
  registeredAdminName?: string;
  registeredAdminEmail?: string;
  isExpired: boolean;
  isValid: boolean;
  hoursUntilExpiration: number;
}

const AdminInvitationsPage = () => {
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    notes: '',
    expirationHours: 24,
    department: '',
    role: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/auth/invitations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/auth/invitation/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      toast.success('Admin invitation created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        notes: '',
        expirationHours: 24,
        department: '',
        role: ''
      });
      fetchInvitations();
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error(error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/auth/invitation/${invitationId}/revoke`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      toast.success('Invitation revoked successfully');
      fetchInvitations();
    } catch (error: any) {
      console.error('Error revoking invitation:', error);
      toast.error('Failed to revoke invitation');
    }
  };

  const getStatusIcon = (status: string, isExpired: boolean) => {
    if (isExpired) return <Clock className="w-4 h-4 text-orange-500" />;
    
    switch (status) {
      case 'PENDING':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'USED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'REVOKED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, isExpired: boolean) => {
    if (isExpired) return 'bg-orange-100 text-orange-800';
    
    switch (status) {
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'USED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      case 'REVOKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Invitations</h1>
          <p className="text-gray-600">Manage administrator invitations and access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invitation</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invitations</p>
              <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-blue-600">
                {invitations.filter(inv => inv.status === 'PENDING' && !inv.isExpired).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Used</p>
              <p className="text-2xl font-bold text-green-600">
                {invitations.filter(inv => inv.status === 'USED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-orange-600">
                {invitations.filter(inv => inv.isExpired || inv.status === 'EXPIRED').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invitations</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invited By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </div>
                        {invitation.notes && (
                          <div className="text-sm text-gray-500">
                            {invitation.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invitation.status, invitation.isExpired)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status, invitation.isExpired)}`}>
                        {invitation.isExpired ? 'Expired' : invitation.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invitation.invitedByName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                    {invitation.status === 'PENDING' && !invitation.isExpired && (
                      <div className="text-xs text-blue-600">
                        {invitation.hoursUntilExpiration}h remaining
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {invitation.status === 'PENDING' && !invitation.isExpired && (
                      <button
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Revoke</span>
                      </button>
                    )}
                    {invitation.status === 'USED' && invitation.registeredAdminName && (
                      <div className="text-green-600 text-xs">
                        Used by {invitation.registeredAdminName}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {invitations.length === 0 && (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new admin invitation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Admin Invitation</h3>
              
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="admin@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={createForm.expirationHours}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, expirationHours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Content Management"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Additional information..."
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Create Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvitationsPage; 