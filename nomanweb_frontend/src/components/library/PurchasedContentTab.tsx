import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePurchasedChapters } from '@/hooks/usePurchasedChapters';
import { useQuery } from '@tanstack/react-query';
import { monetizationApi } from '@/lib/api/monetization';
import { 
  BookOpenIcon, 
  EyeIcon, 
  ClockIcon,
  ShoppingBagIcon,
  BookIcon
} from '@heroicons/react/24/outline';
import { ShoppingBagIcon as ShoppingBagIconSolid } from '@heroicons/react/24/solid';

interface PurchasedContentTabProps {
  sortBy: 'recent' | 'title' | 'author';
}

type PurchaseType = 'all' | 'chapters' | 'books';

export default function PurchasedContentTab({ sortBy }: PurchasedContentTabProps) {
  const [purchaseFilter, setPurchaseFilter] = useState<PurchaseType>('all');
  
  const { data: purchasedChapters = [], isLoading: isLoadingChapters, error: chaptersError } = usePurchasedChapters();
  
  // Fetch purchase history (includes both chapters and books)
  const { data: purchaseHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ['purchaseHistory'],
    queryFn: () => monetizationApi.getPurchaseHistory()
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Purchases</h3>
        <p className="text-gray-600">Failed to load your purchased content. Please try again.</p>
      </div>
    );
  }

  const purchases = purchaseHistory?.content || [];

  if (purchases.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Yet</h3>
        <p className="text-gray-600 mb-4">You haven't purchased any content yet.</p>
        <Link 
          href="/stories"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BookOpenIcon className="w-4 h-4 mr-2" />
          Browse Stories
        </Link>
      </div>
    );
  }

  // Filter purchases by type
  const filteredPurchases = purchases.filter(purchase => {
    if (purchaseFilter === 'chapters') {
      return purchase.chapter; // Has chapter property
    } else if (purchaseFilter === 'books') {
      return !purchase.chapter; // No chapter property (book purchase)
    }
    return true; // All purchases
  });

  // Sort purchases
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (sortBy === 'title') {
      return a.story.title.localeCompare(b.story.title);
    } else if (sortBy === 'author') {
      const authorA = a.story.author?.displayName || a.story.author?.username || 'Unknown';
      const authorB = b.story.author?.displayName || b.story.author?.username || 'Unknown';
      return authorA.localeCompare(authorB);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Purchase Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPurchaseFilter('all')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            purchaseFilter === 'all'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ShoppingBagIconSolid className="w-4 h-4" />
          <span>All Purchases ({purchases.length})</span>
        </button>
        
        <button
          onClick={() => setPurchaseFilter('chapters')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            purchaseFilter === 'chapters'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookOpenIcon className="w-4 h-4" />
          <span>Chapters ({purchases.filter(p => p.chapter).length})</span>
        </button>
        
        <button
          onClick={() => setPurchaseFilter('books')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            purchaseFilter === 'books'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookIcon className="w-4 h-4" />
          <span>Books ({purchases.filter(p => !p.chapter).length})</span>
        </button>
      </div>

      {/* Purchase List */}
      <div className="space-y-4">
        {sortedPurchases.map((purchase) => (
          <div key={purchase.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              {/* Story Cover */}
              <div className="flex-shrink-0">
                {purchase.story.coverImageUrl ? (
                  <Image
                    src={purchase.story.coverImageUrl}
                    alt={purchase.story.title}
                    width={64}
                    height={96}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                    <BookOpenIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Purchase Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {purchase.chapter ? (
                    <ShoppingBagIconSolid className="w-4 h-4 text-purple-600" />
                  ) : (
                    <BookIcon className="w-4 h-4 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    purchase.chapter ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    {purchase.chapter ? 'Chapter Purchase' : 'Book Purchase'}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{formatDate(purchase.createdAt)}</span>
                </div>
                
                <Link 
                  href={purchase.chapter 
                    ? `/stories/${purchase.story.id}/chapters/${purchase.chapter.chapterNumber}`
                    : `/stories/${purchase.story.id}`
                  }
                  className="block hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1 truncate">
                    {purchase.story.title}
                  </h3>
                  {purchase.chapter && (
                    <p className="text-sm text-gray-600 mb-2">
                      Chapter {purchase.chapter.chapterNumber}: {purchase.chapter.title}
                    </p>
                  )}
                </Link>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span>by {purchase.story.author?.displayName || purchase.story.author?.username || 'Unknown'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="font-medium text-blue-600">{purchase.totalCoins} coins</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                <Link
                  href={purchase.chapter 
                    ? `/stories/${purchase.story.id}/chapters/${purchase.chapter.chapterNumber}`
                    : `/stories/${purchase.story.id}`
                  }
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {purchase.chapter ? 'Read Chapter' : 'Read Book'}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 