import { prisma } from './prisma';
import { customFetch } from './api';
import { encrypt, decrypt } from './crypto';
import { sendNotification } from './web-push';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Registers a push subscription for a user
 */
export async function registerPushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  try {
    // Encrypt and store the subscription in the database
    const encryptedSubscription = encrypt(JSON.stringify(subscription));
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: encryptedSubscription,
        pushEnabled: true,
      },
    });
    
    console.log('Push subscription registered for user:', userId);
  } catch (error) {
    console.error('Error registering push subscription:', error);
    throw new Error('Failed to register push subscription');
  }
}

/**
 * Unregisters push notifications for a user
 */
export async function unregisterPushSubscription(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: null,
        pushEnabled: false,
      },
    });
    
    console.log('Push subscription unregistered for user:', userId);
  } catch (error) {
    console.error('Error unregistering push subscription:', error);
    throw new Error('Failed to unregister push subscription');
  }
}

/**
 * Sends a push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true, pushEnabled: true },
    });
    
    if (!user || !user.pushEnabled || !user.pushSubscription) {
      console.log('User has no push subscription or push disabled:', userId);
      return false;
    }
    
    const decryptedSubscription = decrypt(user.pushSubscription);
    const subscription: PushSubscription = JSON.parse(decryptedSubscription);
    
    await sendNotification(subscription, payload);
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Sends push notifications to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  const promises = userIds.map(async (userId) => {
    const result = await sendPushNotificationToUser(userId, payload);
    if (result) {
      success++;
    } else {
      failed++;
    }
  });
  
  await Promise.all(promises);
  
  console.log(`Push notifications sent: ${success} success, ${failed} failed`);
  return { success, failed };
}

/**
 * Gets push subscription status for a user
 */
export async function getPushSubscriptionStatus(userId: string): Promise<{
  enabled: boolean;
  hasSubscription: boolean;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true, pushEnabled: true },
    });
    
    return {
      enabled: user?.pushEnabled || false,
      hasSubscription: !!user?.pushSubscription,
    };
  } catch (error) {
    console.error('Error getting push subscription status:', error);
    return { enabled: false, hasSubscription: false };
  }
}

/**
 * Client-side utility to request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Client-side utility to subscribe to push notifications
 */
export const subscribeToPushNotifications = async (
  userId: string
): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }
    
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    
    // In a real implementation, you would use your VAPID public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });
    
    // Send subscription to server
    const response = await customFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });
    
    if (response.ok) {
      console.log('Successfully subscribed to push notifications');
      return true;
    } else {
      console.error('Failed to subscribe to push notifications');
      return false;
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

/**
 * Client-side utility to unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async (
  userId: string
): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    // Notify server
    const response = await customFetch('/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    
    if (response.ok) {
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } else {
      console.error('Failed to unsubscribe from push notifications');
      return false;
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

/**
 * Show a local notification (for testing or immediate feedback)
 */
export const showLocalNotification = (
  title: string,
  options?: NotificationOptions
): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }
}; 