'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { LexicalEditor } from '@/components/editor';
import { Save, Settings, Clock, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLiveblocksCollaboration } from '@/hooks/useLiveblocksCollaboration';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useAuth } from '@/contexts/AuthContext';
import { LiveblocksActiveCollaborators } from '@/components/collaboration/LiveblocksActiveCollaborators';

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
  story?: {
    pricingType: 'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK';
    bookPrice?: number;
  };
  useLiveblocks?: boolean; // New prop to enable Liveblocks collaboration
}

export function ChapterForm({
  storyId,
  chapterId,
  initialData,
  onSubmit,
  onAutoSave,
  isLoading = false,
  isEditing = false,
  maxChapterNumber = 0,
  story,
  useLiveblocks = false
}: ChapterFormProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auth context
  const { user } = useAuth();

  // Cursor position tracking for enhanced collaboration
  const { textareaRef, cursorPosition, updateCursorPosition, calculateCursorPosition } = useCursorPosition();

  // Real-time collaboration - only use Liveblocks when enabled
  const liveblocksCollaboration = useLiveblocks ? useLiveblocksCollaboration(chapterId || '') : null;
  
  const { sendContentUpdate, sendCursorPosition, sendSelectionRange, registerContentUpdateCallback, isConnected, collaborators, storage } = 
    liveblocksCollaboration || { 
      sendContentUpdate: () => {}, 
      sendCursorPosition: () => {}, 
      sendSelectionRange: () => {}, 
      registerContentUpdateCallback: () => () => {}, 
      isConnected: false, 
      collaborators: [],
      storage: null
    };

  // Calculate remote cursor positions for visualization
  const remoteCursors = collaborators
    .filter(collaborator => collaborator.cursorPosition !== undefined)
    .map(collaborator => {
      const remotePosition = calculateCursorPosition(content, collaborator.cursorPosition!);
      
      if (!textareaRef.current) return null;
      
      const textareaRect = textareaRef.current.getBoundingClientRect();
      const relativeX = remotePosition.x - textareaRect.left;
      const relativeY = remotePosition.y - textareaRect.top;
      
      return {
        ...collaborator,
        position: { x: relativeX, y: relativeY }
      };
    })
    .filter(Boolean);

  console.log(`ChapterForm: ${useLiveblocks ? 'Liveblocks' : 'No collaboration'} status:`, {
    chapterId,
    isConnected,
    hasSendContentUpdate: !!sendContentUpdate,
    hasRegisterCallback: !!registerContentUpdateCallback,
    collaboratorsCount: collaborators.length,
    remoteCursorsCount: remoteCursors.length,
    mode: useLiveblocks ? 'Liveblocks' : 'None',
    typingUsers: collaborators.filter(c => c.isTyping).length,
    collaborators: collaborators.map(c => ({
      userId: c.userId,
      displayName: c.displayName,
      isTyping: c.isTyping
    }))
  });

  // Ref to track the latest content
  const latestContentRef = useRef(initialData?.content || '');
  const previousContentRef = useRef(initialData?.content || '');
  const router = useRouter();

  // Handle cursor position changes for real-time collaboration
  const handleCursorChange = useCallback((position: number, selectionStart: number, selectionEnd: number) => {
    if (chapterId && useLiveblocks) {
      // Update local cursor position for visualization
      updateCursorPosition(content, position);
      
      // Send cursor position to other collaborators
      sendCursorPosition(position);
      
      // Send selection range if text is selected
      if (selectionStart !== selectionEnd) {
        sendSelectionRange(selectionStart, selectionEnd);
      }
    }
  }, [chapterId, useLiveblocks, sendCursorPosition, sendSelectionRange, updateCursorPosition, content]);

  // Handle immediate typing detection for responsive feedback
  const handleTypingStart = useCallback(() => {
    if (chapterId && user && useLiveblocks) {
      console.log('ChapterForm: Typing started - updating presence');
      // Use sendCursorPosition to trigger typing status (it handles typing indicators)
      const currentPosition = cursorPosition.column || 0;
      sendCursorPosition(currentPosition);
    }
  }, [chapterId, user, useLiveblocks, sendCursorPosition, cursorPosition]);

  const handleTypingEnd = useCallback(() => {
    if (chapterId && user && useLiveblocks) {
      console.log('ChapterForm: Typing ended - presence will auto-clear');
      // Typing status will automatically clear after timeout in the hook
    }
  }, [chapterId, user, useLiveblocks]);

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
    
    // Real-time collaboration: Send content update to other collaborators
    if (chapterId && newContent) {
      const previousContent = previousContentRef.current;
      
      // Only send update if content actually changed
      if (newContent !== previousContent) {
        console.log('ChapterForm: Content changed, scheduling real-time update:', {
          previousLength: previousContent.length,
          newLength: newContent.length,
          chapterId
        });
        
        // Debounce content updates to prevent too many messages
        clearTimeout((window as any).contentUpdateTimeout);
        (window as any).contentUpdateTimeout = setTimeout(() => {
          console.log('ChapterForm: Sending real-time content update:', {
            contentLength: newContent.length,
            chapterId,
            isConnected,
            hasSendContentUpdate: !!sendContentUpdate
          });
          
          // For now, send the full content as a replacement
          // This is simpler and more reliable than trying to calculate diffs
          if (sendContentUpdate && isConnected) {
            sendContentUpdate(newContent, 0, newContent.length, 'replace');
            console.log('ChapterForm: Real-time content update sent successfully');
          } else {
            console.log('ChapterForm: Cannot send real-time update - WebSocket not connected or function not available');
          }
          
          // Update previous content ref
          previousContentRef.current = newContent;
        }, 300); // 300ms debounce for more responsive collaboration
      }
    }
    
    // Fast auto-save for content changes (works for both create and edit modes)
    if (onAutoSave && newContent && newContent.trim()) {
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
          
          // Show subtle feedback for fast saves (more subtle for create mode)
          if (isEditing) {
          toast.success('Auto-saved', { 
            duration: 1000,
            style: { fontSize: '12px', opacity: 0.8 }
          });
          }
        } catch (error) {
          console.error('Fast auto-save failed:', error);
        }
      }, 500); // Very fast - 500ms delay
    }
  }, [setValue, onAutoSave, isEditing, chapterId, watchedValues, sendContentUpdate]);

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
    // Enable auto-save on leave for both editing and creation modes
    if (!onAutoSave) return;

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
          
          // For create mode, just use the onAutoSave callback (localStorage save)
          // For edit mode, use sendBeacon for reliable auto-save on page unload
          if (isEditing && chapterId) {
          const data = JSON.stringify(formData);
            if (navigator.sendBeacon) {
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
          } else {
            // For create mode, use regular onAutoSave callback
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout((window as any).contentUpdateTimeout);
      clearTimeout((window as any).contentChangeAutoSaveTimeout);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Chapter' : 'Create Chapter'}
            </h1>
            
         
          </div>
          
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
                    setValueAs: (value: string) => parseInt(value) || 1
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

              {/* Pricing - Based on Story Pricing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Coins size={16} className="inline mr-1" />
                  Chapter Price
                </label>
                {story?.pricingType === 'PAID_PER_CHAPTER' ? (
                  // Allow setting price for PAID_PER_CHAPTER
                  <>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      disabled={watchedValues.isFree}
                      defaultValue={initialData?.coinPrice || 0}
                      {...register('coinPrice', { 
                        min: { value: 0, message: 'Price cannot be negative' },
                        valueAsNumber: true
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Enter chapter price"
                    />
                    {errors.coinPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.coinPrice.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Current value: {watchedValues.coinPrice || 0} coins
                    </p>
                  </>
                ) : story?.pricingType === 'WHOLE_BOOK' ? (
                  // Show book price for WHOLE_BOOK
                  <>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-blue-900">
                      Included in book price
                    </div>
                    <p className="mt-1 text-xs text-blue-600">
                      Readers pay {story.bookPrice || 0} coins for the entire book
                    </p>
                    <input type="hidden" {...register('coinPrice', { valueAsNumber: true })} value="0" />
                    <input type="hidden" {...register('isFree')} value="" />
                  </>
                ) : (
                  // FREE stories
                  <>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-green-50 text-green-900">
                      Free to read
                    </div>
                    <p className="mt-1 text-xs text-green-600">
                      This story is free for all readers
                    </p>
                    <input type="hidden" {...register('coinPrice', { valueAsNumber: true })} value="0" />
                    <input type="hidden" {...register('isFree')} value="on" />
                  </>
                )}
              </div>

              {/* Free Toggle - Only for PAID_PER_CHAPTER */}
              {story?.pricingType === 'PAID_PER_CHAPTER' && (
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
              )}
            </div>

            {/* Story Pricing Information */}
            {story && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">📖 Story Pricing Information</h4>
                <div className="text-xs text-gray-700 space-y-1">
                  {story.pricingType === 'FREE' && (
                    <p>• This is a <span className="font-medium text-green-700">FREE</span> story - all chapters are free to read</p>
                  )}
                  {story.pricingType === 'WHOLE_BOOK' && (
                    <>
                      <p>• This is a <span className="font-medium text-blue-700">WHOLE BOOK</span> story</p>
                      <p>• Readers pay <span className="font-medium">{story.bookPrice || 0} coins</span> once to access all chapters</p>
                      <p>• Individual chapter prices are not applicable</p>
                    </>
                  )}
                  {story.pricingType === 'PAID_PER_CHAPTER' && (
                    <>
                      <p>• This is a <span className="font-medium text-purple-700">PAID PER CHAPTER</span> story</p>
                      <p>• You can set individual prices for each chapter</p>
                      <p>• Readers pay separately for each chapter they want to read</p>
                    </>
                  )}
                </div>
              </div>
            )}

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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Chapter Content
            </label>
            
            {/* Collaboration Status Bar */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Active Collaborators */}
              {collaborators.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Collaborators:</span>
                  <div className="flex -space-x-1">
                    {collaborators.slice(0, 3).map((collaborator) => (
                      <div
                        key={collaborator.userId}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: collaborator.color }}
                        title={`${collaborator.displayName} ${collaborator.isTyping ? '(typing...)' : ''}`}
                      >
                        {collaborator.displayName.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {collaborators.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                        +{collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Typing Indicators */}
              {collaborators.filter(c => c.isTyping).length > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">
                    {collaborators.filter(c => c.isTyping).length} typing...
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Editor Container with Cursor Overlay */}
          <div className="relative">
            <LexicalEditor
              value={content}
              onChange={handleContentChange}
              onCursorChange={handleCursorChange}
              placeholder="Start writing your chapter..."
              isDarkMode={isDarkMode}
              autoSaveInterval={10000}
              className="min-h-[500px]"
              chapterId={chapterId}
              registerContentUpdateCallback={registerContentUpdateCallback}
              sendContentUpdate={useLiveblocks ? sendContentUpdate : undefined}
              onTypingStart={handleTypingStart}
              onTypingEnd={handleTypingEnd}
            />
            
            {/* Remote Cursors Overlay for Rich Text Editor */}
            {useLiveblocks && remoteCursors.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {remoteCursors.map((collaborator) => {
                  if (!collaborator || !collaborator.position) return null;
                  
                  return (
                    <div key={`cursor-${collaborator.userId}`}>
                      {/* Cursor indicator */}
                      <div
                        className={`absolute w-0.5 h-5 ${collaborator.isTyping ? 'animate-pulse' : ''}`}
                        style={{
                          backgroundColor: collaborator.color,
                          left: `${collaborator.position.x}px`,
                          top: `${collaborator.position.y}px`,
                          zIndex: 15,
                          boxShadow: collaborator.isTyping ? `0 0 8px ${collaborator.color}` : 'none',
                        }}
                      >
                        {/* Cursor label */}
                        <div
                          className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-sm ${
                            collaborator.isTyping ? 'animate-bounce' : ''
                          }`}
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {collaborator.displayName}
                          {collaborator.isTyping && (
                            <span className="ml-1">⌨️</span>
                          )}
                        </div>
                      </div>

                      {/* Typing indicator dot */}
                      {collaborator.isTyping && (
                        <div
                          className="absolute w-3 h-3 rounded-full animate-ping"
                          style={{
                            backgroundColor: collaborator.color,
                            left: `${collaborator.position.x - 6}px`,
                            top: `${collaborator.position.y - 6}px`,
                            zIndex: 20,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
          
          {/* Collaboration Activity Log */}
          {useLiveblocks && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-700 space-y-1">
                <p>✨ <strong>Real-time sync:</strong> {content.length > 0 ? `${content.length} characters synced` : 'No content yet'}</p>
                <p>👥 <strong>Active users:</strong> {collaborators.length + 1} (including you)</p>
                <p>⌨️ <strong>Typing status:</strong> {collaborators.filter(c => c.isTyping).length} users typing</p>
                <p>🖱️ <strong>Active cursors:</strong> {collaborators.filter(c => c.cursorPosition !== undefined).length} cursors visible</p>
                <p>💾 <strong>Storage state:</strong> {storage ? 'Liveblocks loaded' : 'Loading...'}</p>
              </div>
            </div>
          )}
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Debug Info:</p>
              <p>Mode: {useLiveblocks ? 'Liveblocks' : 'No collaboration'}</p>
              <p>Collaborators: {collaborators.length + (user ? 1 : 0)} (including you)</p>
              <p>Others: {collaborators.length}</p>
              <p>Current User: {user?.id}</p>
              <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
              <p>Chapter ID: {chapterId}</p>
              <p>Typing Users: {collaborators.filter(c => c.isTyping).length}</p>
              <p>Typing Status: {collaborators.filter(c => c.isTyping).map(c => c.displayName).join(', ') || 'None'}</p>
              {useLiveblocks && liveblocksCollaboration?.storage && (
                <p>Storage Content Length: {liveblocksCollaboration.storage.content?.length || 0}</p>
              )}
              
              {/* Manual typing test button */}
              {useLiveblocks && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      console.log('Manual typing test - calling sendContentUpdate');
                      sendContentUpdate('Test typing indicator', 0, 20, 'replace');
                    }}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Test Typing Indicator
                  </button>
                </div>
              )}
            </div>
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