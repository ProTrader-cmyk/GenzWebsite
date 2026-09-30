/**
 * Push Notification Service for GenZ Trader
 *
 * Uses the browser Notification API + Firestore real-time listener.
 * When an admin publishes a signal, a notification doc is written to
 * Firestore's `notifications` collection. All connected clients with
 * granted notification permission receive a native OS notification.
 *
 * Architecture (no Cloud Functions needed):
 *  1. Admin publishes signal → `broadcastSignalNotification()` writes to Firestore
 *  2. Member clients call `subscribeToNotifications()` on login
 *  3. Firestore `onSnapshot` fires → browser Notification shown
 */

import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

const NOTIFICATIONS_COLLECTION = 'notifications';

// ---------------------------------------------------------------------------
// 1. PERMISSION — request user consent for browser notifications
// ---------------------------------------------------------------------------

/**
 * Returns the current Notification permission state.
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests notification permission from the user.
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[PushNotification] Notifications not supported in this browser.');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.error('[PushNotification] Error requesting permission:', err);
    return 'default';
  }
}

// ---------------------------------------------------------------------------
// 2. BROADCAST — admin writes a notification doc when publishing a signal
// ---------------------------------------------------------------------------

/**
 * Broadcasts a signal notification to all connected clients via Firestore.
 * Called ONLY when the admin clicks "Drop Signal to Website (Live)".
 *
 * @param {Object} signal - The published signal data
 * @param {string} signal.pair - e.g. 'XAUUSD'
 * @param {string} signal.direction - 'buy' or 'sell'
 * @param {number} signal.entry - Entry price
 * @param {number} signal.sl - Stop loss
 * @param {number} signal.tp - Take profit
 * @param {string} signal.session - e.g. 'London Killzone'
 */
export async function broadcastSignalNotification(signal) {
  try {
    const dirLabel = signal.direction === 'sell' ? '🔴 SELL' : '🟢 BUY';
    const notifId = `notif-${Date.now()}`;
    const notifDoc = doc(db, NOTIFICATIONS_COLLECTION, notifId);

    await setDoc(notifDoc, {
      type: 'signal',
      title: `⚡ New Signal: ${signal.pair} ${dirLabel}`,
      body: `Entry: ${signal.entry} | SL: ${signal.sl} | TP: ${signal.tp} | Session: ${signal.session || 'London KZ'}`,
      pair: signal.pair || 'XAUUSD',
      direction: signal.direction || 'buy',
      entry: signal.entry,
      sl: signal.sl,
      tp: signal.tp,
      session: signal.session || 'London Killzone',
      createdAt: serverTimestamp(),
      // Client-side timestamp for immediate comparison (serverTimestamp resolves async)
      clientTimestamp: Date.now(),
    });

    console.log('[PushNotification] Signal notification broadcast to Firestore:', notifId);
    return notifId;
  } catch (err) {
    console.error('[PushNotification] Failed to broadcast notification:', err);
    // Don't throw — notification failure shouldn't block signal publishing
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. SUBSCRIBE — member clients listen for new notification docs
// ---------------------------------------------------------------------------

/**
 * Subscribes to new signal notifications in real-time.
 * Shows a native browser Notification when a new signal is published.
 *
 * @param {Function} [onNotification] - Optional callback for in-app toast
 * @returns {Function} unsubscribe function
 */
export function subscribeToNotifications(onNotification) {
  // Only subscribe to the latest notification doc
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  // Track the timestamp we started listening to avoid firing on old docs
  const subscribedAt = Date.now();

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) return;

    for (const change of snapshot.docChanges()) {
      if (change.type !== 'added') continue;

      const data = change.doc.data();
      if (!data.type || data.type !== 'signal') continue;

      // Skip old notifications (only show ones created after we subscribed)
      const docTimestamp = data.clientTimestamp || (data.createdAt?.toMillis?.() ?? 0);
      if (docTimestamp < subscribedAt - 5000) continue; // 5s grace for clock skew

      // 1. Show native browser notification (if permission granted)
      showBrowserNotification(data);

      // 2. Fire in-app callback for toast / UI update
      if (typeof onNotification === 'function') {
        onNotification(data);
      }
    }
  });

  return unsubscribe;
}

// ---------------------------------------------------------------------------
// 4. DISPLAY — show a native OS notification
// ---------------------------------------------------------------------------

/**
 * Shows a native browser notification with sound.
 * @param {Object} data - Notification data from Firestore
 */
function showBrowserNotification(data) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(data.title || '⚡ New Trading Signal', {
      body: data.body || 'A new signal has been published. Check the terminal!',
      icon: '/src/assets/Fav.png',
      badge: '/src/assets/Fav.png',
      tag: `signal-${data.pair}-${data.clientTimestamp || Date.now()}`,
      requireInteraction: true, // Keep notification visible until user interacts
      vibrate: [200, 100, 200], // Vibration pattern for mobile
      data: {
        url: '/member', // Navigate to member area on click
        pair: data.pair,
        direction: data.direction,
      },
    });

    // Navigate to member terminal when notification is clicked
    notification.onclick = () => {
      window.focus();
      if (window.location.pathname !== '/member') {
        window.location.href = '/member';
      }
      notification.close();
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      try { notification.close(); } catch {}
    }, 30000);

    console.log('[PushNotification] Browser notification shown:', data.title);
  } catch (err) {
    console.error('[PushNotification] Failed to show browser notification:', err);
  }
}

// ---------------------------------------------------------------------------
// 5. SERVICE WORKER REGISTRATION (for background notifications)
// ---------------------------------------------------------------------------

/**
 * Registers the push notification service worker.
 * This enables notifications even when the tab is in the background.
 */
export async function registerNotificationServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[PushNotification] Service workers not supported.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/notification-sw.js', {
      scope: '/',
    });
    console.log('[PushNotification] Service worker registered:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('[PushNotification] Service worker registration failed:', err);
    return null;
  }
}
