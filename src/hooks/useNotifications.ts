import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../utils/NotificationService';
import type { AppNotification } from '../types';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(() => {
    if (userId) {
      const data = NotificationService.getNotifications(userId);
      setNotifications(data);
    } else {
      setNotifications([]);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
    
    // Optional: listen to storage events to update notifications across tabs
    const handleStorage = (e: StorageEvent) => {
      if (userId && e.key === NotificationService.getStorageKey(userId)) {
        loadNotifications();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadNotifications, userId]);

  const markAsRead = useCallback((id: string) => {
    if (!userId) return;
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      NotificationService.saveNotifications(userId, next);
      return next;
    });
  }, [userId]);

  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, is_read: true }));
      NotificationService.saveNotifications(userId, next);
      return next;
    });
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications
  };
}

