import webpush from 'web-push';
import { env } from './env';

if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
  console.error('You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
} else {
    webpush.setVapidDetails(
        'mailto:admin@sore-app.com', // You should use a real email address
        env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
    );
}

export const sendNotification = async (subscription: webpush.PushSubscription, payload: any) => {
    try {
        const stringifiedPayload = JSON.stringify(payload);
        await webpush.sendNotification(subscription, stringifiedPayload);
        console.log('Push notification sent successfully.');
    } catch (error) {
        console.error('Error sending push notification:', error);
        // Here you might want to handle expired subscriptions by deleting them from the DB
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
            // GONE: subscription is no longer valid
            console.log('Subscription has expired or is no longer valid.');
            // await db.pushSubscription.delete({ where: { endpoint: subscription.endpoint } });
        }
    }
};

export default webpush; 