'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvitationDetails, useAcceptInvitation } from '@/hooks/useCollaborations';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

export default function AcceptCollaborationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get('token');
  
  const { data: invitation, isLoading, error } = useInvitationDetails(token || '');
  const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptInvitation();

  useEffect(() => {
    if (!authLoading && !user) {
      // Store the current URL to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.href);
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleAccept = () => {
    if (!token) return;
    
    acceptInvitation(token, {
      onSuccess: (data) => {
        router.push(`/stories/${data.storyId}/chapters/${data.chapterNumber}/edit`);
      },
    });
  };

  const handleDecline = () => {
    router.push('/dashboard');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">
            This invitation link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if invitation has expired
  const isExpired = invitation.invitationExpiresAt && 
    new Date(invitation.invitationExpiresAt) < new Date();

  // Check if already accepted
  if (invitation.invitationAcceptedAt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-gray-600 mb-6">
            You have already accepted this invitation.
          </p>
          <button
            onClick={() => router.push(`/stories/${invitation.storyId}/chapters/${invitation.chapterNumber}/edit`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Chapter
          </button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ClockIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h1>
          <p className="text-gray-600 mb-6">
            This invitation has expired. Please ask for a new invitation.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <UserGroupIcon className="w-12 h-12 mb-3" />
          <h1 className="text-2xl font-bold">Collaboration Invitation</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Inviter Info */}
          {invitation.invitedBy && (
            <div className="flex items-center space-x-3">
              {invitation.invitedBy.profileImageUrl ? (
                <Image
                  src={invitation.invitedBy.profileImageUrl}
                  alt={invitation.invitedBy.displayName}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-lg">
                    {invitation.invitedBy.displayName[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-gray-900">
                  <span className="font-semibold">{invitation.invitedBy.displayName}</span> invited you to collaborate
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}

          {/* Chapter Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Chapter Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Story:</span>{' '}
                <span className="font-medium text-gray-900">{invitation.storyTitle}</span>
              </div>
              <div>
                <span className="text-gray-600">Chapter:</span>{' '}
                <span className="font-medium text-gray-900">{invitation.chapterTitle}</span>
              </div>
            </div>
          </div>

          {/* Role Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Your Role</h3>
            <div className={`flex items-center space-x-2 ${
              invitation.role === 'EDIT' ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {invitation.role === 'EDIT' ? (
                <PencilIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
              <span className="font-medium">
                {invitation.role === 'EDIT' ? 'Editor' : 'Viewer'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {invitation.role === 'EDIT' 
                ? 'You will have full editing access to this chapter.'
                : 'You will be able to view and comment on this chapter.'}
            </p>
          </div>

          {/* Expiration Warning */}
          {invitation.invitationExpiresAt && (
            <div className="text-sm text-gray-500 flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>
                Expires {formatDistanceToNow(new Date(invitation.invitationExpiresAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
} 