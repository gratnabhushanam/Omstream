// Notification Service for Daily Sloka and other features

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  return Notification.permission;
};

export const sendNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: '/gita-icon.png',
      badge: '/gita-badge.png',
      tag: 'gita-wisdom',
      ...options,
    });

    // Auto-close notification after 10 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const scheduleDailyNotification = (hour = 8, minute = 0, sloka = null) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const calculateNextNotification = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime.getTime() - now.getTime();
  };

  let timeoutId = null;
  let isCancelled = false;

  const scheduleNotification = () => {
    if (isCancelled) {
      return;
    }

    const timeUntilNext = calculateNextNotification();
    
    timeoutId = setTimeout(() => {
      if (isCancelled) {
        return;
      }

      const title = 'Daily Sloka from Gita Wisdom';
      const body = sloka
        ? sloka.sanskrit
        : 'Your daily verse awaits. Visit Gita Wisdom to receive today\'s guidance.';

      sendNotification(title, {
        body: body,
        tag: 'daily-sloka',
        requireInteraction: true,
      });

      // Schedule next notification (recursively)
      scheduleNotification();
    }, timeUntilNext);
  };

  // Start scheduling
  scheduleNotification();

  // Return function to cancel scheduling
  return () => {
    isCancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    console.log('Notification scheduling stopped');
  };
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

export const enableBackgroundSync = async () => {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync is not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-daily-sloka');
    console.log('Background sync registered');
    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Add Web Push subscription
export const subscribeUserToPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return false;
  }
  
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe using the public VAPID key
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BDMaeaDKARXaDrXdmeBkdcq4880r8vx3QTqj114DTOBqgddw9xOJC3gL73-fzce95JLRo__t2GYNQrl1ctK1LIk';
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
    }

    // Send subscription to backend
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return false;
  }
  return false;
};
