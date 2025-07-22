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

// Emoji gifts with their corresponding icons
const EMOJI_GIFTS = [
  { id: 'heart', name: 'Heart', emoji: '❤️', cost: 1, description: 'Show your love' },
  { id: 'star', name: 'Star', emoji: '⭐', cost: 5, description: 'This story shines' },
  { id: 'crown', name: 'Crown', emoji: '👑', cost: 10, description: 'You are the king/queen' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', cost: 25, description: 'Precious like a diamond' },
  { id: 'trophy', name: 'Trophy', emoji: '🏆', cost: 50, description: 'You deserve this trophy' },
  { id: 'fire', name: 'Fire', emoji: '🔥', cost: 15, description: 'This is fire!' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', cost: 30, description: 'To the moon!' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', cost: 20, description: 'Magical content' },
];

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
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
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
    console.log('Quantity changed:', { quantity, giftMode, selectedEmoji, customAmount, coinBalance });
  }, [quantity, giftMode, selectedEmoji, customAmount, coinBalance]);

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
    if (giftMode === 'emoji' && !selectedEmoji) {
      toast.error('Please select an emoji gift');
      return;
    }

    if (giftMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = giftMode === 'emoji' 
      ? EMOJI_GIFTS.find(e => e.id === selectedEmoji)?.cost || 0
      : parseFloat(customAmount);

    const totalCost = amount * quantity;
    
    if (totalCost > coinBalance) {
      toast.error('Insufficient coins');
      return;
    }

    setLoading(true);
    try {
      await monetizationApi.sendGift({
        giftId: giftMode === 'emoji' ? `emoji_${selectedEmoji}` : 'custom',
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
      setSelectedEmoji(null);
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
    if (giftMode === 'emoji' && selectedEmoji) {
      const emojiGift = EMOJI_GIFTS.find(e => e.id === selectedEmoji);
      const cost = (emojiGift?.cost || 0) * quantity;
      console.log('Emoji gift cost:', { emojiGift: emojiGift?.name, cost: emojiGift?.cost, quantity, totalCost: cost });
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
    if (giftMode === 'emoji' && selectedEmoji) {
      const emojiGift = EMOJI_GIFTS.find(e => e.id === selectedEmoji);
      const costPerGift = emojiGift?.cost || 1;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <GiftIcon className="h-6 w-6 text-purple-600" />
                Send Gift to {recipientName}
              </h2>
              <p className="text-gray-600">Choose how you want to support this creator</p>
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

          {/* Gift Mode Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setGiftMode('emoji');
                  setSelectedEmoji(null);
                  setQuantity(1);
                  setCustomAmount('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  giftMode === 'emoji'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎁 Emoji Gifts
              </button>
              <button
                onClick={() => {
                  setGiftMode('custom');
                  setCustomAmount('');
                  setQuantity(1);
                  setSelectedEmoji(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  giftMode === 'custom'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                💰 Custom Amount
              </button>
            </div>
          </div>

          {/* Emoji Gifts */}
          {giftMode === 'emoji' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Choose an Emoji Gift</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {EMOJI_GIFTS.map((emojiGift) => (
                  <Card
                    key={emojiGift.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedEmoji === emojiGift.id
                        ? 'ring-2 ring-purple-500 bg-purple-50'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedEmoji(emojiGift.id);
                      // Reset quantity to 1 when selecting a new emoji
                      setQuantity(1);
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{emojiGift.emoji}</div>
                      <h4 className="font-medium text-sm mb-1">{emojiGift.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{emojiGift.description}</p>
                      <div className="flex items-center justify-center gap-1 text-yellow-600">
                        <Coins className="h-4 w-4" />
                        <span className="font-bold">{emojiGift.cost}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          {giftMode === 'custom' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Custom Coin Amount</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max={coinBalance}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Message */}
          {((giftMode === 'emoji' && selectedEmoji) || (giftMode === 'custom' && customAmount)) && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity {quantity > 1 && <span className="text-purple-600">({quantity} gifts)</span>}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={`p-2 border border-gray-300 rounded-md transition-colors ${
                      quantity <= 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-50 hover:border-gray-400'
                    }`}
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
                    className="text-lg font-medium w-16 text-center border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className={`p-2 border border-gray-300 rounded-md transition-colors ${
                      quantity >= getMaxQuantity()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-50 hover:border-gray-400'
                    }`}
                    disabled={quantity >= getMaxQuantity()}
                    title={quantity >= getMaxQuantity() ? 'Maximum quantity reached' : 'Increase quantity'}
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Maximum quantity: {getMaxQuantity()} (based on your coin balance)
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
                    {giftMode === 'emoji' && selectedEmoji 
                      ? EMOJI_GIFTS.find(e => e.id === selectedEmoji)?.cost || 0
                      : customAmount || 0
                    }
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
                  <div className="text-xs text-green-600 mt-1">
                    💝 100% goes to {recipientName} (no platform fee)
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
              disabled={!selectedEmoji && giftMode === 'emoji' || 
                       (giftMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) || 
                       !canAfford || loading}
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