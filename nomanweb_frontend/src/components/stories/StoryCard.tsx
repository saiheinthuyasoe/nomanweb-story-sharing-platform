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

interface StoryCardProps {
  story: StoryPreview;
  showAuthor?: boolean;
  className?: string;
}

export function StoryCard({ story, showAuthor = true, className = '' }: StoryCardProps) {
  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 hover:border-[#18243c]/30 transition-all duration-300 overflow-hidden group hover:shadow-xl hover:shadow-[#18243c]/10 ${className}`}>
      <Link href={`/stories/${story.id}`}>
        <div className="relative aspect-[16/9] bg-gray-200 overflow-hidden">
          {story.coverImageUrl ? (
            <Image
              src={story.coverImageUrl}
              alt={story.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#18243c]/5 to-[#22325a]/5">
              <div className="text-center">
                <BookOpenIcon className="w-12 h-12 text-[#18243c]/40 mx-auto mb-2" />
                <p className="text-xs text-[#18243c]/60 font-medium">No Cover Image</p>
              </div>
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-lg ${
              story.status === 'PUBLISHED' 
                ? 'bg-green-500 text-white' 
                : story.status === 'DRAFT'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {story.status}
            </span>
          </div>

          {/* Featured badge */}
          {story.isFeatured && (
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <StarIcon className="w-4 h-4 text-white fill-current" />
              </div>
            </div>
          )}

          {/* Pricing type badge */}
          <div className="absolute bottom-3 right-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-lg ${
              story.pricingType === 'FREE' 
                ? 'bg-green-500 text-white' 
                : story.pricingType === 'PAID_PER_CHAPTER'
                ? 'bg-gradient-to-r from-[#18243c] to-[#22325a] text-white'
                : 'bg-purple-500 text-white'
            }`}>
              {story.pricingType === 'PAID_PER_CHAPTER' ? 'PAID PER CHAPTER' : 
               story.pricingType === 'WHOLE_BOOK' ? 'WHOLE BOOK' : 
               story.pricingType}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/stories/${story.id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 hover:text-[#18243c] transition-colors duration-200 group-hover:underline">
            {story.title}
          </h3>
        </Link>

        {story.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {story.description}
          </p>
        )}

        {/* Author info */}
        {showAuthor && (
          <div className="flex items-center mb-4 p-3 bg-gray-50/50 rounded-xl">
            <div className="flex items-center space-x-3">
              {story.author.profileImageUrl ? (
                <div className="relative">
                  <Image
                    src={story.author.profileImageUrl}
                    alt={story.author.displayName || story.author.username}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
              )}
              <div>
                <Link 
                  href={`/authors/${story.author.id}`}
                  className="text-sm font-semibold text-gray-800 hover:text-[#18243c] transition-colors duration-200"
                >
                  {story.author.displayName || story.author.username}
                </Link>
                <p className="text-xs text-gray-500">Author</p>
              </div>
            </div>
          </div>
        )}

        {/* Category */}
        {story.category && (
          <div className="mb-4">
            <Link 
              href={`/categories/${story.category.id}`}
              className="inline-flex items-center px-3 py-1 text-xs font-bold text-[#18243c] bg-[#18243c]/10 rounded-full hover:bg-[#18243c]/20 transition-colors duration-200 border border-[#18243c]/20"
            >
              <SparklesIcon className="w-3 h-3 mr-1" />
              {story.category.name}
            </Link>
          </div>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {story.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            {story.tags.length > 2 && (
              <span className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-full">
                +{story.tags.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span className="font-medium">{story.totalViews.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span className="font-medium">{story.totalLikes.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpenIcon className="w-4 h-4" />
              <span className="font-medium">{story.totalChapters}</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          {story.publishedAt 
            ? `Published ${formatDistanceToNow(new Date(story.publishedAt), { addSuffix: true })}`
            : `Created ${formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}`
          }
        </div>
      </div>
    </div>
  );
} 