'use client';

import React, { useEffect } from 'react';
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
  PencilIcon 
} from '@heroicons/react/24/outline';

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
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
    
    if (story && user && user.id !== story.author.id) {
      router.push(`/stories/${storyId}`);
      return;
    }
  }, [user, loading, story, storyId, router]);

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
          router.push(`/stories/${storyId}`);
        },
        onError: (error) => {
          console.error('EditPage - Update failed:', error);
        }
      }
    );
  };

  const handleAutoSave = async (data: Partial<any>) => {
    if (!chapter || !data.content) return;
    
    try {
      const autoSaveData: UpdateChapterRequest = {
        content: data.content,
        isAutoSave: true,
      };

      console.log('EditPage - Auto-saving chapter:', {
        chapterId: chapter.id,
        contentLength: data.content?.length || 0,
      });

      autoSaveChapter({ id: chapter.id, data: autoSaveData });
    } catch (error) {
      console.error('EditPage - Auto-save failed:', error);
    }
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

  // Check authorization
  if (user?.id !== story.author.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center card-elevated p-8 max-w-md mx-4">
          <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <PencilIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-nomanweb-primary mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You can only edit chapters of your own stories.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/stories/${storyId}`}
            className="inline-flex items-center space-x-2 text-nomanweb-primary hover:text-nomanweb-secondary transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to {story.title}</span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="bg-nomanweb-gradient p-3 rounded-lg">
              <PencilIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-nomanweb-primary">Edit Chapter</h1>
              <p className="text-gray-600">Chapter {chapter.chapterNumber}: {chapter.title}</p>
            </div>
          </div>
        </div>

        {/* Chapter Form */}
        <div className="card-elevated">
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