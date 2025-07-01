'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { LexicalEditor } from '@/components/editor';
import { Save, Settings, Clock, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLiveblocksCollaboration } from '@/hooks/useLiveblocksCollaboration';
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

interface LiveblocksChapterFormProps {
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
}

export function LiveblocksChapterForm({
  storyId,
  chapterId,
  initialData,
  onSubmit,
  onAutoSave,
  isLoading = false,
  isEditing = false,
  maxChapterNumber = 0,
  story
}: LiveblocksChapterFormProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auth context
  const { user } = useAuth();

  // Liveblocks real-time collaboration (replaces WebSocket-based collaboration)
  const { 
    sendContentUpdate, 
    sendCursorPosition, 
    sendSelectionRange, 
    registerContentUpdateCallback, 
    isConnected, 
    collaborators,
    storage
  } = useLiveblocksCollaboration(chapterId || '');

  console.log('LiveblocksChapterForm: Real-time collaboration status:', {
    chapterId,
    isConnected,
    collaboratorsCount: collaborators.length,
    hasStorage: !!storage
  });

  // Ref to track the latest content
  const latestContentRef = useRef(initialData?.content || '');
  const router = useRouter();

  // Handle cursor position changes for real-time collaboration
  const handleCursorChange = useCallback((position: number, selectionStart: number, selectionEnd: number) => {
    if (chapterId) {
      sendCursorPosition(position);
      if (selectionStart !== selectionEnd) {
        sendSelectionRange(selectionStart, selectionEnd);
      }
    }
  }, [chapterId, sendCursorPosition, sendSelectionRange]);

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

  // Sync content from Liveblocks storage
  useEffect(() => {
    if (storage?.content && storage.content !== content && storage.lastModifiedBy !== user?.id) {
      console.log('LiveblocksChapterForm: Syncing content from Liveblocks storage');
      setContent(storage.content);
      setValue('content', storage.content);
      
      // Update word and character counts
      const words = storage.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characters = storage.content.length;
      setWordCount(words);
      setCharacterCount(characters);
    }
  }, [storage?.content, storage?.lastModifiedBy, user?.id, content, setValue]);

  // Update all form values when initialData changes (for editing)
  useEffect(() => {
    if (initialData && isEditing) {
      console.log('LiveblocksChapterForm - Updating form values for editing:', {
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

  // Handle content changes from the Lexical editor
  const handleContentChange = useCallback((newContent: string, words: number, characters: number) => {
    console.log('LiveblocksChapterForm - handleContentChange called:', {
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
    
    // Real-time collaboration: Send content update to Liveblocks
    if (chapterId && newContent) {
      console.log('LiveblocksChapterForm: Content changed, sending to Liveblocks:', {
        contentLength: newContent.length,
        chapterId,
        isConnected
      });
      
      // Debounce content updates to prevent too many messages
      clearTimeout((window as any).contentUpdateTimeout);
      (window as any).contentUpdateTimeout = setTimeout(() => {
        console.log('LiveblocksChapterForm: Sending Liveblocks content update');
        
        if (sendContentUpdate && isConnected) {
          sendContentUpdate(newContent, 0, newContent.length, 'replace');
          console.log('LiveblocksChapterForm: Liveblocks content update sent successfully');
        } else {
          console.log('LiveblocksChapterForm: Cannot send Liveblocks update - not connected');
        }
      }, 300); // 300ms debounce
    }
    
    // Fast auto-save for content changes
    if (onAutoSave && newContent && newContent.trim()) {
      clearTimeout((window as any).contentChangeAutoSaveTimeout);
      
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
          
          if (isEditing) {
            toast.success('Auto-saved', { 
              duration: 1000,
              style: { fontSize: '12px', opacity: 0.8 }
            });
          }
        } catch (error) {
          console.error('Fast auto-save failed:', error);
        }
      }, 500);
    }
  }, [setValue, onAutoSave, isEditing, chapterId, watchedValues, sendContentUpdate, isConnected]);

  // Register content update callback for receiving updates from other collaborators
  useEffect(() => {
    if (!registerContentUpdateCallback) return;

    const unregister = registerContentUpdateCallback((updatedContent: string) => {
      console.log('LiveblocksChapterForm: Received content update from collaborator');
      setContent(updatedContent);
      setValue('content', updatedContent);
      
      // Update word and character counts
      const words = updatedContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characters = updatedContent.length;
      setWordCount(words);
      setCharacterCount(characters);
    });

    return unregister;
  }, [registerContentUpdateCallback, setValue]);

  // Handle form submission
  const onFormSubmit = async (data: ChapterFormData) => {
    try {
      const latestContent = latestContentRef.current;
      
      const submissionData = {
        ...data,
        content: latestContent,
        storyId
      };
      
      console.log('LiveblocksChapterForm - Submitting data:', {
        title: submissionData.title,
        contentLength: submissionData.content?.length || 0,
        coinPrice: submissionData.coinPrice,
        isFree: submissionData.isFree,
        isDraft: submissionData.isDraft,
        storyId: submissionData.storyId
      });
      
      if (!submissionData.content || !submissionData.content.trim()) {
        toast.error('Chapter content cannot be empty');
        return;
      }
      
      await onSubmit(submissionData);
      console.log('LiveblocksChapterForm - Submit successful');
      setIsSubmitted(true);
      toast.success(isEditing ? 'Chapter updated!' : 'Chapter created!');
    } catch (error) {
      console.error('LiveblocksChapterForm - Submit failed:', error);
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Chapter (Liveblocks)' : 'Create Chapter (Liveblocks)'}
            </h1>
            
            {/* Liveblocks Active Collaborators */}
            {chapterId && <LiveblocksActiveCollaborators chapterId={chapterId} />}
          </div>
        </div>

        {/* Liveblocks Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected to Liveblocks' : 'Disconnected from Liveblocks'}
          </span>
          {collaborators.length > 0 && (
            <span className="text-gray-500">• {collaborators.length} other{collaborators.length !== 1 ? 's' : ''} editing</span>
          )}
        </div>
      </div>
      
      {/* Placeholder for the rest of the form */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 Liveblocks Migration Preview</h3>
        <p className="text-blue-800 text-sm">
          This is a preview of how your ChapterForm would look with Liveblocks integration.
          The form content would be identical to your current form, but powered by Liveblocks instead of WebSocket.
        </p>
        <ul className="mt-3 text-sm text-blue-700 space-y-1">
          <li>✅ Real-time collaboration with conflict resolution</li>
          <li>✅ Better presence indicators and typing status</li>
          <li>✅ More reliable content synchronization</li>
          <li>✅ Built-in undo/redo with collaborative awareness</li>
          <li>✅ Persistent collaboration state</li>
        </ul>
      </div>
    </div>
  );
} 