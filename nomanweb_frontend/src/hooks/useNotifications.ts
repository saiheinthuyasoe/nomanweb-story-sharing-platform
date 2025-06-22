import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { notificationsApi, NotificationResponse, UnreadCountResponse } from '@/lib/api/notifications';
import { Notification, NotificationStats } from '@/types/user';

// Get notifications
export const useNotifications = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => notificationsApi.getNotifications(page, size),
  });
};

// Get unread notifications
export const useUnreadNotifications = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['notifications', 'unread', page, size],
    queryFn: () => notificationsApi.getUnreadNotifications(page, size),
  });
};

// Get unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Get notification stats
export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => notificationsApi.getNotificationStats(),
  });
};

// Mark notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: (data, notificationId) => {
      // Update the notifications in cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Update unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old: UnreadCountResponse | undefined) => {
        if (old) {
          return { unreadCount: Math.max(0, old.unreadCount - 1) };
        }
        return old;
      });
      
      toast.success('Notification marked as read');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark notification as read');
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      // Update all notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Update unread count to 0
      queryClient.setQueryData(['notifications', 'unread-count'], { unreadCount: 0 });
      
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark all notifications as read');
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.deleteNotification(notificationId),
    onSuccess: (data, notificationId) => {
      // Remove from all notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete notification');
    },
  });
};

// Send system notification (admin/testing)
export const useSendSystemNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, message }: { title: string; message: string }) => 
      notificationsApi.sendSystemNotification(title, message),
    onSuccess: () => {
      // Invalidate notifications to show the new one
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast.success('System notification sent');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send system notification');
    },
  });
}; 