'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StoryForm } from '@/components/stories/StoryForm';
import { useCreateStory } from '@/hooks/useStories';
import { CreateStoryRequest, UpdateStoryRequest } from '@/types/story';
import Cookies from 'js-cookie';

export default function CreateStoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { mutate: createStory, isPending } = useCreateStory();

  useEffect(() => {
    console.log('🔍 CreateStoryPage auth check:', {
      loading,
      user: user ? { id: user.id, email: user.email } : null,
      hasToken: !!Cookies.get('token'),
      hasRefreshToken: !!Cookies.get('refreshToken')
    });

    if (!loading && !user) {
      console.log('🚨 User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = (data: CreateStoryRequest | UpdateStoryRequest) => {
    console.log('📝 Submitting story creation:', data);
    console.log('🔑 Current auth state:', {
      user: user ? { id: user.id, email: user.email } : null,
      hasToken: !!Cookies.get('token'),
      tokenPreview: Cookies.get('token')?.substring(0, 20) + '...'
    });

    createStory(data as CreateStoryRequest, {
      onSuccess: (newStory: any) => {
        console.log('✅ Story created successfully:', newStory);
        router.push(`/dashboard/stories/${newStory.id}`);
      },
      onError: (error: any) => {
        console.error('❌ Story creation failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          responseText: error.response?.data?.message || error.response?.data?.error || 'No error message'
        });
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚨 CreateStoryPage: No user found, not rendering form');
    return null;
  }

  console.log('✅ CreateStoryPage: User authenticated, rendering form');

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