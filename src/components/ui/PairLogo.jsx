// Real institutional dual-currency pair & asset logos
// Renders ultra-crisp vector SVG emblems (TradingView / Binance style)

export function FlagUS({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`us-circle-${size}`}>
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#us-circle-${size})`}>
        {/* White base */}
        <rect width="32" height="32" fill="#FFFFFF" />
        {/* Red stripes */}
        <rect y="0" width="32" height="2.46" fill="#B22234" />
        <rect y="4.92" width="32" height="2.46" fill="#B22234" />
        <rect y="9.84" width="32" height="2.46" fill="#B22234" />
        <rect y="14.76" width="32" height="2.46" fill="#B22234" />
        <rect y="19.68" width="32" height="2.46" fill="#B22234" />
        <rect y="24.6" width="32" height="2.46" fill="#B22234" />
        <rect y="29.54" width="32" height="2.46" fill="#B22234" />
        {/* Blue Canton */}
        <rect x="0" y="0" width="15" height="15" fill="#3C3B6E" />
        {/* Stars pattern */}
        <circle cx="3" cy="3" r="0.9" fill="#FFFFFF" />
        <circle cx="7.5" cy="3" r="0.9" fill="#FFFFFF" />
        <circle cx="12" cy="3" r="0.9" fill="#FFFFFF" />
        <circle cx="5.2" cy="6" r="0.9" fill="#FFFFFF" />
        <circle cx="9.8" cy="6" r="0.9" fill="#FFFFFF" />
        <circle cx="3" cy="9" r="0.9" fill="#FFFFFF" />
        <circle cx="7.5" cy="9" r="0.9" fill="#FFFFFF" />
        <circle cx="12" cy="9" r="0.9" fill="#FFFFFF" />
        <circle cx="5.2" cy="12" r="0.9" fill="#FFFFFF" />
        <circle cx="9.8" cy="12" r="0.9" fill="#FFFFFF" />
      </g>
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  );
}

export function FlagUK({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`uk-circle-${size}`}>
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#uk-circle-${size})`}>
        {/* Blue field */}
        <rect width="32" height="32" fill="#012169" />
        {/* White saltire */}
        <line x1="0" y1="0" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="0" y1="32" x2="32" y2="0" stroke="#FFFFFF" strokeWidth="6" />
        {/* Red saltire */}
        <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" strokeWidth="2.2" />
        <line x1="0" y1="32" x2="32" y2="0" stroke="#C8102E" strokeWidth="2.2" />
        {/* White cross */}
        <rect x="12" y="0" width="8" height="32" fill="#FFFFFF" />
        <rect x="0" y="12" width="32" height="8" fill="#FFFFFF" />
        {/* Red cross */}
        <rect x="13.5" y="0" width="5" height="32" fill="#C8102E" />
        <rect x="0" y="13.5" width="32" height="5" fill="#C8102E" />
      </g>
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  );
}

export function FlagEU({ size = 26 }) {
  const stars = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const r = 9.5;
  const cx = 16;
  const cy = 16;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`eu-circle-${size}`}>
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#eu-circle-${size})`}>
        <rect width="32" height="32" fill="#003399" />
        {stars.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x = cx + r * Math.sin(rad);
          const y = cy - r * Math.cos(rad);
          return (
            <polygon
              key={deg}
              points={`${x},${y - 1.6} ${x + 0.45},${y - 0.45} ${x + 1.6},${y - 0.45} ${x + 0.75},${y + 0.35} ${x + 1.1},${y + 1.5} ${x},${y + 0.75} ${x - 1.1},${y + 1.5} ${x - 0.75},${y + 0.35} ${x - 1.6},${y - 0.45} ${x - 0.45},${y - 0.45}`}
              fill="#FFCC00"
            />
          );
        })}
      </g>
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  );
}

export function FlagJapan({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`jp-circle-${size}`}>
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#jp-circle-${size})`}>
        <rect width="32" height="32" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="7.5" fill="#BC002D" />
      </g>
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  );
}

export function GoldIngotLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`gold-bg-${size}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE57F" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <linearGradient id={`bar-face-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Outer Coin Circle */}
      <circle cx="16" cy="16" r="15" fill={`url(#gold-bg-${size})`} />
      <circle cx="16" cy="16" r="13.8" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
      
      {/* 3D Gold Bullion Bar Ingot */}
      <polygon points="9,13 14,8 24,8 19,13" fill="#FFE259" />
      <polygon points="19,13 24,8 24,20 19,23" fill="#D97706" />
      <polygon points="9,13 19,13 19,23 9,21" fill={`url(#bar-face-${size})`} stroke="#B45309" strokeWidth="0.5" />
      
      {/* Engraved Stamp "999.9" */}
      <text x="14" y="18.5" fill="#78350F" fontSize="3.8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.05em">
        999.9
      </text>
      <text x="14" y="14.8" fill="#92400E" fontSize="3.2" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
        AU
      </text>

      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  );
}

