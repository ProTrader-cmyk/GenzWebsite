/**
 * Real-time News Alert Watcher for GenZ Trader
 *
 * Monitors the live news feed for breaking financial and market news.
 * When a new article is detected, triggers:
 *  1. Two-tone institutional chime
 *  2. Native desktop OS notification (window.Notification / ServiceWorker)
 *  3. Top-right floating glassmorphism alert toast
 */

import {
  playNotificationSound,
  showBrowserNotification,
  getNotificationPermission,
  requestNotificationPermission,
} from './pushNotificationService.js';

const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app';
const LAST_SEEN_KEY = 'genz_last_seen_news_url';

let activeWatcherTimer = null;
let memoryLastSeenUrl = null;

/**
 * Checks for new breaking news articles and triggers alerts if a new story is detected.
 * @param {Function} [onAlert] - Callback for in-app toast
 * @returns {Promise<Object|null>} newly detected article, or null
 */
export async function checkNewNews(onAlert) {
  if (!NEWS_API_URL) return null;

  try {
    const res = await fetch(`${NEWS_API_URL}/api/news`);
    if (!res.ok) return null;

    const data = await res.json();
    const articles = data.articles || [];
    if (articles.length === 0) return null;

    const latest = articles[0];
    if (!latest || !latest.url) return null;

    // Retrieve last seen article from memory or localStorage
    const storedLastSeen = memoryLastSeenUrl || localStorage.getItem(LAST_SEEN_KEY);

    // Initial load: save baseline so we don't alert on old articles already in feed
    if (!storedLastSeen) {
      memoryLastSeenUrl = latest.url;
      try { localStorage.setItem(LAST_SEEN_KEY, latest.url); } catch {}
      return null;
    }

    // New article detected!
    if (latest.url !== storedLastSeen) {
      memoryLastSeenUrl = latest.url;
      try { localStorage.setItem(LAST_SEEN_KEY, latest.url); } catch {}

      const sourceName = latest.source || 'Market Wire';
      const payload = {
        type: 'news',
        id: `news-${Date.now()}`,
        title: `📰 Breaking News: ${sourceName}`,
        body: latest.title,
        source: sourceName,
        url: latest.url,
        publishedAt: latest.publishedAt || new Date().toISOString(),
        article: latest,
      };

      console.log('[NewsNotification] New article detected, triggering alert:', latest.title);

      // 1. Play audio alert chime
      playNotificationSound();

      // 2. Native OS Notification
      showBrowserNotification({
        id: payload.id,
        title: payload.title,
        body: payload.body,
        pair: 'NEWS',
        direction: 'buy',
      });

      // 3. Callback
      if (typeof onAlert === 'function') {
        onAlert(payload);
      }

      // 4. Site-wide custom event for top floating banner
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: payload }));
      }

      return payload;
    }

    return null;
  } catch (err) {
    console.warn('[NewsNotification] Check error:', err);
    return null;
  }
}

/**
 * Starts periodic news polling (defaults to every 60 seconds).
 * @param {Function} [onAlert] - Callback for in-app alert
 * @param {number} [intervalMs=60000] - Polling interval in ms
 * @returns {Function} stopWatcher cleanup function
 */
export function startNewsWatcher(onAlert, intervalMs = 60000) {
  // Prime baseline immediately
  checkNewNews(onAlert).catch(() => {});

  if (activeWatcherTimer) {
    clearInterval(activeWatcherTimer);
  }

  activeWatcherTimer = setInterval(() => {
    checkNewNews(onAlert).catch(() => {});
  }, intervalMs);

  return () => {
    if (activeWatcherTimer) {
      clearInterval(activeWatcherTimer);
      activeWatcherTimer = null;
    }
  };
}

/**
 * Manually triggers a test breaking news alert for instant verification.
 * @param {Function} [onAlert]
 */
export async function triggerTestNewsNotification(onAlert) {
  const perm = await requestNotificationPermission();

  const testArticle = {
    title: 'US CPI Inflation Cools to 2.8%, Fed Rate Cut Odds Surge & Gold Rallies',
    source: 'Bloomberg Markets',
    url: 'https://bloomberg.com/markets',
    publishedAt: new Date().toISOString(),
  };

  const payload = {
    type: 'news',
    id: `test-news-${Date.now()}`,
    title: '📰 Breaking News: Bloomberg Markets',
    body: testArticle.title,
    source: testArticle.source,
    url: testArticle.url,
    article: testArticle,
  };

  playNotificationSound();

  if (perm === 'granted') {
    await showBrowserNotification({
      id: payload.id,
      title: payload.title,
      body: payload.body,
      pair: 'NEWS',
      direction: 'buy',
    });
  }

  if (typeof onAlert === 'function') {
    onAlert(payload);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: payload }));
  }

  return { perm, ok: true };
}
