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
  UserIcon 
} from '@heroicons/react/24/outline';

interface StoryCardProps {
  story: StoryPreview;
  showAuthor?: boolean;
  className?: string;
}

export function StoryCard({ story, showAuthor = true, className = '' }: StoryCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${className}`}>
      <Link href={`/stories/${story.id}`}>
        <div className="relative aspect-[16/9] bg-gray-200">
          {story.coverImageUrl ? (
            <Image
              src={story.coverImageUrl}
              alt={story.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
              <BookOpenIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              story.status === 'PUBLISHED' 
                ? 'bg-green-100 text-green-800' 
                : story.status === 'DRAFT'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {story.status}
            </span>
          </div>

          {/* Featured badge */}
          {story.isFeatured && (
            <div className="absolute top-2 right-2">
              <StarIcon className="w-5 h-5 text-yellow-500 fill-current" />
            </div>
          )}

          {/* Content type badge */}
          <div className="absolute bottom-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              story.contentType === 'FREE' 
                ? 'bg-green-100 text-green-800' 
                : story.contentType === 'PAID'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {story.contentType}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/stories/${story.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {story.title}
          </h3>
        </Link>

        {story.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {story.description}
          </p>
        )}

        {/* Author info */}
        {showAuthor && (
          <div className="flex items-center mb-3">
            <div className="flex items-center space-x-2">
              {story.author.profileImageUrl ? (
                <Image
                  src={story.author.profileImageUrl}
                  alt={story.author.displayName || story.author.username}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-gray-400" />
              )}
              <Link 
                href={`/authors/${story.author.id}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {story.author.displayName || story.author.username}
              </Link>
            </div>
          </div>
        )}

        {/* Category */}
        {story.category && (
          <div className="mb-3">
            <Link 
              href={`/categories/${story.category.id}`}
              className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"
            >
              {story.category.name}
            </Link>
          </div>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {story.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {story.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{story.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{story.totalViews.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{story.totalLikes.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpenIcon className="w-4 h-4" />
              <span>{story.totalChapters} chapters</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="mt-2 text-xs text-gray-400">
          {story.publishedAt 
            ? `Published ${formatDistanceToNow(new Date(story.publishedAt), { addSuffix: true })}`
            : `Created ${formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}`
          }
        </div>
      </div>
    </div>
  );
} 