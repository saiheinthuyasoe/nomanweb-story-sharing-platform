'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChapterForm } from '@/components/chapters/ChapterForm';
import { useCreateChapter } from '@/hooks/useChapters';
import { useStory } from '@/hooks/useStories';
import { CreateChapterRequest } from '@/lib/api/chapters';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const storyId = params.id as string;

  const { data: story, isLoading: isLoadingStory, error: storyError } = useStory(storyId);
  const { mutate: createChapter, isPending: isCreating } = useCreateChapter();

  // Redirect if not authenticated - wait for loading to complete
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check if user is the story author
  useEffect(() => {
    if (story && user && story.author.id !== user.id) {
      router.push(`/stories/${storyId}`);
    }
  }, [story, user, router, storyId]);

  const handleSubmit = async (data: any) => {
    const chapterData: CreateChapterRequest = {
      storyId,
      title: data.title,
      content: data.content,
      chapterNumber: data.chapterNumber,
      coinPrice: data.coinPrice || 0,
      isFree: data.isFree ?? true,
      isDraft: data.isDraft ?? true,
    };

    createChapter(chapterData, {
      onSuccess: (newChapter) => {
        router.push(`/stories/${storyId}/chapters/${newChapter.chapterNumber}`);
      }
    });
  };

  if (isLoadingStory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (storyError || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h1>
          <p className="text-gray-600 mb-4">The story you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/stories')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6 px-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => router.push('/stories')}
              className="hover:text-gray-700"
            >
              Stories
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/stories/${storyId}`)}
              className="hover:text-gray-700"
            >
              {story.title}
            </button>
            <span>/</span>
            <span className="text-gray-900">New Chapter</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Chapter</h1>
              <p className="text-gray-600 mt-1">
                for "{story.title}" • Chapter {(story.totalChapters || 0) + 1}
              </p>
            </div>
            
            <button
              onClick={() => router.push(`/stories/${storyId}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Chapter Form */}
        <ChapterForm
          storyId={storyId}
          onSubmit={handleSubmit}
          isLoading={isCreating}
          maxChapterNumber={story.totalChapters || 0}
        />
      </div>
    </div>
  );
} 