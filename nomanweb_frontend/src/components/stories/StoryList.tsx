import React from "react";
import { StoryCard } from "./StoryCard";
import { StoryPreview, StoriesResponse } from "@/types/story";
import { BookOpenIcon } from "@heroicons/react/24/outline";

interface StoryListProps {
  stories: StoriesResponse | null;
  isLoading: boolean;
  error: any;
  className?: string;
  emptyMessage?: string;
  onPageChange?: (page: number) => void;
  currentPage?: number;
}

export function StoryList({
  stories,
  isLoading,
  error,
  className = "",
  emptyMessage = "No stories found",
  onPageChange,
  currentPage = 0,
}: StoryListProps) {
  if (isLoading) {
    return (
      <div className={`${className} space-y-6`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex space-x-4">
                <div className="w-24 h-32 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
      <div className={`${className} text-center py-16`}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpenIcon className="w-8 h-8 text-red-600 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-red-600 mb-3">
          Error Loading Stories
        </h3>
        <p className="text-gray-500 text-base mb-6 max-w-md mx-auto">
          {error.message ||
            "Something went wrong while loading stories. Please try again."}
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
        <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <BookOpenIcon className="w-12 h-12 text-[#18243c]" />
        </div>
        <h3 className="text-2xl font-bold text-[#18243c] mb-4">
          No stories found
        </h3>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.content.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Pagination */}
      {stories.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-1">
            {(() => {
              const totalPages = stories.totalPages;
              const current = currentPage;
              const pages = [];

              if (totalPages <= 7) {
                // Show all pages if 7 or fewer
                for (let i = 0; i < totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Always show first page
                pages.push(0);

                if (current <= 3) {
                  // Show first 5 pages + ellipsis + last page
                  for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                  }
                  pages.push("ellipsis");
                  pages.push(totalPages - 1);
                } else if (current >= totalPages - 4) {
                  // Show first page + ellipsis + last 5 pages
                  pages.push("ellipsis");
                  for (let i = totalPages - 5; i < totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
                  pages.push("ellipsis");
                  for (let i = current - 1; i <= current + 1; i++) {
                    pages.push(i);
                  }
                  pages.push("ellipsis");
                  pages.push(totalPages - 1);
                }
              }

              return pages.map((pageNum, index) => {
                if (pageNum === "ellipsis") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-2 text-gray-400"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum as number)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNum === currentPage
                        ? "bg-[#18243c] text-white"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {(pageNum as number) + 1}
                  </button>
                );
              });
            })()}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= stories.totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
