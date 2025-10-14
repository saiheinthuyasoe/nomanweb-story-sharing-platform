"use client";

import dynamic from 'next/dynamic';

// Loading component for dashboard pages
const DashboardLoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Loading Dashboard
      </h2>
      <p className="text-gray-600">
        Please wait while we load your dashboard...
      </p>
    </div>
  </div>
);

// Lazy load dashboard components
export const LazyDashboardMain = dynamic(
  () => import('@/app/dashboard/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

export const LazyDashboardStories = dynamic(
  () => import('@/app/dashboard/stories/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

export const LazyDashboardMyStories = dynamic(
  () => import('@/app/dashboard/my-stories/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

export const LazyDashboardIncome = dynamic(
  () => import('@/app/dashboard/income/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

export const LazyDashboardGifts = dynamic(
  () => import('@/app/dashboard/gifts/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

export const LazyDashboardNotifications = dynamic(
  () => import('@/app/dashboard/notifications/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

export const LazyDashboardMonetization = dynamic(
  () => import('@/app/dashboard/monetization/page'),
  {
    loading: () => <DashboardLoadingSpinner />,
    ssr: false
  }
);

// Lazy load monetization components
export const LazyBookPurchaseModal = dynamic(
  () => import('@/components/monetization/BookPurchaseModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyChapterPurchaseModal = dynamic(
  () => import('@/components/monetization/ChapterPurchaseModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyChapterPurchaseModalNew = dynamic(
  () => import('@/components/monetization/ChapterPurchaseModalNew'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyEnhancedGiftModal = dynamic(
  () => import('@/components/monetization/EnhancedGiftModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyGiftModal = dynamic(
  () => import('@/components/monetization/GiftModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

// Dashboard route configuration with lazy loading
export const dashboardRouteConfig = {
  '/dashboard': LazyDashboardMain,
  '/dashboard/stories': LazyDashboardStories,
  '/dashboard/my-stories': LazyDashboardMyStories,
  '/dashboard/income': LazyDashboardIncome,
  '/dashboard/gifts': LazyDashboardGifts,
  '/dashboard/notifications': LazyDashboardNotifications,
  '/dashboard/monetization': LazyDashboardMonetization,
} as const;

export type DashboardRoute = keyof typeof dashboardRouteConfig;