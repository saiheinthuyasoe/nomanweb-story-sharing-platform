import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';

export function useUserStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['userStats', targetUserId],
    queryFn: () => {
      if (!targetUserId) throw new Error('No user ID provided');
      return userId ? usersApi.getUserStats(userId) : usersApi.getMyStats();
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}