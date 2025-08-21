'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle, Shield, Clock, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">
                  {step === 'form' ? 'Change Email Address' : 'Verify New Email'}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 'form' ? 'Update your email address' : 'Check your email for verification'}
                </p>
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

        {step === 'form' ? (
          /* Enhanced Email Change Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Current Email Section */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Mail className="w-4 h-4 text-[#18243c]" />
                <span>Current Email Address</span>
              </label>
              <div className="p-3 bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl backdrop-blur-sm">
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
                    <p className="text-blue-700">Since you signed up with Google or LINE, no password verification is required to change your email address.</p>
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

            {/* New Email Section */}
            <div className="space-y-3">
              <label htmlFor="newEmail" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Mail className="w-4 h-4 text-[#18243c]" />
                <span>New Email Address *</span>
              </label>
              <div className="relative group">
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
                  className={`w-full pl-4 pr-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#18243c]/20 focus:border-[#18243c]/40 transition-all duration-300 placeholder-gray-400 ${
                    errors.newEmail ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200/60'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#18243c]/5 to-[#22325a]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              {errors.newEmail && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.newEmail}</span>
                </p>
              )}
            </div>

            {/* Enhanced Email Change Info */}
            <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#18243c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-[#18243c]" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-800 mb-2">Email Change Process</p>
                  <ul className="space-y-1 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                      <span>Verification email will be sent to new address</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                      <span>Click the verification link to confirm</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#18243c] rounded-full" />
                      <span>Email will be updated after verification</span>
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
          /* Enhanced Pending Verification Step */
          <div className="p-6 space-y-6">
            {/* Success Message */}
            <div className="bg-gradient-to-r from-green-50/80 to-green-100/30 border border-green-200/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-green-800 mb-1">Verification Email Sent!</p>
                  <p className="text-green-700">We've sent a verification email to <span className="font-medium">{pendingEmail}</span></p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/30 border border-blue-200/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 mb-2">Next Steps</p>
                  <ul className="space-y-1 text-blue-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Check your email inbox (and spam folder)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Click the verification link in the email</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Your email will be updated automatically</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Resend Verification */}
            <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 border border-gray-200/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#18243c]/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#18243c]" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">Didn't receive the email?</p>
                    <p className="text-gray-600">You can resend the verification email</p>
                  </div>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={!canResend || isLoading}
                  className="group flex items-center space-x-2 px-4 py-2 bg-[#18243c]/10 hover:bg-[#18243c]/20 text-[#18243c] rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                  <span>
                    {canResend ? 'Resend' : `${cooldownTime}s`}
                  </span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-gray-200/60"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Change Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 