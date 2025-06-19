'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StoryForm } from '@/components/stories/StoryForm';
import { useCreateStory } from '@/hooks/useStories';
import { CreateStoryRequest } from '@/types/story';

export default function CreateStoryPage() {
  const router = useRouter();
  const { mutate: createStory, isPending } = useCreateStory();

  const handleSubmit = (data: CreateStoryRequest) => {
    createStory(data, {
      onSuccess: (newStory) => {
        router.push(`/dashboard/stories/${newStory.id}`);
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <StoryForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isPending}
          isEdit={false}
        />
      </div>
    </div>
  );
} 