import { useState, useEffect, useRef } from 'react';
import { getNotifications, markAllNotificationsRead } from '../api/notificationApi';

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [immersiveNotification, setImmersiveNotification] = useState(null);
  const previousUnreadCountRef = useRef(0);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const data = await getNotifications();
          const fetchedNotifications = Array.isArray(data) ? data : [];
          setNotifications(fetchedNotifications);
          
          const currentUnread = fetchedNotifications.filter(n => !n.isRead && !n.read).length;
          
          // Check if new notifications arrived that deserve an immersive alert
          if (currentUnread > previousUnreadCountRef.current) {
            const newest = fetchedNotifications[0];
            if (newest && !newest.read && (newest.type === 'promo' || newest.type === 'content' || newest.type === 'system')) {
              setImmersiveNotification(newest);
            }
          }
          
          previousUnreadCountRef.current = currentUnread;
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      };
      
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  const handleMarkAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true, read: true })));
      previousUnreadCountRef.current = 0;
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return {
    notifications,
    showNotifications,
    setShowNotifications,
    unreadCount,
    handleMarkAsRead,
    immersiveNotification,
    setImmersiveNotification,
  };
};

