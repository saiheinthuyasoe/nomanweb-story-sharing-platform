"use client";

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for admin pages
const AdminLoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Loading Admin Panel
      </h2>
      <p className="text-gray-600">
        Please wait while we load the admin interface...
      </p>
    </div>
  </div>
);

// Lazy load admin dashboard components
export const LazyAdminDashboard = dynamic(
  () => import('@/app/admin/dashboard/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminAnalytics = dynamic(
  () => import('@/app/admin/analytics/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminUsers = dynamic(
  () => import('@/app/admin/users/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminModeration = dynamic(
  () => import('@/app/admin/moderation/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminCoins = dynamic(
  () => import('@/app/admin/coins/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminWithdrawals = dynamic(
  () => import('@/app/admin/withdrawals/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminHomepage = dynamic(
  () => import('@/app/admin/homepage/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminInsights = dynamic(
  () => import('@/app/admin/insights/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminMonetization = dynamic(
  () => import('@/app/admin/monetization/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminMigration = dynamic(
  () => import('@/app/admin/migration/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

export const LazyAdminTestNotifications = dynamic(
  () => import('@/app/admin/test-notifications/page'),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
);

// Lazy load admin component utilities
export const LazyBookInsightsDashboard = dynamic(
  () => import('@/components/admin/BookInsightsDashboard'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyAutoSuggestPanel = dynamic(
  () => import('@/components/admin/AutoSuggestPanel'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyBookSuggestionModal = dynamic(
  () => import('@/components/admin/BookSuggestionModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyBulkExpirationModal = dynamic(
  () => import('@/components/admin/BulkExpirationModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyEditExpirationModal = dynamic(
  () => import('@/components/admin/EditExpirationModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyExpirationAlerts = dynamic(
  () => import('@/components/admin/ExpirationAlerts'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-24 w-full"></div>
    ),
    ssr: false
  }
);

// Type definitions for lazy components
export type LazyAdminComponentType = ComponentType<any>;

// Admin route configuration with lazy loading
export const adminRouteConfig = {
  '/admin/dashboard': LazyAdminDashboard,
  '/admin/analytics': LazyAdminAnalytics,
  '/admin/users': LazyAdminUsers,
  '/admin/moderation': LazyAdminModeration,
  '/admin/coins': LazyAdminCoins,
  '/admin/withdrawals': LazyAdminWithdrawals,
  '/admin/homepage': LazyAdminHomepage,
  '/admin/insights': LazyAdminInsights,
  '/admin/monetization': LazyAdminMonetization,
  '/admin/migration': LazyAdminMigration,
  '/admin/test-notifications': LazyAdminTestNotifications,
} as const;

export type AdminRoute = keyof typeof adminRouteConfig;