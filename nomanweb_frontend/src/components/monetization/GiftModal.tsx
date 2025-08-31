'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Gift, Coins, Send } from 'lucide-react';
import Cookies from 'js-cookie';

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
          'Authorization': `Bearer ${Cookies.get('token')}`,
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
          'Authorization': `Bearer ${Cookies.get('token')}`,
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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(24, 36, 60, 0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#18243c' }}>
                <Gift className="h-5 w-5" style={{ color: '#18243c' }} />
                Send Gift
              </h2>
              <p className="text-gray-500 text-sm">Choose how you want to support {recipientName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/50 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Coin Balance */}
          <div className="mb-6 p-3 rounded-xl" style={{ backgroundColor: 'rgba(24, 36, 60, 0.05)' }}>
            <div className="flex items-center gap-2" style={{ color: '#18243c' }}>
              <Coins className="h-4 w-4" />
              <span className="font-medium text-sm">{coinBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          {/* Gift Selection */}
          <div className="mb-6">
            <h3 className="text-base font-medium mb-3" style={{ color: '#18243c' }}>Select Gift</h3>
            <div className="grid grid-cols-2 gap-3">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  className={`cursor-pointer transition-all p-3 rounded-xl border ${
                    selectedGift?.id === gift.id
                      ? 'border-2 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedGift?.id === gift.id ? 'rgba(24, 36, 60, 0.05)' : 'transparent',
                    borderColor: selectedGift?.id === gift.id ? '#18243c' : undefined
                  }}
                  onClick={() => setSelectedGift(gift)}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: 'rgba(24, 36, 60, 0.1)' }}>
                      <Gift className="h-5 w-5" style={{ color: '#18243c' }} />
                    </div>
                    <h4 className="font-medium text-sm mb-1" style={{ color: '#18243c' }}>{gift.name}</h4>
                    <div className="flex items-center justify-center gap-1" style={{ color: '#18243c' }}>
                      <Coins className="h-3 w-3" />
                      <span className="font-semibold text-xs">{gift.coinCost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity and Message */}
          {selectedGift && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#18243c' }}>
                  Quantity
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full border transition-colors flex items-center justify-center"
                    style={{ 
                      borderColor: '#18243c', 
                      color: quantity <= 1 ? '#9ca3af' : '#18243c',
                      backgroundColor: quantity <= 1 ? 'transparent' : 'rgba(24, 36, 60, 0.05)'
                    }}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-base font-medium w-8 text-center" style={{ color: '#18243c' }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full border transition-colors flex items-center justify-center"
                    style={{ 
                      borderColor: '#18243c', 
                      color: totalCost >= coinBalance ? '#9ca3af' : '#18243c',
                      backgroundColor: totalCost >= coinBalance ? 'transparent' : 'rgba(24, 36, 60, 0.05)'
                    }}
                    disabled={totalCost >= coinBalance}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#18243c' }}>
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors text-sm"
                  style={{ 
                    focusBorderColor: '#18243c',
                    backgroundColor: 'rgba(24, 36, 60, 0.02)'
                  }}
                  rows={2}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {message.length}/500
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(24, 36, 60, 0.03)', borderColor: 'rgba(24, 36, 60, 0.1)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#18243c' }}>Total:</span>
                  <span className={`flex items-center gap-1 font-semibold ${!canAfford ? 'text-red-500' : ''}`} style={{ color: canAfford ? '#18243c' : undefined }}>
                    <Coins className="h-3 w-3" />
                    <span className="text-sm">{totalCost}</span>
                  </span>
                </div>
                {!canAfford && (
                  <p className="text-red-500 text-xs mt-1">Insufficient coins</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSendGift}
              disabled={!selectedGift || !canAfford || loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#18243c' }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Send className="h-3 w-3" />
              )}
              Send Gift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}