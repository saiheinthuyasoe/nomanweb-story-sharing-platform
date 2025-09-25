import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { User, AuthResponse } from '@/types/user';
import { Story, Category } from '@/types/story';

// Query Keys
export const queryKeys = {
  user: ['user'] as const,
  profile: ['user', 'profile'] as const,
  stories: ['stories'] as const,
  story: (id: string) => ['stories', id] as const,
  categories: ['categories'] as const,
  userStories: (userId: string) => ['stories', 'user', userId] as const,
} as const;

// Auth Hooks
export function useProfile(options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: authApi.getProfile,
    ...options,
  });
}

export function useUpdateProfile(options?: UseMutationOptions<User, Error, Partial<User>>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    ...options,
  });
}

export function useChangePassword(options?: UseMutationOptions<void, Error, { currentPassword: string; newPassword: string }>) {
  return useMutation({
    mutationFn: authApi.changePassword,
    ...options,
  });
}

export function useLogin(options?: UseMutationOptions<AuthResponse, Error, { email: string; password: string }>) {
  return useMutation({
    mutationFn: authApi.login,
    ...options,
  });
}

export function useRegister(options?: UseMutationOptions<AuthResponse, Error, { email: string; username: string; password: string; displayName?: string }>) {
  return useMutation({
    mutationFn: authApi.register,
    ...options,
  });
}

export function useForgotPassword(options?: UseMutationOptions<void, Error, string>) {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    ...options,
  });
}

export function useResetPassword(options?: UseMutationOptions<void, Error, { token: string; password: string }>) {
  return useMutation({
    mutationFn: authApi.resetPassword,
    ...options,
  });
}

// Story Hooks (for future implementation)
export function useStories(options?: Omit<UseQueryOptions<Story[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.stories,
    queryFn: async () => {
      // TODO: Implement story API
      return [] as Story[];
    },
    enabled: false, // Disable until API is implemented
    ...options,
  });
}

export function useStory(id: string, options?: Omit<UseQueryOptions<Story>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.story(id),
    queryFn: async () => {
      // TODO: Implement story API
      return {} as Story;
    },
    enabled: false, // Disable until API is implemented
    ...options,
  });
}

export function useCategories(options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      // TODO: Implement category API
      return [] as Category[];
    },
    enabled: false, // Disable until API is implemented
    ...options,
  });
}

// Utility hook for invalidating queries
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
    invalidateStories: () => queryClient.invalidateQueries({ queryKey: queryKeys.stories }),
    invalidateStory: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.story(id) }),
    invalidateCategories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
} 