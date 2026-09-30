/**
 * Push Notification Service for GenZ Trader
 *
 * Direct integration with Firestore's `signals` collection (which is already
 * authorized for reads and writes). No external backend or separate collections needed.
 *
 * Triggers:
 *  1. Native OS Web Push Notification (via Service Worker showNotification & window.Notification)
 *  2. Synthetic institutional double-chime alert sound (Web Audio API)
 *  3. In-app glassmorphism toast alert banner
 */

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase.js';

const SIGNALS_COLLECTION = 'signals';

// ---------------------------------------------------------------------------
// 1. PERMISSION — query & request user consent for browser notifications
// ---------------------------------------------------------------------------

export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[PushNotification] Notifications not supported in this browser.');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const result = await Notification.requestPermission();
    console.log('[PushNotification] Permission result:', result);
    return result;
  } catch (err) {
    console.error('[PushNotification] Error requesting permission:', err);
    return 'default';
  }
}

// ---------------------------------------------------------------------------
// 2. AUDIO ALERT — Web Audio API two-tone institutional chime
// ---------------------------------------------------------------------------

export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: E6 (1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Tone 2: A6 (1760.0 Hz) — higher accent chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760.0, now + 0.1);
    gain2.gain.setValueAtTime(0.35, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch (err) {
    // Autoplay policy may restrict audio before user gesture
  }
}

// ---------------------------------------------------------------------------
// 3. NATIVE OS NOTIFICATION DISPLAY
// ---------------------------------------------------------------------------

export async function showBrowserNotification(data) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = data.title || `⚡ New Signal: ${data.pair || 'XAUUSD'}`;
  const dirUpper = (data.direction || 'BUY').toUpperCase();
  const options = {
    body: data.body || `${data.pair} ${dirUpper} | Entry: ${data.entry} | SL: ${data.sl} | TP: ${data.tp}`,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `signal-${data.id || Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [250, 100, 250],
    data: {
      url: '/member',
      pair: data.pair,
      direction: data.direction,
    },
  };

  // 1. Try Service Worker showNotification with a 1s timeout to prevent hanging
  let swShown = false;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        swShown = true;
        console.log('[PushNotification] Notification shown via ServiceWorker');
      }
    } catch (swErr) {
      console.warn('[PushNotification] ServiceWorker showNotification notice:', swErr);
    }
  }

  // 2. Fallback to standard window Notification if SW didn't show
  if (!swShown) {
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        try { notif.close(); } catch {}
      };
      setTimeout(() => {
        try { notif.close(); } catch {}
      }, 30000);
      console.log('[PushNotification] Notification shown via window.Notification');
    } catch (winErr) {
      console.warn('[PushNotification] window.Notification notice:', winErr);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. REAL-TIME SIGNAL SUBSCRIBER — listens to the authorized `signals` collection
// ---------------------------------------------------------------------------

/**
 * Subscribes to newly published signals in real-time.
 * Automatically triggers:
 *  - Native OS notification (if permission granted)
 *  - High-pitch audio chime
 *  - In-app toast callback (for all active users)
 *
 * @param {Function} [onNotification] - Callback for in-app toast banner: (data) => void
 * @returns {Function} unsubscribe function
 */
export function subscribeToNotifications(onNotification) {
  const subscribedAt = Date.now();
  let initialLoad = true;

  try {
    const q = query(
      collection(db, SIGNALS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Skip alerting on signals that already existed before this page was opened
        if (initialLoad) {
          initialLoad = false;
          return;
        }

        for (const change of snapshot.docChanges()) {
          // ONLY trigger on brand-new added signals (NOT on status updates to TP/SL or deletes)
          if (change.type !== 'added') continue;

          const data = change.doc.data();
          if (data.status && data.status !== 'active') continue;

          // Check timestamp to avoid stale events; default to Date.now() if serverTimestamp is pending
          const publishedTime =
            data.publishedAt ||
            (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now());

          if (publishedTime && publishedTime < subscribedAt - 15000) {
            continue; // Created before we opened the session
          }

          const dirLabel = (data.direction || '').toUpperCase() === 'SELL' ? '🔴 SELL' : '🟢 BUY';
          const notifPayload = {
            id: change.doc.id,
            title: `⚡ New Signal: ${data.pair || 'XAUUSD'} ${dirLabel}`,
            body: `Entry: ${data.entry} | SL: ${data.sl} | TP: ${data.tp} (1:2 R:R)`,
            pair: data.pair || 'XAUUSD',
            direction: (data.direction || 'buy').toLowerCase(),
            entry: data.entry,
            sl: data.sl,
            tp: data.tp,
            session: data.session || 'London Killzone',
            publishedAt: publishedTime || Date.now(),
          };

          console.log('[PushNotification] Live signal detected, triggering alerts:', notifPayload.title);

          // 1. Play audio chime
          playNotificationSound();

          // 2. Show native OS notification
          showBrowserNotification(notifPayload);

          // 3. Fire in-app toast
          if (typeof onNotification === 'function') {
            onNotification(notifPayload);
          }
        }
      },
      (err) => {
        console.warn('[PushNotification] Error subscribing to signals collection:', err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[PushNotification] Failed to initialize signals listener:', err);
    return () => {};
  }
}

// ---------------------------------------------------------------------------
// 5. TEST ALERT TRIGGER — allows admin or user to test notification instantly
// ---------------------------------------------------------------------------

export async function triggerTestNotification(onNotification) {
  const perm = await requestNotificationPermission();

  const testPayload = {
    id: `test-${Date.now()}`,
    title: '⚡ TEST SIGNAL: XAUUSD 🟢 BUY',
    body: 'Entry: 4174.50 | SL: 4168.50 | TP: 4186.50 (1:2 R:R)',
    pair: 'XAUUSD',
    direction: 'buy',
    entry: '4174.50',
    sl: '4168.50',
    tp: '4186.50',
    session: 'London Killzone',
  };

  playNotificationSound();

  if (perm === 'granted') {
    await showBrowserNotification(testPayload);
  }

  if (typeof onNotification === 'function') {
    onNotification(testPayload);
  }

  return { perm, ok: true };
}

// ---------------------------------------------------------------------------
// 6. BROADCAST (kept for compatibility with Admin publish button)
// ---------------------------------------------------------------------------

export async function broadcastSignalNotification(signal) {
  // Publishing to `signals` collection automatically fires onSnapshot for all clients!
  // We play sound locally on admin console as confirmation
  playNotificationSound();
  return `sig-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// 7. SERVICE WORKER REGISTRATION
// ---------------------------------------------------------------------------

export async function registerNotificationServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/notification-sw.js', {
      scope: '/',
    });
    console.log('[PushNotification] Service worker ready:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('[PushNotification] Service worker registration notice:', err);
    return null;
  }
}
