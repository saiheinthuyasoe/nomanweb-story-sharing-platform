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
  const [hasUserStartedTyping, setHasUserStartedTyping] = useState(false);
  
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

  // Auto-focus on title if it's "Untitled Chapter" - only on initial load and if user hasn't started typing
  useEffect(() => {
    if (chapter && chapter.title === 'Untitled Chapter' && !hasUserStartedTyping) {
      // Focus on title input after a short delay to ensure form is rendered
      const timer = setTimeout(() => {
        const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
        const editorElement = document.querySelector('[data-lexical-editor="true"]') as HTMLElement;
        
        // Only auto-focus if:
        // 1. Title input exists and is not already focused
        // 2. Editor is not currently focused
        // 3. User hasn't started typing yet
        if (titleInput && 
            !titleInput.matches(':focus') && 
            (!editorElement || !editorElement.matches(':focus-within'))) {
          titleInput.focus();
          titleInput.select();
        }
      }, 200); // Increased delay to ensure editor is fully loaded
      return () => clearTimeout(timer);
    }
  }, [chapter, hasUserStartedTyping]);



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

  // Handle when user starts typing in the editor
  const handleTypingStart = () => {
    setHasUserStartedTyping(true);
  };

  if (storyLoading || chapterLoading) {
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

  // Check authorization - only story author can edit
  if (user?.id !== story.author.id) {
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

            {/* Right side - Save status */}
            <div className="flex items-center space-x-4">
              {/* Auto-save Status */}
              <div className="flex items-center space-x-2">
                {saveStatus === 'saving' && (
                  <>
                    <CloudIcon className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-blue-600">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">Error</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            story={{
              pricingType: story.pricingType,
              bookPrice: story.bookPrice
            }}
            onTypingStart={handleTypingStart}
          />
        </div>
      </div>


    </div>
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