import { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'gzt_theme';
// Matches --bg in main.css for each theme — mobile browsers color their own
// chrome (status bar / address bar) from this meta tag, not from CSS, so it
// has to be kept in sync by hand whenever the palette's --bg values change.
const BG_BY_THEME = { dark: '#0C0C0F', light: '#FAF9F7' };

function loadTheme() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
  return saved === 'light' ? 'light' : 'dark';
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG_BY_THEME[theme]);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
