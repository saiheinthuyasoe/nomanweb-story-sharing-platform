'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Gift, ShoppingBag, Calendar, Star } from 'lucide-react';

interface RevenueAnalytics {
  totalEarnings: number;
  totalChapterSales: number;
  totalGiftEarnings: number;
  currentMonthEarnings: number;
  lastMonthEarnings: number;
  dailyRevenue: Array<{
    date: string;
    amount: number;
  }>;
  topChapters: Array<{
    chapterTitle: string;
    storyTitle: string;
    totalRevenue: number;
    purchaseCount: number;
  }>;
  recentGifts: Array<{
    senderName: string;
    giftName: string;
    earnings: number;
    storyTitle: string;
    message: string;
  }>;
}

interface GiftTransaction {
  id: string;
  gift: {
    id: string;
    name: string;
    iconUrl: string;
    coinCost: number;
  };
  sender: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string;
  };
  recipient: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string;
  };
  totalCoins: number;
  message: string;
  createdAt: string;
}

export default function MonetizationPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [receivedGifts, setReceivedGifts] = useState<GiftTransaction[]>([]);
  const [sentGifts, setSentGifts] = useState<GiftTransaction[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'received' | 'sent' | 'purchases'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMonetizationData();
    }
  }, [user]);

  const fetchMonetizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch revenue analytics
      const revenueResponse = await fetch('/api/monetization/revenue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setAnalytics(revenueData);
      }

      // Fetch coin balance
      const balanceResponse = await fetch('/api/monetization/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (balanceResponse.ok) {
        const balance = await balanceResponse.json();
        setCoinBalance(balance);
      }

      // Fetch received gifts
      const receivedResponse = await fetch('/api/monetization/gifts/received?page=0&size=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        setReceivedGifts(receivedData.content || []);
      }

      // Fetch sent gifts
      const sentResponse = await fetch('/api/monetization/gifts/sent?page=0&size=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setSentGifts(sentData.content || []);
      }

    } catch (error) {
      console.error('Error fetching monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Monetization Dashboard</h1>
        <p className="text-gray-600">Track your earnings and manage your coins</p>
      </div>

      {/* Coin Balance Card */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6" />
              Current Coin Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{formatCurrency(coinBalance)} Coins</div>
              <Button 
                onClick={() => window.location.href = '/buy-coins'}
                className="bg-white text-orange-600 hover:bg-gray-100 border border-orange-200"
              >
                Buy More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 border-b">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'received', label: 'Gifts Received', icon: Gift },
            { key: 'sent', label: 'Gifts Sent', icon: Gift },
            { key: 'purchases', label: 'Purchases', icon: ShoppingBag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.totalEarnings)} Coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Chapter Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.totalChapterSales)} Coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Gift Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.totalGiftEarnings)} Coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(analytics.currentMonthEarnings)} Coins
                </div>
                <div className="text-sm text-gray-500">
                  Last month: {formatCurrency(analytics.lastMonthEarnings)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Earning Chapters */}
          {analytics.topChapters && analytics.topChapters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Earning Chapters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topChapters.slice(0, 5).map((chapter, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{chapter.chapterTitle}</h4>
                        <p className="text-sm text-gray-600">{chapter.storyTitle}</p>
                        <p className="text-xs text-gray-500">{chapter.purchaseCount} purchases</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(chapter.totalRevenue)} Coins
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Gifts */}
          {analytics.recentGifts && analytics.recentGifts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Recent Gifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentGifts.slice(0, 5).map((gift, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{gift.giftName} from {gift.senderName}</h4>
                        {gift.storyTitle && (
                          <p className="text-sm text-gray-600">Story: {gift.storyTitle}</p>
                        )}
                        {gift.message && (
                          <p className="text-sm text-gray-500">"{gift.message}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">
                          +{formatCurrency(gift.earnings)} Coins
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Received Gifts Tab */}
      {activeTab === 'received' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gifts Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receivedGifts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No gifts received yet</p>
              ) : (
                receivedGifts.map((gift) => (
                  <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{gift.gift.name}</h4>
                        <p className="text-sm text-gray-600">
                          From: {gift.sender.displayName || gift.sender.username}
                        </p>
                        {gift.message && (
                          <p className="text-sm text-gray-500">"{gift.message}"</p>
                        )}
                        <p className="text-xs text-gray-400">{formatDate(gift.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">
                        +{formatCurrency(gift.totalCoins * 0.7)} Coins
                      </div>
                      <div className="text-xs text-gray-500">
                        Cost: {formatCurrency(gift.totalCoins)} Coins
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Gifts Tab */}
      {activeTab === 'sent' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gifts Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentGifts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No gifts sent yet</p>
              ) : (
                sentGifts.map((gift) => (
                  <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{gift.gift.name}</h4>
                        <p className="text-sm text-gray-600">
                          To: {gift.recipient.displayName || gift.recipient.username}
                        </p>
                        {gift.message && (
                          <p className="text-sm text-gray-500">"{gift.message}"</p>
                        )}
                        <p className="text-xs text-gray-400">{formatDate(gift.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        -{formatCurrency(gift.totalCoins)} Coins
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Chapter Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Purchase history will be implemented here
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 