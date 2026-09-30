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
// ---------------------------------------------------------------------------
// 2. AUDIO ALERT — Web Audio API institutional two-tone chime
// ---------------------------------------------------------------------------

let sharedAudioCtx = null;
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
}

// Warm up / unlock audio on any user tap or keypress
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
}

export async function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: E6 (1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Tone 2: A6 (1760.0 Hz) — accent chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760.0, now + 0.1);
    gain2.gain.setValueAtTime(0.4, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.48);
  } catch (err) {
    console.warn('[PushNotification] Sound error:', err);
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
    data: {
      url: '/member',
      pair: data.pair,
      direction: data.direction,
    },
  };

  let shown = false;

  // 1. Desktop: Try native window.Notification first
  // (Pops up directly in Chrome/Edge on Windows/Mac without being suppressed by Windows Action Center)
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      try { notif.close(); } catch {}
    };
    setTimeout(() => {
      try { notif.close(); } catch {}
    }, 20000);
    shown = true;
    console.log('[PushNotification] Visual popup created via window.Notification');
  } catch (winErr) {
    // Expected on Android Chrome where Notification constructor is restricted
    console.log('[PushNotification] window.Notification not supported directly, falling back to ServiceWorker');
  }

  // 2. Mobile/Android: Use Service Worker showNotification
  if (!shown && 'serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        shown = true;
        console.log('[PushNotification] Notification shown via ServiceWorker');
      }
    } catch (swErr) {
      console.warn('[PushNotification] ServiceWorker showNotification notice:', swErr);
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

          // 2. Show native OS notification (desktop popup or mobile service worker)
          showBrowserNotification(notifPayload);

          // 3. Fire in-app toast callback
          if (typeof onNotification === 'function') {
            onNotification(notifPayload);
          }

          // 4. Dispatch site-wide event for floating alert toast
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: notifPayload }));
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

  // Dispatch global event so the floating toast banner pops up immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: testPayload }));
  }

  return { perm, ok: true };
}

// ---------------------------------------------------------------------------
// 6. BROADCAST (kept for compatibility with Admin publish button)
// ---------------------------------------------------------------------------

export async function broadcastSignalNotification(signal) {
  const dirLabel = (signal.direction || '').toUpperCase() === 'SELL' ? '🔴 SELL' : '🟢 BUY';
  const payload = {
    id: `local-sig-${Date.now()}`,
    title: `⚡ Live Signal: ${signal.pair || 'XAUUSD'} ${dirLabel}`,
    body: `Entry: ${signal.entry} | SL: ${signal.sl} | TP: ${signal.tp} (1:2 R:R)`,
    pair: signal.pair || 'XAUUSD',
    direction: (signal.direction || 'buy').toLowerCase(),
    entry: signal.entry,
    sl: signal.sl,
    tp: signal.tp,
    session: signal.session || 'London Killzone',
  };

  playNotificationSound();

  let perm = getNotificationPermission();
  if (perm === 'default') {
    perm = await requestNotificationPermission();
  }

  if (perm === 'granted') {
    await showBrowserNotification(payload);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: payload }));
  }

  return payload.id;
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
