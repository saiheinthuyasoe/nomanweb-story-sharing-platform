import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePurchasedChapters } from '@/hooks/usePurchasedChapters';
import { 
  BookOpenIcon, 
  EyeIcon, 
  ClockIcon,
  ShoppingBagIcon 
} from '@heroicons/react/24/outline';
import { ShoppingBagIcon as ShoppingBagIconSolid } from '@heroicons/react/24/solid';

interface PurchasedChaptersTabProps {
  sortBy: 'recent' | 'title' | 'author';
}

export default function PurchasedChaptersTab({ sortBy }: PurchasedChaptersTabProps) {
  const { data: purchasedChapters = [], isLoading, error } = usePurchasedChapters();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-24 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Purchases</h3>
        <p className="text-gray-600">Failed to load your purchased chapters. Please try again.</p>
      </div>
    );
  }

  if (purchasedChapters.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchased Chapters</h3>
        <p className="text-gray-600 mb-4">You haven't purchased any chapters yet.</p>
        <Link 
          href="/stories"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BookOpenIcon className="w-4 h-4 mr-2" />
          Browse Stories
        </Link>
      </div>
    );
  }

  // Sort chapters
  const sortedChapters = [...purchasedChapters].sort((a, b) => {
    if (sortBy === 'title') {
      return a.story.title.localeCompare(b.story.title);
    } else if (sortBy === 'author') {
      const authorA = a.story.author.displayName || a.story.author.username;
      const authorB = b.story.author.displayName || b.story.author.username;
      return authorA.localeCompare(authorB);
    } else {
      return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {sortedChapters.map((chapter) => (
        <div key={chapter.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4">
            {/* Story Cover */}
            <div className="flex-shrink-0">
              {chapter.story.coverImageUrl ? (
                <Image
                  src={chapter.story.coverImageUrl}
                  alt={chapter.story.title}
                  width={64}
                  height={96}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                  <BookOpenIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Chapter Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <ShoppingBagIconSolid className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Purchased</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{formatDate(chapter.purchasedAt)}</span>
              </div>
              
              <Link 
                href={`/stories/${chapter.story.id}/chapters/${chapter.chapterNumber}`}
                className="block hover:text-blue-600 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-1 truncate">
                  {chapter.story.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Chapter {chapter.chapterNumber}: {chapter.title}
                </p>
              </Link>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <span>by {chapter.story.author.displayName || chapter.story.author.username}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="font-medium text-green-600">{chapter.coinPrice} coins</span>
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <Link
                href={`/stories/${chapter.story.id}/chapters/${chapter.chapterNumber}`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                Read
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 