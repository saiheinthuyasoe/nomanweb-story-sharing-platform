'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useMyReadingLists, 
  useToggleBookmark, 
  useCurrentlyReading,
  useFavoriteStories,
  useCompletedStories,
  useWantToReadStories,
  usePurchasedStories,
  useHistoryStories,
  useLikedStories
} from '@/hooks/useReadingLists';
import PurchasedContentTab from '@/components/library/PurchasedContentTab';
import { 
  useMyReadingProgress, 
  useClearReadingHistory 
} from '@/hooks/useReadingProgress';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpenIcon, 
  HeartIcon, 
  StarIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ShoppingBagIcon,
  BookmarkIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid, 
  StarIcon as StarIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

type TabType = 'library' | 'history' | 'purchased';
type LibraryFilter = 'all' | 'reading' | 'completed' | 'liked' | 'want_to_read' | 'purchased';

export default function LibraryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author'>('recent');

  // Reading lists data
  const { data: currentlyReadingData = [] } = useCurrentlyReading();
  const { data: likedStoriesData = [] } = useLikedStories();
  const { data: completedStoriesData = [] } = useCompletedStories();
  const { data: wantToReadData = [] } = useWantToReadStories();
  const { data: purchasedStoriesData = [] } = usePurchasedStories();
  const { data: historyStoriesData = [] } = useHistoryStories();

  // Reading history data
  const { data: readingHistoryData, isLoading: isLoadingHistory, error: historyError } = useMyReadingProgress(0, 20, !!user);
  const readingHistory = readingHistoryData?.content || [];

  // New: Filter purchased stories by backend access
  const [accessiblePurchasedStories, setAccessiblePurchasedStories] = useState<any[]>([]);
  useEffect(() => {
    async function checkAccess() {
      if (!user || !purchasedStoriesData) {
        setAccessiblePurchasedStories([]);
        return;
      }
      const results = await Promise.all(
        purchasedStoriesData.map(async (item: any) => {
          try {
            const res = await fetch(`/api/stories/${item.story.id}/can-access`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data.canAccess === true || data === true) return item;
            return null;
          } catch {
            return null;
          }
        })
      );
      setAccessiblePurchasedStories(results.filter(Boolean));
    }
    checkAccess();
  }, [user, purchasedStoriesData]);

  // Mutations
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { mutate: clearHistory, isPending: isClearingHistory } = useClearReadingHistory();

  // Combine all library items based on filter
  const getFilteredLibraryItems = () => {
    let items = [];
    
    switch (libraryFilter) {
      case 'reading':
        items = currentlyReadingData;
        break;
      case 'completed':
        items = completedStoriesData;
        break;
          case 'liked':
      items = likedStoriesData;
        break;
      case 'want_to_read':
        items = wantToReadData;
        break;
      case 'purchased':
        items = accessiblePurchasedStories;
        break;
      case 'all':
      default:
        items = [
          ...currentlyReadingData,
          ...likedStoriesData,
          ...completedStoriesData,
          ...wantToReadData,
          ...purchasedStoriesData
        ].filter((item, index, self) => 
          index === self.findIndex((t) => t.story.id === item.story.id)
        );
        break;
    }

    // Sort items
    if (sortBy === 'title') {
      items.sort((a, b) => a.story.title.localeCompare(b.story.title));
    } else if (sortBy === 'author') {
      items.sort((a, b) => {
        const authorA = a.story.author.displayName || a.story.author.username;
        const authorB = b.story.author.displayName || b.story.author.username;
        return authorA.localeCompare(authorB);
      });
    } else {
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }

    return items;
  };

  const libraryItems = getFilteredLibraryItems();

  // Get counts for each category
  const categoryCounts = {
    all: [
      ...currentlyReadingData,
      ...likedStoriesData,
      ...completedStoriesData,
      ...wantToReadData,
      ...purchasedStoriesData
    ].filter((item, index, self) => 
      index === self.findIndex((t) => t.story.id === item.story.id)
    ).length,
    reading: currentlyReadingData.length,
    completed: completedStoriesData.length,
    liked: likedStoriesData.length,
    want_to_read: wantToReadData.length,
    purchased: purchasedStoriesData.length
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsEditMode(false);
    setSelectedItems(new Set());
  };

  const handleLibraryFilterChange = (filter: LibraryFilter) => {
    setLibraryFilter(filter);
    setIsEditMode(false);
    setSelectedItems(new Set());
  };

  const handleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setSelectedItems(new Set());
    }
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkRemove = () => {
    if (selectedItems.size === 0) return;
    
    selectedItems.forEach(storyId => {
      toggleBookmark({ storyId, listType: 'REMOVE' });
    });
    
    setSelectedItems(new Set());
    setIsEditMode(false);
    toast.success(`Removed ${selectedItems.size} items from library`);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all reading history? This action cannot be undone.')) {
      clearHistory();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Library</h2>
          <p className="text-gray-600 mb-6">Please log in to view your library and reading history.</p>
          <Link 
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Library</h1>
          
          {/* Main Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => handleTabChange('library')}
                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'library'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Library ({categoryCounts.all})
              </button>
              <button
                onClick={() => handleTabChange('purchased')}
                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'purchased'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Purchased Content
              </button>
              <button
                onClick={() => handleTabChange('history')}
                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History ({readingHistory.length})
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {activeTab === 'library' && (
                <>
                  {isEditMode && selectedItems.size > 0 && (
                    <button
                      onClick={handleBulkRemove}
                      className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Remove ({selectedItems.size})</span>
                    </button>
                  )}
                  <button
                    onClick={handleEditMode}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm transition-colors ${
                      isEditMode 
                        ? 'text-blue-600 hover:text-blue-700' 
                        : 'text-gray-600 hover:text-gray-700'
                    }`}
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>{isEditMode ? 'Done' : 'Edit'}</span>
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                  </select>
                </>
              )}
              {activeTab === 'purchased' && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="recent">Recently Purchased</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
              )}
              {activeTab === 'history' && (
                <button
                  onClick={handleClearHistory}
                  disabled={isClearingHistory}
                  className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>{isClearingHistory ? 'Clearing...' : 'Clear All History'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Library Category Filters */}
          {activeTab === 'library' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleLibraryFilterChange('all')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  libraryFilter === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>All ({categoryCounts.all})</span>
              </button>
              
              <button
                onClick={() => handleLibraryFilterChange('reading')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  libraryFilter === 'reading'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <EyeIcon className="w-4 h-4" />
                <span>Reading ({categoryCounts.reading})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange('completed')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  libraryFilter === 'completed'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircleIconSolid className="w-4 h-4" />
                <span>Completed ({categoryCounts.completed})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange('liked')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  libraryFilter === 'liked'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <HeartIconSolid className="w-4 h-4" />
                <span>Liked ({categoryCounts.liked})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange('want_to_read')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  libraryFilter === 'want_to_read'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookmarkIconSolid className="w-4 h-4" />
                <span>Want to Read ({categoryCounts.want_to_read})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange('purchased')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  libraryFilter === 'purchased'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ShoppingBagIconSolid className="w-4 h-4" />
                <span>Purchased ({categoryCounts.purchased})</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'library' && (
          <LibraryTab 
            items={libraryItems}
            isEditMode={isEditMode}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
            sortBy={sortBy}
            filter={libraryFilter}
          />
        )}
        
        {activeTab === 'purchased' && (
          <PurchasedContentTab sortBy={sortBy} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab 
            items={readingHistory} 
            isLoading={isLoadingHistory}
            error={historyError}
          />
        )}
      </div>
    </div>
  );
}

