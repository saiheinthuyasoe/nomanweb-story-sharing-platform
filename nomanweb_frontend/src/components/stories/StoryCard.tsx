import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StoryPreview } from '@/types/story';
import { formatDistanceToNow } from 'date-fns';
import { 
  EyeIcon, 
  HeartIcon, 
  BookOpenIcon,
  StarIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useToggleBookmark } from '@/hooks/useLibraries';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface StoryCardProps {
  story: StoryPreview;
  showAuthor?: boolean;
  className?: string;
}

export function StoryCard({ story, showAuthor = true, className = '' }: StoryCardProps) {
  const { user } = useAuth();
  const { mutate: toggleBookmark, isPending: isBookmarkLoading } = useToggleBookmark();

  const handleAddToWantToRead = () => {
    if (!user) {
      toast.error('Please login to add to library');
      return;
    }

    toggleBookmark({
      storyId: story.id,
      listType: 'WANT_TO_READ',
    });
  };

  return (
    <div className={`bg-white hover:bg-gray-50 transition-colors duration-200 ${className}`}>
      <div className="flex p-4">
        {/* Cover Image */}
        <Link href={`/stories/${story.id}`} className="flex-shrink-0">
          <div className="relative w-[90px] h-[120px] bg-gray-100 overflow-hidden rounded">
            {story.coverImageUrl ? (
              <Image
                src={story.coverImageUrl}
                alt={story.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <BookOpenIcon className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 ml-4 flex flex-col justify-between min-h-[120px]">
          {/* Top section */}
          <div>
            {/* Title */}
            <Link href={`/stories/${story.id}`}>
              <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 hover:text-gray-600 transition-colors leading-tight">
                {story.title}
              </h3>
            </Link>

            {/* Description */}
            {story.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                {story.description}
              </p>
            )}
          </div>

          {/* Genre, Rating, and Tags */}
          <div className="mb-2">
            {/* Genre and Rating */}
            <div className="flex items-center gap-2 mb-1">
              {story.category && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {story.category.name}
                </span>
              )}
              {story.totalViews > 0 && (
                <div className="flex items-center gap-1">
                  <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600">
                    {((story.totalLikes / story.totalViews) * 5).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Stats and Button - All in one row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Stats */}
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <BookOpenIcon className="w-3 h-3" />
                    <span>{story.totalChapters}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-3 h-3" />
                    <span>{story.totalViews.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* ADD button */}
              <button 
                onClick={handleAddToWantToRead}
                disabled={isBookmarkLoading}
                className="px-3 py-1 text-xs text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium rounded-md flex-shrink-0"
                style={{ backgroundColor: '#18243c' }}
              >
                {isBookmarkLoading ? 'Adding...' : '+ Want to Read'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}