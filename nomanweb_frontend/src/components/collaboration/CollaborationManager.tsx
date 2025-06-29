'use client';

import React, { useState } from 'react';
import { 
  useChapterCollaborators, 
  useCreateInvitation, 
  useUpdateCollaboratorRole,
  useRemoveCollaborator 
} from '@/hooks/useCollaborations';
import { 
  UserPlusIcon, 
  UsersIcon, 
  PencilIcon, 
  EyeIcon,
  TrashIcon,
  EnvelopeIcon,
  XMarkIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface CollaborationManagerProps {
  chapterId: string;
  isOwner: boolean;
}

export function CollaborationManager({ chapterId, isOwner }: CollaborationManagerProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDIT' | 'VIEW'>('VIEW');
  const [inviteMessage, setInviteMessage] = useState('');
  
  const { data: collaborators = [], isLoading } = useChapterCollaborators(chapterId);
  const { mutate: createInvitation, isPending: isInviting } = useCreateInvitation();
  const { mutate: updateRole } = useUpdateCollaboratorRole();
  const { mutate: removeCollaborator } = useRemoveCollaborator();

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    createInvitation(
      {
        chapterId,
        inviteeEmail: inviteEmail,
        role: inviteRole,
        message: inviteMessage || undefined,
      },
      {
        onSuccess: () => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteMessage('');
          setInviteRole('VIEW');
        },
      }
    );
  };

  const handleRoleChange = (userId: string, newRole: 'EDIT' | 'VIEW') => {
    updateRole({ chapterId, userId, role: newRole });
  };

  const handleRemove = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to remove ${username} from this chapter?`)) {
      removeCollaborator({ chapterId, userId });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
            <span className="text-sm text-gray-500">({collaborators.length})</span>
          </div>
          
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">Invite</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Section - Avatar Icons Only */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-6">
            <UsersIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No collaborators yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Avatar Grid */}
            <div className="flex flex-wrap gap-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="relative group cursor-pointer"
                  title={`${collaborator.user.displayName} (${collaborator.role})${collaborator.isPending ? ' - Pending' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    {collaborator.user.profileImageUrl ? (
                      <Image
                        src={collaborator.user.profileImageUrl}
                        alt={collaborator.user.displayName}
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-gray-100 hover:ring-blue-300 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center ring-2 ring-gray-100 hover:ring-blue-300 transition-all">
                        <span className="text-white font-bold text-sm">
                          {collaborator.user.displayName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Status Indicator */}
                    {collaborator.isPending ? (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <ClockIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    
                    {/* Owner Indicator */}
                    {collaborator.isOwner && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <StarIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Role Badge on Hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className={`px-2 py-1 rounded text-xs font-medium text-white ${
                      collaborator.role === 'EDIT' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {collaborator.role === 'EDIT' ? 'Editor' : 'Viewer'}
                    </div>
                    <div className="w-2 h-2 bg-gray-600 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                  
                  {/* Actions on Hover (for owners) */}
                  {isOwner && !collaborator.isPending && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
                      <div className="flex flex-col space-y-1 min-w-[120px]">
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleRoleChange(collaborator.user.id, e.target.value as 'EDIT' | 'VIEW')}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="EDIT">Editor</option>
                          <option value="VIEW">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRemove(collaborator.user.id, collaborator.user.displayName)}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center space-x-1"
                        >
                          <TrashIcon className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Quick Stats */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{collaborators.filter(c => c.role === 'EDIT').length} editors</span>
                <span>{collaborators.filter(c => c.role === 'VIEW').length} viewers</span>
                <span>{collaborators.filter(c => c.isPending).length} pending</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-2xl border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserPlusIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Invite Collaborator</h3>
                    <p className="text-sm text-gray-600">Add someone to work on this chapter</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Permission Level
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setInviteRole('VIEW')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      inviteRole === 'VIEW'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                        inviteRole === 'VIEW' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <EyeIcon className={`w-6 h-6 ${inviteRole === 'VIEW' ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">View Only</p>
                      <p className="text-xs text-gray-500">Can read and comment</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setInviteRole('EDIT')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      inviteRole === 'EDIT'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                        inviteRole === 'EDIT' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <PencilIcon className={`w-6 h-6 ${inviteRole === 'EDIT' ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">Can Edit</p>
                      <p className="text-xs text-gray-500">Full editing access</p>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Optional Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message to make your invitation more welcoming..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md"
                >
                  {isInviting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 