export function SilverIngotLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`silver-bg-${size}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#silver-bg-${size})`} />
      <circle cx="16" cy="16" r="13.8" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

      {/* 3D Silver Bar */}
      <polygon points="9,13 14,8 24,8 19,13" fill="#F8FAFC" />
      <polygon points="19,13 24,8 24,20 19,23" fill="#64748B" />
      <polygon points="9,13 19,13 19,23 9,21" fill="#CBD5E1" stroke="#475569" strokeWidth="0.5" />

      <text x="14" y="18.5" fill="#1E293B" fontSize="3.8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
        999
      </text>
      <text x="14" y="14.8" fill="#334155" fontSize="3.2" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
        AG
      </text>

      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  );
}

export function BitcoinLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="#F7931A" />
      <circle cx="16" cy="16" r="13.8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      {/* Official Bitcoin B symbol */}
      <path
        d="M20.9 14.1C21.2 12.3 19.9 11.2 18.2 10.6L18.8 8.1L17.3 7.7L16.7 10.1C16.3 10 15.9 9.9 15.5 9.8L16.1 7.4L14.6 7L14 9.4C13.7 9.3 13.3 9.2 13 9.1L11 8.6L10.6 10.2C10.6 10.2 11.6 10.4 11.6 10.5C12.1 10.6 12.3 11 12.2 11.3L11.5 14.2C11.6 14.2 11.7 14.2 11.8 14.3C11.7 14.2 11.6 14.2 11.5 14.2L10.5 18.2C10.4 18.5 10.2 18.7 9.8 18.6C9.8 18.7 8.8 18.4 8.8 18.4L8 20.3L9.9 20.8C10.3 20.9 10.6 21 11 21.1L10.4 23.6L11.9 24L12.5 21.5C12.9 21.6 13.3 21.7 13.7 21.8L13.1 24.3L14.6 24.7L15.2 22.2C17.8 22.7 19.8 22.5 20.6 20.1C21.3 18.2 20.6 17.1 19.3 16.4C20.2 15.8 20.8 14.9 20.9 14.1ZM17.7 18.9C17.2 20.9 13.9 20 12.7 19.7L13.5 16.5C14.7 16.8 18.2 17 17.7 18.9ZM18.2 13.7C17.8 15.4 14.9 14.7 13.9 14.4L14.6 11.6C15.6 11.9 18.6 12 18.2 13.7Z"
        fill="#FFFFFF"
      />
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  );
}

export function US30Logo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`us30-bg-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#us30-bg-${size})`} />
      <circle cx="16" cy="16" r="13.8" stroke="#38BDF8" strokeWidth="0.8" opacity="0.6" />
      
      {/* Mini Dow Trend Bars */}
      <rect x="7" y="19" width="2" height="4" fill="#10B981" rx="0.5" />
      <rect x="10.5" y="16" width="2" height="7" fill="#10B981" rx="0.5" />
      <rect x="14" y="13" width="2" height="10" fill="#38BDF8" rx="0.5" />
      <rect x="17.5" y="10" width="2" height="13" fill="#00F2FE" rx="0.5" />
      <rect x="21" y="7" width="2" height="16" fill="#F59E0B" rx="0.5" />

      {/* Label "30" */}
      <text x="16" y="27" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.08em">
        US30
      </text>
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  );
}

/**
 * Institutional Dual-Pair Logo Badge Component
 * Displays authentic base-currency emblem overlapping quote-currency roundel
 */
export default function PairLogo({ pair, className = '' }) {
  const norm = String(pair || 'XAUUSD').toUpperCase().replace(/[^A-Z0-9]/g, '');

  let baseIcon = null;
  let quoteIcon = <FlagUS size={18} />;

  if (norm.includes('GBP')) {
    baseIcon = <FlagUK size={26} />;
    quoteIcon = <FlagUS size={18} />;
  } else if (norm.includes('EUR')) {
    baseIcon = <FlagEU size={26} />;
    quoteIcon = <FlagUS size={18} />;
  } else if (norm.includes('XAU') || norm.includes('GOLD')) {
    baseIcon = <GoldIngotLogo size={26} />;
    quoteIcon = <FlagUS size={18} />;
  } else if (norm.includes('XAG') || norm.includes('SILVER')) {
    baseIcon = <SilverIngotLogo size={26} />;
    quoteIcon = <FlagUS size={18} />;
  } else if (norm.includes('BTC')) {
    baseIcon = <BitcoinLogo size={26} />;
    quoteIcon = <FlagUS size={18} />;
  } else if (norm.includes('JPY')) {
    baseIcon = <FlagUS size={26} />;
    quoteIcon = <FlagJapan size={18} />;
  } else if (norm.includes('US30') || norm.includes('DJ30') || norm.includes('DOW')) {
    baseIcon = <US30Logo size={26} />;
    quoteIcon = <FlagUS size={18} />;
  } else {
    // Default Gold
    baseIcon = <GoldIngotLogo size={26} />;
    quoteIcon = <FlagUS size={18} />;
  }

  return (
    <div className={`ait-dual-pair-badge ${className}`}>
      <div className="ait-pair-base">{baseIcon}</div>
      <div className="ait-pair-quote">{quoteIcon}</div>
    </div>
  );
}

