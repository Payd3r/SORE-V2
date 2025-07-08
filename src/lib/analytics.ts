'use client';

type EventName = 
  // Moment Events
  | 'moment_initiated'
  | 'moment_partner_joined'
  | 'moment_completed'
  | 'moment_expired'
  | 'moment_failed'
  // Add other event names here as the app grows
  | 'custom_event';

interface EventProperties {
  [key: string]: any;
}

/**
 * Tracks a custom event by sending it to the analytics API endpoint.
 * This is a "fire-and-forget" function and will not throw errors.
 * @param eventName The name of the event to track.
 * @param properties Optional additional data to send with the event.
 */
export const trackEvent = (
  eventName: EventName,
  properties?: EventProperties
): void => {
  try {
    // Use navigator.sendBeacon if available for more reliable background sending
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ eventName, properties })], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/analytics/event', blob);
    } else {
      // Fallback to fetch for older browsers
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventName, properties }),
        keepalive: true, // Helps ensure the request is sent even if the page is closing
      }).catch(error => {
        // We catch the error here to prevent it from bubbling up,
        // as this is a non-critical, fire-and-forget call.
        console.error('Analytics trackEvent fallback failed:', error);
      });
    }
  } catch (error) {
    // Also catch potential errors from JSON.stringify or other sync operations
    console.error('Analytics trackEvent failed:', error);
  }
}; 