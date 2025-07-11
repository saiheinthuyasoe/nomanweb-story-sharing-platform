'use client';

import { useCoinBalanceRealtime } from '@/hooks/useCoinBalanceRealtime';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  console.log('🚀 RealtimeProvider rendering');
  
  try {
    // Initialize real-time connections
    useCoinBalanceRealtime();
    console.log('✅ useCoinBalanceRealtime hook called successfully');
  } catch (error) {
    console.error('❌ Error in RealtimeProvider:', error);
  }

  return <>{children}</>;
} 