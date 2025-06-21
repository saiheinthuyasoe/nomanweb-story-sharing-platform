import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi, UserStats, FollowerUser } from '@/lib/api/users';
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

export function useFollowers(userId: string, page = 0) {
  return useQuery({
    queryKey: ['followers', userId, page],
    queryFn: () => usersApi.getFollowers(userId, page),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useFollowing(userId: string, page = 0) {
  return useQuery({
    queryKey: ['following', userId, page],
    queryFn: () => usersApi.getFollowing(userId, page),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useIsFollowing(userId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => usersApi.isFollowing(userId),
    enabled: !!user && !!userId && user.id !== userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUserProfile() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  
  const [followersPage, setFollowersPage] = useState(0);
  const [followingPage, setFollowingPage] = useState(0);
  
  const { 
    data: followers, 
    isLoading: followersLoading 
  } = useFollowers(user?.id || '', followersPage);
  
  const { 
    data: following, 
    isLoading: followingLoading 
  } = useFollowing(user?.id || '', followingPage);

  return {
    user,
    stats,
    followers,
    following,
    isLoading: statsLoading || followersLoading || followingLoading,
    error: statsError,
    followersPage,
    followingPage,
    setFollowersPage,
    setFollowingPage,
  };
} 