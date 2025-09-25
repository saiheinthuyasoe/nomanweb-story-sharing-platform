import { useQuery } from "@tanstack/react-query";
import { usersApi, UserProfile } from "@/lib/api/users";

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
