import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';

export const useUserSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => usersApi.searchUsers(query),
    enabled: enabled && query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}; 