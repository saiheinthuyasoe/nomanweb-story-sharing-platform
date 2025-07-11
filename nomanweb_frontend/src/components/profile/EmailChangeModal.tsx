'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { User as UserType } from '@/types/user';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/utils/errorHandling';

interface EmailChangeModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onEmailChanged: (newEmail: string) => void;
}

export default function EmailChangeModal({ user, isOpen, onClose, onEmailChanged }: EmailChangeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'pending'>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cooldownTime, setCooldownTime] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Check if user has OAuth accounts
  const hasOAuthAccount = !!(user.googleId || user.lineUserId);
  
  // Use backend flag if available, otherwise use conservative approach
  const canUseOAuthEndpoints = user.canUseOAuthEndpoints ?? false;
  
  const isOAuthOnlyUser = canUseOAuthEndpoints;
  const isHybridUser = hasOAuthAccount && !canUseOAuthEndpoints;
  const isPasswordOnlyUser = !hasOAuthAccount;
  
  // Use OAuth endpoint only if backend explicitly allows it
  const isOAuthUser = isOAuthOnlyUser;

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownTime]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if ((isPasswordOnlyUser || isHybridUser) && !formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newEmail.trim()) {
      newErrors.newEmail = 'New email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.newEmail)) {
      newErrors.newEmail = 'Please enter a valid email address';
    } else if (formData.newEmail.toLowerCase() === user.email.toLowerCase()) {
      newErrors.newEmail = 'New email must be different from current email';
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
        await authApi.changeEmailOAuth({
          newEmail: formData.newEmail,
        });
      } else {
        await authApi.changeEmail({
          currentPassword: formData.currentPassword,
          newEmail: formData.newEmail,
        });
      }

      setPendingEmail(formData.newEmail);
      setStep('pending');
      toast.success('Email change verification sent to new email address');
    } catch (error: any) {
      handleApiError(error, 'Failed to initiate email change');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) {
      toast.error(`Please wait ${cooldownTime} seconds before resending`);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resendEmailChangeVerification(pendingEmail);
      toast.success('Verification email resent successfully');
      
      // Start cooldown timer (60 seconds)
      setCooldownTime(60);
      setCanResend(false);
    } catch (error: any) {
      handleApiError(error, 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ currentPassword: '', newEmail: '' });
    setErrors({});
    setPendingEmail('');
    setCooldownTime(0);
    setCanResend(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'form' ? 'Change Email Address' : 'Verify New Email'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'form' ? (
          /* Email Change Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Current Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Email Address
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                {user.email}
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
                    <p>Since you signed up with Google or LINE, no password verification is required to change your email address.</p>
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

            {/* New Email */}
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                New Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="newEmail"
                  value={formData.newEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, newEmail: e.target.value });
                    if (errors.newEmail) {
                      setErrors({ ...errors, newEmail: '' });
                    }
                  }}
                  placeholder="Enter new email address"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.newEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.newEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.newEmail}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>You'll need to verify your new email address before the change takes effect. A verification link will be sent to the new email address.</p>
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Send Verification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Pending Verification Step */
          <div className="p-6 space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check Your New Email
              </h3>
              <p className="text-gray-600 mb-4">
                We've sent a verification email to <strong>{pendingEmail}</strong>.
                Please click the verification link in the email to complete the email change.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important</p>
                  <p>Your email address will remain unchanged until you verify the new email address. The verification link will expire in 24 hours.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isLoading || !canResend}
                className="w-full px-4 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Resending...</span>
                  </>
                ) : !canResend ? (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Resend in {cooldownTime}s</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 