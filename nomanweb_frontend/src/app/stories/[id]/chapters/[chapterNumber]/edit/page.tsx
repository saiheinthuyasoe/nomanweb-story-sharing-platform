'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChapterByStoryAndNumber, useUpdateChapter, useAutoSaveChapter } from '@/hooks/useChapters';
import { useStory } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { ChapterForm } from '@/components/chapters/ChapterForm';
import { UpdateChapterRequest } from '@/lib/api/chapters';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  PencilIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  StarIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { LiveblocksRoomProvider } from '@/components/collaboration/LiveblocksRoomProvider';
import { LiveblocksActiveCollaborators } from '@/components/collaboration/LiveblocksActiveCollaborators';
import { LiveblocksFeaturesChecklist } from '@/components/collaboration/LiveblocksFeaturesChecklist';
import { useChapterCollaborators, useCreateInvitation, useUpdateCollaboratorRole, useRemoveCollaborator } from '@/hooks/useCollaborations';
import { CollaborationResponse } from '@/lib/api/collaborations';
import Image from 'next/image';

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDIT' | 'VIEW'>('VIEW');
  const [inviteMessage, setInviteMessage] = useState('');
  
  const storyId = params.id as string;
  const chapterNumber = parseInt(params.chapterNumber as string);
  
  const { data: story, isLoading: storyLoading } = useStory(storyId);
  const { data: chapter, isLoading: chapterLoading, error } = useChapterByStoryAndNumber(
    storyId, 
    chapterNumber, 
    true
  );
  const { mutate: updateChapter, isPending } = useUpdateChapter();
  const { mutate: autoSaveChapter } = useAutoSaveChapter();
  const { data: collaborators = [], isLoading: collaboratorsLoading } = useChapterCollaborators(chapter?.id || '');
  const { mutate: createInvitation, isPending: isInviting } = useCreateInvitation();
  const { mutate: updateRole } = useUpdateCollaboratorRole();
  const { mutate: removeCollaborator } = useRemoveCollaborator();

  // Check if user is authorized - wait for loading to complete
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
  }, [user, loading, router]);

  // Auto-save status indicator
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Auto-focus on title if it's "Untitled Chapter"
  useEffect(() => {
    if (chapter && chapter.title === 'Untitled Chapter') {
      // Focus on title input after a short delay to ensure form is rendered
      const timer = setTimeout(() => {
        const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chapter]);

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    createInvitation(
      {
        chapterId: chapter?.id || '',
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
    updateRole({ chapterId: chapter?.id || '', userId, role: newRole });
  };

  const handleRemove = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to remove ${username} from this chapter?`)) {
      removeCollaborator({ chapterId: chapter?.id || '', userId });
    }
  };

  const handleSubmit = async (data: {
    storyId: string;
    title: string;
    content: string;
    coinPrice: number;
    isFree: boolean;
    isDraft: boolean;
    chapterNumber?: number;
  }) => {
    if (!chapter) return;

    setSaveStatus('saving');

    console.log('EditPage - Original chapter data:', {
      id: chapter.id,
      title: chapter.title,
      contentLength: chapter.content?.length || 0,
      coinPrice: chapter.coinPrice,
      isFree: chapter.isFree,
      status: chapter.status
    });

    console.log('EditPage - Form data received:', {
      title: data.title,
      contentLength: data.content?.length || 0,
      contentPreview: data.content?.substring(0, 100) + '...',
      coinPrice: data.coinPrice,
      isFree: data.isFree,
      isDraft: data.isDraft,
      chapterNumber: data.chapterNumber
    });

    const updateData: UpdateChapterRequest = {
      title: data.title && data.title.trim() ? data.title : undefined,
      content: data.content && data.content.trim() ? data.content : undefined,
      coinPrice: data.coinPrice !== chapter.coinPrice ? data.coinPrice : undefined,
      isFree: data.isFree !== chapter.isFree ? data.isFree : undefined,
      chapterNumber: data.chapterNumber !== chapter.chapterNumber ? data.chapterNumber : undefined,
      shouldPublish: !data.isDraft && chapter.status === 'DRAFT' ? true : undefined,
    };

    console.log('EditPage - Update data being sent:', updateData);

    updateChapter(
      { id: chapter.id, data: updateData },
      {
        onSuccess: (updatedChapter) => {
          console.log('EditPage - Update successful, received:', {
            id: updatedChapter.id,
            title: updatedChapter.title,
            contentLength: updatedChapter.content?.length || 0,
            status: updatedChapter.status
          });
          setSaveStatus('saved');
          setLastSaved(new Date());
          router.push(`/dashboard/stories/${storyId}`);
        },
        onError: (error) => {
          console.error('EditPage - Update failed:', error);
          setSaveStatus('error');
          toast.error('Failed to save changes');
        }
      }
    );
  };

  const handleAutoSave = async (data: Partial<any>) => {
    if (!chapter || !data.content) return;
    
    setSaveStatus('saving');
    
    try {
      const autoSaveData: UpdateChapterRequest = {
        content: data.content,
        // Include other form fields in auto-save to prevent them from being overwritten
        title: data.title !== chapter.title ? data.title : undefined,
        coinPrice: data.coinPrice !== chapter.coinPrice ? data.coinPrice : undefined,
        isFree: data.isFree !== chapter.isFree ? data.isFree : undefined,
        isAutoSave: true,
      };

      console.log('EditPage - Auto-saving chapter:', {
        chapterId: chapter.id,
        contentLength: data.content?.length || 0,
        title: data.title,
        coinPrice: data.coinPrice,
        isFree: data.isFree,
      });

      autoSaveChapter(
        { id: chapter.id, data: autoSaveData },
        {
          onSuccess: () => {
            setSaveStatus('saved');
            setLastSaved(new Date());
          },
          onError: () => {
            setSaveStatus('error');
          }
        }
      );
    } catch (error) {
      console.error('EditPage - Auto-save failed:', error);
      setSaveStatus('error');
    }
  };

  if (storyLoading || chapterLoading || collaboratorsLoading) {
    return <EditChapterSkeleton />;
  }

  // Show loading while checking authentication
  if (loading) {
    return <EditChapterSkeleton />;
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center card-elevated p-8 max-w-md mx-4">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpenIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-nomanweb-primary mb-2">Chapter Not Found</h2>
          <p className="text-gray-600 mb-6">The chapter you're trying to edit doesn't exist or has been removed.</p>
          <Link 
            href={`/stories/${storyId}`}
            className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Story</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  // Check authorization
  const hasAccess = user?.id === story.author.id || 
    collaborators.some((collaborator: CollaborationResponse) => 
      collaborator.user.id === user?.id && collaborator.active
    );

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center card-elevated p-8 max-w-md mx-4">
          <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <PencilIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-nomanweb-primary mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to edit this chapter.</p>
          <Link 
            href={`/stories/${storyId}`}
            className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Story</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <LiveblocksRoomProvider 
      chapterId={chapter.id}
      initialContent={chapter.content || ''}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Google Docs-style Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Left side */}
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/dashboard/stories/${storyId}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to story"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </Link>
                
                <div className="flex items-center space-x-2">
                  <BookOpenIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h1 className="text-lg font-medium text-gray-900 truncate max-w-md">
                      {chapter.title || 'Untitled Chapter'}
                    </h1>
                    <p className="text-xs text-gray-500">
                      {story.title} • Chapter {chapter.chapterNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side - Save status and collaborators */}
              <div className="flex items-center space-x-4">
                {/* Liveblocks Features Status */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">Liveblocks Active</span>
                </div>
                
                {/* Real-time Collaboration Indicator - Liveblocks */}
                {chapter && <LiveblocksActiveCollaborators chapterId={chapter.id} />}
                
                {/* Invite Button */}
                {user?.id === story.author.id && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    title="Invite collaborator"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Invite</span>
                  </button>
                )}
                
                {/* Save Status */}
                <div className="flex items-center space-x-2">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600">Saved</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-600">Error saving</span>
                    </>
                  )}
                  {saveStatus === 'idle' && lastSaved && (
                    <>
                      <CloudIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Last saved {lastSaved.toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Liveblocks Features Checklist */}
          <LiveblocksFeaturesChecklist 
            chapterId={chapter.id} 
            content={chapter.content || ''} 
          />
          
          <div className="bg-white rounded-lg shadow-sm">
            <ChapterForm
              storyId={storyId}
              chapterId={chapter.id}
              initialData={{
                title: chapter.title,
                content: chapter.content,
                coinPrice: chapter.coinPrice,
                isFree: chapter.isFree,
                isDraft: chapter.status === 'DRAFT',
                chapterNumber: chapter.chapterNumber,
              }}
              onSubmit={handleSubmit}
              onAutoSave={handleAutoSave}
              isLoading={isPending}
              isEditing={true}
              useLiveblocks={true}
              story={{
                pricingType: story.pricingType,
                bookPrice: story.bookPrice
              }}
            />
          </div>
        </div>

        {/* Invite Modal */}
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
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
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
    </LiveblocksRoomProvider>
  );
}

function EditChapterSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="card-elevated p-8">
            <div className="space-y-6">
              <div>
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 