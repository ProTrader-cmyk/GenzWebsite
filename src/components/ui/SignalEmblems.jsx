import React from 'react';

/**
 * Ultra-clean circular gold bullion emblem matching institutional trading card design
 */
export function GoldAssetEmblem({ size = 42, className = '' }) {
  const gradId = `gold-emblem-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </radialGradient>
      </defs>
      {/* Golden Roundel */}
      <circle cx="22" cy="22" r="21" fill={`url(#${gradId})`} />
      
      {/* 2-Tier Stacked Gold Bullion / Ingot matching reference screenshot */}
      {/* Top trapezoid tier */}
      <path
        d="M16 15H28L29.8 19H14.2L16 15Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Bottom wider trapezoid tier */}
      <path
        d="M13 20.5H31L32.8 25.5H11.2L13 20.5Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      {/* Subtle depth separator */}
      <line x1="14.5" y1="19.8" x2="29.5" y2="19.8" stroke="#CA8A04" strokeWidth="0.8" opacity="0.45" />
    </svg>
  );
}

/**
 * 4-Bar Signal Strength Meter matching reference screenshot
 */
export function SignalStrengthBars({ activeCount = 4, color = '#F59E0B' }) {
  const bars = [
    { height: 6, idx: 1 },
    { height: 9, idx: 2 },
    { height: 12, idx: 3 },
    { height: 15, idx: 4 },
  ];

  return (
    <span
      className="ait-signal-strength-bars"
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: '2.5px',
        height: '15px',
        marginRight: '6px',
        verticalAlign: 'middle',
      }}
    >
      {bars.map((b) => (
        <span
          key={b.idx}
          style={{
            width: '3.5px',
            height: `${b.height}px`,
            borderRadius: '1px',
            backgroundColor: b.idx <= activeCount ? color : 'rgba(255, 255, 255, 0.2)',
            transition: 'background-color 0.2s ease',
          }}
        />
      ))}
    </span>
  );
}

/**
 * Formats a timestamp into "Oct 6, 2026 · 10:30 UTC" format matching reference screenshot
 */
export function formatSignalDate(val) {
  if (!val) return 'Today · Active';
  if (typeof val === 'string' && val.includes('·')) return val;
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} · ${hours}:${mins} UTC`;
  } catch (e) {
    return String(val);
  }
}

/**
 * Formats price levels with standard thousands comma separators: "4,150.50"
 */
export function formatLevelPrice(val, asset = 'XAUUSD') {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'string' && val.includes('••')) return val;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return String(val);
  const isGold = (asset || '').toUpperCase().includes('XAU') || (asset || '').toUpperCase().includes('GOLD');
  if (isGold) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (num > 100) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return num.toFixed(5);
}
