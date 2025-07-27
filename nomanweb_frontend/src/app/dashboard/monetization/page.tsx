"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingBag,
  Calendar,
  Star,
  DollarSign,
  BookOpen,
  Users,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

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

interface EarnedMoney {
  id: string;
  transactionType: "chapter_purchase" | "story_purchase";
  amount: number;
  readerName: string;
  readerUsername: string;
  storyTitle: string;
  chapterTitle?: string;
  chapterNumber?: number;
  createdAt: string;
  commission: number; // Platform commission percentage
  netEarnings: number; // Amount after commission
}

interface PurchaseHistory {
  id: string;
  purchaseType: "chapter" | "book";
  storyId: string;
  storyTitle: string;
  storyAuthor: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  amount: number;
  createdAt: string;
  status: "completed" | "pending" | "failed";
}

export default function MonetizationPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [receivedGifts, setReceivedGifts] = useState<GiftTransaction[]>([]);
  const [sentGifts, setSentGifts] = useState<GiftTransaction[]>([]);
  const [earnedMoney, setEarnedMoney] = useState<EarnedMoney[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    "overview" | "earned" | "received" | "sent" | "purchases"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMonetizationData();
    }
  }, [user]);

  // Monitor coin balance changes and show notifications
  useEffect(() => {
    if (previousBalance > 0 && coinBalance !== previousBalance) {
      const difference = coinBalance - previousBalance;
      if (difference > 0) {
        toast.success(
          `🎉 Your coin balance has increased by ${difference} coins!`
        );
      } else if (difference < 0) {
        toast.info(
          `Your coin balance has been updated. New balance: ${coinBalance} coins`
        );
      }
    }
    setPreviousBalance(coinBalance);
  }, [coinBalance, previousBalance]);

  // Update local balance when user context changes
  useEffect(() => {
    if (user?.coinBalance !== undefined) {
      setCoinBalance(user.coinBalance);
    }
  }, [user?.coinBalance]);

  // Monitor SSE connection status
  useEffect(() => {
    const checkSseConnection = () => {
      // Check if SSE connection is working by looking for console logs
      const originalLog = console.log;
      let sseConnected = false;

      console.log = (...args) => {
        if (args[0]?.includes?.("✅ Connected to coin balance updates SSE")) {
          sseConnected = true;
          setSseConnected(true);
        }
        originalLog.apply(console, args);
      };

      // Reset after a short delay
      setTimeout(() => {
        console.log = originalLog;
        if (!sseConnected) {
          setSseConnected(false);
        }
      }, 1000);
    };

    checkSseConnection();
  }, []);

  const fetchMonetizationData = async () => {
    try {
      setLoading(true);

      // Fetch revenue analytics
      const revenueResponse = await fetch("/api/monetization/revenue", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setAnalytics(revenueData);
      }

      // Fetch coin balance
      const balanceResponse = await fetch("/api/monetization/balance", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (balanceResponse.ok) {
        const balance = await balanceResponse.json();
        setCoinBalance(balance);
      }

      // Fetch received gifts
      const receivedResponse = await fetch(
        "/api/monetization/gifts/received?page=0&size=10",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        setReceivedGifts(receivedData.content || []);
      }

      // Fetch sent gifts
      const sentResponse = await fetch(
        "/api/monetization/gifts/sent?page=0&size=10",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setSentGifts(sentData.content || []);
      }

      // Fetch earned money from reader purchases
      const earnedResponse = await fetch(
        "/api/monetization/earnings?page=0&size=20",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (earnedResponse.ok) {
        const earnedData = await earnedResponse.json();
        setEarnedMoney(earnedData.content || []);
      }

      // Fetch purchase history (user's own purchases)
      const purchaseResponse = await fetch(
        "/api/monetization/purchases?page=0&size=20",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (purchaseResponse.ok) {
        const purchaseData = await purchaseResponse.json();
        setPurchaseHistory(purchaseData.content || []);
      }
    } catch (error) {
      console.error("Error fetching monetization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Monetization Dashboard
        </h1>
        <p className="text-gray-600">
          Track your earnings and manage your coins
        </p>
      </div>

      {/* Coin Balance Card */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6" />
              Current Coin Balance
              {coinBalance !== user?.coinBalance && (
                <div className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs animate-pulse">
                  Updating...
                </div>
              )}
              <div
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  sseConnected ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                {sseConnected ? "🟢 Live" : "🔴 Offline"}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {formatCurrency(coinBalance)} Coins
              </div>
              <Button
                onClick={() => (window.location.href = "/buy-coins")}
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
            { key: "overview", label: "Overview", icon: TrendingUp },
            { key: "earned", label: "Earned Money", icon: DollarSign },
            { key: "received", label: "Gifts Received", icon: Gift },
            { key: "sent", label: "Gifts Sent", icon: Gift },
            { key: "purchases", label: "Purchases", icon: ShoppingBag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.totalEarnings)} Coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Chapter Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.totalChapterSales)} Coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Gift Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.totalGiftEarnings)} Coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  This Month
                </CardTitle>
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{chapter.chapterTitle}</h4>
                        <p className="text-sm text-gray-600">
                          {chapter.storyTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          {chapter.purchaseCount} purchases
                        </p>
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">
                          {gift.giftName} from {gift.senderName}
                        </h4>
                        {gift.storyTitle && (
                          <p className="text-sm text-gray-600">
                            Story: {gift.storyTitle}
                          </p>
                        )}
                        {gift.message && (
                          <p className="text-sm text-gray-500">
                            "{gift.message}"
                          </p>
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

      {/* Earned Money Tab */}
      {activeTab === "earned" && (
        <div className="space-y-6">
          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    earnedMoney.reduce(
                      (sum, earning) => sum + earning.netEarnings,
                      0
                    )
                  )}{" "}
                  Coins
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Net after platform fees
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {earnedMoney.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Chapters & Stories sold
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Unique Readers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(earnedMoney.map((e) => e.readerUsername)).size}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Different buyers
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    earnedMoney
                      .filter(
                        (e) =>
                          new Date(e.createdAt).getMonth() ===
                          new Date().getMonth()
                      )
                      .reduce((sum, earning) => sum + earning.netEarnings, 0)
                  )}{" "}
                  Coins
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Current month earnings
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Earnings History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnedMoney.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No earnings yet
                  </p>
                ) : (
                  earnedMoney.slice(0, 10).map((earning) => (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          {earning.transactionType === "chapter_purchase" ? (
                            <BookOpen className="h-5 w-5 text-white" />
                          ) : (
                            <Star className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {earning.transactionType === "chapter_purchase"
                              ? `Chapter ${earning.chapterNumber}: ${earning.chapterTitle}`
                              : earning.storyTitle}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Story: {earning.storyTitle}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reader: {earning.readerName} (@
                            {earning.readerUsername})
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(earning.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          +{formatCurrency(earning.netEarnings)} Coins
                        </div>
                        <div className="text-xs text-gray-500">
                          Gross: {formatCurrency(earning.amount)} Coins
                        </div>
                        <div className="text-xs text-gray-500">
                          Fee: {earning.commission}%
                        </div>
                        <Badge
                          variant={
                            earning.transactionType === "chapter_purchase"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {earning.transactionType === "chapter_purchase"
                            ? "Chapter"
                            : "Story"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {earnedMoney.length > 10 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Load More Earnings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Earning Stories */}
          {earnedMoney.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Earning Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    earnedMoney.reduce((acc, earning) => {
                      if (!acc[earning.storyTitle]) {
                        acc[earning.storyTitle] = {
                          totalEarnings: 0,
                          purchaseCount: 0,
                        };
                      }
                      acc[earning.storyTitle].totalEarnings +=
                        earning.netEarnings;
                      acc[earning.storyTitle].purchaseCount += 1;
                      return acc;
                    }, {} as Record<string, { totalEarnings: number; purchaseCount: number }>)
                  )
                    .sort(([, a], [, b]) => b.totalEarnings - a.totalEarnings)
                    .slice(0, 5)
                    .map(([storyTitle, data], index) => (
                      <div
                        key={storyTitle}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                ? "bg-amber-600"
                                : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {storyTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {data.purchaseCount} purchases
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(data.totalEarnings)} Coins
                          </div>
                          <div className="text-xs text-gray-500">
                            Avg:{" "}
                            {formatCurrency(
                              data.totalEarnings / data.purchaseCount
                            )}{" "}
                            per sale
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
      {activeTab === "received" && (
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
                <p className="text-gray-500 text-center py-8">
                  No gifts received yet
                </p>
              ) : (
                receivedGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{gift.gift.name}</h4>
                        <p className="text-sm text-gray-600">
                          From:{" "}
                          {gift.sender.displayName || gift.sender.username}
                        </p>
                        {gift.message && (
                          <p className="text-sm text-gray-500">
                            "{gift.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(gift.createdAt)}
                        </p>
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
      {activeTab === "sent" && (
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
                <p className="text-gray-500 text-center py-8">
                  No gifts sent yet
                </p>
              ) : (
                sentGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{gift.gift.name}</h4>
                        <p className="text-sm text-gray-600">
                          To:{" "}
                          {gift.recipient.displayName ||
                            gift.recipient.username}
                        </p>
                        {gift.message && (
                          <p className="text-sm text-gray-500">
                            "{gift.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(gift.createdAt)}
                        </p>
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
      {activeTab === "purchases" && (
        <div className="space-y-6">
          {/* Purchase Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    purchaseHistory.reduce(
                      (sum, purchase) => sum + purchase.amount,
                      0
                    )
                  )}{" "}
                  Coins
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  All-time spending
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {purchaseHistory.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Chapters & Books
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Books Owned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {
                    purchaseHistory.filter((p) => p.purchaseType === "book")
                      .length
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">Complete books</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Chapters Owned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {
                    purchaseHistory.filter((p) => p.purchaseType === "chapter")
                      .length
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Individual chapters
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No purchases yet
                    </p>
                    <p className="text-gray-400 text-sm">
                      Start exploring stories to build your library
                    </p>
                  </div>
                ) : (
                  purchaseHistory.slice(0, 15).map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            purchase.purchaseType === "book"
                              ? "bg-gradient-to-r from-purple-500 to-pink-500"
                              : "bg-gradient-to-r from-blue-500 to-green-500"
                          }`}
                        >
                          {purchase.purchaseType === "book" ? (
                            <BookOpen className="h-5 w-5 text-white" />
                          ) : (
                            <Star className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {purchase.purchaseType === "book"
                              ? purchase.storyTitle
                              : `Chapter ${purchase.chapterNumber}: ${purchase.chapterTitle}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {purchase.purchaseType === "book"
                              ? `Complete Book by ${purchase.storyAuthor}`
                              : `${purchase.storyTitle} by ${purchase.storyAuthor}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                purchase.purchaseType === "book"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {purchase.purchaseType === "book"
                                ? "Complete Book"
                                : "Chapter"}
                            </Badge>
                            <Badge
                              variant={
                                purchase.status === "completed"
                                  ? "default"
                                  : purchase.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {purchase.status.charAt(0).toUpperCase() +
                                purchase.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(purchase.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          -{formatCurrency(purchase.amount)} Coins
                        </div>
                        {purchase.purchaseType === "book" && (
                          <p className="text-xs text-green-600 mt-1">
                            Full access unlocked
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {purchaseHistory.length > 15 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Load More Purchases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Authors */}
          {purchaseHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Favorite Authors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    purchaseHistory.reduce((acc, purchase) => {
                      if (!acc[purchase.storyAuthor]) {
                        acc[purchase.storyAuthor] = {
                          totalSpent: 0,
                          purchaseCount: 0,
                          booksPurchased: 0,
                        };
                      }
                      acc[purchase.storyAuthor].totalSpent += purchase.amount;
                      acc[purchase.storyAuthor].purchaseCount += 1;
                      if (purchase.purchaseType === "book") {
                        acc[purchase.storyAuthor].booksPurchased += 1;
                      }
                      return acc;
                    }, {} as Record<string, { totalSpent: number; purchaseCount: number; booksPurchased: number }>)
                  )
                    .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
                    .slice(0, 5)
                    .map(([authorName, data], index) => (
                      <div
                        key={authorName}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                ? "bg-amber-600"
                                : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {authorName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {data.purchaseCount} purchases •{" "}
                              {data.booksPurchased} books owned
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            {formatCurrency(data.totalSpent)} Coins
                          </div>
                          <div className="text-xs text-gray-500">
                            Total spent
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
    </div>
  );
}
