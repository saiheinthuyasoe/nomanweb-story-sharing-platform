'use client';

import { useCoinBalanceRealtime } from '@/hooks/useCoinBalanceRealtime';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  // Initialize real-time connections
  useCoinBalanceRealtime();

  return <>{children}</>;
} 