// Minimal line-style icons (Feather/Lucide-style) for the category cards —
// swapped in for emoji to match the site's understated blue/gold look.
const common = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function CandleChartIcon() {
  return (
    <svg {...common}>
      <line x1="5" y1="3" x2="5" y2="21" />
      <rect x="2.5" y="9" width="5" height="7" rx="1" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <rect x="9.5" y="5" width="5" height="9" rx="1" />
      <line x1="19" y1="7" x2="19" y2="21" />
      <rect x="16.5" y="12" width="5" height="6" rx="1" />
    </svg>
  );
}

export function BrainIcon() {
  return (
    <svg {...common}>
      <path d="M9.5 3.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 5 12a3 3 0 0 0 1.5 5.2 3 3 0 0 0 3 2.8 2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 0 0-2.5-2.5Z" />
      <path d="M14.5 3.5a3 3 0 0 1 3 3v.3A3 3 0 0 1 19 12a3 3 0 0 1-1.5 5.2 3 3 0 0 1-3 2.8 2.5 2.5 0 0 1-2.5-2.5V6a2.5 2.5 0 0 1 2.5-2.5Z" />
      <path d="M9.5 8.5h1.8M9 12.5h2.3M9.5 16.2h1.8M12.7 8.5h1.8M12.7 12.5h2.3M12.7 16.2h1.8" opacity=".55" />
    </svg>
  );
}

export function AppWindowIcon() {
  return (
    <svg {...common}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <line x1="2.5" y1="8.7" x2="21.5" y2="8.7" />
      <circle cx="5.6" cy="6.6" r=".6" fill="currentColor" stroke="none" />
      <circle cx="7.6" cy="6.6" r=".6" fill="currentColor" stroke="none" />
      <circle cx="9.6" cy="6.6" r=".6" fill="currentColor" stroke="none" />
      <path d="M7 15.5l2.5-2.8L11.5 15l3-3.7L17 14.5" />
    </svg>
  );
}

export function BacktestIcon() {
  return (
    <svg {...common}>
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <polyline points="3 3 4 7 8 6.3" />
      <polyline points="12 8 12 12.5 15 14.3" />
    </svg>
  );
}

export function AdvancedChartIcon() {
  return (
    <svg {...common}>
      <polyline points="3 17 9 10.5 13 14 21 5" />
      <polyline points="15 5 21 5 21 11" />
      <path d="M3 20.5h18" opacity=".45" />
    </svg>
  );
}

export function SparkleIcon() {
  return (
    <svg {...common}>
      <path d="M11 2.5 12.6 8l5.4 1.6-5.4 1.6L11 16.7 9.4 11.2 4 9.6l5.4-1.6L11 2.5Z" />
      <path d="M18.5 15.5 19.3 18l2.5.8-2.5.8-.8 2.4-.8-2.4-2.5-.8 2.5-.8.8-2.5Z" />
    </svg>
  );
}

// Filled padlock used as a small overlay badge — kept visually distinct
// (solid, not outline) so it reads as a status marker, not a nav icon.
export function LockIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 1.5a5 5 0 0 0-5 5V9H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6.5a5 5 0 0 0-5-5Zm-3 5a3 3 0 0 1 6 0V9H9V6.5Zm3 8a1.6 1.6 0 0 1 .9 2.9v1.4a.9.9 0 0 1-1.8 0v-1.4A1.6 1.6 0 0 1 12 14.5Z" />
    </svg>
  );
}

export function TelegramIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.5 3.5 2.9 10.8c-1.2.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.1-2 4.4 3.2c.8.5 1.4.2 1.6-.7l2.9-13.7c.3-1.2-.4-1.7-1.6-1z" />
    </svg>
  );
}

export function FacebookIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21.9v-8.4h2.8l.4-3.3h-3.2V8.1c0-.95.26-1.6 1.63-1.6h1.74V3.5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.53-4.22 4.33v2.42H7.3v3.3h2.85v8.4h3.35Z" />
    </svg>
  );
}

export function YoutubeIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22.2 8.5a3.1 3.1 0 0 0-2.2-2.2C18.1 5.8 12 5.8 12 5.8s-6.1 0-8 .5A3.1 3.1 0 0 0 1.8 8.5 32 32 0 0 0 1.3 12a32 32 0 0 0 .5 3.5 3.1 3.1 0 0 0 2.2 2.2c1.9.5 8 .5 8 .5s6.1 0 8-.5a3.1 3.1 0 0 0 2.2-2.2 32 32 0 0 0 .5-3.5 32 32 0 0 0-.5-3.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" />
    </svg>
  );
}

export function TiktokIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 2h-3.3v13.9a2.7 2.7 0 1 1-2-2.6V9.9a5.9 5.9 0 1 0 5.3 5.9V9.1a8 8 0 0 0 4.6 1.5V7.2a4.7 4.7 0 0 1-4.6-4.7V2Z" />
    </svg>
  );
}
