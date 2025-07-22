import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { toast } from 'react-hot-toast';

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.followUser,
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      
      toast.success('User followed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to follow user');
    }
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.unfollowUser,
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      
      toast.success('User unfollowed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unfollow user');
    }
  });
}; 