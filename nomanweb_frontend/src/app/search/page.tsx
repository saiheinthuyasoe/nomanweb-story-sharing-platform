'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSearchStories } from '@/hooks/useStories';
import { useUserSearch } from '@/hooks/useUserSearch';
import { StoryList } from '@/components/stories/StoryList';
import { MagnifyingGlassIcon, BookOpenIcon, UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  email?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'stories' | 'users'>('stories');
  const [page, setPage] = useState(0);

  // Get search parameters from URL
  const urlSearchQuery = searchParams.get('q') || '';
  const urlSearchType = (searchParams.get('type') as 'stories' | 'users') || 'stories';

  // Initialize state from URL parameters
  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
    if (urlSearchType) {
      setSearchType(urlSearchType);
    }
  }, [urlSearchQuery, urlSearchType]);

  // Search hooks
  const { data: stories, isLoading: isStoriesLoading, error: storiesError } = useSearchStories({
    query: searchQuery,
    page,
    size: 12,
  });

  const { data: users, isLoading: isUsersLoading, error: usersError } = useUserSearch(
    searchQuery,
    !!searchQuery && searchType === 'users'
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
    }
    setPage(0);
  };

  const handleTabChange = (type: 'stories' | 'users') => {
    setSearchType(type);
    setPage(0);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${type}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const isLoading = searchType === 'stories' ? isStoriesLoading : isUsersLoading;
  const error = searchType === 'stories' ? storiesError : usersError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Search'}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {searchQuery 
                  ? `Found ${searchType === 'stories' 
                      ? (stories?.totalElements || 0) 
                      : (users?.totalElements || 0)} ${searchType} matching your search`
                  : 'Search for stories and users across our platform'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for stories, authors, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Search Type Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleTabChange('stories')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  searchType === 'stories'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpenIcon className="h-5 w-5" />
                <span>Stories</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('users')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  searchType === 'users'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span>Users</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Results Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchType === 'stories' ? 'Stories' : 'Users'} 
                  {searchType === 'stories' && stories && (
                    <span className="text-gray-500 font-normal ml-2">
                      ({stories.totalElements} results)
                    </span>
                  )}
                  {searchType === 'users' && users && (
                    <span className="text-gray-500 font-normal ml-2">
                      ({users.totalElements} results)
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Results Content */}
            <div className="p-6">
              {searchType === 'stories' ? (
                <StoryList
                  stories={stories}
                  isLoading={isLoading}
                  error={error}
                  onPageChange={handlePageChange}
                  emptyMessage={`No stories found for "${searchQuery}". Try a different search term.`}
                />
              ) : (
                <UserSearchResults
                  users={users}
                  isLoading={isLoading}
                  error={error}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
              <p className="text-gray-600 mb-6">
                Enter a search term above to find stories and users on our platform.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Search for story titles, authors, or genres</p>
                <p>• Find users by username or display name</p>
                <p>• Discover new content and connect with authors</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// User Search Results Component
function UserSearchResults({ 
  users, 
  isLoading, 
  error, 
  searchQuery 
}: { 
  users: any; 
  isLoading: boolean; 
  error: any; 
  searchQuery: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Error loading users</div>
        <div className="text-gray-500 text-sm">
          {error.message || 'Something went wrong. Please try again.'}
        </div>
      </div>
    );
  }

  if (!users || users.content.length === 0) {
    return (
      <div className="text-center py-12">
        <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
        <p className="text-gray-600">
          No users found for "{searchQuery}". Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.content.map((user: SearchUser) => (
        <Link
          key={user.id}
          href={`/authors/${user.id}`}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {user.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={user.displayName || user.username}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {user.displayName || user.username}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                @{user.username}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 