import { apiClient } from './client';
import { Notification, NotificationStats } from '@/types/user';

export interface NotificationResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const notificationsApi = {
  // Get user notifications
  async getNotifications(page: number = 0, size: number = 20): Promise<NotificationResponse> {
    const response = await apiClient.get('/notifications', {
      params: { page, size }
    });
    return response.data;
  },

  // Get unread notifications
  async getUnreadNotifications(page: number = 0, size: number = 20): Promise<NotificationResponse> {
    const response = await apiClient.get('/notifications/unread', {
      params: { page, size }
    });
    return response.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await apiClient.post('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  // Bulk delete notifications
  async bulkDeleteNotifications(notificationIds: string[]): Promise<{ message: string }> {
    const response = await apiClient.delete('/notifications/bulk', {
      data: { notificationIds }
    });
    return response.data;
  },

  // Get notification statistics
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await apiClient.get('/notifications/stats');
    return response.data;
  },

  // Send system notification (admin/testing)
  async sendSystemNotification(title: string, message: string): Promise<{ message: string }> {
    const response = await apiClient.post('/notifications/system', {
      title,
      message
    });
    return response.data;
  }
};