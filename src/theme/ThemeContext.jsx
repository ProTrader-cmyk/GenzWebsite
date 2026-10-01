import { createContext, useContext, useLayoutEffect, useState } from 'react';

const THEME_KEY = 'gzt_theme';
// Matches --bg in main.css for each theme — mobile browsers color their own
// chrome (status bar / address bar) from this meta tag, not from CSS, so it
// has to be kept in sync by hand whenever the palette's --bg values change.
const BG_BY_THEME = { dark: '#0C0C0F', light: '#FAF9F7' };

function loadTheme() {
  let saved = null;
  try {
    saved = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
  } catch {
    // Theme switching still works for this page if storage is unavailable.
  }
  return saved === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG_BY_THEME[theme]);
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Keep the selected theme for this session even if it cannot be persisted.
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(loadTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
