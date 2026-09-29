import { useState, useEffect } from 'react';
import { formatRelativeTime } from '../../data/mockSignals.js';
import { subscribeSignals, updateSignalStatus } from '../../data/signals.js';
import { fetchLivePrice, calcTradeProgress, evaluateSignalOutcome } from '../../services/marketPriceService.js';
import GoldChart from '../../components/GoldChart.jsx';

function formatSpotPrice(pair, price) {
  if (price == null || isNaN(price)) return '---';
  const p = String(pair || 'XAUUSD').toUpperCase();
  if (p.includes('JPY')) return Number(price).toFixed(3);
  if (p.includes('EUR') || p.includes('GBP') || p.includes('AUD')) return Number(price).toFixed(5);
  return Number(price).toFixed(2);
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Signals' },
  { key: 'active', label: '⚡ Active Setups' },
  { key: 'tp', label: '✓ Hit Take Profit' },
  { key: 'sl', label: '✕ Hit Stop Loss' },
];

function SignalCard({ signal, accountBalance, riskPercent, onCopy, livePrice }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lot sizing for Gold (1 pip = $0.10 per 0.01 lot)
  const slDist = Math.abs(signal.entry - signal.sl);
  const riskDollars = (accountBalance * (riskPercent / 100));
  const rawLots = slDist > 0 ? (riskDollars / (slDist * 100)) : 0.01;
  const lots = Math.max(0.01, Math.round(rawLots * 100) / 100).toFixed(2);
  const profitDollars = (riskDollars * signal.rr).toFixed(2);

  function copyToClipboard() {
    const text = `${signal.pair} ${signal.direction.toUpperCase()} | Entry: ${signal.entry} | SL: ${signal.sl} | TP: ${signal.tp} (R:R ${signal.rr}R)`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    if (onCopy) onCopy(signal.pair);
    setTimeout(() => setCopied(false), 2200);
  }

  const isWin = signal.status === 'tp';
  const isLoss = signal.status === 'sl';
  const isActive = signal.status === 'active';

  return (
    <div className={`terminal-signal-card ${signal.status}`}>
      <div className="signal-card-header">
        <div className="signal-header-left">
          <span className={`signal-dir-tag ${signal.direction}`}>
            {signal.direction === 'buy' ? '▲ BUY' : '▼ SELL'}
          </span>
          <span className="signal-asset-title">{signal.pair}</span>
          <span className="signal-rr-badge">{signal.rr}R Target</span>
        </div>

        <div className="signal-header-right">
          <span className={`signal-status-pill ${signal.status}`}>
            {isActive && <span className="status-live-pulse" />}
            {isActive ? 'ACTIVE SIGNAL' : isWin ? '✓ TAKE PROFIT HIT' : 'STOPPED OUT'}
          </span>
          <span className="signal-time-ago">{formatRelativeTime(signal.minutesAgo)}</span>
        </div>
      </div>

      <div className="signal-matrix-grid">
        <div className="signal-cell entry">
          <div className="cell-label">ENTRY LEVEL</div>
          <div className="cell-value">{signal.entry.toFixed(1)}</div>
        </div>

        <div className="signal-cell sl">
          <div className="cell-label">STOP LOSS</div>
          <div className="cell-value sl-val">{signal.sl.toFixed(1)}</div>
          <div className="cell-sub">Risk: -${riskDollars.toFixed(0)}</div>
        </div>

        <div className="signal-cell tp">
          <div className="cell-label">TAKE PROFIT</div>
          <div className="cell-value tp-val">{signal.tp.toFixed(1)}</div>
          <div className="cell-sub">Profit: +${profitDollars}</div>
        </div>

        <div className="signal-cell calc">
          <div className="cell-label">CALCULATED LOT</div>
          <div className="cell-value lot-val">{lots} Lots</div>
          <div className="cell-sub">@ {riskPercent}% risk</div>
        </div>
      </div>

      {/* LIVE MARKET SPOT TRACKER & TP PROGRESS */}
      {isActive && livePrice && (
        <div className="signal-live-tracker-strip">
          <div className="tracker-strip-info">
            <div className="live-spot-val">
              <span className="spot-dot" /> Live Spot: <strong>${formatSpotPrice(signal.pair, livePrice)}</strong>
            </div>
            <div className="live-progress-val">
              {calcTradeProgress(signal, livePrice).progressPct}% to Target ({calcTradeProgress(signal, livePrice).pipsToTp} pips remaining)
            </div>
          </div>
          <div className="tracker-progress-track">
            <div
              className="tracker-progress-fill"
              style={{ width: `${calcTradeProgress(signal, livePrice).progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="signal-bottom-bar">
        <div className="signal-confluence-tags">
          <span className="confluence-tag">ICT Model</span>
          <span className="confluence-tag">15m FVG</span>
          <span className="confluence-tag">OTE 61.8%</span>
        </div>

        <div className="signal-action-buttons">
          <button
            type="button"
            className="signal-details-btn"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide Analysis ↑' : 'Trade Rationale ↓'}
          </button>

          <button
            type="button"
            className={`signal-copy-btn${copied ? ' copied' : ''}`}
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy Setup</span>
              </>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="signal-expansion-panel">
          <div className="expansion-label">Institutional Setup Rationale:</div>
          <p className="expansion-text">{signal.reason}</p>
          <div className="expansion-rules">
            <strong>Management Rule:</strong> When price hits 1:1 Risk-to-Reward, move Stop Loss to Breakeven (BE). Take 50% partials at TP1.
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountBalance, setAccountBalance] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [toast, setToast] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [showChart, setShowChart] = useState(true);

  useEffect(() => {
    const unsub = subscribeSignals((list) => {
      setSignals(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPrices() {
      const activePairs = Array.from(new Set(['XAUUSD', ...signals.map((s) => s.pair || 'XAUUSD')]));
      const nextPrices = {};
      for (const p of activePairs) {
        const price = await fetchLivePrice(p);
        if (price) nextPrices[p] = price;
      }
      if (cancelled) return;
      setLivePrices((prev) => ({ ...prev, ...nextPrices }));

      // Auto-evaluate active signals against live OANDA tick
      const activeList = signals.filter((s) => s.status === 'active');
      for (const s of activeList) {
        const currentPrice = nextPrices[s.pair || 'XAUUSD'];
        if (!currentPrice) continue;
        const outcome = evaluateSignalOutcome(s, currentPrice);
        if (outcome === 'tp' || outcome === 'sl') {
          try {
            await updateSignalStatus(s.id, outcome);
          } catch (err) {
            console.warn('Auto signal outcome update error:', err);
          }
        }
      }
    }

    loadPrices();
    const interval = setInterval(loadPrices, 3500); // 3.5s real-time tick streaming
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [signals]);

  const sorted = [...signals].sort((a, b) => (a.minutesAgo ?? 0) - (b.minutesAgo ?? 0));
  const filtered = sorted.filter((s) => statusFilter === 'all' || s.status === statusFilter);

  function handleSignalCopy(pair) {
    setToast(`Copied ${pair} setup to clipboard! Ready to paste into MetaTrader.`);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="terminal-signals-page">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-notification">
          <span>✓ {toast}</span>
        </div>
      )}

      {/* SIZING CALCULATOR BAR */}
      <div className="terminal-risk-bar">
        <div className="risk-bar-title-wrap">
          <div className="risk-bar-icon">⚡</div>
          <div>
            <div className="risk-bar-title">Live Position Size Engine</div>
            <div className="risk-bar-sub">Signals automatically compute exact lot sizes for your account.</div>
          </div>
        </div>

        <div className="risk-inputs-cluster">
          <div className="risk-input-group">
            <label>YOUR CAPITAL ($)</label>
            <input
              type="number"
              min="100"
              step="100"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Math.max(100, Number(e.target.value)))}
              className="risk-num-input"
            />
          </div>

          <div className="risk-input-group">
            <label>RISK PER TRADE</label>
            <div className="risk-pct-selector">
              {[0.5, 1.0, 2.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`risk-pct-pill${riskPercent === pct ? ' active' : ''}`}
                  onClick={() => setRiskPercent(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="risk-display-group">
            <div className="risk-val-label">MAX RISK / TRADE</div>
            <div className="risk-val-display">${(accountBalance * (riskPercent / 100)).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="terminal-filter-row">
        <div className="terminal-chips">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`terminal-filter-chip${statusFilter === f.key ? ' active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {livePrices['XAUUSD'] && (
            <div className="tracker-pulse-badge" style={{ padding: '3px 10px' }}>
              <span className="pulse-dot" /> SPOT GOLD: ${formatSpotPrice('XAUUSD', livePrices['XAUUSD'])}
            </div>
          )}
          <div className="signals-count-tag">
            Showing <strong>{filtered.length}</strong> verified signals
          </div>
        </div>
      </div>

      {/* LIVE OANDA TRADINGVIEW CHART */}
      <div className="terminal-chart-section">
        <div className="terminal-chart-header">
          <div className="terminal-chart-title-wrap">
            <span className="terminal-chart-icon">📈</span>
            <div>
              <div className="terminal-chart-title">
                Live OANDA Market Chart
                <span className="live-chart-feed-badge">
                  <span className="pulse-dot" /> REAL-TIME OANDA FEED
                </span>
                {livePrices['XAUUSD'] && (
                  <span className="live-chart-price-pill">
                    <span className="pulse-dot" /> OANDA SPOT: ${formatSpotPrice('XAUUSD', livePrices['XAUUSD'])}
                  </span>
                )}
              </div>
              <div className="terminal-chart-sub">
                Official OANDA institutional data feed (Cambodia GMT+7). Defaulted to <strong>⚡ 1m (Live Ticks)</strong> so active candles fluctuate live on every tick.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="terminal-chart-toggle-btn"
            onClick={() => setShowChart((v) => !v)}
          >
            {showChart ? 'Collapse Chart ▴' : 'Expand Chart ▾'}
          </button>
        </div>

        {showChart && (
          <div className="terminal-chart-body">
            <GoldChart initialSymbol="gold" />
          </div>
        )}
      </div>

      {/* SIGNALS LIST */}
      <div className="terminal-signal-feed">
        {loading ? (
          <div className="admin-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>📡</div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Connecting to Live Signal Desk...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg1)', border: '1px solid var(--faint)', borderRadius: '16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '8px' }}>
              No Active Signals Right Now
            </div>
            <div style={{ fontSize: '13px', color: 'var(--mute)', maxWidth: '440px', margin: '0 auto', lineHeight: '1.6' }}>
              Live institutional setups will appear here in real time as soon as they are published from the Desk during London & New York Killzones.
            </div>
          </div>
        ) : (
          filtered.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              accountBalance={accountBalance}
              riskPercent={riskPercent}
              onCopy={handleSignalCopy}
              livePrice={livePrices[signal.pair || 'XAUUSD']}
            />
          ))
        )}
      </div>
    </div>
  );
}
