'use client';

import React, { useState } from 'react';
import { StoryList } from '@/components/stories/StoryList';
import { useStories, useCategories } from '@/hooks/useStories';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function StoriesPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [contentType, setContentType] = useState('');
  const [sortBy, setSortBy] = useState('');

  const { data: stories, isLoading, error } = useStories({
    page,
    size: 12,
    sortBy,
    categoryId: selectedCategory || undefined,
    contentType: contentType || undefined,
  });

  const { data: categories } = useCategories();

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const resetFilters = () => {
    setPage(0);
    setSearchQuery('');
    setSelectedCategory('');
    setContentType('');
    setSortBy('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">Discover Stories</h1>
              <p className="mt-2 text-lg text-gray-600">
                Explore amazing stories from our community of writers
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/stories/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Write a Story
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Latest</option>
                <option value="views">Most Views</option>
                <option value="likes">Most Likes</option>
                <option value="chapters">Most Chapters</option>
              </select>
            </div>
          </div>
        </div>

        {/* Story List */}
        <StoryList
          stories={stories}
          isLoading={isLoading}
          error={error}
          onPageChange={handlePageChange}
          emptyMessage="No stories found. Try adjusting your filters or be the first to write a story!"
        />
      </div>
    </div>
  );
}
 