import { useState, useEffect } from 'react';
import { formatRelativeTime, PLAN_SIGNAL_ACCESS } from '../../data/mockSignals.js';
import { subscribeSignals, updateSignalStatus } from '../../data/signals.js';
import {
  fetchLivePrice,
  calcTradeProgress,
  evaluateSignalOutcome,
  subscribeLiveTicks,
  formatSpotPrice,
} from '../../services/marketPriceService.js';
import { GoldAssetEmblem, SignalStrengthBars, formatSignalDate, formatLevelPrice } from '../../components/ui/SignalEmblems.jsx';
import PairLogo from '../../components/ui/PairLogo.jsx';

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

  const asset = (signal.pair || 'XAUUSD').toUpperCase();
  const isGold = asset.includes('XAU') || asset.includes('GOLD');
  const dir = (signal.direction || 'BUY').toUpperCase();
  const isBuy = dir === 'BUY';
  const tf = (signal.timeframe || signal.mode || '15m').toUpperCase();
  const cleanTf = (tf.match(/\b(1M|5M|15M|30M|1H|4H|D1)\b/i)?.[0] || '15M').toUpperCase();
  const timeframeTag = `INTRADAY (${cleanTf})`;
  const assetSubtitle = isGold ? `Gold · ${cleanTf.toLowerCase()}` : `${asset.replace('USD', '')} · ${cleanTf.toLowerCase()}`;

  const entryNum = parseFloat(signal.entry) || 0;
  const slNum = parseFloat(signal.sl) || 0;
  const tpNum = parseFloat(signal.tp) || 0;

  const isWin = signal.status === 'tp';
  const isLoss = signal.status === 'sl';
  const isActive = signal.status === 'active';
  const conf = signal.confidence || (isBuy ? 88 : 84);

  return (
    <div className={`ait-sig-card ${isBuy ? 'buy-card' : 'sell-card'}`} style={{ margin: '0 auto 16px' }}>
      {/* Top Row: Asset Icon & Title + Timeframe Tag */}
      <div className="ait-card-top-row">
        <div className="ait-card-asset-info">
          <div className="ait-card-asset-icon">
            {isGold ? <GoldAssetEmblem size={42} /> : <PairLogo pair={asset} />}
          </div>
          <div className="ait-card-asset-titles">
            <h4 className="ait-card-symbol-title">{asset}</h4>
            <span className="ait-card-symbol-sub">{assetSubtitle}</span>
          </div>
        </div>
        <div className="ait-card-timeframe-tag">{timeframeTag}</div>
      </div>

      {/* Centered Direction & Desk Badges */}
      <div className="ait-card-center-badges">
        <span className={`ait-dir-pill ${isBuy ? 'buy' : 'sell'}`}>
          <span className="ait-dir-dot">●</span>
          <span>{dir}</span>
        </span>
        <span className={`ait-desk-pill ${isBuy ? 'buy' : 'sell'}`}>DESK</span>
      </div>

      {/* Price Levels: Entry, Target, Stop */}
      <div className="ait-card-levels-vertical ait-mono">
        <div className="ait-level-row">
          <span className="ait-level-key">Entry</span>
          <span className="ait-level-val entry">{formatLevelPrice(entryNum, asset)}</span>
        </div>
        <div className="ait-level-row">
          <span className="ait-level-key">Target</span>
          <span className="ait-level-val target">{formatLevelPrice(tpNum, asset)}</span>
        </div>
        <div className="ait-level-row">
          <span className="ait-level-key">Stop</span>
          <span className="ait-level-val stop">{formatLevelPrice(slNum, asset)}</span>
        </div>
      </div>

      {/* Setup Conviction Pill with Chevron Dropdown */}
      <div className="ait-card-setup-toggle-wrapper">
        <button
          type="button"
          className={`ait-card-setup-pill ${open ? 'open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          title="Click to view setup confluences & thesis"
        >
          <span className="ait-setup-dot">●</span>
          <span className="ait-setup-text">High conviction setup</span>
          <span className={`ait-setup-chevron ${open ? 'rotated' : ''}`}>⌄</span>
        </button>
      </div>

      {/* Expandable Confluences Drawer */}
      {open && (
        <div className="ait-card-expanded-drawer">
          <div className="ait-drawer-head">
            <span className="ait-drawer-title">Setup Rationale</span>
            <span className="ait-drawer-model">{signal.session || 'London KZ'}</span>
          </div>
          <div className="ait-drawer-items">
            <div className="ait-drawer-item">
              <span className="ait-drawer-tag">Rationale</span>
              <span className="ait-drawer-desc">{signal.reason || 'Institutional SMC setup with liquidity raid and displacement confirmation.'}</span>
            </div>
            <div className="ait-drawer-item highlight">
              <span className="ait-drawer-tag">Rule</span>
              <span className="ait-drawer-desc">When price hits 1:1 R:R, move Stop Loss to BE. Strict 0.03 Lot size execution.</span>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Divider */}
      <div className="ait-card-hr" />

      {/* Meta Section: Confidence, Opened, Closed */}
      <div className="ait-card-meta-list">
        <div className="ait-meta-row">
          <span className="ait-meta-key">Confidence</span>
          <div className="ait-meta-val confidence">
            <SignalStrengthBars activeCount={Math.min(4, Math.max(2, Math.round((conf / 100) * 4)))} />
            <span className="ait-confidence-pct">{conf}%</span>
          </div>
        </div>

        <div className="ait-meta-row">
          <span className="ait-meta-key">Opened</span>
          <span className="ait-meta-val date ait-mono">{formatSignalDate(signal.publishedAt || signal.timestamp)}</span>
        </div>

        <div className="ait-meta-row">
          <span className="ait-meta-key">Closed</span>
          <span className="ait-meta-val date ait-mono">
            {isWin ? 'Completed · Target Hit' : isLoss ? 'Closed · Stopped Out' : 'Active · In-Progress'}
          </span>
        </div>
      </div>

      {/* Bottom Tags & Status Note */}
      <div className="ait-card-footer-tags">
        <div className="ait-tags-chips-row">
          <span className="ait-tag-chip default">Trending</span>
          <span className="ait-tag-chip outline">Auto (AI picks best)</span>
        </div>

        <div className="ait-status-note-banner">
          <span>
            {isWin
              ? 'Target reached — trade won'
              : isLoss
              ? 'Stopped out at risk limit'
              : 'Active setup — tracking market liquidity'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MemberSignals({ plan = 'elite' }) {
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
    const activePairs = ['XAUUSD'];

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

  const sorted = signals.filter((s) => /XAU|GOLD/i.test(s.pair || '')).sort((a, b) => (a.minutesAgo ?? 0) - (b.minutesAgo ?? 0));
  const filtered = sorted.filter((s) => statusFilter === 'all' || s.status === statusFilter);
  const visibilityPercent = Math.round((PLAN_SIGNAL_ACCESS[plan] ?? 1) * 100);

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
        {visibilityPercent < 100 && !loading && (
          <div style={{ gridColumn: '1 / -1', color: 'var(--mute)', fontSize: 12, textAlign: 'right' }}>
            {plan === 'starter' ? 'Starter' : 'Pro'} members see {visibilityPercent}% of signals published each day.
          </div>
        )}
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
