const MARKETS = ['gold', 'silver', 'oil', 'usd'];
const MARKET_ICON = { gold: '🟡', silver: '⚪', oil: '🛢️', usd: '💵' };

export default function EconomicFilters({
  highImpactOnly,
  onHighImpactChange,
  selectedMarkets,
  onToggleMarket,
  currency,
  onCurrencyChange,
  availableCurrencies,
  t,
}) {
  return (
    <div className="econ-filters">
      <div className="econ-filter-row">
        <button
          className={`econ-chip ${highImpactOnly ? 'econ-chip-active econ-chip-high' : ''}`}
          onClick={() => onHighImpactChange(!highImpactOnly)}
        >
          🔴 {t.highImpactOnly}
        </button>
        {MARKETS.map((m) => (
          <button
            key={m}
            className={`econ-chip ${selectedMarkets.has(m) ? 'econ-chip-active' : ''}`}
            onClick={() => onToggleMarket(m)}
          >
            {MARKET_ICON[m]} {t[m]}
          </button>
        ))}

        {availableCurrencies.length > 0 && (
          <select className="econ-currency-select" value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
            <option value="all">{t.allCurrencies}</option>
            {availableCurrencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
