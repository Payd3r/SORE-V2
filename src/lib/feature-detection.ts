// Funzioni per rilevare il supporto delle API del browser in modo sicuro.

/**
 * Controlla se l'API Vibration è supportata.
 */
export const supportsVibration = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Controlla se l'API Service Worker è supportata.
 */
export const supportsServiceWorker = (): boolean => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
};

/**
 * Controlla se l'API Push è supportata.
 */
export const supportsPushManager = (): boolean => {
  return typeof window !== 'undefined' && 'PushManager' in window;
};

/**
 * Controlla se l'API Background Sync è supportata.
 */
export const supportsBackgroundSync = (): boolean => {
  return typeof window !== 'undefined' && 'SyncManager' in window;
};

/**
 * Controlla se l'API Screen Orientation è supportata.
 */
export const supportsScreenOrientation = (): boolean => {
  return typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen;
};

/**
 * Controlla se l'API MediaDevices (getUserMedia) è supportata.
 */
export const supportsMediaDevices = (): boolean => {
  return typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
};

/**
 * Controlla se il dispositivo è di tipo touch.
 */
export const isTouchDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}; 