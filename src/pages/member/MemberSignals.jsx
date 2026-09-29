import { useState } from 'react';
import { MOCK_SIGNALS, formatRelativeTime } from '../../data/mockSignals.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Signals' },
  { key: 'active', label: '⚡ Active Setups' },
  { key: 'tp', label: '✓ Hit Take Profit' },
  { key: 'sl', label: '✕ Hit Stop Loss' },
];

function SignalCard({ signal, accountBalance, riskPercent, onCopy }) {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountBalance, setAccountBalance] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [toast, setToast] = useState(null);

  const sorted = [...MOCK_SIGNALS].sort((a, b) => a.minutesAgo - b.minutesAgo);
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
        <div className="signals-count-tag">
          Showing <strong>{filtered.length}</strong> verified signals
        </div>
      </div>

      {/* SIGNALS LIST */}
      <div className="terminal-signal-feed">
        {filtered.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            accountBalance={accountBalance}
            riskPercent={riskPercent}
            onCopy={handleSignalCopy}
          />
        ))}
      </div>
    </div>
  );
}
