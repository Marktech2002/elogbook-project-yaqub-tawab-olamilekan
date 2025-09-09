import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import notificationService, { Notification } from '../lib/services/notification.service';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setError(null);
      const data = await notificationService.getNotifications(profile.id);
      setNotifications(data);
      
      // Get unread count
      const count = await notificationService.getUnreadCount(profile.id);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    }
  }, [profile?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, updated_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Refresh unread count
      if (profile?.id) {
        const count = await notificationService.getUnreadCount(profile.id);
        setUnreadCount(count);
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
    }
  }, [profile?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Refresh unread count
      if (profile?.id) {
        const count = await notificationService.getUnreadCount(profile.id);
        setUnreadCount(count);
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
    }
  }, [profile?.id]);

  // Refresh all notifications
  const refreshNotifications = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      await fetchNotifications();
    } catch (err) {
      console.error('Error refreshing notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, fetchNotifications]);

  // Initial data fetch
  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
    }
  }, [profile?.id, fetchNotifications]);

  // Set up real-time updates (optional - can be added later)
  useEffect(() => {
    if (!profile?.id) return;

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [profile?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    refreshNotifications
  };
} 