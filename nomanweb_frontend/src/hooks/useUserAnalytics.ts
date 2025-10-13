import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';

export function useUserAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userAnalytics', user?.id],
    queryFn: () => usersApi.getMyAnalytics(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}