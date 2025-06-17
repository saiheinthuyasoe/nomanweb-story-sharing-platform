'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { LexicalEditor } from '@/components/editor';
import { Save, Settings, Clock, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChapterFormData {
  storyId: string;
  title: string;
  content: string;
  coinPrice: number;
  isFree: boolean;
  isDraft: boolean;
  chapterNumber?: number;
}

interface ChapterFormProps {
  storyId: string;
  chapterId?: string;
  initialData?: Partial<ChapterFormData>;
  onSubmit: (data: ChapterFormData) => Promise<void>;
  onAutoSave?: (data: Partial<ChapterFormData>) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
  maxChapterNumber?: number;
}

export function ChapterForm({
  storyId,
  chapterId,
  initialData,
  onSubmit,
  onAutoSave,
  isLoading = false,
  isEditing = false,
  maxChapterNumber = 0
}: ChapterFormProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Ref to track the latest content
  const latestContentRef = useRef(initialData?.content || '');
  const previousContentRef = useRef(initialData?.content || '');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<ChapterFormData>({
    defaultValues: {
      storyId,
      title: initialData?.title || '',
      content: initialData?.content || '',
      coinPrice: initialData?.coinPrice || 0,
      isFree: initialData?.isFree ?? true,
      isDraft: initialData?.isDraft ?? true,
      chapterNumber: initialData?.chapterNumber || (maxChapterNumber + 1),
    }
  });

  const watchedValues = watch();

  // Update all form values when initialData changes (for editing)
  useEffect(() => {
    if (initialData && isEditing) {
      console.log('ChapterForm - Updating form values for editing:', {
        title: initialData.title,
        chapterNumber: initialData.chapterNumber,
        coinPrice: initialData.coinPrice,
        isFree: initialData.isFree,
        isDraft: initialData.isDraft
      });
      
      // Update all form fields with initial data
      if (initialData.title !== undefined) {
        setValue('title', initialData.title);
      }
      if (initialData.chapterNumber !== undefined) {
        setValue('chapterNumber', initialData.chapterNumber);
      }
      if (initialData.coinPrice !== undefined) {
        setValue('coinPrice', initialData.coinPrice);
      }
      if (initialData.isFree !== undefined) {
        setValue('isFree', initialData.isFree);
      }
      if (initialData.isDraft !== undefined) {
        setValue('isDraft', initialData.isDraft);
      }
    }
  }, [initialData, isEditing, setValue]);

  // Update content state when initialData changes (for editing)
  useEffect(() => {
    if (initialData?.content && initialData.content !== content) {
      setContent(initialData.content);
      // Calculate initial word and character counts
      const words = initialData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characters = initialData.content.length;
      setWordCount(words);
      setCharacterCount(characters);
      setValue('content', initialData.content);
    }
  }, [initialData?.content, content, setValue]);

  // Initialize counts if content is already present
  useEffect(() => {
    if (content && wordCount === 0 && characterCount === 0) {
      const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characters = content.length;
      setWordCount(words);
      setCharacterCount(characters);
    }
  }, [content, wordCount, characterCount]);

  // Handle content changes from the Lexical editor
  const handleContentChange = useCallback((newContent: string, words: number, characters: number) => {
    console.log('ChapterForm - handleContentChange called:', {
      contentLength: newContent?.length || 0,
      words,
      characters,
      contentPreview: newContent?.substring(0, 100) + '...'
    });
    
    setContent(newContent);
    setWordCount(words);
    setCharacterCount(characters);
    
    // Update the ref with latest content
    latestContentRef.current = newContent;
    
    // Immediately update the form state to ensure sync
    setValue('content', newContent, { shouldDirty: true, shouldValidate: true });
    
    // Fast auto-save for content changes
    if (onAutoSave && newContent && newContent.trim() && isEditing && chapterId) {
      // Clear any existing timeout
      clearTimeout((window as any).contentChangeAutoSaveTimeout);
      
      // Much faster auto-save - 500ms delay
      (window as any).contentChangeAutoSaveTimeout = setTimeout(async () => {
        try {
          const formData = {
            ...watchedValues,
            content: newContent,
            isDraft: true,
            isAutoSave: true
          };
          
          console.log('Fast content change auto-save triggered...');
          await onAutoSave(formData);
          
          // Show subtle feedback for fast saves
          toast.success('Auto-saved', { 
            duration: 1000,
            style: { fontSize: '12px', opacity: 0.8 }
          });
        } catch (error) {
          console.error('Fast auto-save failed:', error);
        }
      }, 500); // Very fast - 500ms delay
    }
  }, [setValue, onAutoSave, isEditing, chapterId, watchedValues]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async (autoSaveContent: string) => {
    // Remove the isDirty dependency since editor formatting might not update form state immediately
    if (!onAutoSave) return;

    // Check if there's actual content to save
    if (!autoSaveContent || !autoSaveContent.trim()) return;

    try {
      const formData = {
        ...watchedValues,
        content: autoSaveContent,
        isAutoSave: true
      };
      
      await onAutoSave(formData);
      setLastAutoSave(new Date());
      toast.success('Auto-saved', { duration: 2000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Auto-save failed');
    }
  }, [onAutoSave, watchedValues]);

  // Auto-save on page leave/refresh functionality
  useEffect(() => {
    // Only enable auto-save on leave for editing mode (not creation)
    if (!isEditing || !chapterId || !onAutoSave) return;

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      // Check if there are unsaved changes and form hasn't been successfully submitted
      // Remove isDirty dependency for more reliable detection of editor changes
      if (!isSubmitted && latestContentRef.current && latestContentRef.current.trim()) {
        // Try to save as draft automatically (silently)
        try {
          const formData = {
            ...watchedValues,
            content: latestContentRef.current,
            isDraft: true, // Force save as draft
            isAutoSave: true
          };
          
          console.log('Auto-saving draft on page leave...');
          
          // Use sendBeacon for reliable auto-save on page unload
          const data = JSON.stringify(formData);
          if (navigator.sendBeacon && chapterId) {
            // This is more reliable for page unload scenarios
            const token = document.cookie.split('; ')
              .find(row => row.startsWith('token='))
              ?.split('=')[1];
            
            if (token) {
              navigator.sendBeacon(
                `/api/chapters/${chapterId}/auto-save`,
                new Blob([data], { type: 'application/json' })
              );
            }
          } else {
            // Fallback to regular async call
            await onAutoSave(formData);
          }
        } catch (error) {
          console.error('Failed to auto-save on page leave:', error);
        }
        
        // Don't show browser warning - let auto-save handle it silently
        // Remove the e.preventDefault() and return value to avoid the warning
      }
    };

    const handleRouteChange = async () => {
      // Same logic for route changes
      if (!isSubmitted && latestContentRef.current && latestContentRef.current.trim()) {
        try {
          const formData = {
            ...watchedValues,
            content: latestContentRef.current,
            isDraft: true,
            isAutoSave: true
          };
          
          console.log('Auto-saving draft on route change...');
          await onAutoSave(formData);
          
          // Show notification
          toast.success('Changes auto-saved as draft', { 
            duration: 2000,
            style: { fontSize: '14px' }
          });
        } catch (error) {
          console.error('Failed to auto-save on route change:', error);
          toast.error('Failed to auto-save changes', {
            duration: 2000,
            style: { fontSize: '14px' }
          });
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also handle visibility change (when user switches tabs or minimizes)
    const handleVisibilityChange = async () => {
      if (document.hidden && !isSubmitted && latestContentRef.current && latestContentRef.current.trim()) {
        try {
          const formData = {
            ...watchedValues,
            content: latestContentRef.current,
            isDraft: true,
            isAutoSave: true
          };
          
          console.log('Fast auto-save on visibility change...');
          await onAutoSave(formData);
          
          // Quick notification
          toast.success('Auto-saved', { 
            duration: 1000,
            style: { fontSize: '13px', opacity: 0.9 }
          });
        } catch (error) {
          console.error('Failed to auto-save on visibility change:', error);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle navigation by detecting clicks on links and back/forward buttons
    const handleNavigationAttempt = async (e: Event) => {
      // Check if it's a navigation link click
      const target = e.target as HTMLElement;
      
      // Exclude editor toolbar buttons and editor-related elements
      const isEditorElement = target.closest('[data-lexical-editor]') ||
                             target.closest('[data-lexical-toolbar]') ||
                             target.closest('[data-lexical-button]') ||
                             target.closest('.lexical-toolbar') ||
                             target.closest('.floating-text-toolbar') ||
                             target.closest('[role="toolbar"]') ||
                             target.closest('[data-testid*="editor"]') ||
                             target.closest('.editor-') ||
                             target.classList.contains('editor-') ||
                             target.hasAttribute('data-lexical-button');
      
      // Exclude chapter form buttons (Save Draft, Publish, etc.)
      const isFormButton = target.closest('form') && target.tagName === 'BUTTON';
      
      // Only detect actual navigation elements
      const isNavigation = !isEditorElement && !isFormButton && (
        target.closest('a[href]') || 
        (target.closest('button[type="button"]') && 
         (target.textContent?.includes('Back') || 
          target.textContent?.includes('Cancel') ||
          target.closest('[role="navigation"]')))
      );
      
      if (isNavigation && !isSubmitted && latestContentRef.current && latestContentRef.current.trim()) {
        // Immediate auto-save on navigation - no delay for safety
        try {
          const formData = {
            ...watchedValues,
            content: latestContentRef.current,
            isDraft: true,
            isAutoSave: true
          };
          
          console.log('Immediate auto-save on navigation...');
          await onAutoSave(formData);
          
          // Show confirmation
          toast.success('Changes auto-saved as draft', { 
            duration: 1500,
            style: { fontSize: '14px' }
          });
        } catch (error) {
          console.error('Failed to auto-save on navigation:', error);
          toast.error('Failed to auto-save changes', {
            duration: 1500,
            style: { fontSize: '14px' }
          });
        }
      }
    };

    // Listen for clicks that might trigger navigation
    document.addEventListener('click', handleNavigationAttempt, true);
    
    // Handle browser back/forward buttons
    const handlePopState = async () => {
      await handleRouteChange();
    };
    
    window.addEventListener('popstate', handlePopState);

    // Periodic auto-save as backup (much more frequent)
    const periodicAutoSave = setInterval(async () => {
      if (!isSubmitted && latestContentRef.current && latestContentRef.current.trim() && isEditing && chapterId) {
        try {
          const formData = {
            ...watchedValues,
            content: latestContentRef.current,
            isDraft: true,
            isAutoSave: true
          };
          
          console.log('Frequent periodic auto-save triggered...');
          await onAutoSave(formData);
          
          // Very subtle notification for frequent saves
          toast.success('Auto-saved', { 
            duration: 800,
            style: { fontSize: '11px', opacity: 0.6 }
          });
        } catch (error) {
          console.error('Periodic auto-save failed:', error);
        }
      }
    }, 30000); // Every 30 seconds instead of 2 minutes

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleNavigationAttempt, true);
      window.removeEventListener('popstate', handlePopState);
      clearInterval(periodicAutoSave);
    };
  }, [isSubmitted, isEditing, chapterId, onAutoSave, watchedValues]);

  // Handle form submission
  const onFormSubmit = async (data: ChapterFormData) => {
    try {
      // Use the latest content from the ref to ensure we have the most current content
      const latestContent = latestContentRef.current;
      
      const submissionData = {
        ...data,
        content: latestContent, // Use the latest content from ref
        storyId
      };
      
      console.log('ChapterForm - Submitting data:', {
        title: submissionData.title,
        contentLength: submissionData.content?.length || 0,
        contentPreview: submissionData.content?.substring(0, 100) + '...',
        coinPrice: submissionData.coinPrice,
        isFree: submissionData.isFree,
        isDraft: submissionData.isDraft,
        storyId: submissionData.storyId,
        contentFromState: content?.length || 0,
        contentFromForm: data.content?.length || 0,
        contentFromRef: latestContent?.length || 0
      });
      
      // Ensure we have content
      if (!submissionData.content || !submissionData.content.trim()) {
        toast.error('Chapter content cannot be empty');
        return;
      }
      
      await onSubmit(submissionData);
      console.log('ChapterForm - Submit successful');
      setIsSubmitted(true); // Mark as successfully submitted
      toast.success(isEditing ? 'Chapter updated!' : 'Chapter created!');
    } catch (error) {
      console.error('ChapterForm - Submit failed:', error);
      toast.error(isEditing ? 'Failed to update chapter' : 'Failed to create chapter');
    }
  };

  // Publish/Unpublish handlers
  const handlePublish = () => {
    setValue('isDraft', false);
    handleSubmit(onFormSubmit)();
  };

  const handleSaveDraft = () => {
    setValue('isDraft', true);
    handleSubmit(onFormSubmit)();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Chapter' : 'Write New Chapter'}
          </h1>
          
          <div className="flex items-center space-x-2">
            {lastAutoSave && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock size={14} className="mr-1" />
                Auto-saved {lastAutoSave.toLocaleTimeString()}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Chapter Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900">Chapter Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Chapter Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chapter Number
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={initialData?.chapterNumber || (maxChapterNumber + 1)}
                  {...register('chapterNumber', { 
                    required: 'Chapter number is required',
                    min: { value: 1, message: 'Chapter number must be positive' },
                    valueAsNumber: true,
                    setValueAs: (value) => parseInt(value) || 1
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter chapter number"
                />
                {errors.chapterNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.chapterNumber.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Current value: {watchedValues.chapterNumber}
                </p>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Coins size={16} className="inline mr-1" />
                  Coin Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={watchedValues.isFree}
                  {...register('coinPrice', { 
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Free Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isFree')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Free to read
                </label>
              </div>
            </div>

            {/* Editor preferences */}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        )}

        {/* Chapter Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chapter Title
          </label>
          <input
            type="text"
            {...register('title', { 
              required: 'Chapter title is required',
              maxLength: { value: 255, message: 'Title too long' }
            })}
            placeholder="Enter your chapter title..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Lexical Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chapter Content
          </label>
          <LexicalEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing your chapter..."
            isDarkMode={isDarkMode}
            autoSaveInterval={10000}
            className="min-h-[500px]"
            chapterId={chapterId}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </button>
            
            <button
              type="button"
              onClick={handlePublish}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {isEditing ? 'Update & Publish' : 'Publish Chapter'}
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </div>
        </div>
      </form>
    </div>
  );
} 