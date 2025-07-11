'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Change Username
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Username Change Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Username (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Username
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
              {user.username}
            </div>
          </div>

          {/* Current Password - Required for password-only and hybrid users */}
          {(isPasswordOnlyUser || isHybridUser) && (
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>
          )}

          {/* OAuth Notice */}
          {isOAuthUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">OAuth Account</p>
                  <p>Since you signed up with Google or LINE, no password verification is required to change your username.</p>
                </div>
              </div>
            </div>
          )}

          {/* Hybrid Account Notice */}
          {isHybridUser && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Hybrid Account</p>
                  <p>You have both a password and OAuth accounts linked. Password verification is required for security.</p>
                </div>
              </div>
            </div>
          )}

          {/* New Username */}
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-2">
              New Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.newUsername ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.newUsername && (
              <p className="mt-1 text-sm text-red-600">{errors.newUsername}</p>
            )}
          </div>

          {/* Username Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Username Requirements</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>3-50 characters long</li>
                  <li>Only letters, numbers, and underscores</li>
                  <li>Must be unique across all users</li>
                  <li>Cannot be changed back immediately</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
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
                  <span>Changing...</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
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