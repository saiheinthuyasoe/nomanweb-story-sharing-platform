import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePurchasedChapters } from "@/hooks/usePurchasedChapters";
import { useQuery } from "@tanstack/react-query";
import { monetizationApi } from "@/lib/api/monetization";
import {
  BookOpenIcon,
  EyeIcon,
  ClockIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ShoppingBagIcon as ShoppingBagIconSolid } from "@heroicons/react/24/solid";

interface PurchasedContentTabProps {
  sortBy: "recent" | "title" | "author";
}

export default function PurchasedContentTab({
  sortBy,
}: PurchasedContentTabProps) {
  const [expandedStories, setExpandedStories] = useState<Set<string>>(
    new Set()
  );

  const {
    data: purchasedChapters = [],
    isLoading: isLoadingChapters,
    error: chaptersError,
  } = usePurchasedChapters();

  // Fetch purchase history (includes both chapters and books)
  const {
    data: purchaseHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ["purchaseHistory"],
    queryFn: () => monetizationApi.getPurchaseHistory(),
  });

  const isLoading = isLoadingChapters || isLoadingHistory;
  const error = chaptersError || historyError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-24 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
      <div className="text-center py-8">
        <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Purchases
        </h3>
        <p className="text-gray-600">
          Failed to load your purchased content. Please try again.
        </p>
      </div>
    );
  }

  const purchases = purchaseHistory?.content || [];

  if (purchases.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Purchases Yet
        </h3>
        <p className="text-gray-600 mb-4">
          You haven't purchased any content yet.
        </p>
        <Link
          href="/stories"
          className="inline-flex items-center px-4 py-2 bg-[#18243c] text-white rounded-lg hover:bg-[#18243c]/90 transition-colors"
        >
          <BookOpenIcon className="w-4 h-4 mr-2" />
          Browse Stories
        </Link>
      </div>
    );
  }

  // Sort purchases
  const sortedPurchases = [...purchases].sort((a, b) => {
    if (sortBy === "title") {
      return a.story.title.localeCompare(b.story.title);
    } else if (sortBy === "author") {
      const authorA =
        a.story.author?.displayName || a.story.author?.username || "Unknown";
      const authorB =
        b.story.author?.displayName || b.story.author?.username || "Unknown";
      return authorA.localeCompare(authorB);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Group purchases by story
  const groupedPurchases = sortedPurchases.reduce((groups, purchase) => {
    const storyId = purchase.story.id;
    if (!groups[storyId]) {
      groups[storyId] = {
        story: purchase.story,
        bookPurchase: null,
        chapterPurchases: [],
        totalCoins: 0,
        latestPurchaseDate: purchase.createdAt,
      };
    }

    if (purchase.chapter) {
      groups[storyId].chapterPurchases.push(purchase);
    } else {
      groups[storyId].bookPurchase = purchase;
    }

    groups[storyId].totalCoins += purchase.totalCoins;
    if (
      new Date(purchase.createdAt) >
      new Date(groups[storyId].latestPurchaseDate)
    ) {
      groups[storyId].latestPurchaseDate = purchase.createdAt;
    }

    return groups;
  }, {} as Record<string, any>);

  // Determine the effective purchase type based on current story pricing and purchases
  const getEffectivePurchaseType = (group: any) => {
    const hasBookPurchase = !!group.bookPurchase;
    const hasChapterPurchases = group.chapterPurchases.length > 0;
    const currentPricingType = group.story.pricingType;

    // If story is currently WHOLE_BOOK and user has book purchase, it's a book purchase
    if (currentPricingType === "WHOLE_BOOK" && hasBookPurchase) {
      return "book";
    }

    // If story is currently WHOLE_BOOK and user has purchased most chapters, treat as book purchase
    if (
      currentPricingType === "WHOLE_BOOK" &&
      hasChapterPurchases &&
      !hasBookPurchase
    ) {
      return "book";
    }

    // If story is currently PAID_PER_CHAPTER, treat it as chapter purchases (even if originally book purchase)
    if (currentPricingType === "PAID_PER_CHAPTER") {
      return "chapters";
    }

    // If user only has chapter purchases, it's chapter purchases
    if (hasChapterPurchases) {
      return "chapters";
    }

    // Fallback
    return hasBookPurchase ? "book" : "chapters";
  };

  // Get purchase description based on effective purchase type
  const getPurchaseDescription = (
    group: any,
    effectivePurchaseType: string
  ) => {
    const hasBookPurchase = !!group.bookPurchase;
    const chapterCount = group.chapterPurchases.length;
    const currentPricingType = group.story.pricingType;

    switch (effectivePurchaseType) {
      case "book":
        // If user has chapter purchases and story is WHOLE_BOOK, show they have access through chapter purchases
        if (
          chapterCount > 0 &&
          !hasBookPurchase &&
          currentPricingType === "WHOLE_BOOK"
        ) {
          return `All Chapters • Access through chapter purchases (${chapterCount} purchased)`;
        }
        return "All Chapters • Whole book purchased";
      case "chapters":
        // If originally a book purchase but story is now PAID_PER_CHAPTER, show the chapters they have access to
        if (hasBookPurchase && currentPricingType === "PAID_PER_CHAPTER") {
          const chaptersAtPurchase =
            group.bookPurchase?.chaptersAtPurchase || 0;
          return `${chaptersAtPurchase} Chapter${
            chaptersAtPurchase !== 1 ? "s" : ""
          } • ${chaptersAtPurchase} purchased`;
        }
        // Regular chapter purchases
        return `${chapterCount} Chapter${
          chapterCount !== 1 ? "s" : ""
        } • ${chapterCount} purchased`;
      default:
        return "Unknown purchase type";
    }
  };

  const toggleExpanded = (storyId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Purchase List - Grouped by Story */}
      <div className="space-y-4">
        {Object.values(groupedPurchases).map((group: any) => {
          const storyId = group.story.id;
          const isExpanded = expandedStories.has(storyId);
          const effectivePurchaseType = getEffectivePurchaseType(group);
          const chapterCount = group.chapterPurchases.length;
          const purchaseDescription = getPurchaseDescription(
            group,
            effectivePurchaseType
          );

          return (
            <div
              key={storyId}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Main Story Card */}
              <div className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Story Cover */}
                  <div className="flex-shrink-0">
                    {group.story.coverImageUrl ? (
                      <Image
                        src={group.story.coverImageUrl}
                        alt={group.story.title}
                        width={96}
                        height={144}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-24 h-36 bg-gray-200 rounded flex items-center justify-center">
                        <BookOpenIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Story Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {effectivePurchaseType === "book" ? (
                        <BookOpenIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <ShoppingBagIconSolid className="w-5 h-5 text-purple-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          effectivePurchaseType === "book"
                            ? "text-green-600"
                            : "text-purple-600"
                        }`}
                      >
                        {effectivePurchaseType === "book"
                          ? "Book Purchase"
                          : "Chapter Purchases"}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(group.latestPurchaseDate)}
                      </span>
                    </div>

                    <Link
                      href={`/stories/${storyId}`}
                      className="block hover:text-blue-600 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {group.story.title}
                      </h3>
                    </Link>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>
                        by{" "}
                        {group.story.author?.displayName ||
                          group.story.author?.username ||
                          "Unknown"}
                      </span>
                      <span className="font-medium text-blue-600">
                        {group.totalCoins} coins total
                      </span>
                    </div>

                    {/* Purchase Summary */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {purchaseDescription}
                        </span>

                        {/* Expand/Collapse Button for Chapters */}
                        {chapterCount > 0 && (
                          <button
                            onClick={() => toggleExpanded(storyId)}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDownIcon className="w-4 h-4" />
                                <span>Hide Chapters</span>
                              </>
                            ) : (
                              <>
                                <ChevronRightIcon className="w-4 h-4" />
                                <span>Show Chapters ({chapterCount})</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/stories/${storyId}`}
                          className="inline-flex items-center px-3 py-2 bg-[#18243c] text-white text-sm rounded-lg hover:bg-[#18243c]/90 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {effectivePurchaseType === "book"
                            ? "Read Book"
                            : "Continue Reading"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Chapters Section */}
              {chapterCount > 0 && isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Purchased Chapters:
                    </h4>
                    <div className="space-y-2">
                      {group.chapterPurchases
                        .sort(
                          (a: any, b: any) =>
                            a.chapter.chapterNumber - b.chapter.chapterNumber
                        )
                        .map((purchase: any) => (
                          <div
                            key={purchase.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  Chapter {purchase.chapter.chapterNumber}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-600">
                                  {purchase.chapter.title}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-blue-600 font-medium">
                                  {purchase.totalCoins} coins
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Purchased {formatDate(purchase.createdAt)}
                              </div>
                            </div>
                            <Link
                              href={`/stories/${storyId}/chapters/${purchase.chapter.chapterNumber}/read`}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                            >
                              <EyeIcon className="w-3 h-3 mr-1" />
                              Read
                            </Link>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
