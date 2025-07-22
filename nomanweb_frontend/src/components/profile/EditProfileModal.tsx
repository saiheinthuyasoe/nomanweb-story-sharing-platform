'use client';

import React, { useState } from 'react';
import { X, User, Mail, Edit3, Save, Settings, Camera, Shield, Crown, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">
                  Edit Profile
                </h2>
                <p className="text-sm text-gray-600">Update your profile information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Display Name Section */}
          <div className="space-y-3">
            <label htmlFor="displayName" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <User className="w-4 h-4 text-[#18243c]" />
              <span>Display Name</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Enter your display name"
                className="w-full pl-4 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-[#18243c]/20 focus:border-[#18243c]/40 transition-all duration-300 placeholder-gray-400"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-3">
            <label htmlFor="bio" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Sparkles className="w-4 h-4 text-[#18243c]" />
              <span>Bio</span>
            </label>
            <div className="relative group">
              <textarea
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-[#18243c]/20 focus:border-[#18243c]/40 transition-all duration-300 resize-none placeholder-gray-400"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Share your story with the community</span>
              <span className={`font-medium ${formData.bio.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                {formData.bio.length}/500
              </span>
            </div>
          </div>

          {/* Enhanced Read-only Fields Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-4 h-4 text-[#18243c]" />
              <span className="text-sm font-semibold text-gray-700">Account Settings</span>
            </div>
            
            {/* Username Field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700 font-medium">@{user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUsernameChangeModalOpen(true)}
                  className="group/btn flex items-center space-x-1 px-3 py-1.5 bg-[#18243c]/10 hover:bg-[#18243c]/20 text-[#18243c] rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  <Settings className="h-3.5 w-3.5 group-hover/btn:rotate-90 transition-transform duration-300" />
                  <span>Change</span>
                </button>
              </div>
            </div>
            
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700 font-medium">{user.email}</span>
                  {user.emailVerified && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailChangeModalOpen(true)}
                  className="group/btn flex items-center space-x-1 px-3 py-1.5 bg-[#18243c]/10 hover:bg-[#18243c]/20 text-[#18243c] rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  <Settings className="h-3.5 w-3.5 group-hover/btn:rotate-90 transition-transform duration-300" />
                  <span>Change</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-gray-200/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:scale-105 shadow-lg hover:shadow-xl"
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