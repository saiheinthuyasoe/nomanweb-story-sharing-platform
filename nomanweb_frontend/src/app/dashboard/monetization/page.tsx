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
  Calendar,
  Star,
  DollarSign,
  BookOpen,
  Users,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { useMonetizationData, useInvalidateMonetization } from "@/hooks/useMonetization";

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
  const invalidateMonetization = useInvalidateMonetization();
  
  // Use React Query hooks for data fetching with caching
  const {
    analytics,
    coinBalance,
    receivedGifts,
    sentGifts,
    earnedMoney,
    purchaseHistory,
    refundsEarned,
    refundsPaid,
    isLoading,
    isError,
    error,
    loadingStates,
    refetch
  } = useMonetizationData();

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "earned"
    | "received"
    | "sent"
    | "purchases"
    | "refunds-earned"
    | "refunds-paid"
  >("overview");
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState(false);

  // Monitor coin balance changes and show notifications
  useEffect(() => {
    if (previousBalance > 0 && coinBalance !== undefined && coinBalance !== previousBalance) {
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
    if (coinBalance !== undefined) {
      setPreviousBalance(coinBalance);
    }
  }, [coinBalance, previousBalance]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Failed to load monetization data. Please try again.
            </p>
            <Button
              onClick={() => {
                refetch.revenue();
                refetch.balance();
                refetch.receivedGifts();
                refetch.sentGifts();
                refetch.earnings();
                refetch.purchaseHistory();
                refetch.refundsEarned();
                refetch.refundsPaid();
              }}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
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
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header with Coin Balance */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-8 mb-6 sm:mb-8">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Monetization Dashboard
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Track your earnings and manage your coins
          </p>
        </div>

        {/* Compact Coin Balance Card */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 sm:p-4 w-full sm:w-80 lg:w-64 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-700">
                  Coin Balance
                </p>
                <p className="text-base sm:text-lg font-bold text-yellow-900">
                  {formatCurrency(coinBalance)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                onClick={() => (window.location.href = "/buy-coins")}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm h-6 sm:h-7 rounded-md font-medium"
              >
                + Buy
              </Button>
            </div>
          </div>
          {coinBalance !== user?.coinBalance && (
            <div className="mt-1 sm:mt-2">
              <span className="text-xs sm:text-sm text-yellow-600 animate-pulse font-medium">
                Updating...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-gray-100 p-1 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1">
            {[
              { key: "overview", label: "Overview", icon: TrendingUp },
              { key: "earned", label: "Earned Money", icon: DollarSign },
              { key: "received", label: "Gifts Received", icon: Gift },
              { key: "sent", label: "Gifts Sent", icon: Gift },
              { key: "purchases", label: "Purchases" },
              { key: "refunds-earned", label: "Refunds Earned" },
              { key: "refunds-paid", label: "Refunds Paid" },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center lg:justify-start space-x-1 sm:space-x-2 min-h-[2.5rem] sm:min-h-[2.75rem]`}
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
                {Icon && <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />}
                <span className="hidden sm:inline lg:inline truncate">{label}</span>
                <span className="sm:hidden text-center leading-tight">
                  {key === "overview" ? "Overview" :
                   key === "earned" ? "Earned" :
                   key === "received" ? "Received" :
                   key === "sent" ? "Sent" :
                   key === "purchases" ? "Purchases" :
                   key === "refunds-earned" ? "R.Earned" :
                   "R.Paid"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-4 sm:space-y-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Total Earnings
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(analytics.totalEarnings)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Chapter Sales
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(analytics.totalChapterSales)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Gift Earnings
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(analytics.totalGiftEarnings)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  This Month
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(analytics.currentMonthEarnings)}
                </p>
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
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Earned
                </p>
                <p className="text-lg font-bold text-gray-900">
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

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Purchases
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {earnedMoney.length}
                </p>
                <p className="text-xs text-gray-500">
                  Chapters & Stories sold
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Unique Readers
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {new Set(earnedMoney.map((e) => e.readerUsername)).size}
                </p>
                <p className="text-xs text-gray-500">Different buyers</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  This Month
                </p>
                <p className="text-lg font-bold text-gray-900">
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

          {/* Earnings History */}
          <Card>
            <CardHeader>
              <CardTitle>
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
                        <div className="font-bold text-gray-900">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Spent
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Purchases
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {purchaseHistory.length}
                  </p>
                  <p className="text-xs text-gray-500">Chapters & Books</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Books Owned
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Chapters Owned
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
              <CardTitle>
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseHistory.length === 0 ? (
                  <div className="text-center py-8">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds Received
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {refundsEarned.length}
                  </p>
                  <p className="text-xs text-gray-500">Refund transactions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Book Refunds
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Chapter Refunds
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
              <CardTitle>
                Refunds Received History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {refundsEarned.length === 0 ? (
                  <div className="text-center py-8">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds Paid
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Refunds
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {refundsPaid.length}
                  </p>
                  <p className="text-xs text-gray-500">Refund transactions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Unique Readers
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Set(refundsPaid.map((r) => r.readerUsername)).size}
                  </p>
                  <p className="text-xs text-gray-500">Readers refunded</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-lg font-bold text-gray-900">
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
                Refunds Paid History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {refundsPaid.length === 0 ? (
                  <div className="text-center py-8">
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
                        <div className="font-bold text-gray-900">
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
