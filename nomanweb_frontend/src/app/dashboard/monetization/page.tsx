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
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";

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
  } | null;
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

interface RefundEarned {
  id: string;
  userId: string;
  authorId: string;
  storyId: string;
  storyTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  refundType: string;
  originalPurchaseType: string;
  refundAmount: number;
  originalAmount: number;
  refundReason: string;
  status: string;
  processedAt: string;
  createdAt: string;
}

interface RefundPaid {
  id: string;
  userId: string;
  authorId: string;
  storyId: string;
  storyTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  refundType: string;
  originalPurchaseType: string;
  refundAmount: number;
  originalAmount: number;
  refundReason: string;
  status: string;
  processedAt: string;
  createdAt: string;
}

export default function MonetizationPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [receivedGifts, setReceivedGifts] = useState<GiftTransaction[]>([]);
  const [sentGifts, setSentGifts] = useState<GiftTransaction[]>([]);
  const [earnedMoney, setEarnedMoney] = useState<EarnedMoney[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [refundsEarned, setRefundsEarned] = useState<RefundEarned[]>([]);
  const [refundsPaid, setRefundsPaid] = useState<RefundPaid[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "earned"
    | "received"
    | "sent"
    | "purchases"
    | "refunds-earned"
    | "refunds-paid"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMonetizationData();
    } else {
      setLoading(false);
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
      try {
        const revenueResponse = await apiClient.get("/monetization/revenue");
        setAnalytics(revenueResponse.data);
      } catch (error) {
        console.error("Failed to fetch revenue analytics:", error);
      }

      // Fetch coin balance
      try {
        const balanceResponse = await apiClient.get("/monetization/balance");
        setCoinBalance(balanceResponse.data);
      } catch (error) {
        console.error("Failed to fetch coin balance:", error);
      }

      // Fetch received gifts
      try {
        const receivedResponse = await apiClient.get(
          "/monetization/gifts/received?page=0&size=10"
        );
        setReceivedGifts(receivedResponse.data.content || []);
      } catch (error) {
        console.error("Failed to fetch received gifts:", error);
      }

      // Fetch sent gifts
      try {
        const sentResponse = await apiClient.get(
          "/monetization/gifts/sent?page=0&size=10"
        );
        setSentGifts(sentResponse.data.content || []);
      } catch (error) {
        console.error("Failed to fetch sent gifts:", error);
      }

      // Fetch earned money from reader purchases
      try {
        const earnedResponse = await apiClient.get(
          "/monetization/earnings?page=0&size=20"
        );
        setEarnedMoney(earnedResponse.data.content || []);
      } catch (error) {
        console.error("Failed to fetch earned money:", error);
      }

      // Fetch purchase history (user's own purchases)
      try {
        const purchaseResponse = await apiClient.get(
          "/monetization/purchases?page=0&size=20"
        );
        setPurchaseHistory(purchaseResponse.data.content || []);
      } catch (error) {
        console.error("Failed to fetch purchase history:", error);
      }

      // Fetch refunds earned (refunds received by user as reader)
      try {
        console.log("Fetching refunds earned...");
        const refundsEarnedResponse = await apiClient.get(
          "/monetization/refunds/earned?page=0&size=20"
        );
        console.log("Refunds earned response:", refundsEarnedResponse.data);
        setRefundsEarned(refundsEarnedResponse.data.content || []);
      } catch (error) {
        console.error("Failed to fetch refunds earned:", error);
      }

      // Fetch refunds paid (refunds given by user as writer)
      try {
        console.log("Fetching refunds paid...");
        const refundsPaidResponse = await apiClient.get(
          "/monetization/refunds/paid?page=0&size=20"
        );
        console.log("Refunds paid response:", refundsPaidResponse.data);
        setRefundsPaid(refundsPaidResponse.data.content || []);
      } catch (error) {
        console.error("Failed to fetch refunds paid:", error);
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

  // Helper function to check if iconUrl is an emoji
  const isEmoji = (str: string) => {
    // Check if string contains emoji characters or is a single character emoji
    const emojiRegex =
      /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
    return emojiRegex.test(str) || str.length <= 4; // Most emojis are 1-4 characters
  };

  // Helper component to render gift icon
  const GiftIcon = ({
    iconUrl,
    name,
    className = "",
  }: {
    iconUrl?: string;
    name?: string;
    className?: string;
  }) => {
    if (!iconUrl) {
      return (
        <div
          className={`w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ${className}`}
        >
          <Gift className="h-6 w-6 text-white" />
        </div>
      );
    }

    if (isEmoji(iconUrl)) {
      return (
        <div
          className={`w-full h-full flex items-center justify-center text-2xl ${className}`}
        >
          {iconUrl}
        </div>
      );
    }

    return (
      <img
        src={iconUrl}
        alt={name || "Gift"}
        className={`w-full h-full object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Please log in to view your monetization dashboard and refund data.
            </p>
            <Button
              onClick={() => (window.location.href = "/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Coin Balance */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monetization Dashboard
          </h1>
          <p className="text-gray-600">
            Track your earnings and manage your coins
          </p>
        </div>

        {/* Compact Coin Balance Card */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 w-64 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <Coins className="h-4 w-4 text-yellow-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-yellow-700">
                  Coin Balance
                </p>
                <p className="text-base font-bold text-yellow-900">
                  {formatCurrency(coinBalance)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  sseConnected ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <Button
                onClick={() => (window.location.href = "/buy-coins")}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs h-6 rounded-md font-medium"
              >
                + Buy
              </Button>
            </div>
          </div>
          {coinBalance !== user?.coinBalance && (
            <div className="mt-1">
              <span className="text-xs text-yellow-600 animate-pulse font-medium">
                Updating...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex flex-wrap gap-1">
          {[
            { key: "overview", label: "Overview", icon: TrendingUp },
            { key: "earned", label: "Earned Money", icon: DollarSign },
            { key: "received", label: "Gifts Received", icon: Gift },
            { key: "sent", label: "Gifts Sent", icon: Gift },
            { key: "purchases", label: "Purchases", icon: ShoppingBag },
            { key: "refunds-earned", label: "Refunds Earned", icon: RotateCcw },
            { key: "refunds-paid", label: "Refunds Paid", icon: RotateCcw },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2`}
              style={{
                backgroundColor: activeTab === key ? "#18243c" : "transparent",
                color: activeTab === key ? "#ffffff" : "#6b7280",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== key) {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== key) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-green-50">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-600 truncate">
                    Total Earnings
                  </h3>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {formatCurrency(analytics.totalEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-600 truncate">
                    Chapter Sales
                  </h3>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {formatCurrency(analytics.totalChapterSales)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-purple-50">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-600 truncate">
                    Gift Earnings
                  </h3>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {formatCurrency(analytics.totalGiftEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-orange-50">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-600 truncate">
                    This Month
                  </h3>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {formatCurrency(analytics.currentMonthEarnings)}
                  </p>
                </div>
              </div>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Earned
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      earnedMoney.reduce(
                        (sum, earning) => sum + earning.netEarnings,
                        0
                      )
                    )}{" "}
                    Coins
                  </p>
                  <p className="text-xs text-gray-500">
                    Net after platform fees
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Purchases
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {earnedMoney.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Chapters & Stories sold
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Unique Readers
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {new Set(earnedMoney.map((e) => e.readerUsername)).size}
                  </p>
                  <p className="text-xs text-gray-500">Different buyers</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-lg font-bold text-orange-600">
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
                  </p>
                  <p className="text-xs text-gray-500">
                    Current month earnings
                  </p>
                </div>
              </div>
            </div>
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
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-purple-200">
                        <GiftIcon
                          iconUrl={gift.gift?.iconUrl}
                          name={gift.gift?.name}
                          className=""
                        />
                        {gift.gift?.iconUrl && !isEmoji(gift.gift.iconUrl) && (
                          <div
                            className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center"
                            style={{ display: "none" }}
                          >
                            <Gift className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {gift.gift?.name || "Unknown Gift"}
                          </h4>
                          {gift.gift?.coinCost && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                              {gift.gift.coinCost} coins
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          From:{" "}
                          <span className="font-medium">
                            {gift.sender.displayName || gift.sender.username}
                          </span>
                        </p>
                        {gift.message && (
                          <p className="text-sm text-gray-500 italic mb-1">
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
                        +{formatCurrency(gift.totalCoins)} Coins
                      </div>
                      <div className="text-xs text-gray-500">
                        Gift Value: {formatCurrency(gift.totalCoins)} Coins
                      </div>
                      <div className="text-xs text-green-600">
                        No platform fee
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
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-blue-200">
                        <GiftIcon
                          iconUrl={gift.gift?.iconUrl}
                          name={gift.gift?.name}
                          className=""
                        />
                        {gift.gift?.iconUrl && !isEmoji(gift.gift.iconUrl) && (
                          <div
                            className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"
                            style={{ display: "none" }}
                          >
                            <Gift className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {gift.gift?.name || "Unknown Gift"}
                          </h4>
                          {gift.gift?.coinCost && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              {gift.gift.coinCost} coins
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          To:{" "}
                          <span className="font-medium">
                            {gift.recipient.displayName ||
                              gift.recipient.username}
                          </span>
                        </p>
                        {gift.message && (
                          <p className="text-sm text-gray-500 italic mb-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Coins className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Spent
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      purchaseHistory.reduce(
                        (sum, purchase) => sum + purchase.amount,
                        0
                      )
                    )}{" "}
                    Coins
                  </p>
                  <p className="text-xs text-gray-500">All-time spending</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Purchases
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {purchaseHistory.length}
                  </p>
                  <p className="text-xs text-gray-500">Chapters & Books</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Books Owned
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {
                      purchaseHistory.filter((p) => p.purchaseType === "book")
                        .length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Complete books</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Chapters Owned
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {
                      purchaseHistory.filter(
                        (p) => p.purchaseType === "chapter"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Individual chapters</p>
                </div>
              </div>
            </div>
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
                              : `Chapter ${purchase.chapterNumber || "N/A"}: ${
                                  purchase.chapterTitle || "Untitled"
                                }`}
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
                              {purchase.status
                                ? purchase.status.charAt(0).toUpperCase() +
                                  purchase.status.slice(1)
                                : "Unknown"}
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

      {/* Refunds Earned Tab */}
      {activeTab === "refunds-earned" && (
        <div className="space-y-6">
          {/* Refunds Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds Received
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      refundsEarned.reduce(
                        (sum, refund) => sum + refund.refundAmount,
                        0
                      )
                    )}{" "}
                    Coins
                  </p>
                  <p className="text-xs text-gray-500">Money returned to you</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {refundsEarned.length}
                  </p>
                  <p className="text-xs text-gray-500">Refund transactions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Book Refunds
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {
                      refundsEarned.filter((r) => r.refundType === "book")
                        .length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Complete book refunds</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Chapter Refunds
                  </p>
                  <p className="text-lg font-bold text-orange-600">
                    {
                      refundsEarned.filter((r) => r.refundType === "chapter")
                        .length
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    Individual chapter refunds
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Refunds Earned History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Refunds Received History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {refundsEarned.length === 0 ? (
                  <div className="text-center py-8">
                    <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No refunds received yet
                    </p>
                    <p className="text-gray-400 text-sm">
                      Refunds from authors will appear here
                    </p>
                  </div>
                ) : (
                  refundsEarned.slice(0, 15).map((refund) => (
                    <div
                      key={refund.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            refund.refundType === "book"
                              ? "bg-gradient-to-r from-green-500 to-blue-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-500"
                          }`}
                        >
                          {refund.refundType === "book" ? (
                            <BookOpen className="h-5 w-5 text-white" />
                          ) : (
                            <Star className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {refund.refundType === "book"
                              ? refund.storyTitle
                              : `Chapter ${refund.chapterNumber || "N/A"}: ${
                                  refund.chapterTitle || "Untitled"
                                }`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {refund.refundType === "book"
                              ? `Complete Book: ${refund.storyTitle}`
                              : `${refund.storyTitle}`}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Reason: {refund.refundReason}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                refund.refundType === "book"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {refund.refundType === "book"
                                ? "Complete Book"
                                : "Chapter"}
                            </Badge>
                            <Badge
                              variant={
                                refund.status === "completed"
                                  ? "default"
                                  : refund.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {refund.status
                                ? refund.status.charAt(0).toUpperCase() +
                                  refund.status.slice(1)
                                : "Unknown"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(refund.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          +{formatCurrency(refund.refundAmount)} Coins
                        </div>
                        <div className="text-xs text-gray-500">
                          Original: {formatCurrency(refund.originalAmount)}{" "}
                          Coins
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {refundsEarned.length > 15 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Load More Refunds
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refunds Paid Tab */}
      {activeTab === "refunds-paid" && (
        <div className="space-y-6">
          {/* Refunds Paid Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds Paid
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      refundsPaid.reduce(
                        (sum, refund) => sum + refund.refundAmount,
                        0
                      )
                    )}{" "}
                    Coins
                  </p>
                  <p className="text-xs text-gray-500">
                    Money refunded to readers
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {refundsPaid.length}
                  </p>
                  <p className="text-xs text-gray-500">Refund transactions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Unique Readers
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {new Set(refundsPaid.map((r) => r.readerUsername)).size}
                  </p>
                  <p className="text-xs text-gray-500">Readers refunded</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(
                      refundsPaid
                        .filter(
                          (r) =>
                            new Date(r.createdAt).getMonth() ===
                            new Date().getMonth()
                        )
                        .reduce((sum, refund) => sum + refund.refundAmount, 0)
                    )}{" "}
                    Coins
                  </p>
                  <p className="text-xs text-gray-500">Current month refunds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Refunds Paid History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Refunds Paid History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {refundsPaid.length === 0 ? (
                  <div className="text-center py-8">
                    <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No refunds paid yet
                    </p>
                    <p className="text-gray-400 text-sm">
                      Refunds you've given to readers will appear here
                    </p>
                  </div>
                ) : (
                  refundsPaid.slice(0, 15).map((refund) => (
                    <div
                      key={refund.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            refund.refundType === "book"
                              ? "bg-gradient-to-r from-red-500 to-pink-500"
                              : "bg-gradient-to-r from-orange-500 to-red-500"
                          }`}
                        >
                          {refund.refundType === "book" ? (
                            <BookOpen className="h-5 w-5 text-white" />
                          ) : (
                            <Star className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {refund.refundType === "book"
                              ? refund.storyTitle
                              : `Chapter ${refund.chapterNumber || "N/A"}: ${
                                  refund.chapterTitle || "Untitled"
                                }`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {refund.refundType === "book"
                              ? `Complete Book`
                              : `${refund.storyTitle}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            User ID: {refund.userId}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Reason: {refund.refundReason}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                refund.refundType === "book"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {refund.refundType === "book"
                                ? "Complete Book"
                                : "Chapter"}
                            </Badge>
                            <Badge
                              variant={
                                refund.status === "completed"
                                  ? "default"
                                  : refund.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {refund.status
                                ? refund.status.charAt(0).toUpperCase() +
                                  refund.status.slice(1)
                                : "Unknown"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(refund.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          -{formatCurrency(refund.refundAmount)} Coins
                        </div>
                        <div className="text-xs text-gray-500">
                          Original: {formatCurrency(refund.originalAmount)}{" "}
                          Coins
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {refundsPaid.length > 15 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Load More Refunds
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Refunded Stories */}
          {refundsPaid.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Most Refunded Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    refundsPaid.reduce((acc, refund) => {
                      if (!acc[refund.storyTitle]) {
                        acc[refund.storyTitle] = {
                          totalRefunds: 0,
                          refundCount: 0,
                        };
                      }
                      acc[refund.storyTitle].totalRefunds +=
                        refund.refundAmount;
                      acc[refund.storyTitle].refundCount += 1;
                      return acc;
                    }, {} as Record<string, { totalRefunds: number; refundCount: number }>)
                  )
                    .sort(([, a], [, b]) => b.totalRefunds - a.totalRefunds)
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
                                ? "bg-red-500"
                                : index === 1
                                ? "bg-orange-500"
                                : index === 2
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {storyTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {data.refundCount} refunds
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            {formatCurrency(data.totalRefunds)} Coins
                          </div>
                          <div className="text-xs text-gray-500">
                            Avg:{" "}
                            {formatCurrency(
                              data.totalRefunds / data.refundCount
                            )}{" "}
                            per refund
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
