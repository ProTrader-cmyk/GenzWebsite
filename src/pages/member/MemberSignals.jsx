import { useState, useEffect } from 'react';
import { formatRelativeTime } from '../../data/mockSignals.js';
import { subscribeSignals, updateSignalStatus } from '../../data/signals.js';
import {
  fetchLivePrice,
  calcTradeProgress,
  evaluateSignalOutcome,
  subscribeLiveTicks,
  formatSpotPrice,
} from '../../services/marketPriceService.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Signals' },
  { key: 'active', label: '⚡ Active Setups' },
  { key: 'tp', label: '✓ Hit Take Profit' },
  { key: 'sl', label: '✕ Hit Stop Loss' },
];

function extractConfluenceTags(signal) {
  if (Array.isArray(signal.tags) && signal.tags.length > 0) {
    return signal.tags;
  }

  const tags = [];
  const text = `${signal.reason || ''} ${signal.session || ''}`.toLowerCase();

  // 1. Session / Timing tag
  if (signal.session) {
    if (signal.session.toLowerCase().includes('london')) tags.push('London KZ');
    else if (signal.session.toLowerCase().includes('new york') || signal.session.toLowerCase().includes('ny')) tags.push('NY KZ');
    else if (signal.session.toLowerCase().includes('asian')) tags.push('Asian Session');
    else tags.push(signal.session.split('(')[0].trim());
  }

  // 2. Setup model / pattern tags extracted from actual rationale
  if (text.includes('fvg') || text.includes('fair value gap')) {
    tags.push('15m FVG');
  }
  if (text.includes('sweep') || text.includes('liquidity') || text.includes('raid')) {
    tags.push('Liquidity Sweep');
  }
  if (text.includes('order block') || text.includes(' ob')) {
    tags.push('Order Block');
  }
  if (text.includes('mss') || text.includes('shift') || text.includes('bos') || text.includes('displacement')) {
    tags.push('MSS Structure');
  }
  if (text.includes('ote') || text.includes('61.8') || text.includes('fib')) {
    tags.push('OTE 61.8%');
  }
  if (text.includes('discount')) {
    tags.push('Discount Zone');
  } else if (text.includes('premium')) {
    tags.push('Premium Zone');
  }
  if (text.includes('breaker')) {
    tags.push('Breaker Block');
  }

  // Fallback defaults if reason was brief
  if (tags.length === 0) {
    tags.push('ICT Model', `${signal.direction === 'buy' ? 'Bullish' : 'Bearish'} Bias`);
  } else if (tags.length === 1) {
    tags.push('ICT Model');
  }

  return tags.slice(0, 4);
}

function SignalCard({ signal, livePrice }) {
  const [open, setOpen] = useState(false);

  const isGold = (signal.pair || '').toUpperCase().includes('XAU') || (signal.pair || '').toUpperCase().includes('GOLD');
  const pipMultiplier = isGold ? 10 : 10000;
  const entryNum = parseFloat(signal.entry) || 0;
  const slNum = parseFloat(signal.sl) || 0;
  const tpNum = parseFloat(signal.tp) || 0;
  const slPips = Math.round(Math.abs(entryNum - slNum) * pipMultiplier * 10) / 10;
  const tpPips = Math.round(Math.abs(tpNum - entryNum) * pipMultiplier * 10) / 10;

  const displayRr = signal.rr ? (String(signal.rr).includes(':') ? signal.rr : `1:${signal.rr}`) : '1:2';
  const formatVal = (val) => {
    if (!val || isNaN(val)) return '—';
    return isGold ? val.toFixed(2) : (val < 10 ? val.toFixed(4) : val.toFixed(2));
  };

  const isWin = signal.status === 'tp';
  const isLoss = signal.status === 'sl';
  const isActive = signal.status === 'active';
  const confluenceTags = extractConfluenceTags(signal);

  return (
    <div className={`terminal-signal-card ${signal.status}`}>
      <div className="signal-card-header">
        <div className="signal-header-left">
          <span className={`signal-dir-tag ${signal.direction}`}>
            {signal.direction === 'buy' ? '▲ BUY' : '▼ SELL'}
          </span>
          <span className="signal-asset-title">{signal.pair}</span>
          <span className="signal-rr-badge">{displayRr} R:R Target</span>
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
          <div className="cell-value">{formatVal(entryNum)}</div>
          <div className="cell-sub">Execution Price</div>
        </div>

        <div className="signal-cell sl">
          <div className="cell-label">STOP LOSS</div>
          <div className="cell-value sl-val">{formatVal(slNum)}</div>
          <div className="cell-sub">Risk: {slPips} pips</div>
        </div>

        <div className="signal-cell tp">
          <div className="cell-label">TAKE PROFIT</div>
          <div className="cell-value tp-val">{formatVal(tpNum)}</div>
          <div className="cell-sub">Target: {tpPips} pips</div>
        </div>

        <div className="signal-cell calc">
          <div className="cell-label">RISK : REWARD</div>
          <div className="cell-value lot-val">{displayRr}</div>
          <div className="cell-sub">{signal.session || 'Institutional Setup'}</div>
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
          {confluenceTags.map((tag, idx) => (
            <span key={idx} className="confluence-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="signal-action-buttons">
          <button
            type="button"
            className="signal-details-btn"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide Analysis ↑' : 'Trade Rationale ↓'}
          </button>
        </div>
      </div>

      {open && (
        <div className="signal-expansion-panel">
          <div className="expansion-label">Institutional Setup Rationale:</div>
          <p className="expansion-text">{signal.reason || 'Institutional SMC setup with liquidity raid and displacement confirmation.'}</p>
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
  const [toast, setToast] = useState(null);
  const [livePrices, setLivePrices] = useState({});

  useEffect(() => {
    const unsub = subscribeSignals((list) => {
      setSignals(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const activePairs = Array.from(new Set(['XAUUSD', ...signals.map((s) => s.pair || 'XAUUSD')]));

    // 1. Initial snapshot fetch
    async function loadSnapshot() {
      const nextPrices = {};
      for (const p of activePairs) {
        const price = await fetchLivePrice(p);
        if (price) nextPrices[p] = price;
      }
      if (cancelled) return;
      setLivePrices((prev) => ({ ...prev, ...nextPrices }));
    }
    loadSnapshot();

    // 2. Direct real-time WebSocket tick stream from TradingView OANDA feed (matches chart candle 1:1)
    const unsubTicks = subscribeLiveTicks(activePairs, (incoming) => {
      if (cancelled) return;
      setLivePrices((prev) => ({ ...prev, ...incoming }));

      // Instant TP / SL outcome evaluation on every single live tick
      const activeList = signals.filter((s) => s.status === 'active');
      for (const s of activeList) {
        const pair = s.pair || 'XAUUSD';
        const currentPrice = incoming[pair];
        if (!currentPrice) continue;
        const outcome = evaluateSignalOutcome(s, currentPrice);
        if (outcome === 'tp' || outcome === 'sl') {
          updateSignalStatus(s.id, outcome).catch(() => {});
        }
      }
    });

    // 3. Fallback poll every 8 seconds if WebSocket misses a symbol
    const interval = setInterval(loadSnapshot, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubTicks();
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

      {/* SIGNALS LIST */}
      <div className="terminal-signal-feed">
        {loading ? (
          <div className="admin-empty" style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>📡</div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Connecting to Live Signal Desk...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', background: 'var(--bg1)', border: '1px solid var(--faint)', borderRadius: '16px' }}>
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
              livePrice={livePrices[signal.pair || 'XAUUSD']}
            />
          ))
        )}
      </div>
    </div>
  );
}
