'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Gift as GiftIcon, Coins, Send, Heart, Star, Crown, Diamond, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { monetizationApi, Gift } from '@/lib/api/monetization';



interface EnhancedGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  storyId?: string;
  chapterId?: string;
  onGiftSent?: () => void;
}

// Emoji mapping for gifts
const GIFT_EMOJI_MAP: { [key: string]: string } = {
  'Heart': '❤️',
  'Star': '⭐',
  'Crown': '👑',
  'Diamond': '💎',
  'Trophy': '🏆',
  'Fire': '🔥',
  'Rocket': '🚀',
  'Rainbow': '🌈',
};

// Get emoji for gift name, fallback to gift icon
const getGiftEmoji = (giftName: string): string => {
  return GIFT_EMOJI_MAP[giftName] || '🎁';
};

export default function EnhancedGiftModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  storyId,
  chapterId,
  onGiftSent,
}: EnhancedGiftModalProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftMode, setGiftMode] = useState<'emoji' | 'custom'>('emoji');
  const [quantity, setQuantity] = useState(1);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      fetchCoinBalance();
    }
  }, [isOpen]);

  // Debug quantity changes
  useEffect(() => {
    console.log('Quantity changed:', { quantity, giftMode, selectedGift: selectedGift?.name, customAmount, coinBalance });
  }, [quantity, giftMode, selectedGift, customAmount, coinBalance]);

  const fetchGifts = async () => {
    try {
      const data = await monetizationApi.getGifts();
      setGifts(data);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  };

  const fetchCoinBalance = async () => {
    try {
      const balance = await monetizationApi.getCoinBalance();
      setCoinBalance(balance);
    } catch (error) {
      console.error('Error fetching coin balance:', error);
      // Set a default balance to prevent UI issues
      setCoinBalance(0);
    }
  };

  const handleSendGift = async () => {
    if (giftMode === 'emoji' && !selectedGift) {
      toast.error('Please select a gift');
      return;
    }

    if (giftMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = giftMode === 'emoji' 
      ? selectedGift?.coinCost || 0
      : parseFloat(customAmount);

    const totalCost = amount * quantity;
    
    if (totalCost > coinBalance) {
      toast.error('Insufficient coins');
      return;
    }

    setLoading(true);
    try {
      await monetizationApi.sendGift({
        giftId: giftMode === 'emoji' ? selectedGift?.id : 'custom',
        recipientId,
        storyId,
        chapterId,
        quantity,
        message: message.trim() || null,
        customAmount: giftMode === 'custom' ? parseFloat(customAmount) : undefined,
      });

      toast.success('Gift sent successfully!');
      onGiftSent?.();
      onClose();
      
      // Reset form
      setSelectedGift(null);
      setQuantity(1);
      setCustomAmount('');
      setMessage('');
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error('Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    if (giftMode === 'emoji' && selectedGift) {
      const cost = (selectedGift.coinCost || 0) * quantity;
      console.log('Gift cost:', { gift: selectedGift.name, cost: selectedGift.coinCost, quantity, totalCost: cost });
      return cost;
    }
    if (giftMode === 'custom' && customAmount) {
      const cost = parseFloat(customAmount) * quantity;
      console.log('Custom gift cost:', { customAmount, quantity, totalCost: cost });
      return cost;
    }
    return 0;
  };

  const getMaxQuantity = () => {
    if (giftMode === 'emoji' && selectedGift) {
      const costPerGift = selectedGift.coinCost || 1;
      return Math.floor(coinBalance / costPerGift);
    }
    if (giftMode === 'custom' && customAmount) {
      const costPerGift = parseFloat(customAmount) || 1;
      return Math.floor(coinBalance / costPerGift);
    }
    return 1;
  };

  const totalCost = getTotalCost();
  const canAfford = totalCost <= coinBalance;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ 
        backgroundColor: 'rgba(24, 36, 60, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#18243c' }}>
                <GiftIcon className="h-5 w-5" style={{ color: '#18243c' }} />
                Send Gift to <span className="cursor-pointer hover:underline">{recipientName}</span>
              </h2>
              <p className="text-sm" style={{ color: 'rgba(24, 36, 60, 0.6)' }}>Support this creator</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <X className="h-4 w-4" style={{ color: '#18243c' }} />
            </button>
          </div>

          {/* Coin Balance */}
          <div className="mb-6 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(24, 36, 60, 0.03)', borderColor: 'rgba(24, 36, 60, 0.1)' }}>
            <div className="flex items-center gap-2" style={{ color: '#18243c' }}>
              <Coins className="h-4 w-4" />
              <span className="font-medium text-sm">{coinBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          {/* Gift Mode Toggle */}
          <div className="mb-6">
            <div className="flex rounded-xl p-1" style={{ backgroundColor: 'rgba(24, 36, 60, 0.05)' }}>
              <button
                onClick={() => {
                  setGiftMode('emoji');
                  setSelectedGift(null);
                  setQuantity(1);
                  setCustomAmount('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                  giftMode === 'emoji'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
                style={{ 
                  color: giftMode === 'emoji' ? '#18243c' : 'rgba(24, 36, 60, 0.6)'
                }}
              >
                🎁 Gifts
              </button>
              <button
                onClick={() => {
                  setGiftMode('custom');
                  setCustomAmount('');
                  setQuantity(1);
                  setSelectedGift(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                  giftMode === 'custom'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
                style={{ 
                  color: giftMode === 'custom' ? '#18243c' : 'rgba(24, 36, 60, 0.6)'
                }}
              >
                💰 Custom Amount
              </button>
            </div>
          </div>

          {/* Available Gifts */}
          {giftMode === 'emoji' && (
            <div className="mb-6">
              <h3 className="text-base font-medium mb-4" style={{ color: '#18243c' }}>Choose a Gift</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gifts.map((gift) => (
                  <div
                    key={gift.id}
                    className={`cursor-pointer transition-all hover:shadow-sm rounded-xl border p-4 text-center ${
                      selectedGift?.id === gift.id
                        ? 'shadow-sm'
                        : 'hover:border-gray-300'
                    }`}
                    style={{
                      backgroundColor: selectedGift?.id === gift.id ? 'rgba(24, 36, 60, 0.03)' : 'white',
                      borderColor: selectedGift?.id === gift.id ? 'rgba(24, 36, 60, 0.2)' : 'rgba(24, 36, 60, 0.1)'
                    }}
                    onClick={() => {
                      setSelectedGift(gift);
                      // Reset quantity to 1 when selecting a new gift
                      setQuantity(1);
                    }}
                  >
                    <div className="text-3xl mb-2">
                      {gift.iconUrl || getGiftEmoji(gift.name)}
                    </div>
                    <h4 className="font-medium text-xs mb-1" style={{ color: '#18243c' }}>{gift.name}</h4>
                    <p className="text-xs mb-2" style={{ color: 'rgba(24, 36, 60, 0.6)' }}>{gift.description}</p>
                    <div className="flex items-center justify-center gap-1" style={{ color: '#18243c' }}>
                      <Coins className="h-3 w-3" />
                      <span className="font-semibold text-xs">{gift.coinCost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          {giftMode === 'custom' && (
            <div className="mb-6">
              <h3 className="text-base font-medium mb-4" style={{ color: '#18243c' }}>Custom Coin Amount</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#18243c' }}>
                    Amount (Coins)
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      // Reset quantity to 1 when changing custom amount
                      setQuantity(1);
                    }}
                    placeholder="Enter amount"
                    className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{
                      borderColor: 'rgba(24, 36, 60, 0.2)',
                      backgroundColor: 'rgba(24, 36, 60, 0.02)',
                      color: '#18243c'
                    }}
                    min="1"
                    max={coinBalance}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Message */}
          {((giftMode === 'emoji' && selectedGift) || (giftMode === 'custom' && customAmount)) && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#18243c' }}>
                  Quantity {quantity > 1 && <span style={{ color: 'rgba(24, 36, 60, 0.6)' }}>({quantity} gifts)</span>}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={`p-2 border rounded-lg transition-colors text-sm ${
                      quantity <= 1 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      borderColor: 'rgba(24, 36, 60, 0.2)',
                      color: '#18243c'
                    }}
                    disabled={quantity <= 1}
                    title={quantity <= 1 ? 'Minimum quantity reached' : 'Decrease quantity'}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      const maxQuantity = getMaxQuantity();
                      setQuantity(Math.max(1, Math.min(newQuantity, maxQuantity)));
                    }}
                    className="text-sm font-medium w-16 text-center border rounded-lg p-2 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: 'rgba(24, 36, 60, 0.2)',
                      backgroundColor: 'rgba(24, 36, 60, 0.02)',
                      color: '#18243c'
                    }}
                    min="1"
                    max={getMaxQuantity()}
                  />
                  <button
                    onClick={() => {
                      const maxQuantity = getMaxQuantity();
                      if (quantity < maxQuantity) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className={`p-2 border rounded-lg transition-colors text-sm ${
                      quantity >= getMaxQuantity()
                        ? 'cursor-not-allowed opacity-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      borderColor: 'rgba(24, 36, 60, 0.2)',
                      color: '#18243c'
                    }}
                    disabled={quantity >= getMaxQuantity()}
                    title={quantity >= getMaxQuantity() ? 'Maximum quantity reached' : 'Increase quantity'}
                  >
                    +
                  </button>
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(24, 36, 60, 0.6)' }}>
                  Maximum: {getMaxQuantity()}
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
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                  style={{
                    borderColor: 'rgba(24, 36, 60, 0.2)',
                    backgroundColor: 'rgba(24, 36, 60, 0.02)',
                    color: '#18243c'
                  }}
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs mt-1" style={{ color: 'rgba(24, 36, 60, 0.6)' }}>
                  {message.length}/500 characters
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
                <div className="text-xs mt-1" style={{ color: 'rgba(24, 36, 60, 0.6)' }}>
                  💝 100% goes to {recipientName}
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
              disabled={!selectedGift && giftMode === 'emoji' || 
                       (giftMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) || 
                       !canAfford || loading}
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