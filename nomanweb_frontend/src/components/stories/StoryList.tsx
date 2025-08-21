import React from 'react';
import { StoryCard } from './StoryCard';
import { StoryPreview, StoriesResponse } from '@/types/story';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface StoryListProps {
  stories: StoriesResponse | undefined;
  isLoading: boolean;
  error: any;
  onPageChange: (page: number) => void;
  showAuthor?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function StoryList({ 
  stories, 
  isLoading, 
  error, 
  onPageChange, 
  showAuthor = true,
  emptyMessage = "No stories found.",
  className = ''
}: StoryListProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <StoryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-12`}>
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-red-600 mb-3">Error Loading Stories</h3>
        <p className="text-gray-500 text-base mb-6 max-w-md mx-auto">
          {error.message || 'Something went wrong while loading stories. Please try again.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-[#18243c] to-[#22325a] text-white rounded-xl font-medium hover:from-[#22325a] hover:to-[#2d4574] transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stories || stories.content.length === 0) {
    return (
      <div className={`${className} text-center py-16`}>
        <div className="w-24 h-24 bg-gradient-to-br from-[#18243c]/10 to-[#22325a]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BookOpenIcon className="w-12 h-12 text-[#18243c]" />
        </div>
        <h3 className="text-2xl font-bold text-[#18243c] mb-4">{emptyMessage}</h3>
        <p className="text-gray-600 text-base mb-8 max-w-lg mx-auto">
          Try adjusting your search criteria or explore different categories to discover amazing stories.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-[#18243c]/10 rounded-xl border border-[#18243c]/20">
            <MagnifyingGlassIcon className="w-4 h-4 text-[#18243c]" />
            <span className="text-sm font-medium text-[#18243c]">Try Different Keywords</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-xl">
            <SparklesIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Browse Categories</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {stories.content.map((story) => (
          <StoryCard 
            key={story.id} 
            story={story} 
            showAuthor={showAuthor}
          />
        ))}
      </div>

      {/* Pagination */}
      {stories.totalPages > 1 && (
        <Pagination
          currentPage={stories.number}
          totalPages={stories.totalPages}
          totalElements={stories.totalElements}
          size={stories.size}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

function StoryCardSkeleton() {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded-lg mb-3" />
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50/50 rounded-xl">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-8" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

function Pagination({ 
  currentPage, 
  totalPages, 
  totalElements, 
  size, 
  onPageChange 
}: PaginationProps) {
  const startItem = currentPage * size + 1;
  const endItem = Math.min((currentPage + 1) * size, totalElements);
  
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(0, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 1) {
      rangeWithDots.push(0, '...');
    } else if (currentPage - delta === 1) {
      rangeWithDots.push(0);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 2) {
      rangeWithDots.push('...', totalPages - 1);
    } else if (currentPage + delta === totalPages - 2) {
      rangeWithDots.push(totalPages - 1);
    }

    return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index);
  };

  return (
    <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl px-6 py-4 border border-white/50 sm:px-8 rounded-2xl shadow-lg">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="relative inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="relative ml-3 inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-bold">{startItem}</span> to{' '}
            <span className="font-bold">{endItem}</span> of{' '}
            <span className="font-bold">{totalElements}</span> results
          </p>
        </div>
        
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="relative inline-flex items-center rounded-l-xl px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-[#18243c] to-[#22325a] text-white ring-[#18243c] shadow-lg'
                        : 'text-gray-900 ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {(page as number) + 1}
                  </button>
                )}
              </React.Fragment>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="relative inline-flex items-center rounded-r-xl px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
} 