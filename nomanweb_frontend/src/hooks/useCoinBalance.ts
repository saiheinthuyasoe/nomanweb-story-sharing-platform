import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { monetizationApi } from '@/lib/api/monetization';

export const useCoinBalance = (enabled: boolean = true) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['coin-balance'],
    queryFn: () => monetizationApi.getCoinBalance(),
    enabled: enabled && !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}; 