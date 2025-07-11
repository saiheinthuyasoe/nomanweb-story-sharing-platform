'use client';

import React, { useState } from 'react';
import { X, User, Mail, Edit3, Save, Settings } from 'lucide-react';
import { User as UserType } from '@/types/user';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import EmailChangeModal from './EmailChangeModal';
import UsernameChangeModal from './UsernameChangeModal';

interface EditProfileModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: UserType) => void;
}

export default function EditProfileModal({ user, isOpen, onClose, onSave }: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
  const [isUsernameChangeModalOpen, setIsUsernameChangeModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await authApi.updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
      });

      onSave(updatedUser);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Enter your display name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Read-only fields for reference */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                <span className="text-gray-600">@{user.username}</span>
                <button
                  type="button"
                  onClick={() => setIsUsernameChangeModalOpen(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Change
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                <span className="text-gray-600">{user.email}</span>
                <button
                  type="button"
                  onClick={() => setIsEmailChangeModalOpen(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Email Change Modal */}
      <EmailChangeModal
        user={user}
        isOpen={isEmailChangeModalOpen}
        onClose={() => setIsEmailChangeModalOpen(false)}
        onEmailChanged={(newEmail) => {
          // Update the user object with new email
          const updatedUser = { ...user, email: newEmail };
          onSave(updatedUser);
          setIsEmailChangeModalOpen(false);
        }}
      />

      {/* Username Change Modal */}
      <UsernameChangeModal
        user={user}
        isOpen={isUsernameChangeModalOpen}
        onClose={() => setIsUsernameChangeModalOpen(false)}
        onUsernameChanged={(newUsername) => {
          // Update the user object with new username
          const updatedUser = { ...user, username: newUsername };
          onSave(updatedUser);
          setIsUsernameChangeModalOpen(false);
        }}
      />
    </div>
  );
} 