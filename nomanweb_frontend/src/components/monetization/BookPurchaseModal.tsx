'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Coins, Lock, CreditCard, BookOpen } from 'lucide-react';
import { usePurchaseBook } from '@/hooks/useBookPurchase';
import { useCoinBalance } from '@/hooks/useCoinBalance';
import { PurchaseBenefitDisplay } from '@/components/purchase/PurchaseBenefitDisplay';

interface BookPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  bookPrice: number;
  totalChapters: number;
  onPurchaseComplete?: () => void;
}

export default function BookPurchaseModal({
  isOpen,
  onClose,
  storyId,
  storyTitle,
  bookPrice,
  totalChapters,
  onPurchaseComplete,
}: BookPurchaseModalProps) {
  const { data: coinBalance = 0 } = useCoinBalance(isOpen);
  const { mutate: purchaseBook, isPending: loading } = usePurchaseBook();

  const handlePurchase = () => {
    if (bookPrice > coinBalance) {
      alert('Insufficient coins');
      return;
    }

    purchaseBook(
      { storyId },
      {
        onSuccess: () => {
          onPurchaseComplete?.();
          onClose();
        },
      }
    );
  };

  const canAfford = bookPrice <= coinBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Purchase Whole Book
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Book Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">{storyTitle}</h3>
            <p className="text-sm text-blue-700 mb-2">
              Complete access to all {totalChapters} chapters
            </p>
            <div className="flex items-center gap-2 text-blue-800">
              <Coins className="h-4 w-4" />
              <span className="font-bold">{bookPrice} Coins</span>
            </div>
          </div>

          {/* Balance Info */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800">Your Balance:</span>
              <div className="flex items-center gap-2 text-yellow-800">
                <Coins className="h-4 w-4" />
                <span className="font-bold">{coinBalance.toLocaleString()} Coins</span>
              </div>
            </div>
            {!canAfford && (
              <p className="text-red-600 text-sm mt-2">
                You need {(bookPrice - coinBalance).toLocaleString()} more coins to purchase this book.
              </p>
            )}
          </div>

          {/* Purchase Info */}
          <div className="mb-4">
            <PurchaseBenefitDisplay
              itemType="story"
              itemTitle={storyTitle}
              currentPricingType="WHOLE_BOOK"
              showCompact={true}
            />
          </div>

          <div className="mb-4 p-3 border rounded-lg">
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Unlimited access to all {totalChapters} chapters</li>
              <li>• Support the author with 70% of the purchase price</li>
              <li>• Access from any device</li>
              <li>• Future chapters included at no extra cost</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!canAfford || loading}
              className="flex-1 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Purchase Book
            </Button>
          </div>

          {!canAfford && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Need more coins?</p>
              <Button
                onClick={() => {
                  // Navigate to coin purchase page - placeholder for now
                  alert('Coin purchase feature coming soon!');
                }}
                variant="outline"
                size="sm"
              >
                Buy Coins
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}