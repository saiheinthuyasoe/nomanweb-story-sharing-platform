'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Gift, Coins, Send } from 'lucide-react';

interface Gift {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  coinCost: number;
  isActive: boolean;
}

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  storyId?: string;
  chapterId?: string;
  onGiftSent?: () => void;
}

export default function GiftModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  storyId,
  chapterId,
  onGiftSent,
}: GiftModalProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      fetchCoinBalance();
    }
  }, [isOpen]);

  const fetchGifts = async () => {
    try {
      const response = await fetch('/api/monetization/gifts');
      if (response.ok) {
        const data = await response.json();
        setGifts(data);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  };

  const fetchCoinBalance = async () => {
    try {
      const response = await fetch('/api/monetization/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const balance = await response.json();
        setCoinBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching coin balance:', error);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) return;

    const totalCost = selectedGift.coinCost * quantity;
    if (totalCost > coinBalance) {
      alert('Insufficient coins');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/monetization/gifts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          giftId: selectedGift.id,
          recipientId,
          storyId,
          chapterId,
          quantity,
          message: message.trim() || null,
        }),
      });

      if (response.ok) {
        alert('Gift sent successfully!');
        onGiftSent?.();
        onClose();
        
        // Reset form
        setSelectedGift(null);
        setQuantity(1);
        setMessage('');
      } else {
        const error = await response.text();
        alert(`Failed to send gift: ${error}`);
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = selectedGift ? selectedGift.coinCost * quantity : 0;
  const canAfford = totalCost <= coinBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Gift className="h-6 w-6 text-purple-600" />
                Send Gift
              </h2>
              <p className="text-gray-600">Send a gift to {recipientName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Coin Balance */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Coins className="h-5 w-5" />
              <span className="font-medium">Your Balance: {coinBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          {/* Gift Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Choose a Gift</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gifts.map((gift) => (
                <Card
                  key={gift.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedGift?.id === gift.id
                      ? 'ring-2 ring-purple-500 bg-purple-50'
                      : ''
                  }`}
                  onClick={() => setSelectedGift(gift)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">{gift.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{gift.description}</p>
                    <div className="flex items-center justify-center gap-1 text-yellow-600">
                      <Coins className="h-4 w-4" />
                      <span className="font-bold">{gift.coinCost}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quantity and Message */}
          {selectedGift && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={totalCost >= coinBalance}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/500 characters
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Cost per gift:</span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {selectedGift.coinCost}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Cost:</span>
                    <span className={`flex items-center gap-1 ${!canAfford ? 'text-red-600' : ''}`}>
                      <Coins className="h-4 w-4" />
                      {totalCost}
                    </span>
                  </div>
                  {!canAfford && (
                    <p className="text-red-600 text-sm mt-1">Insufficient coins</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
              onClick={handleSendGift}
              disabled={!selectedGift || !canAfford || loading}
              className="flex-1 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Gift
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 