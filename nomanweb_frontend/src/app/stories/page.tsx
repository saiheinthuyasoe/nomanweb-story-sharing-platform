'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StoryList } from '@/components/stories/StoryList';
import { useStories, useSearchStories, useCategories } from '@/hooks/useStories';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, SparklesIcon, BookOpenIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Custom styles for dropdown hover effects
const dropdownStyles = `
  .stories-dropdown select {
    background-color: white;
    color: #374151;
  }
  
  .stories-dropdown select:hover {
    border-color: #18243c;
    box-shadow: 0 0 0 1px #18243c;
  }
  
  .stories-dropdown select:focus {
    border-color: #18243c;
    box-shadow: 0 0 0 2px rgba(24, 36, 60, 0.2);
  }
  
  .stories-dropdown select option {
    background-color: white;
    color: #374151;
    padding: 8px 12px;
  }
  
  .stories-dropdown select option:hover {
    background-color: #18243c !important;
    color: white !important;
  }
  
  .stories-dropdown select option:checked {
    background-color: #18243c !important;
    color: white !important;
  }
  
  .stories-dropdown select option:focus {
    background-color: #18243c !important;
    color: white !important;
  }
  
  /* Firefox specific styles */
  .stories-dropdown select:-moz-focusring {
    color: transparent;
    text-shadow: 0 0 0 #374151;
  }
  
  /* Webkit browsers (Chrome, Safari, Edge) */
  .stories-dropdown select::-webkit-select-placeholder {
    color: #9ca3af;
  }
  
  /* Custom dropdown arrow styling */
  .stories-dropdown .chevron-icon {
    transition: transform 0.2s ease;
  }
  
  .stories-dropdown select:focus + .chevron-icon {
    transform: rotate(180deg);
  }
  
  /* Override any light blue hover effects with navbar colors */
  .stories-dropdown select.group-hover\\:border-\\[\\#18243c\\]\\/30:hover {
    border-color: #18243c !important;
    box-shadow: 0 0 0 1px #18243c !important;
  }
  
  /* Ensure all hover states use navbar colors */
  .stories-dropdown:hover select {
    border-color: #18243c !important;
    box-shadow: 0 0 0 1px #18243c !important;
  }
`;

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pricingType, setPricingType] = useState('');
  const [bookStatus, setBookStatus] = useState('');
  const [sortBy, setSortBy] = useState('');

  // Get search query from URL parameters
  const urlSearchQuery = searchParams.get('search') || '';

  // Initialize search query from URL
  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery]);

  // Use search API if there's a search query, otherwise use regular stories API
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useSearchStories({
    query: urlSearchQuery,
    page,
    size: 12,
  });

  const { data: regularStories, isLoading: isRegularLoading, error: regularError } = useStories({
    page,
    size: 12,
    sortBy,
    categoryId: selectedCategory || undefined,
    pricingType: pricingType || undefined,
    bookStatus: bookStatus || undefined,
  });

  // Use search results if there's a search query, otherwise use regular stories
  const stories = urlSearchQuery ? searchResults : regularStories;
  const isLoading = urlSearchQuery ? isSearchLoading : isRegularLoading;
  const error = urlSearchQuery ? searchError : regularError;

  const { data: categories } = useCategories();

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stories?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/stories');
    }
    setPage(0);
  };

  const resetFilters = () => {
    setPage(0);
    setSearchQuery('');
    setSelectedCategory('');
    setPricingType('');
    setBookStatus('');
    setSortBy('');
    router.push('/stories');
  };

  return (
    <>
      <style jsx>{dropdownStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
      {/* Enhanced Header with Animation */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#18243c]/5 to-[#22325a]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#18243c]/5 to-[#22325a]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-xl flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">
                  {urlSearchQuery ? `Search Results for "${urlSearchQuery}"` : 'Discover Stories'}
                </h1>
              </div>
              <p className="text-base text-gray-600 ml-13">
                {urlSearchQuery 
                  ? `Found ${stories?.totalElements || 0} stories matching your search`
                  : 'Explore amazing stories from our community of writers'
                }
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/stories/create"
                className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Write a Story
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters with Better Visual Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-6 mb-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-xl flex items-center justify-center">
              <FunnelIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#18243c]">
              {urlSearchQuery ? 'Search Results' : 'Refine Your Search'}
            </h3>
            {urlSearchQuery && (
              <span className="px-4 py-2 bg-[#18243c]/10 text-[#18243c] text-sm rounded-full border border-[#18243c]/20 font-medium">
                <SparklesIcon className="w-4 h-4 inline mr-1" />
                Searching for: "{urlSearchQuery}"
              </span>
            )}
            <button
              onClick={resetFilters}
              className="ml-auto text-sm text-[#18243c] hover:text-[#22325a] font-medium transition-colors duration-200 hover:bg-[#18243c]/10 px-3 py-1 rounded-lg"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Enhanced Search - Positioned above and longer */}
            <div className="md:col-span-5 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Stories
              </label>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] transition-all duration-200 bg-white/80 backdrop-blur-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-4 py-1 bg-gradient-to-r from-[#18243c] to-[#22325a] text-white text-sm rounded-lg hover:from-[#22325a] hover:to-[#2d4574] transition-all duration-200 font-medium"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Enhanced Filter Grid */}
            <div className="md:col-span-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Enhanced Category */}
                <div className="group stories-dropdown">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-md flex items-center justify-center mr-2">
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    </div>
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setPage(0);
                      }}
                      disabled={!!urlSearchQuery}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer hover:border-[#18243c]"
                      style={{
                        backgroundImage: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 chevron-icon" />
                    </div>
                  </div>
                  {urlSearchQuery && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <FunnelIcon className="w-3 h-3 mr-1" />
                      Filters disabled during search
                    </p>
                  )}
                </div>

                {/* Enhanced Pricing Type */}
                <div className="group stories-dropdown">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-md flex items-center justify-center mr-2">
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    </div>
                    Pricing Type
                  </label>
                  <div className="relative">
                    <select
                      value={pricingType}
                      onChange={(e) => {
                        setPricingType(e.target.value);
                        setPage(0);
                      }}
                      disabled={!!urlSearchQuery}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer hover:border-[#18243c]"
                      style={{
                        backgroundImage: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="">All Types</option>
                      <option value="FREE">Free</option>
                      <option value="PAID_PER_CHAPTER">Paid per Chapter</option>
                      <option value="WHOLE_BOOK">Whole Book</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 chevron-icon" />
                    </div>
                  </div>
                </div>

                {/* Enhanced Book Status */}
                <div className="group stories-dropdown">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center mr-2">
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    </div>
                    Book Status
                  </label>
                  <div className="relative">
                    <select
                      value={bookStatus}
                      onChange={(e) => {
                        setBookStatus(e.target.value);
                        setPage(0);
                      }}
                      disabled={!!urlSearchQuery}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer group-hover:border-[#18243c]/30"
                      style={{
                        backgroundImage: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 chevron-icon" />
                    </div>
                  </div>
                  {urlSearchQuery && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <FunnelIcon className="w-3 h-3 mr-1" />
                      Filters disabled during search
                    </p>
                  )}
                </div>

                {/* Enhanced Sort By */}
                <div className="group stories-dropdown">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center mr-2">
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    </div>
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setPage(0);
                      }}
                      disabled={!!urlSearchQuery}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer group-hover:border-[#18243c]/30"
                      style={{
                        backgroundImage: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="">Latest</option>
                      <option value="views">Most Views</option>
                      <option value="likes">Most Likes</option>
                      <option value="chapters">Most Chapters</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 chevron-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Story List */}
        <StoryList
          stories={stories}
          isLoading={isLoading}
          error={error}
          onPageChange={handlePageChange}
          emptyMessage={
            urlSearchQuery 
              ? `No stories found for "${urlSearchQuery}". Try a different search term or browse all stories.`
              : "No stories found. Try adjusting your filters or be the first to write a story!"
          }
        />
      </div>
    </div>
    </>
  );
}
 