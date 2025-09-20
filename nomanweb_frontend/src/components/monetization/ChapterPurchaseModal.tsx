'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Coins, Lock, CreditCard } from 'lucide-react';
import { usePurchaseChapter } from '@/hooks/useChapterPurchase';
import { useCoinBalance } from '@/hooks/useCoinBalance';
import { PurchaseBenefitDisplay } from '@/components/purchase/PurchaseBenefitDisplay';

interface ChapterPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
  coinPrice: number;
  onPurchaseComplete?: () => void;
}

export default function ChapterPurchaseModal({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  coinPrice,
  onPurchaseComplete,
}: ChapterPurchaseModalProps) {
  const { data: coinBalance = 0 } = useCoinBalance(isOpen);
  const { mutate: purchaseChapter, isPending: loading } = usePurchaseChapter();

  const handlePurchase = () => {
    if (coinPrice > coinBalance) {
      alert('Insufficient coins');
      return;
    }

    purchaseChapter(
      { chapterId },
      {
        onSuccess: () => {
          onPurchaseComplete?.();
          onClose();
        },
      }
    );
  };

  const canAfford = coinPrice <= coinBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Purchase Chapter
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chapter Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">{chapterTitle}</h3>
            <div className="flex items-center gap-2 text-blue-800">
              <Coins className="h-4 w-4" />
              <span className="font-bold">{coinPrice} Coins</span>
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
                You need {(coinPrice - coinBalance).toLocaleString()} more coins to purchase this chapter.
              </p>
            )}
          </div>

          {/* Purchase Info */}
          <div className="mb-4">
            <PurchaseBenefitDisplay
              itemType="chapter"
              itemTitle={chapterTitle}
              currentPricingType="PAID_PER_CHAPTER"
              showCompact={true}
            />
          </div>

          <div className="mb-4 p-3 border rounded-lg">
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Unlimited access to this chapter</li>
              <li>• Support the author with 70% of the purchase price</li>
              <li>• Access from any device</li>
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
              Purchase
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