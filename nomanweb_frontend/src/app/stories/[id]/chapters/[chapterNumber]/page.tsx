'use client';

import { useParams, useRouter } from 'next/navigation';
import { useChapterByStoryAndNumber } from '@/hooks/useChapters';
import { useStory } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { useChapterProgress, useAutoUpdateProgress } from '@/hooks/useReadingProgress';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  EyeIcon, 
  PencilIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { 
  Settings, 
  List,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { chaptersApi } from '@/lib/api/chapters';

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  lineHeight: number;
  darkMode: boolean;
}

const defaultSettings: ReadingSettings = {
  fontSize: 18,
  fontFamily: 'Georgia',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  lineHeight: 1.7,
  darkMode: false,
};

const fontOptions = [
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Open Sans', value: 'Open Sans' },
];

const backgroundOptions = [
  { name: 'White', value: '#ffffff', textColor: '#1a1a1a' },
  { name: 'Cream', value: '#faf7f0', textColor: '#2d2d2d' },
  { name: 'Light Gray', value: '#f5f5f5', textColor: '#1a1a1a' },
  { name: 'Dark', value: '#1a1a1a', textColor: '#e5e5e5' },
  { name: 'Black', value: '#000000', textColor: '#ffffff' },
];

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id as string;
  const chapterNumber = parseInt(params.chapterNumber as string);

  const contentRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  const { data: story, isLoading: isLoadingStory } = useStory(storyId);
  const { data: chapter, isLoading: isLoadingChapter, error: chapterError } = useChapterByStoryAndNumber(
    storyId, 
    chapterNumber
  );

  // Fetch all chapters for table of contents
  const { data: allChapters } = useQuery({
    queryKey: ['chapters', storyId],
    queryFn: () => chaptersApi.getChaptersByStory(storyId),
  });

  const { data: progressData } = useChapterProgress(chapter?.id || '', !!chapter);
  const updateProgress = useAutoUpdateProgress(chapter?.id || '');
  
  // Stable reference to updateProgress for useEffect
  const updateProgressRef = useRef(updateProgress);
  updateProgressRef.current = updateProgress;

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('reading-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('reading-settings', JSON.stringify(updated));
  };

  // Check if user is the story author
  const isAuthor = story && user && story.author.id === user.id;

  const handlePrevious = () => {
    if (chapter?.navigation.hasPrevious) {
      router.push(`/stories/${storyId}/chapters/${chapter.navigation.previousChapterNumber}`);
    }
  };

  const handleNext = () => {
    if (chapter?.navigation.hasNext) {
      router.push(`/stories/${storyId}/chapters/${chapter.navigation.nextChapterNumber}`);
    }
  };

  // Reading progress tracking
  useEffect(() => {
    if (!chapter?.id || !user || !contentRef.current) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (!contentRef.current) return;
      
      // Debounce scroll events to avoid too many calculations
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!contentRef.current) return;
        
        // Simple scroll-based progress calculation
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the page has been scrolled
        const scrollableHeight = documentHeight - windowHeight;
        const progressPercentage = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
        
        if (progressPercentage > 0) {
          updateProgressRef.current(Math.min(100, Math.max(0, progressPercentage)));
        }
      }, 100); // Debounce by 100ms
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial progress update after a short delay to ensure content is rendered
    const initialTimeout = setTimeout(() => {
      handleScroll();
    }, 500);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      clearTimeout(initialTimeout);
    };
  }, [chapter?.id, user]); // Remove updateProgress from dependencies to prevent infinite loop



  if (isLoadingStory || isLoadingChapter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chapterError || !chapter || !story) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chapter Not Found</h1>
          <p className="text-gray-600 mb-4">
            The chapter you're looking for doesn't exist or isn't available.
          </p>
          <Link
            href={`/stories/${storyId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Story
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      {/* Navigation Header */}
      <div className="sticky top-0 border-b border-gray-200 z-10" style={{ backgroundColor: settings.backgroundColor }}>
        {/* Reading Progress Bar */}
        {progressData?.hasProgress && (
          <div className="w-full bg-gray-200 h-1">
            <div 
              className="bg-blue-600 h-1 transition-all duration-300"
              style={{ width: `${progressData.progressPercentage}%` }}
            />
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Story info */}
            <div className="flex items-center space-x-4">
              <Link
                href={`/stories/${storyId}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {story.title}
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600 text-sm">
                Chapter {chapter.chapterNumber} (Preview)
              </span>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <Link
                href={`/stories/${storyId}/chapters/${chapterNumber}/read`}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                title="Open in Reading Mode"
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>Read Mode</span>
              </Link>
              
              {isAuthor && (
                <Link
                  href={`/stories/${storyId}/chapters/${chapterNumber}/edit`}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <PencilIcon className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel Controls */}
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40">
        <div className="flex flex-col gap-2">
          {/* Table of Contents Button */}
          <button
            onClick={() => setShowTableOfContents(true)}
            className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            title="Table of Contents"
          >
            <List className="w-5 h-5" />
          </button>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            title="Reading Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {chapter.title}
            </h1>
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              Preview
            </span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{chapter.views.toLocaleString()} views</span>
            </div>
            <span>
              {chapter.wordCount.toLocaleString()} words • ~{Math.ceil(chapter.wordCount / 200)} min read
            </span>
            <span>
              Published {formatDistanceToNow(new Date(chapter.publishedAt || chapter.createdAt), { addSuffix: true })}
            </span>
            {progressData?.hasProgress && (
              <span className="text-blue-600 font-medium">
                {progressData.progressPercentage.toFixed(0)}% read
              </span>
            )}
          </div>
        </div>

        {/* Chapter Preview Content */}
        <div 
          ref={contentRef}
          className="prose prose-lg max-w-none leading-relaxed"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
            lineHeight: settings.lineHeight,
          }}
        >
          {(() => {
            // Strip HTML tags to get text length for more accurate preview
            const textContent = chapter.content.replace(/<[^>]*>/g, '');
            const isLongContent = textContent.length > 300;
            
            // For preview, show first 300 characters of text content
            let previewContent = chapter.content;
            if (isLongContent) {
              // Find a good breaking point in HTML content
              const htmlWords = chapter.content.split(' ');
              let wordCount = 0;
              let charCount = 0;
              let previewHtml = '';
              
              for (const word of htmlWords) {
                const wordText = word.replace(/<[^>]*>/g, '');
                if (charCount + wordText.length > 300) break;
                previewHtml += word + ' ';
                charCount += wordText.length;
                wordCount++;
              }
              
              previewContent = previewHtml.trim();
            }
            
            return (
              <>
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                
                {/* Preview Overlay and Call to Action */}
                {isLongContent && (
                  <div className="relative mt-8">
                    {/* Gradient Fade Effect */}
                    <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    
                    {/* Preview Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <div className="flex items-center justify-center mb-4">
                        <BookOpenIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Continue Reading
                      </h3>
                      <p className="text-blue-700 mb-4">
                        This is just a preview. Click below to read the full chapter in our enhanced reading mode.
                      </p>
                      <Link
                        href={`/stories/${storyId}/chapters/${chapterNumber}/read`}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <BookOpenIcon className="w-5 h-5" />
                        <span>Read Full Chapter</span>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Chapter Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            End of Chapter {chapter.chapterNumber} Preview
          </div>
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Previous Chapter */}
            {chapter.navigation.hasPrevious ? (
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-3 px-4 py-3 text-left bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                <div>
                  <div className="text-sm text-gray-500">Previous Chapter</div>
                  <div className="font-medium text-gray-900">
                    Chapter {chapter.navigation.previousChapterNumber}
                  </div>
                </div>
              </button>
            ) : (
              <div></div>
            )}

            {/* Chapter Index */}
            <Link
              href={`/stories/${storyId}`}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200"
            >
              All Chapters ({chapter.navigation.totalChapters})
            </Link>

            {/* Next Chapter */}
            {chapter.navigation.hasNext ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-3 px-4 py-3 text-right bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <div className="text-sm text-gray-500">Next Chapter</div>
                  <div className="font-medium text-gray-900">
                    Chapter {chapter.navigation.nextChapterNumber}
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Table of Contents Modal */}
      {showTableOfContents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <List className="w-5 h-5" />
                Table of Contents
              </h3>
              <button
                onClick={() => setShowTableOfContents(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96 p-4">
              {allChapters && allChapters.length > 0 ? (
                <div className="space-y-2">
                  {allChapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/stories/${storyId}/chapters/${ch.chapterNumber}`}
                      onClick={() => setShowTableOfContents(false)}
                      className={`block w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        ch.chapterNumber === chapterNumber
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">Chapter {ch.chapterNumber}</div>
                      <div className="text-sm opacity-75 truncate">{ch.title}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No chapters available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Reading Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96 p-4 space-y-6">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{settings.fontSize}px</div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Background</label>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundOptions.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => updateSettings({ 
                        backgroundColor: bg.value, 
                        textColor: bg.textColor 
                      })}
                      className={`p-3 rounded border-2 ${
                        settings.backgroundColor === bg.value 
                          ? 'border-blue-500' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: bg.value, color: bg.textColor }}
                    >
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium mb-2">Line Height</label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{settings.lineHeight}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 