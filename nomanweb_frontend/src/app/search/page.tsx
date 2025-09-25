"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStories } from "@/hooks/useStories";
import { useUserSearch } from "@/hooks/useUserSearch";
import { StoryList } from "@/components/stories/StoryList";
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  email?: string;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"stories" | "users">("stories");
  const [page, setPage] = useState(0);

  // Get search parameters from URL
  const urlSearchQuery = searchParams.get("q") || "";
  const urlSearchType =
    (searchParams.get("type") as "stories" | "users") || "stories";

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
  const {
    data: stories,
    isLoading: isStoriesLoading,
    error: storiesError,
  } = useSearchStories({
    query: searchQuery,
    page,
    size: 12,
  });

  const {
    data: users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useUserSearch(searchQuery, !!searchQuery && searchType === "users");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`
      );
    }
    setPage(0);
  };

  const handleTabChange = (type: "stories" | "users") => {
    setSearchType(type);
    setPage(0);
    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery.trim())}&type=${type}`
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const isLoading =
    searchType === "stories" ? isStoriesLoading : isUsersLoading;
  const error = searchType === "stories" ? storiesError : usersError;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {searchQuery ? `"${searchQuery}"` : "Discover"}
          </h1>
          {searchQuery ? (
            <p className="text-gray-600">
              {searchType === "stories"
                ? stories?.totalElements || 0
                : users?.totalElements || 0}{" "}
              {searchType} found
            </p>
          ) : (
            <p className="text-gray-600">
              Find amazing stories and talented authors
            </p>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#18243c] text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!searchQuery.trim()}
              >
                Search
              </button>
            </div>

            {/* Search Type Tabs */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTabChange("stories")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  searchType === "stories"
                    ? "bg-[#18243c] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BookOpenIcon className="h-4 w-4" />
                <span>Stories</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("users")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  searchType === "users"
                    ? "bg-[#18243c] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Users</span>
              </button>
            </div>
          </div>
        </form>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-8">
            {searchType === "stories" ? (
              <StoryList
                stories={stories}
                isLoading={isLoading}
                error={error}
                onPageChange={handlePageChange}
                emptyMessage={`No stories found for "${searchQuery}".`}
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
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Your Discovery
            </h3>
            <p className="text-gray-500">
              Enter a search term to find amazing stories and talented authors.
            </p>
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
  searchQuery,
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
          <div
            key={index}
            className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
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
        <div className="text-red-500 text-sm mb-1">Error loading users</div>
        <div className="text-gray-400 text-xs">
          {error.message || "Something went wrong. Please try again."}
        </div>
      </div>
    );
  }

  if (!users || users.content.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Authors Found
        </h3>
        <p className="text-gray-500">
          We couldn't find any authors matching "{searchQuery}". Try a different
          search term.
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
          className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-200 transform hover:-translate-y-1 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-gray-50 group-hover:ring-gray-100 transition-all">
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
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                {user.displayName || user.username}
              </h3>
              <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18243c]"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
