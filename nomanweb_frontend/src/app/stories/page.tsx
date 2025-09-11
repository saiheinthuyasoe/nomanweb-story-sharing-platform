"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StoryList } from "@/components/stories/StoryList";
import {
  useStories,
  useSearchStories,
  useCategories,
} from "@/hooks/useStories";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pricingType, setPricingType] = useState("");
  const [bookStatus, setBookStatus] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Get search query from URL parameters
  const urlSearchQuery = searchParams.get("search") || "";

  // Initialize search query from URL
  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery]);

  // Use search API if there's a search query, otherwise use regular stories API
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useSearchStories({
    query: urlSearchQuery,
    page,
    size: 30,
  });

  const {
    data: regularStories,
    isLoading: isRegularLoading,
    error: regularError,
  } = useStories({
    page,
    size: 30,
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
      router.push("/stories");
    }
    setPage(0);
  };

  const resetFilters = () => {
    setPage(0);
    setSearchQuery("");
    setSelectedCategory("");
    setPricingType("");
    setBookStatus("");
    setSortBy("");
    router.push("/stories");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimalist Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {urlSearchQuery ? `Search Results` : "Discover Stories"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {urlSearchQuery
                  ? `${
                      stories?.totalElements || 0
                    } results for "${urlSearchQuery}"`
                  : "Explore stories from our community"}
              </p>
            </div>
            <Link
              href="/stories/create"
              className="inline-flex items-center px-4 py-2 text-white hover:opacity-80 transition-all font-medium rounded-md"
              style={{ backgroundColor: '#18243c' }}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Write Story
            </Link>
          </div>
        </div>
      </div>

      {/* Minimalist Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {urlSearchQuery ? "Search Results" : "Filters"}
            </h3>
            {urlSearchQuery && (
              <span className="text-sm text-gray-600">"{urlSearchQuery}"</span>
            )}
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-4">
            {/* Search */}
            <div>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-20 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c]"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 px-3 py-1 text-white text-sm hover:opacity-80 transition-all font-medium rounded-md"
                  style={{ backgroundColor: '#18243c' }}
                >
                  Search
                </button>
              </form>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(0);
                  }}
                  disabled={!!urlSearchQuery}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Type */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Pricing
                </label>
                <select
                  value={pricingType}
                  onChange={(e) => {
                    setPricingType(e.target.value);
                    setPage(0);
                  }}
                  disabled={!!urlSearchQuery}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">All Types</option>
                  <option value="FREE">Free</option>
                  <option value="PAID_PER_CHAPTER">Paid per Chapter</option>
                  <option value="WHOLE_BOOK">Whole Book</option>
                </select>
              </div>

              {/* Book Status */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={bookStatus}
                  onChange={(e) => {
                    setBookStatus(e.target.value);
                    setPage(0);
                  }}
                  disabled={!!urlSearchQuery}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">All Status</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              {/* Sort By */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(0);
                  }}
                  disabled={!!urlSearchQuery}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">Latest</option>
                  <option value="views">Most Views</option>
                  <option value="likes">Most Likes</option>
                  <option value="chapters">Most Chapters</option>
                </select>
              </div>
            </div>
            {urlSearchQuery && (
              <p className="text-xs text-gray-500 mt-2">
                Filters disabled during search
              </p>
            )}
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
  );
}
