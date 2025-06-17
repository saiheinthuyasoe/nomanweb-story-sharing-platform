import React from 'react';
import { StoryCard } from './StoryCard';
import { StoryPreview, StoriesResponse } from '@/types/story';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
        <div className="text-red-600 mb-2">Error loading stories</div>
        <div className="text-gray-500 text-sm">
          {error.message || 'Something went wrong. Please try again.'}
        </div>
      </div>
    );
  }

  if (!stories || stories.content.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <div className="text-gray-500 text-lg mb-2">{emptyMessage}</div>
        <div className="text-gray-400 text-sm">
          Try adjusting your search or filters.
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-gray-200" />
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded mb-3" />
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
        </div>
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
    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalElements}</span> results
          </p>
        </div>
        
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === page
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900'
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
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
} 