// Library Tab Component
function LibraryTab({ 
  items, 
  isEditMode, 
  selectedItems, 
  onItemSelect, 
  sortBy,
  filter 
}: {
  items: any[];
  isEditMode: boolean;
  selectedItems: Set<string>;
  onItemSelect: (id: string) => void;
  sortBy: string;
  filter: LibraryFilter;
}) {
  if (items.length === 0) {
    const getEmptyStateContent = () => {
      switch (filter) {
        case 'reading':
          return {
            icon: <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
            title: "No stories currently reading",
            message: "Stories you're actively reading will appear here"
          };
        case 'completed':
          return {
            icon: <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
            title: "No completed stories",
            message: "Stories you've finished reading will appear here"
          };
        case 'liked':
          return {
            icon: <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
            title: "No liked stories",
            message: "Heart the stories you love to add them here"
          };
        case 'want_to_read':
          return {
            icon: <BookmarkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
            title: "No stories in your reading list",
            message: "Save stories you want to read later"
          };
        case 'purchased':
          return {
            icon: <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
            title: "No purchased stories",
            message: "Premium stories you've purchased will appear here"
          };
        default:
          return {
            icon: <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
            title: "Your library is empty",
            message: "Start building your collection by adding stories you love"
          };
      }
    };

    const emptyState = getEmptyStateContent();

    return (
      <div className="text-center py-16">
        {emptyState.icon}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
        <p className="text-gray-600 mb-6">{emptyState.message}</p>
        <Link 
          href="/stories"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Stories
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <LibraryBookCard 
          key={item.story.id}
          item={item}
          isEditMode={isEditMode}
          isSelected={selectedItems.has(item.story.id)}
          onSelect={() => onItemSelect(item.story.id)}
        />
      ))}
    </div>
  );
}

