import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Universal State Persistence & Storage Utility for GenZ Trader
 * 
 * Provides fail-safe, quota-resilient, type-preserving read/write
 * across localStorage and sessionStorage with debouncing, user isolation,
 * and automatic synchronization.
 */

// Memory fallback cache if localStorage/sessionStorage is blocked or disabled
const memoryFallback = new Map();

/**
 * Safely access storage object with incognito/private mode resilience
 */
function getStorage(type = 'local') {
  if (typeof window === 'undefined') return null;
  try {
    const storage = type === 'session' ? window.sessionStorage : window.localStorage;
    // Test write/remove to guarantee permissions (handles Safari private mode quirks)
    const testKey = '__gzt_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

/**
 * Safely retrieve and parse a stored value
 */
export function getStorageItem(key, fallback = null, type = 'local') {
  try {
    const storage = getStorage(type);
    if (!storage) {
      if (!memoryFallback.has(key)) return fallback;
      const memVal = memoryFallback.get(key);
      return (memVal === undefined || memVal === null) ? fallback : memVal;
    }
    const raw = storage.getItem(key);
    if (raw === null || raw === undefined) return fallback;

    // Handle common primitives and JSON objects
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (raw === 'null') return null;
    if (raw === 'undefined') return undefined;

    // Try parsing as JSON if it looks like an array, object, or number
    if (/^[{\[\d"-]/.test(raw)) {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  } catch (err) {
    console.warn(`[StatePersistence] Error reading key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely serialize and write a value to storage
 */
export function setStorageItem(key, value, type = 'local') {
  try {
    if (value === undefined || value === null) {
      const storage = getStorage(type);
      if (storage) {
        storage.removeItem(key);
      }
      memoryFallback.delete(key);
      return true;
    }

    const storage = getStorage(type);
    if (!storage) {
      memoryFallback.set(key, value);
      return true;
    }

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, serialized);
    memoryFallback.set(key, value);
    return true;
  } catch (err) {
    // Gracefully handle QuotaExceededError or security restrictions
    console.warn(`[StatePersistence] Error writing key "${key}":`, err);
    memoryFallback.set(key, value);
    return false;
  }
}

/**
 * Safely remove an item from storage
 */
export function removeStorageItem(key, type = 'local') {
  try {
    const storage = getStorage(type);
    if (storage) {
      storage.removeItem(key);
    }
    memoryFallback.delete(key);
  } catch (err) {
    console.warn(`[StatePersistence] Error removing key "${key}":`, err);
  }
}

/**
 * Resolves a storage key with optional account isolation
 */
export function resolveStorageKey(baseKey, userId = null) {
  if (!userId || typeof userId !== 'string') return baseKey;
  return `${baseKey}_uid_${userId.trim()}`;
}

/**
 * Custom React Hook: usePersistentState
 * 
 * Works exactly like React.useState, but persists state changes across
 * page refreshes and browser sessions automatically.
 * 
 * @param {string} baseKey - Storage identifier
 * @param {any} defaultValue - Initial value if no stored value exists
 * @param {object} [options]
 * @param {'local'|'session'} [options.storage='local'] - Storage type
 * @param {string|null} [options.userId=null] - User ID for account isolation
 * @param {number} [options.debounceMs=0] - Debounce write time in milliseconds
 * @param {function} [options.validator=null] - Optional function (val) => boolean to validate restored data
 */
export function usePersistentState(baseKey, defaultValue, options = {}) {
  const {
    storage = 'local',
    userId = null,
    debounceMs = 0,
    validator = null,
  } = options;

  const resolvedKey = resolveStorageKey(baseKey, userId);

  // 1. Synchronous lazy initialization directly from storage to eliminate any flash/flicker
  const [state, setState] = useState(() => {
    const saved = getStorageItem(resolvedKey, null, storage);
    if (saved !== null && saved !== undefined) {
      if (typeof validator === 'function') {
        if (validator(saved)) return saved;
      } else {
        return saved;
      }
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  const timerRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 2. Persist whenever state changes (with optional debounce)
  useEffect(() => {
    if (debounceMs > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setStorageItem(resolvedKey, state, storage);
      }, debounceMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      setStorageItem(resolvedKey, state, storage);
    }
  }, [resolvedKey, state, storage, debounceMs]);

  // 3. Listen for changes from other tabs if using localStorage
  useEffect(() => {
    if (storage !== 'local' || typeof window === 'undefined') return undefined;

    function handleStorageEvent(e) {
      if (e.key === resolvedKey && e.newValue !== null) {
        try {
          const incoming = getStorageItem(resolvedKey, null, 'local');
          if (incoming !== null && incoming !== undefined) {
            if (!validator || validator(incoming)) {
              setState(incoming);
            }
          }
        } catch {}
      }
    }

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [resolvedKey, storage, validator]);

  return [state, setState];
}

/**
 * Custom React Hook: useScrollPersistence
 * 
 * Automatically remembers and restores the scroll position for a specific page/section.
 * 
 * @param {string} pageKey - Identifier for the page/section
 * @param {boolean} [enabled=true] - Whether scroll persistence is active
 */
export function useScrollPersistence(pageKey, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !pageKey) return undefined;

    const scrollKey = `gzt_scroll_${pageKey}`;

    // Restore saved scroll position after DOM settles
    const savedY = getStorageItem(scrollKey, null, 'session');
    if (Number.isFinite(savedY) && savedY > 0) {
      // Use requestAnimationFrame to ensure children have rendered their layout height
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      });
    }

    let timer = null;
    function handleScroll() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        setStorageItem(scrollKey, currentY, 'session');
      }, 150);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageKey, enabled]);
}

/**
 * Navigation state helper for App.jsx
 */
const NAV_STATE_KEY = 'gzt_app_navigation_state';

export function getPersistedNavState() {
  // 1. Check URL parameters first (allows bookmarking and direct links)
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSection = params.get('section') || params.get('page');
      const urlView = params.get('view') || params.get('lesson');
      if (urlSection) {
        return {
          section: urlSection,
          view: urlView || 'home',
          adminViewingSite: params.get('adminSite') !== 'false',
          source: 'url',
        };
      }

      // Check hash (e.g. #ai-trading, #news, #member-preview)
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash) {
        const [hSection, hView] = hash.split('/');
        return {
          section: hSection,
          view: hView || 'home',
          adminViewingSite: true,
          source: 'hash',
        };
      }
    } catch {}
  }

  // 2. Check localStorage / sessionStorage (and memoryFallback)
  const stored = getStorageItem(NAV_STATE_KEY, null, 'local');
  if (stored && typeof stored === 'object' && stored.section) {
    return {
      section: stored.section,
      view: stored.view || 'home',
      adminViewingSite: stored.adminViewingSite !== false,
      source: 'storage',
    };
  }

  return null;
}

export function savePersistedNavState({ section, view = 'home', adminViewingSite = true }) {
  const payload = { section, view, adminViewingSite, updatedAt: Date.now() };
  setStorageItem(NAV_STATE_KEY, payload, 'local');

  if (typeof window === 'undefined') return;

  // Also update URL query parameters cleanly using replaceState so it doesn't trigger a page reload
  try {
    const url = new URL(window.location.href);
    if (section && section !== 'home') {
      url.searchParams.set('section', section);
      if (view && view !== 'home') {
        url.searchParams.set('view', view);
      } else {
        url.searchParams.delete('view');
      }
      if (!adminViewingSite) {
        url.searchParams.set('adminSite', 'false');
      } else {
        url.searchParams.delete('adminSite');
      }
    } else {
      url.searchParams.delete('section');
      url.searchParams.delete('view');
      url.searchParams.delete('adminSite');
    }
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

export function clearPersistedNavState() {
  removeStorageItem(NAV_STATE_KEY, 'local');
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    url.searchParams.delete('view');
    url.searchParams.delete('adminSite');
    window.history.replaceState({}, '', url.toString());
  } catch {}
}
