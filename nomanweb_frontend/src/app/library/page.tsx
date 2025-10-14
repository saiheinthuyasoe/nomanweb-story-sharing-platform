"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyLibraries,
  useToggleBookmark,
  useCurrentlyReading,
  useFavoriteStories,
  useCompletedStories,
  useWantToReadStories,
  usePurchasedStories,
  useHistoryStories,
  useLikedStories,
  useBookmarkStatus,
  useUpdateReadingStatus,
} from "@/hooks/useLibraries";
import PurchasedContentTab from "@/components/library/PurchasedContentTab";
import {
  useMyReadingProgress,
  useClearReadingHistory,
  useStoryProgress,
  useResetStoryProgress,
} from "@/hooks/useReadingProgress";
import { useQuery } from "@tanstack/react-query";
import { monetizationApi } from "@/lib/api/monetization";
import Link from "next/link";
import Image from "next/image";
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
  EyeIcon,
  ArrowPathIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

type TabType = "library" | "history" | "purchased";
type LibraryFilter = "all" | "reading" | "completed" | "liked" | "want_to_read";

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18243c]"></div>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("library");
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"recent" | "title" | "author">("recent");

  // Reading lists data with additional safety checks - only fetch when user is authenticated
  const { data: currentlyReadingData = [], error: currentlyReadingError } =
    useCurrentlyReading(!!user);
  const { data: likedStoriesData = [], error: likedStoriesError } =
    useLikedStories(!!user);
  const { data: completedStoriesData = [], error: completedStoriesError } =
    useCompletedStories(!!user);
  const { data: wantToReadData = [], error: wantToReadError } =
    useWantToReadStories(!!user);
  const { data: purchasedStoriesData = [], error: purchasedStoriesError } =
    usePurchasedStories(!!user);
  const { data: historyStoriesData = [], error: historyStoriesError } =
    useHistoryStories(!!user);

  // Ensure all data arrays are properly initialized
  const safeCurrentlyReadingData = Array.isArray(currentlyReadingData)
    ? currentlyReadingData
    : [];
  const safeLikedStoriesData = Array.isArray(likedStoriesData)
    ? likedStoriesData
    : [];
  const safeCompletedStoriesData = Array.isArray(completedStoriesData)
    ? completedStoriesData
    : [];
  const safeWantToReadData = Array.isArray(wantToReadData)
    ? wantToReadData
    : [];
  const safePurchasedStoriesData = Array.isArray(purchasedStoriesData)
    ? purchasedStoriesData
    : [];
  const safeHistoryStoriesData = Array.isArray(historyStoriesData)
    ? historyStoriesData
    : [];

  // Fetch purchase history for count calculation
  const { data: purchaseHistory, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["purchaseHistory"],
    queryFn: () => monetizationApi.getPurchaseHistory(),
    enabled: !!user,
  });

  // Reading history data
  const {
    data: readingHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useMyReadingProgress(0, 20, !!user);
  const readingHistory = readingHistoryData?.content || [];

  // New: Filter purchased stories by backend access
  const [accessiblePurchasedStories, setAccessiblePurchasedStories] = useState<
    any[]
  >([]);

  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "purchased") {
      setActiveTab("purchased");
    }
  }, [searchParams]);

  // Memoize purchasedStoriesData to prevent infinite re-renders
  const memoizedPurchasedStories = useMemo(
    () => safePurchasedStoriesData,
    [JSON.stringify(safePurchasedStoriesData)]
  );

  useEffect(() => {
    async function checkAccess() {
      if (
        !user ||
        !memoizedPurchasedStories ||
        memoizedPurchasedStories.length === 0
      ) {
        setAccessiblePurchasedStories([]);
        return;
      }
      const results = await Promise.all(
        memoizedPurchasedStories.map(async (item: any) => {
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
  }, [user, memoizedPurchasedStories]);

  // Mutations
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { mutate: clearHistory, isPending: isClearingHistory } =
    useClearReadingHistory();

  // Combine all library items based on filter
  const getFilteredLibraryItems = () => {
    let items = [];

    switch (libraryFilter) {
      case "reading":
        items = safeCurrentlyReadingData;
        break;
      case "completed":
        items = safeCompletedStoriesData;
        break;
      case "liked":
        items = safeLikedStoriesData;
        break;
      case "want_to_read":
        items = safeWantToReadData;
        break;

      case "all":
      default:
        // Use Map for more robust deduplication
        const storyMap = new Map();
        [
          ...safeCurrentlyReadingData,
          ...safeLikedStoriesData,
          ...safeCompletedStoriesData,
          ...safeWantToReadData,
        ].forEach((item) => {
          if (
            item &&
            item.story &&
            item.story.id &&
            !storyMap.has(item.story.id)
          ) {
            storyMap.set(item.story.id, item);
          }
        });
        items = Array.from(storyMap.values());
        break;
    }

    // Sort items
    if (sortBy === "title") {
      items.sort((a, b) => a.story.title.localeCompare(b.story.title));
    } else if (sortBy === "author") {
      items.sort((a, b) => {
        const authorA = a.story.author.displayName || a.story.author.username;
        const authorB = b.story.author.displayName || b.story.author.username;
        return authorA.localeCompare(authorB);
      });
    } else {
      items.sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    }

    return items;
  };

  const libraryItems = getFilteredLibraryItems();

  // Calculate purchased content count by grouping purchases by story
  const purchasedContentCount = useMemo(() => {
    if (!purchaseHistory?.content) return 0;

    const groupedPurchases = purchaseHistory.content.reduce(
      (groups, purchase) => {
        const storyId = purchase.story.id;
        if (!groups[storyId]) {
          groups[storyId] = true;
        }
        return groups;
      },
      {} as Record<string, boolean>
    );

    return Object.keys(groupedPurchases).length;
  }, [purchaseHistory]);

  // Get counts for each category
  const categoryCounts = {
    all: (() => {
      const storyMap = new Map();
      [
        ...safeCurrentlyReadingData,
        ...safeLikedStoriesData,
        ...safeCompletedStoriesData,
        ...safeWantToReadData,
      ].forEach((item) => {
        if (
          item &&
          item.story &&
          item.story.id &&
          !storyMap.has(item.story.id)
        ) {
          storyMap.set(item.story.id, item);
        }
      });
      return storyMap.size;
    })(),
    reading: safeCurrentlyReadingData.length,
    completed: safeCompletedStoriesData.length,
    liked: safeLikedStoriesData.length,
    want_to_read: safeWantToReadData.length,
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

    selectedItems.forEach((storyId) => {
      toggleBookmark({ storyId, listType: "REMOVE" });
    });

    setSelectedItems(new Set());
    setIsEditMode(false);
    toast.success(`Removed ${selectedItems.size} items from library`);
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all reading history? This action cannot be undone."
      )
    ) {
      clearHistory();
    }
  };

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18243c]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Library</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your library and reading history.
          </p>
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Library
          </h1>

          {/* Main Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-2 sm:gap-0 sm:space-x-4 md:space-x-8 mb-3 sm:mb-0">
              <button
                onClick={() => handleTabChange("library")}
                className={`pb-1 sm:pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === "library"
                    ? "border-[#18243c] text-[#18243c]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Library ({categoryCounts.all})
              </button>
              <button
                onClick={() => handleTabChange("purchased")}
                className={`pb-1 sm:pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === "purchased"
                    ? "border-[#18243c] text-[#18243c]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="hidden xs:inline">Purchase History</span>
                <span className="xs:hidden">Purchases</span> (
                {purchasedContentCount})
              </button>
              <button
                onClick={() => handleTabChange("history")}
                className={`pb-1 sm:pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === "history"
                    ? "border-[#18243c] text-[#18243c]"
                    : "border-transparent text-gray-500 hover:text-[#18243c] hover:border-[#18243c]"
                }`}
              >
                <span className="hidden xs:inline">Recent Reading History</span>
                <span className="xs:hidden">History</span> (
                {readingHistory.length})
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {activeTab === "library" && (
                <>
                  {isEditMode && selectedItems.size > 0 && (
                    <button
                      onClick={handleBulkRemove}
                      className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-red-600 hover:text-red-700 text-xs sm:text-sm"
                    >
                      <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Remove ({selectedItems.size})</span>
                    </button>
                  )}
                  <button
                    onClick={handleEditMode}
                    className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors ${
                      isEditMode
                        ? "text-blue-600 hover:text-blue-700"
                        : "text-gray-600 hover:text-gray-700"
                    }`}
                  >
                    <Squares2X2Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{isEditMode ? "Done" : "Select"}</span>
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 bg-white"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                  </select>
                </>
              )}
              {activeTab === "purchased" && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 bg-white"
                >
                  <option value="recent">Recently Purchased</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
              )}
              {activeTab === "history" && (
                <button
                  onClick={handleClearHistory}
                  disabled={isClearingHistory}
                  className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-red-600 hover:text-red-700 text-xs sm:text-sm disabled:opacity-50"
                >
                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>
                    {isClearingHistory ? "Clearing..." : "Clear All History"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Library Category Filters */}
          {activeTab === "library" && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <button
                onClick={() => handleLibraryFilterChange("all")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  libraryFilter === "all"
                    ? "bg-[#18243c] text-white border border-[#18243c]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <BookOpenIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>All ({categoryCounts.all})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange("reading")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  libraryFilter === "reading"
                    ? "bg-[#18243c] text-white border border-[#18243c]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Reading ({categoryCounts.reading})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange("completed")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  libraryFilter === "completed"
                    ? "bg-[#18243c] text-white border border-[#18243c]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <CheckCircleIconSolid className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Completed ({categoryCounts.completed})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange("liked")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  libraryFilter === "liked"
                    ? "bg-[#18243c] text-white border border-[#18243c]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <HeartIconSolid className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Liked ({categoryCounts.liked})</span>
              </button>

              <button
                onClick={() => handleLibraryFilterChange("want_to_read")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  libraryFilter === "want_to_read"
                    ? "bg-[#18243c] text-white border border-[#18243c]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <BookmarkIconSolid className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  <span className="hidden xs:inline">Want to Read</span>
                  <span className="xs:hidden">To Read</span> (
                  {categoryCounts.want_to_read})
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === "library" && (
          <LibraryTab
            items={libraryItems}
            isEditMode={isEditMode}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
            sortBy={sortBy}
            filter={libraryFilter}
          />
        )}

        {activeTab === "purchased" && <PurchasedContentTab sortBy={sortBy} />}

        {activeTab === "history" && (
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
  filter,
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
        case "reading":
          return {
            icon: (
              <EyeIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ),
            title: "No stories currently reading",
            message: "Stories you're actively reading will appear here",
          };
        case "completed":
          return {
            icon: (
              <CheckCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ),
            title: "No completed stories",
            message: "Stories you've finished reading will appear here",
          };
        case "liked":
          return {
            icon: (
              <HeartIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ),
            title: "No liked stories",
            message: "Heart the stories you love to add them here",
          };
        case "want_to_read":
          return {
            icon: (
              <BookmarkIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ),
            title: "No stories in your reading list",
            message: "Save stories you want to read later",
          };
        case "purchased":
          return {
            icon: (
              <ShoppingBagIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ),
            title: "No purchased stories",
            message: "Premium stories you've purchased will appear here",
          };
        default:
          return {
            icon: (
              <BookOpenIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ),
            title: "Your library is empty",
            message:
              "Start building your collection by adding stories you love",
          };
      }
    };

    const emptyState = getEmptyStateContent();

    return (
      <div className="text-center py-10 sm:py-16">
        {emptyState.icon}
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          {emptyState.title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          {emptyState.message}
        </p>
        <Link
          href="/stories"
          className="bg-[#18243c] text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-[#18243c]/90 transition-colors"
        >
          Browse Stories
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
      {items.map((item, index) => (
        <LibraryBookCard
          key={`${item.story.id}-${index}`}
          item={item}
          isEditMode={isEditMode}
          isSelected={selectedItems.has(item.story.id)}
          onSelect={() => onItemSelect(item.story.id)}
          filter={filter}
        />
      ))}
    </div>
  );
}

// History Tab Component
function HistoryTab({
  items,
  isLoading,
  error,
}: {
  items: any[];
  isLoading?: boolean;
  error?: any;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-10 sm:py-16">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
        <p className="text-sm sm:text-base text-gray-600">
          Loading your reading history...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 sm:py-16">
        <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          Failed to load reading history
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          {error?.response?.data?.error ||
            error?.message ||
            "Something went wrong"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors"
          style={{ backgroundColor: "#18243c" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#0f1a2e")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#18243c")
          }
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 sm:py-16">
        <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          No reading history
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Your reading history will appear here as you read stories
        </p>
        <Link
          href="/stories"
          className="text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors"
          style={{ backgroundColor: "#18243c" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#0f1a2e")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#18243c")
          }
        >
          Start Reading
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
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
  onSelect,
  filter,
}: {
  item: any;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  filter: LibraryFilter;
}) {
  const { data: bookmarkStatus } = useBookmarkStatus(item.story.id, true);
  const { data: storyProgress } = useStoryProgress(
    item.story.id,
    filter === "reading" || filter === "all"
  );
  const { mutate: updateReadingStatus } = useUpdateReadingStatus();
  const { mutate: resetStoryProgress } = useResetStoryProgress();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };

    if (showStatusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showStatusMenu]);
  const getListTypeIcon = (listType: string) => {
    switch (listType) {
      case "LIKE":
        return <HeartIconSolid className="w-4 h-4 text-red-500" />;
      case "COMPLETED":
        return <CheckCircleIconSolid className="w-4 h-4 text-green-500" />;
      case "READING":
        return <EyeIcon className="w-4 h-4 text-orange-500" />;
      case "WANT_TO_READ":
        return <BookmarkIconSolid className="w-4 h-4 text-purple-500" />;
      case "PURCHASED":
        return <ShoppingBagIconSolid className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getMultipleIcons = () => {
    if (!bookmarkStatus?.listTypes) return null;

    const icons = [];
    const listTypeMapping = {
      like: "LIKE",
      completed: "COMPLETED",
      reading: "READING",
      want_to_read: "WANT_TO_READ",
    };

    Object.entries(listTypeMapping).forEach(([key, listType]) => {
      if (
        bookmarkStatus.listTypes[key as keyof typeof bookmarkStatus.listTypes]
      ) {
        icons.push(getListTypeIcon(listType));
      }
    });

    return icons.length > 0 ? icons : null;
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
        {/* Cover Image */}
        <Link href={`/stories/${item.story.id}`} className="flex-shrink-0">
          <div className="w-full aspect-[3/4] relative bg-gray-200 rounded-t-lg overflow-hidden">
            {item.story.coverImageUrl ? (
              <Image
                src={item.story.coverImageUrl}
                alt={item.story.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <BookOpenIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* List Type Badge */}
            <div className="absolute top-1 right-1">
              {filter === "all" ? (
                <div className="flex flex-wrap gap-1 max-w-[40px]">
                  {getMultipleIcons()?.map((icon, index) => (
                    <div
                      key={index}
                      className="bg-white/90 rounded-full p-0.5 shadow-sm"
                    >
                      {React.cloneElement(icon as React.ReactElement, {
                        className: "w-3 h-3 sm:w-3.5 sm:h-3.5",
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/90 rounded-full p-0.5 shadow-sm">
                  {React.cloneElement(
                    getListTypeIcon(item.listType) as React.ReactElement,
                    {
                      className: "w-3 h-3 sm:w-3.5 sm:h-3.5",
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 p-2 sm:p-3 min-w-0 flex flex-col">
          <Link href={`/stories/${item.story.id}`}>
            <h3 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors">
              {item.story.title}
            </h3>
          </Link>
          <p className="text-xs text-gray-600 mb-1 truncate">
            by {item.story.author.displayName || item.story.author.username}
          </p>
          <div className="text-xs text-gray-500 mb-1">
            <span>{item.story.totalChapters} chapters</span>
          </div>

          {/* Reading Progress */}
          {storyProgress && (
            <div className="mt-1 mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(storyProgress.overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(storyProgress.overallProgress)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="truncate">
                  {storyProgress.completedChapters}/
                  {storyProgress.totalChapters}
                </span>
                {storyProgress.currentChapter && (
                  <span className="text-blue-600 ml-1">
                    Ch. {storyProgress.currentChapter.chapterNumber}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Reading Status Management */}
          {!isEditMode && (
            <div className="mt-auto pt-2">
              {/* Continue Reading / Start Reading Button */}
              {storyProgress?.currentChapter ? (
                <Link
                  href={`/stories/${item.story.id}/chapters/${storyProgress.currentChapter.chapterNumber}/read`}
                  className="block w-full bg-[#18243c] text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-[#18243c]/90 transition-colors text-center"
                >
                  Continue →
                </Link>
              ) : (
                <Link
                  href={`/stories/${item.story.id}`}
                  className="block w-full bg-[#18243c] text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-[#18243c]/90 transition-colors text-center"
                >
                  Start Reading
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// History Book Card Component
function HistoryBookCard({ item }: { item: any }) {
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { mutate: updateReadingStatus } = useUpdateReadingStatus();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };

    if (showStatusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showStatusMenu]);

  const handleAddToLibrary = () => {
    toggleBookmark({ storyId: item.story.id, listType: "LIKE" });
  };

  // Format the last read date
  const formatLastRead = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Cover Image */}
        <Link
          href={`/stories/${item.story.id}`}
          className="flex-shrink-0 mx-auto sm:mx-0"
        >
          <div className="w-32 sm:w-32 md:w-40 h-44 sm:h-48 md:h-56 relative bg-gray-200 rounded overflow-hidden">
            {item.story.coverImageUrl ? (
              <Image
                src={item.story.coverImageUrl}
                alt={item.story.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <BookOpenIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link href={`/stories/${item.story.id}`}>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                  {item.story.title}
                </h3>
              </Link>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                by {item.story.author.displayName || item.story.author.username}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                <span className="truncate">
                  Chapter {item.chapter.chapterNumber}: {item.chapter.title}
                </span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center space-x-2 sm:space-x-4 mt-1 sm:mt-0">
                  <span>{Math.round(item.progressPercentage)}% complete</span>
                  <span>•</span>
                  <span>Last read: {formatLastRead(item.lastReadAt)}</span>
                </div>
              </div>
              {item.story.description && (
                <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 mb-2 sm:mb-4">
                  {item.story.description}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, item.progressPercentage)
                )}%`,
              }}
            ></div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <Link
              href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}/read`}
              className="bg-[#18243c] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-[#18243c]/90 transition-colors text-xs sm:text-sm font-medium text-center sm:text-left"
            >
              {item.isCompleted ? (
                <>
                  <span className="hidden sm:inline">Read Again</span>
                  <span className="sm:hidden">Read</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Continue Reading</span>
                  <span className="sm:hidden">Continue</span>
                </>
              )}{" "}
              →
            </Link>

            <div className="flex items-center justify-center sm:justify-end space-x-2">
              <button
                onClick={handleAddToLibrary}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-blue-600 transition-colors text-xs sm:text-sm"
              >
                <HeartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Like</span>
              </button>

              {/* Reading Status Management */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowStatusMenu(!showStatusMenu);
                  }}
                  className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors text-xs sm:text-sm border border-gray-300 rounded-lg"
                >
                  <BookmarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add to List</span>
                  <span className="sm:hidden">Add</span>
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateReadingStatus({
                            storyId: item.story.id,
                            status: "READING",
                          });
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <EyeIcon className="w-4 h-4 text-orange-500" />
                        <span>Currently Reading</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateReadingStatus({
                            storyId: item.story.id,
                            status: "COMPLETED",
                          });
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span>Completed</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateReadingStatus({
                            storyId: item.story.id,
                            status: "WANT_TO_READ",
                          });
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <BookmarkIcon className="w-4 h-4 text-purple-500" />
                        <span>Want to Read</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
