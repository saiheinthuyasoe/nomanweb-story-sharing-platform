'use client';

import { useParams, useRouter } from 'next/navigation';
import { useChapterByStoryAndNumber, useNextChapter, usePreviousChapter } from '@/hooks/useChapters';
import { useStory } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { useChapterReactionStatus, useToggleChapterLike } from '@/hooks/useReactions';
import { useBookmarkStatus, useToggleBookmark } from '@/hooks/useReadingLists';
import { useChapterProgress, useAutoUpdateProgress } from '@/hooks/useReadingProgress';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  EyeIcon, 
  HeartIcon, 
  BookmarkIcon,
  ShareIcon,
  PencilIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id as string;
  const chapterNumber = parseInt(params.chapterNumber as string);

  const contentRef = useRef<HTMLDivElement>(null);

  const { data: story, isLoading: isLoadingStory } = useStory(storyId);
  const { data: chapter, isLoading: isLoadingChapter, error: chapterError } = useChapterByStoryAndNumber(
    storyId, 
    chapterNumber
  );

  // Reaction and bookmark hooks
  const { data: reactionStatus } = useChapterReactionStatus(chapter?.id || '', !!chapter);
  const { data: bookmarkStatus } = useBookmarkStatus(storyId, true);
  const { data: progressData } = useChapterProgress(chapter?.id || '', !!chapter);
  
  const toggleChapterLike = useToggleChapterLike();
  const toggleBookmark = useToggleBookmark();
  const updateProgress = useAutoUpdateProgress(chapter?.id || '');
  
  // Stable reference to updateProgress for useEffect
  const updateProgressRef = useRef(updateProgress);
  updateProgressRef.current = updateProgress;

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

  const handleBookmark = () => {
    if (!user) {
      toast.error('Please log in to bookmark stories');
      return;
    }
    toggleBookmark.mutate({ storyId, listType: 'FAVORITE' });
  };

  const handleLike = () => {
    if (!user) {
      toast.error('Please log in to like chapters');
      return;
    }
    if (chapter?.id) {
      toggleChapterLike.mutate(chapter.id);
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
        
        const element = contentRef.current;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate progress based on how much of the content has been scrolled through
        const contentStart = elementTop;
        const viewportBottom = scrollTop + windowHeight;
        
        if (viewportBottom > contentStart && elementHeight > 0) {
          const visibleContent = Math.min(viewportBottom - contentStart, elementHeight);
          const progressPercentage = Math.min((visibleContent / elementHeight) * 100, 100);
          
          if (progressPercentage > 0) {
            updateProgressRef.current(progressPercentage);
          }
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${chapter?.title} - ${story?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

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
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
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
                Chapter {chapter.chapterNumber}
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
              
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg ${
                  bookmarkStatus?.bookmarked 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                disabled={toggleBookmark.isPending}
              >
                {bookmarkStatus?.bookmarked ? (
                  <BookmarkIconSolid className="w-5 h-5" />
                ) : (
                  <BookmarkIcon className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg ${
                  reactionStatus?.liked 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                disabled={toggleChapterLike.isPending}
              >
                {reactionStatus?.liked ? (
                  <HeartIconSolid className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {chapter.title}
          </h1>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{chapter.views.toLocaleString()} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{(reactionStatus?.totalLikes ?? chapter.likes).toLocaleString()} likes</span>
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

        {/* Chapter Content */}
        <div 
          ref={contentRef}
          className="prose prose-lg max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />

        {/* Chapter Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              End of Chapter {chapter.chapterNumber}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  reactionStatus?.liked 
                    ? 'border-red-200 bg-red-50 text-red-600' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                disabled={toggleChapterLike.isPending}
              >
                {reactionStatus?.liked ? (
                  <HeartIconSolid className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span>{reactionStatus?.liked ? 'Liked' : 'Like'}</span>
                {reactionStatus?.totalLikes && reactionStatus.totalLikes > 0 && (
                  <span className="text-xs">({reactionStatus.totalLikes.toLocaleString()})</span>
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
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
    </div>
  );
} 