'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChapterForm } from '@/components/chapters/ChapterForm';
import { useCreateChapter } from '@/hooks/useChapters';
import { useStory } from '@/hooks/useStories';
import { CreateChapterRequest } from '@/lib/api/chapters';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface DraftChapterData {
  title: string;
  content: string;
  chapterNumber: number;
  coinPrice: number;
  isFree: boolean;
  isDraft: boolean;
  lastSaved: string;
}

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const storyId = params.id as string;
  const [draftData, setDraftData] = useState<Partial<DraftChapterData> | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isChapterCreated, setIsChapterCreated] = useState(false);

  const { data: story, isLoading: isLoadingStory, error: storyError } = useStory(storyId);
  const { mutate: createChapter, isPending: isCreating } = useCreateChapter();

  // Load draft data from localStorage on component mount
  useEffect(() => {
    if (storyId) {
      const draftKey = `chapter_draft_${storyId}_create`;
      const savedDraft = localStorage.getItem(draftKey);
      
      // Check if we're coming from a successful creation by looking at sessionStorage
      const justCreated = sessionStorage.getItem(`chapter_created_${storyId}`);
      if (justCreated) {
        // Clear the flag and any existing draft
        sessionStorage.removeItem(`chapter_created_${storyId}`);
        localStorage.removeItem(draftKey);
        console.log('CreateChapterPage - Cleared draft after successful creation');
        setIsDraftLoaded(true);
        return;
      }
      
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft) as DraftChapterData;
          // Check if draft is not too old (7 days)
          const lastSavedDate = new Date(parsedDraft.lastSaved);
          const now = new Date();
          const daysDiff = (now.getTime() - lastSavedDate.getTime()) / (1000 * 3600 * 24);
          
          if (daysDiff <= 7) {
            setDraftData(parsedDraft);
            toast.success('Draft content restored', { duration: 3000 });
          } else {
            // Remove old draft
            localStorage.removeItem(draftKey);
          }
        } catch (error) {
          console.error('Failed to parse draft data:', error);
          localStorage.removeItem(draftKey);
        }
      }
      setIsDraftLoaded(true);
    }
  }, [storyId]);

  // Auto-save function
  const handleAutoSave = async (data: Partial<any>) => {
    // Don't auto-save if chapter has already been created
    if (!storyId || !data.content || isChapterCreated) return;
    
    try {
      const draftKey = `chapter_draft_${storyId}_create`;
      const draftData: DraftChapterData = {
        title: data.title || '',
        content: data.content,
        chapterNumber: data.chapterNumber || 1,
        coinPrice: Math.round((parseFloat(data.coinPrice) || 0) * 100) / 100,
        isFree: data.isFree ?? true,
        isDraft: data.isDraft ?? true,
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      console.log('CreateChapterPage - Auto-saved to localStorage:', {
        contentLength: data.content?.length || 0,
        title: data.title
      });
      
      // Show subtle feedback for auto-save in create mode
      if (!data.isAutoSave) {
        toast.success('Draft auto-saved', { 
          duration: 1500,
          style: { fontSize: '13px', opacity: 0.9 }
        });
      }
    } catch (error) {
      console.error('CreateChapterPage - Auto-save failed:', error);
      toast.error('Failed to save draft', {
        duration: 2000,
        style: { fontSize: '13px' }
      });
    }
  };

  // Clear draft data when chapter is successfully created
  const clearDraft = () => {
    if (storyId) {
      const draftKey = `chapter_draft_${storyId}_create`;
      localStorage.removeItem(draftKey);
      setDraftData(null);
      setIsChapterCreated(true);
      console.log('CreateChapterPage - Draft cleared and chapter marked as created');
    }
  };

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
    console.log('CreateChapterPage - handleSubmit data:', data);
    
    // Validate required fields before sending
    if (!data.title || data.title.trim().length === 0) {
      toast.error('Chapter title is required');
      return;
    }
    
    // Strip HTML tags to check actual text content length
    const stripHtml = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };
    
    const textContent = stripHtml(data.content || '').trim();
    console.log('Content validation:', {
      htmlContent: data.content,
      textContent: textContent,
      textLength: textContent.length,
      htmlLength: data.content?.length || 0
    });
    
    // Check if content exists and has actual text content (not just HTML tags)
    if (!data.content || data.content.trim().length === 0 || textContent.length === 0) {
      toast.error('Chapter content is required');
      return;
    }
    
    if (!data.chapterNumber || data.chapterNumber < 1) {
      toast.error('Chapter number must be a positive integer');
      return;
    }

    // Clear draft immediately when user submits the form
    clearDraft();

    const chapterData: CreateChapterRequest = {
      storyId,
      title: data.title.trim(),
      content: data.content.trim(),
      chapterNumber: parseInt(data.chapterNumber) || 1,
      coinPrice: Math.round((parseFloat(data.coinPrice) || 0) * 100) / 100,
      isFree: data.isFree ?? true,
      isDraft: data.isDraft ?? true,
    };

    console.log('CreateChapterPage - Final chapter data:', chapterData);

    createChapter(chapterData, {
      onSuccess: (newChapter) => {
        toast.success(`Chapter ${newChapter.chapterNumber} created successfully!`);
        // Set flag to indicate successful creation
        sessionStorage.setItem(`chapter_created_${storyId}`, 'true');
        // Redirect to dashboard stories page
        router.push(`/dashboard/stories/${storyId}`);
      }
    });
  };

  if (isLoadingStory || !isDraftLoaded) {
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
              onClick={() => router.push('/dashboard/my-stories')}
              className="hover:text-gray-700"
            >
              Stories
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/dashboard/stories/${storyId}`)}
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
            </div>
            
            <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/stories/${storyId}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            </div>
          </div>
        </div>

        {/* Chapter Form */}
        <ChapterForm
          storyId={storyId}
          initialData={draftData ? {
            title: draftData.title,
            content: draftData.content,
            chapterNumber: draftData.chapterNumber,
            coinPrice: draftData.coinPrice,
            isFree: draftData.isFree,
            isDraft: draftData.isDraft,
          } : undefined}
          onSubmit={handleSubmit}
          onAutoSave={handleAutoSave}
          isLoading={isCreating}
          maxChapterNumber={story.totalChapters || 0}
        />
      </div>
    </div>
  );
} 