// History Tab Component  
function HistoryTab({ 
  items, 
  isLoading, 
  error 
}: { 
  items: any[]; 
  isLoading?: boolean;
  error?: any;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your reading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <ClockIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load reading history</h3>
        <p className="text-gray-600 mb-6">
          {error?.response?.data?.error || error?.message || 'Something went wrong'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reading history</h3>
        <p className="text-gray-600 mb-6">Your reading history will appear here as you read stories</p>
        <Link 
          href="/stories"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Reading
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HistoryBookCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// Library Book Card Component
function LibraryBookCard({ 
  item, 
  isEditMode, 
  isSelected, 
  onSelect 
}: {
  item: any;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const getListTypeIcon = (listType: string) => {
    switch (listType) {
              case 'LIKE':
        return <HeartIconSolid className="w-5 h-5 text-red-500" />;
      case 'COMPLETED':
        return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
      case 'READING':
        return <EyeIcon className="w-5 h-5 text-orange-500" />;
      case 'WANT_TO_READ':
        return <BookmarkIconSolid className="w-5 h-5 text-purple-500" />;
      case 'PURCHASED':
        return <ShoppingBagIconSolid className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative group">
      {isEditMode && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}
      
      <Link href={`/stories/${item.story.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {/* Cover Image */}
          <div className="aspect-[3/4] relative bg-gray-200">
            {item.story.coverImageUrl ? (
              <Image
                src={item.story.coverImageUrl}
                alt={item.story.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <BookOpenIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* List Type Badge */}
            <div className="absolute top-2 right-2">
              {getListTypeIcon(item.listType)}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
              {item.story.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              by {item.story.author.displayName || item.story.author.username}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.story.totalChapters} chapters</span>
              <span className="capitalize">{item.listType.toLowerCase().replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// History Book Card Component
function HistoryBookCard({ item }: { item: any }) {
  const { mutate: toggleBookmark } = useToggleBookmark();

  const handleAddToLibrary = () => {
            toggleBookmark({ storyId: item.story.id, listType: 'LIKE' });
  };

  // Format the last read date
  const formatLastRead = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Cover Image */}
        <Link href={`/stories/${item.story.id}`} className="flex-shrink-0">
          <div className="w-20 h-28 relative bg-gray-200 rounded overflow-hidden">
            {item.story.coverImageUrl ? (
              <Image
                src={item.story.coverImageUrl}
                alt={item.story.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <BookOpenIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link href={`/stories/${item.story.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                  {item.story.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-2">
                by {item.story.author.displayName || item.story.author.username}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <span>Chapter {item.chapter.chapterNumber}: {item.chapter.title}</span>
                <span>•</span>
                <span>{Math.round(item.progressPercentage)}% complete</span>
                <span>•</span>
                <span>Last read: {formatLastRead(item.lastReadAt)}</span>
              </div>
              {item.story.description && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {item.story.description}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage))}%` }}
            ></div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Link
              href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}/read`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {item.isCompleted ? 'Read Again' : 'Continue Reading'} →
            </Link>
            
            <button
              onClick={handleAddToLibrary}
              className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              <HeartIcon className="w-4 h-4" />
              <span>Add to Library</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 