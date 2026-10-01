import { createContext, useContext, useLayoutEffect, useState } from 'react';

const THEME_KEY = 'gzt_theme';
// Matches --bg in main.css for each theme — mobile browsers color their own
// chrome (status bar / address bar) from this meta tag, not from CSS, so it
// has to be kept in sync by hand whenever the palette's --bg values change.
const BG_BY_THEME = { dark: '#0C0C0F', light: '#FAF9F7' };
const THEME_PALETTES = {
  dark: {
    '--bg': '#0C0C0F', '--bg1': '#131318', '--bg2': '#1A1A22', '--bg3': '#22222E',
    '--text': '#F2EFE8', '--mute': '#7A7870', '--faint': '#2A2A35',
    '--up': '#3EC97A', '--upd': 'rgba(62,201,122,0.12)', '--up-rgb': '62,201,122',
    '--dn': '#E05555', '--dnd': 'rgba(224,85,85,0.12)', '--dn-rgb': '224,85,85',
    '--blue': '#5B9BD5', '--blued': 'rgba(91,155,213,0.12)',
    '--warn': '#E0B155', '--warnd': 'rgba(224,177,85,0.14)',
    '--purple': '#B18CF0', '--purpled': 'rgba(177,140,240,0.14)',
    '--gold': '#2E7CF6', '--gold2': '#6FA8FF', '--gold3': '#D6E6FF',
    '--brand': '#2E7CF6', '--brand2': '#6FA8FF', '--brandd': 'rgba(46,124,246,0.14)',
    '--brandline': 'rgba(46,124,246,0.35)', '--glow': 'rgba(46,124,246,0.18)', '--gline': 'rgba(46,124,246,0.28)',
  },
  light: {
    '--bg': '#FAF9F7', '--bg1': '#FFFFFF', '--bg2': '#F5F4F0', '--bg3': '#EFEDE7',
    '--text': '#17171A', '--mute': '#6B6A66', '--faint': '#E5E3DC',
    '--up': '#16A34A', '--upd': 'rgba(22,163,74,0.10)', '--up-rgb': '22,163,74',
    '--dn': '#DC2626', '--dnd': 'rgba(220,38,38,0.08)', '--dn-rgb': '220,38,38',
    '--blue': '#2563EB', '--blued': 'rgba(37,99,235,0.08)',
    '--warn': '#B45309', '--warnd': 'rgba(180,83,9,0.10)',
    '--purple': '#7C3AED', '--purpled': 'rgba(124,58,237,0.10)',
    '--gold': '#0B7A70', '--gold2': '#0B7A70', '--gold3': '#2B4A46',
    '--brand': '#0F9B8E', '--brand2': '#0B7A70', '--brandd': 'rgba(15,155,142,0.10)',
    '--brandline': 'rgba(15,155,142,0.30)', '--glow': 'rgba(15,155,142,0.10)', '--gline': 'rgba(15,155,142,0.22)',
  },
};

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
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  for (const [property, value] of Object.entries(THEME_PALETTES[theme])) {
    root.style.setProperty(property, value);
  }
  if (document.body) {
    document.body.style.backgroundColor = BG_BY_THEME[theme];
    document.body.style.color = THEME_PALETTES[theme]['--text'];
  }
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
