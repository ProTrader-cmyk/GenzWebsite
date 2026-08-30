// Two small badge kinds used on the Economic Calendar:
//  - ImpactBadge: the event's own overall impact level (Finnhub's low/medium/high)
//  - MarketImpactBadge: a heuristic per-market impact chip (Gold/Silver/Oil/USD)

const IMPACT_META = {
  low: { icon: '🟢', cls: 'imp-low' },
  medium: { icon: '🟠', cls: 'imp-medium' },
  high: { icon: '🔴', cls: 'imp-high' },
};

export function ImpactBadge({ level, label }) {
  const meta = IMPACT_META[level] || IMPACT_META.low;
  return (
    <span className={`impact-badge ${meta.cls}`}>
      {meta.icon} {label}
    </span>
  );
}

const MARKET_ICON = { gold: '🟡', silver: '⚪', oil: '🛢️', usd: '💵' };
const LEVEL_CLASS = { low: 'mib-low', medium: 'mib-medium', high: 'mib-high', veryhigh: 'mib-veryhigh' };

export default function MarketImpactBadge({ market, level, marketLabel, levelLabel }) {
  if (!level || level === 'none') return null;
  return (
    <span className={`mib ${LEVEL_CLASS[level] || 'mib-low'}`}>
      <span className="mib-icon">{MARKET_ICON[market]}</span>
      <span className="mib-market">{marketLabel}</span>
      <span className="mib-level">{levelLabel}</span>
    </span>
  );
}
