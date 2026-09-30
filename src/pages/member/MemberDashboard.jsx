import { useState, useEffect } from 'react';
import { subscribeSignals } from '../../data/signals.js';
import { getSessionStatus } from '../../data/marketSessions.js';
import { fetchLivePrice, formatSpotPrice, subscribeGoldMarketSnapshot } from '../../services/marketPriceService.js';
import { TelegramIcon } from '../../components/ui/CategoryIcons.jsx';

const TELEGRAM_VIP_URL = 'https://t.me/Vengsopheagenz?direct';
const NEWS_API_URL = (import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app').replace(/\/$/, '');

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
  const [signals, setSignals] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [goldSnapshot, setGoldSnapshot] = useState({ price: null, change: null, changePercent: null, status: 'loading' });
  const [upcomingUsdNews, setUpcomingUsdNews] = useState({ status: 'loading', events: [] });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const sessions = getSessionStatus(now);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeGoldMarketSnapshot((snapshot) => {
      setGoldSnapshot((current) => ({ ...current, ...snapshot, status: 'live' }));
    });
    fetchLivePrice('XAUUSD')
      .then((price) => {
        if (!cancelled && price) {
          setGoldSnapshot((current) => current.price ? current : { ...current, price, status: 'delayed' });
        } else if (!cancelled && !price) {
          setGoldSnapshot((current) => current.price ? current : { ...current, status: 'error' });
        }
      })
      .catch(() => {
        if (!cancelled) setGoldSnapshot((current) => current.price ? current : { ...current, status: 'error' });
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${NEWS_API_URL}/api/calendar?lang=en`)
      .then((response) => {
        if (!response.ok) throw new Error(`Calendar API returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const currentTime = Date.now();
        const events = (data.events || [])
          .filter((event) => event.currency === 'USD' && event.impact === 'high' && new Date(event.time).getTime() >= currentTime)
          .sort((a, b) => new Date(a.time) - new Date(b.time));
        setUpcomingUsdNews({ status: events.length ? 'loaded' : 'empty', events });
      })
      .catch(() => {
        if (!cancelled) setUpcomingUsdNews({ status: 'error', events: [] });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsub = subscribeSignals((list) => {
      setSignals(list);
    });
    return () => unsub();
  }, []);

  const activeSignals = signals.filter((s) => s.status === 'active');
  const tpSignals = signals.filter((s) => s.status === 'tp');
  const slSignals = signals.filter((s) => s.status === 'sl');
  const closedSignals = signals.filter((s) => s.status === 'tp' || s.status === 'sl');

  // Dynamic Win Rate calculation based on real trade outcomes
  const totalClosed = closedSignals.length;
  const winRateNum = totalClosed > 0 ? (tpSignals.length / totalClosed) * 100 : 0;
  const winRateDisplay = totalClosed > 0 ? `${winRateNum.toFixed(1)}%` : '0.0%';

  // Standard Target R:R (1:2 setup rule)
  const avgRrDisplay = '1:2 R';

  // Dynamic Profit Factor calculation: Gross Wins (in R) / Gross Losses (in R, each SL = 1.0R)
  const grossProfitR = tpSignals.reduce((acc, s) => acc + (parseFloat(s.rr) || 2.0), 0);
  const grossLossR = slSignals.length * 1.0;
  let profitFactorDisplay = '0.00';
  if (grossLossR > 0 && grossProfitR > 0) {
    profitFactorDisplay = (grossProfitR / grossLossR).toFixed(2);
  } else if (grossLossR === 0 && grossProfitR > 0) {
    profitFactorDisplay = grossProfitR.toFixed(2);
  } else if (grossLossR > 0 && grossProfitR === 0) {
    profitFactorDisplay = '0.00';
  } else {
    profitFactorDisplay = '0.00';
  }

  const nextUsdEvents = upcomingUsdNews.events
    .filter((event) => new Date(event.time).getTime() >= now.getTime())
    .slice(0, 3);

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

      {/* METRIC STRIP (DYNAMICALLY CALCULATED FROM REAL SIGNALS) */}
      <div className="terminal-metric-grid">
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">MONTHLY WIN RATE</span>
            <span className={`metric-tag ${totalClosed === 0 ? 'brand' : winRateNum >= 50 ? 'up' : 'dn'}`}>
              {totalClosed === 0 ? 'Standby' : winRateNum >= 50 ? 'Verified' : `${tpSignals.length}W - ${slSignals.length}L`}
            </span>
          </div>
          <div className="metric-num">{winRateDisplay}</div>
          <div className="metric-foot">
            {totalClosed === 0
              ? 'Awaiting first closed setup'
              : `${tpSignals.length} win${tpSignals.length === 1 ? '' : 's'} / ${totalClosed} total closed setup${totalClosed === 1 ? '' : 's'}`}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">AVG RISK : REWARD</span>
            <span className="metric-tag brand">1:2 Setup</span>
          </div>
          <div className="metric-num">{avgRrDisplay}</div>
          <div className="metric-foot">Strict 1:2 Risk to Reward standard</div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">ACTIVE SIGNALS</span>
            <span className={`metric-tag ${activeSignals.length > 0 ? 'warn' : 'brand'}`}>
              {activeSignals.length > 0 ? 'Live' : 'Standby'}
            </span>
          </div>
          <div className="metric-num">{activeSignals.length}</div>
          <div className="metric-foot">
            {activeSignals.length > 0
              ? 'Gold (XAU/USD) institutional setups'
              : 'Waiting for next Killzone setup'}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">PROFIT FACTOR</span>
            <span className={`metric-tag ${grossLossR > 0 && grossProfitR === 0 ? 'dn' : parseFloat(profitFactorDisplay) >= 1.5 ? 'up' : 'brand'}`}>
              {grossLossR > 0 && grossProfitR === 0
                ? `-${grossLossR.toFixed(1)}R`
                : parseFloat(profitFactorDisplay) >= 1.5
                ? 'Profitable'
                : 'Live Sync'}
            </span>
          </div>
          <div className="metric-num">{profitFactorDisplay}</div>
          <div className="metric-foot">
            {totalClosed > 0
              ? `${tpSignals.length} TP hit • ${slSignals.length} SL hit (-${grossLossR.toFixed(1)}R)`
              : 'Gross profits vs gross losses ratio'}
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN SECTION */}
      <div className="terminal-columns-grid">
        {/* LEFT COLUMN: ACTIVE & RECENT TRADES */}
        <div className="terminal-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Institutional Setups Radar</div>
              <div className="panel-sub">Latest active market entries and target projections</div>
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
            {activeSignals.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--mute)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No Active Signals Right Now</div>
                <div>Live institutional setups appear here as soon as dropped from Admin.</div>
              </div>
            ) : (
              <>
                {/* ACTIVE LIVE TRADES */}
                {activeSignals.map((s) => (
                  <div key={s.id} className="radar-signal-card active">
                    <div className="radar-card-top">
                      <div className="radar-tag-row">
                        <span className={`signal-dir-tag ${s.direction}`}>
                          {s.direction === 'buy' ? '▲ BUY' : '▼ SELL'}
                        </span>
                        <span className="radar-pair">{s.pair}</span>
                        <span className="radar-target-rr">1:2 R:R</span>
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

                    {s.reason && <p className="radar-reason">{s.reason}</p>}
                  </div>
                ))}

              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE GOLD PRICE & UPCOMING USD NEWS */}
        <div className="terminal-column-stack">
          <div className="terminal-panel gold-snapshot-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Gold Market Snapshot</div>
                <div className="panel-sub">XAU/USD spot price and daily move</div>
              </div>
              <span className={`gold-snapshot-status ${goldSnapshot.status}`}>
                {goldSnapshot.status === 'live' ? 'LIVE' : goldSnapshot.status === 'delayed' ? 'SPOT' : goldSnapshot.status === 'error' ? 'OFFLINE' : 'WAITING'}
              </span>
            </div>
            {goldSnapshot.price ? (
              <div className="gold-snapshot-content">
                <div className="gold-snapshot-price">${formatSpotPrice('XAUUSD', goldSnapshot.price)}</div>
                {typeof goldSnapshot.changePercent === 'number' ? (
                  <div className={`gold-snapshot-change ${goldSnapshot.changePercent >= 0 ? 'up' : 'down'}`}>
                    {typeof goldSnapshot.change === 'number' ? `${goldSnapshot.change >= 0 ? '+' : ''}${goldSnapshot.change.toFixed(2)} ` : ''}
                    ({goldSnapshot.changePercent >= 0 ? '+' : ''}{goldSnapshot.changePercent.toFixed(2)}%) today
                  </div>
                ) : (
                  <div className="gold-snapshot-change muted">Daily move is waiting for the live quote.</div>
                )}
                <div className="gold-snapshot-updated">
                  {goldSnapshot.status === 'live' ? 'Live quote · OANDA / TradingView' : 'Spot price · live feed reconnecting'}
                </div>
              </div>
            ) : (
              <div className="dashboard-empty-state">
                {goldSnapshot.status === 'error' ? 'Gold price is temporarily unavailable.' : 'Connecting to the live Gold quote...'}
              </div>
            )}
          </div>

          <div className="terminal-panel usd-news-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Upcoming USD News</div>
                <div className="panel-sub">High impact events · Cambodia time (GMT+7)</div>
              </div>
              <span className="usd-news-badge">USD</span>
            </div>
            {upcomingUsdNews.status === 'loading' ? (
              <div className="dashboard-empty-state">Loading the economic calendar...</div>
            ) : nextUsdEvents.length ? (
              <div className="usd-news-list">
                {nextUsdEvents.map((event) => (
                  <div className="usd-news-event" key={event.key}>
                    <span className="usd-news-impact">HIGH</span>
                    <div className="usd-news-event-main">
                      <div className="usd-news-event-title">{event.event}</div>
                      <div className="usd-news-event-time">
                        {new Intl.DateTimeFormat('en-GB', {
                          timeZone: 'Asia/Phnom_Penh', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
                        }).format(new Date(event.time))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                {upcomingUsdNews.status !== 'error'
                  ? 'No upcoming high impact USD events in the calendar.'
                  : 'The economic calendar is temporarily unavailable.'}
              </div>
            )}
            <button type="button" className="panel-action-link usd-news-signals" onClick={() => onNavigate('signals')}>
              Check live signals {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
