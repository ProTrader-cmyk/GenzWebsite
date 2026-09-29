import { useState, useEffect } from 'react';
import { formatRelativeTime } from '../../data/mockSignals.js';
import { subscribeSignals } from '../../data/signals.js';
import { getSessionStatus } from '../../data/marketSessions.js';
import { TelegramIcon } from '../../components/ui/CategoryIcons.jsx';

const TELEGRAM_VIP_URL = 'https://t.me/Vengsopheagenz?direct';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(user) {
  const source = (user?.name || user?.email || 'Trader').trim();
  return source.split(/\s+/)[0];
}

export default function MemberDashboard({ user, onNavigate }) {
  const sessions = getSessionStatus();
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    const unsub = subscribeSignals((list) => {
      setSignals(list);
    });
    return () => unsub();
  }, []);

  const activeSignals = signals.filter((s) => s.status === 'active');
  const recentWinners = signals.filter((s) => s.status === 'tp').slice(0, 2);

  // Quick Account Compound Calculator
  const [calcCap, setCalcCap] = useState(1000);
  const [calcMonths, setCalcMonths] = useState(6);
  const monthlyRate = 0.12; // 12% target conservative monthly growth
  const compoundTotal = Math.round(calcCap * Math.pow(1 + monthlyRate, calcMonths));

  return (
    <div className="terminal-dashboard-page">
      {/* HERO EXECUTIVE BAR */}
      <div className="terminal-hero-card">
        <div className="terminal-hero-left">
          <div className="vip-badge-row">
            <span className="vip-crown-badge">👑 ELITE VIP ACCESS</span>
            <span className="vip-status-online">
              <span className="pulse-dot" /> LIVE TRADING DESK
            </span>
          </div>
          <h1 className="terminal-greeting">
            {greeting()}, {firstName(user)}
          </h1>
          <p className="terminal-sub">
            Your institutional ICT trading dashboard is live. Market sessions and signals are synced with Cambodia Time (GMT+7).
          </p>

          <div className="terminal-sessions-strip">
            <span className="sessions-strip-label">Global Sessions:</span>
            {sessions.map((s) => (
              <div key={s.key} className={`terminal-session-pill${s.open ? ' open' : ''}`}>
                <span className="session-indicator" />
                <span className="session-name">{s.label}</span>
                <span className="session-state">{s.open ? 'OPEN' : 'CLOSED'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="terminal-hero-right">
          <div className="telegram-vip-card">
            <div className="telegram-card-icon">
              <TelegramIcon width={24} height={24} />
            </div>
            <div>
              <div className="tg-card-title">VIP Telegram Stream</div>
              <div className="tg-card-sub">Instant push alerts & audio commentary</div>
            </div>
            <a
              href={TELEGRAM_VIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tg-join-btn"
            >
              Open Telegram
            </a>
          </div>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="terminal-metric-grid">
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">MONTHLY WIN RATE</span>
            <span className="metric-tag up">Verified</span>
          </div>
          <div className="metric-num">78.4%</div>
          <div className="metric-foot">Based on ICT A+ Confluence setups</div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">AVG RISK : REWARD</span>
            <span className="metric-tag brand">Min 2R Rule</span>
          </div>
          <div className="metric-num">2.41R</div>
          <div className="metric-foot">High asymmetric payout on wins</div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">ACTIVE SIGNALS</span>
            <span className="metric-tag warn">Live</span>
          </div>
          <div className="metric-num">{activeSignals.length}</div>
          <div className="metric-foot">Gold (XAU/USD) institutional setups</div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">PROFIT FACTOR</span>
            <span className="metric-tag up">Top 5%</span>
          </div>
          <div className="metric-num">2.85</div>
          <div className="metric-foot">Gross profits vs gross losses ratio</div>
        </div>
      </div>

      {/* MAIN 2-COLUMN SECTION */}
      <div className="terminal-columns-grid">
        {/* LEFT COLUMN: ACTIVE & RECENT TRADES */}
        <div className="terminal-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Institutional Setups Radar</div>
              <div className="panel-sub">Latest market entries and target projections</div>
            </div>
            <button
              type="button"
              className="panel-action-link"
              onClick={() => onNavigate('signals')}
            >
              Full Signals Terminal →
            </button>
          </div>

          <div className="panel-signals-list">
            {activeSignals.length === 0 && recentWinners.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--mute)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No Active Signals Right Now</div>
                <div>Live institutional setups appear here as soon as dropped from Admin.</div>
              </div>
            ) : (
              <>
                {activeSignals.map((s) => (
                  <div key={s.id} className="radar-signal-card active">
                    <div className="radar-card-top">
                      <div className="radar-tag-row">
                        <span className={`signal-dir-tag ${s.direction}`}>
                          {s.direction === 'buy' ? 'BUY' : 'SELL'}
                        </span>
                        <span className="radar-pair">{s.pair}</span>
                        <span className="radar-target-rr">{s.rr}R</span>
                      </div>
                      <span className="radar-live-tag">LIVE NOW</span>
                    </div>

                    <div className="radar-levels-row">
                      <div>
                        <span className="r-label">ENTRY</span>
                        <span className="r-val">{s.entry}</span>
                      </div>
                      <div>
                        <span className="r-label">SL</span>
                        <span className="r-val sl">{s.sl}</span>
                      </div>
                      <div>
                        <span className="r-label">TP</span>
                        <span className="r-val tp">{s.tp}</span>
                      </div>
                    </div>

                    <p className="radar-reason">{s.reason}</p>
                  </div>
                ))}

                {recentWinners.map((s) => (
                  <div key={s.id} className="radar-signal-card tp-hit">
                    <div className="radar-card-top">
                      <div className="radar-tag-row">
                        <span className={`signal-dir-tag ${s.direction}`}>
                          {s.direction === 'buy' ? 'BUY' : 'SELL'}
                        </span>
                        <span className="radar-pair">{s.pair}</span>
                        <span className="radar-target-rr">+{s.rr}R</span>
                      </div>
                      <span className="radar-win-tag">✓ TP HIT</span>
                    </div>
                    <div className="radar-levels-row">
                      <div>
                        <span className="r-label">ENTRY</span>
                        <span className="r-val">{s.entry}</span>
                      </div>
                      <div>
                        <span className="r-label">TP HIT</span>
                        <span className="r-val tp">{s.tp}</span>
                      </div>
                      <div>
                        <span className="r-label">CLOSED</span>
                        <span className="r-val">{formatRelativeTime(s.minutesAgo)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PIP COACH TEASER & COMPOUND CALCULATOR */}
        <div className="terminal-column-stack">
          {/* PIP COACH CARD */}
          <div className="terminal-panel ai-panel">
            <div className="ai-panel-glow" />
            <div className="panel-header">
              <div className="ai-badge-header">
                <span className="ai-bot-icon">🤖</span>
                <div>
                  <div className="panel-title">Pip Trading Coach</div>
                  <div className="panel-sub">Taught directly by GenZ to help all traders succeed</div>
                </div>
              </div>
            </div>

            <p className="ai-teaser-desc">
              Have questions about current market structure, liquidity sweeps, or where to put your Stop Loss? Pip is available 24/7.
            </p>

            <div className="ai-quick-prompts">
              <button
                type="button"
                className="ai-prompt-chip"
                onClick={() => onNavigate('pip')}
              >
                "How to trade the London-NY overlap?" →
              </button>
              <button
                type="button"
                className="ai-prompt-chip"
                onClick={() => onNavigate('pip')}
              >
                "Calculate lot size for $1,000 account" →
              </button>
            </div>

            <button
              type="button"
              className="open-pip-btn"
              onClick={() => onNavigate('pip')}
            >
              Open Pip Trading Terminal
            </button>
          </div>

          {/* CAPITAL COMPOUNDING CALCULATOR */}
          <div className="terminal-panel compound-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Growth & Compounding Model</div>
                <div className="panel-sub">Project your capital with disciplined 1%-2% risk</div>
              </div>
            </div>

            <div className="compound-controls">
              <div>
                <label className="compound-label">STARTING CAPITAL ($)</label>
                <input
                  type="number"
                  min="200"
                  step="100"
                  value={calcCap}
                  onChange={(e) => setCalcCap(Math.max(100, Number(e.target.value)))}
                  className="compound-input"
                />
              </div>

              <div>
                <label className="compound-label">TIME HORIZON ({calcMonths} MONTHS)</label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={calcMonths}
                  onChange={(e) => setCalcMonths(Number(e.target.value))}
                  className="compound-slider"
                />
              </div>
            </div>

            <div className="compound-result-box">
              <div>
                <div className="compound-res-label">PROJECTED CAPITAL</div>
                <div className="compound-res-val">${compoundTotal.toLocaleString()}</div>
              </div>
              <div className="compound-res-gain">
                +${(compoundTotal - calcCap).toLocaleString()} ({Math.round(((compoundTotal - calcCap) / calcCap) * 100)}%)
              </div>
            </div>
            <div className="compound-note">
              *Model assumes conservative 12% monthly growth targeting 2R per setup with strict 1% risk discipline.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
