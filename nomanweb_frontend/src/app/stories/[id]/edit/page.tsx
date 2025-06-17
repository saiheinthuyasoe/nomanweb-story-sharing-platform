'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StoryForm } from '@/components/stories/StoryForm';
import { useStory, useUpdateStory } from '@/hooks/useStories';
import { UpdateStoryRequest } from '@/types/story';

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  
  const { data: story, isLoading } = useStory(storyId);
  const { mutate: updateStory, isPending } = useUpdateStory();

  const handleSubmit = (data: UpdateStoryRequest) => {
    updateStory({ id: storyId, data }, {
      onSuccess: (updatedStory) => {
        router.push(`/stories/${updatedStory.id}`);
      }
    });
  };

  const handleCancel = () => {
    router.push(`/stories/${storyId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6" />
            <div className="space-y-6">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-6">
                <div className="h-12 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
              <div className="h-48 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h2>
          <p className="text-gray-600 mb-4">The story you're trying to edit doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <StoryForm 
          story={story}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isPending}
          isEdit={true}
        />
      </div>
    </div>
  );
} 