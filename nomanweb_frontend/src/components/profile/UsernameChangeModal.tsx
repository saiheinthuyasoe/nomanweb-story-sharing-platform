'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Lock, AlertCircle, CheckCircle, Crown, Shield, Sparkles, AtSign } from 'lucide-react';
import { User as UserType } from '@/types/user';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/utils/errorHandling';

interface UsernameChangeModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUsernameChanged: (newUsername: string) => void;
}

export default function UsernameChangeModal({ user, isOpen, onClose, onUsernameChanged }: UsernameChangeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user has OAuth accounts
  const hasOAuthAccount = !!(user.googleId || user.lineUserId);
  
  // Use backend flag if available, otherwise use conservative approach
  const canUseOAuthEndpoints = user.canUseOAuthEndpoints ?? false;
  
  const isOAuthOnlyUser = canUseOAuthEndpoints;
  const isHybridUser = hasOAuthAccount && !canUseOAuthEndpoints;
  const isPasswordOnlyUser = !hasOAuthAccount;
  
  // Use OAuth endpoint only if backend explicitly allows it
  const isOAuthUser = isOAuthOnlyUser;

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if ((isPasswordOnlyUser || isHybridUser) && !formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newUsername.trim()) {
      newErrors.newUsername = 'New username is required';
    } else if (formData.newUsername.length < 3) {
      newErrors.newUsername = 'Username must be at least 3 characters';
    } else if (formData.newUsername.length > 50) {
      newErrors.newUsername = 'Username must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.newUsername)) {
      newErrors.newUsername = 'Username can only contain letters, numbers, and underscores';
    } else if (formData.newUsername.toLowerCase() === user.username.toLowerCase()) {
      newErrors.newUsername = 'New username must be different from current username';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isOAuthOnlyUser) {
        await authApi.changeUsernameOAuth({
          newUsername: formData.newUsername,
        });
      } else {
        await authApi.changeUsername({
          currentPassword: formData.currentPassword,
          newUsername: formData.newUsername,
        });
      }

      toast.success('Username changed successfully!');
      onUsernameChanged(formData.newUsername);
      setFormData({ currentPassword: '', newUsername: '' });
      setErrors({});
      onClose();
    } catch (error: any) {
      handleApiError(error, 'Failed to change username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newUsername: '' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">
                  Change Username
                </h2>
                <p className="text-sm text-gray-600">Update your unique identifier</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Username Section */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <AtSign className="w-4 h-4 text-[#18243c]" />
              <span>Current Username</span>
            </label>
            <div className="p-3 bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-700 font-medium">@{user.username}</span>
              </div>
            </div>
          </div>

          {/* Current Password Section - Required for password-only and hybrid users */}
          {(isPasswordOnlyUser || isHybridUser) && (
            <div className="space-y-3">
              <label htmlFor="currentPassword" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-[#18243c]" />
                <span>Current Password *</span>
              </label>
              <div className="relative group">
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, currentPassword: e.target.value });
                    if (errors.currentPassword) {
                      setErrors({ ...errors, currentPassword: '' });
                    }
                  }}
                  placeholder="Enter your current password"
                  className={`w-full pl-4 pr-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#18243c]/20 focus:border-[#18243c]/40 transition-all duration-300 placeholder-gray-400 ${
                    errors.currentPassword ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200/60'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.currentPassword}</span>
                </p>
              )}
            </div>
          )}

          {/* Enhanced OAuth Notice */}
          {isOAuthUser && (
            <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/30 border border-blue-200/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 mb-1">OAuth Account</p>
                  <p className="text-blue-700">Since you signed up with Google or LINE, no password verification is required to change your username.</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Hybrid Account Notice */}
          {isHybridUser && (
            <div className="bg-gradient-to-r from-yellow-50/80 to-yellow-100/30 border border-yellow-200/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800 mb-1">Hybrid Account</p>
                  <p className="text-yellow-700">You have both a password and OAuth accounts linked. Password verification is required for security.</p>
                </div>
              </div>
            </div>
          )}

          {/* New Username Section */}
          <div className="space-y-3">
            <label htmlFor="newUsername" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <User className="w-4 h-4 text-[#18243c]" />
              <span>New Username *</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                id="newUsername"
                value={formData.newUsername}
                onChange={(e) => {
                  setFormData({ ...formData, newUsername: e.target.value });
                  if (errors.newUsername) {
                    setErrors({ ...errors, newUsername: '' });
                  }
                }}
                placeholder="Enter new username"
                className={`w-full pl-4 pr-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#18243c]/20 focus:border-[#18243c]/40 transition-all duration-300 placeholder-gray-400 ${
                  errors.newUsername ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200/60'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            {errors.newUsername && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.newUsername}</span>
              </p>
            )}
          </div>

          {/* Enhanced Username Requirements */}
          <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-[#18243c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-[#18243c]" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-800 mb-2">Username Requirements</p>
                <ul className="space-y-1 text-gray-700">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                    <span>3-50 characters long</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                    <span>Only letters, numbers, and underscores</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                    <span>Must be unique across all users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                    <span>Cannot be changed back immediately</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200/50">
            <button
              type="button"
              onClick={handleClose}
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
                  <span>Changing...</span>
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4" />
                  <span>Change Username</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 