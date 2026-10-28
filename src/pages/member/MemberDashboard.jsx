import { useEffect, useState } from 'react';
import { subscribeSignals } from '../../data/signals.js';
import { fetchLivePrice, formatSpotPrice, subscribeGoldMarketSnapshot } from '../../services/marketPriceService.js';
import '../../styles/memberDashboard.css';
import '../../styles/memberCalendar.css';
import '../../styles/memberActiveSignals.css';

const NEWS_API_URL = (import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app').replace(/\/$/, '');

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function formatActivityTime(signal) {
  const raw = signal.updatedAt || signal.closedAt || signal.createdAt || signal.timestamp;
  const date = raw?.toDate ? raw.toDate() : new Date(raw || NaN);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function displayPrice(value) {
  if (value === null || value === undefined || value === '') return '—';
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : String(value);
}

export default function MemberDashboard({ user, onNavigate }) {
  const [signals, setSignals] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [gold, setGold] = useState({ price: null, changePercent: null, status: 'loading' });
  const [calendar, setCalendar] = useState({ status: 'loading', events: [] });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => subscribeSignals(setSignals), []);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeGoldMarketSnapshot((snapshot) => {
      if (active) setGold((current) => ({ ...current, ...snapshot, status: 'live' }));
    });
    fetchLivePrice('XAUUSD').then((price) => {
      if (active && price) setGold((current) => current.price ? current : { ...current, price, status: 'delayed' });
      else if (active && !price) setGold((current) => current.price ? current : { ...current, status: 'error' });
    }).catch(() => {
      if (active) setGold((current) => current.price ? current : { ...current, status: 'error' });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${NEWS_API_URL}/api/calendar?lang=en`).then((response) => {
      if (!response.ok) throw new Error(`Calendar API returned ${response.status}`);
      return response.json();
    }).then((data) => {
      if (!active) return;
      const events = (data.events || []).filter((event) => event.currency === 'USD' && event.impact === 'high' && new Date(event.time).getTime() >= Date.now()).sort((a, b) => new Date(a.time) - new Date(b.time));
      setCalendar({ status: 'loaded', events });
    }).catch(() => { if (active) setCalendar({ status: 'error', events: [] }); });
    return () => { active = false; };
  }, []);

  const goldSignals = signals.filter((signal) => /XAU|GOLD/i.test(signal.pair || ''));
  const activeSignals = goldSignals.filter((signal) => signal.status === 'active');
  const activeRecentSignals = [...activeSignals].sort((a, b) => {
    const time = (signal) => { const value = signal.updatedAt || signal.closedAt || signal.createdAt || signal.timestamp; return value?.toMillis ? value.toMillis() : new Date(value || 0).getTime(); };
    return time(b) - time(a);
  }).slice(0, 4);
  const upcoming = calendar.events.filter((event) => new Date(event.time).getTime() >= now.getTime()).slice(0, 3);
  const name = (user?.name || user?.email || 'Trader').trim().split(/\s+/)[0];

  return (
    <div className="member-overview">
      <section className="member-welcome-card">
        <div className="member-welcome-copy">
          <span className="member-eyebrow">YOUR TRADING COMMUNITY</span>
          <h1>{greeting()}, {name} <span aria-hidden="true">👋</span></h1>
          <p>Catch up on your community, market updates, and latest signals.</p>
          <div className="member-welcome-links"><button onClick={() => onNavigate('live-room')}>Explore the Live Room <span>↗</span></button><span>Member access <b>● Active</b></span></div>
        </div>
        <div className="member-welcome-art" aria-hidden="true"><svg viewBox="0 0 330 160" role="presentation"><path d="M8 130 42 105 68 116 103 72 135 91 173 48 204 65 244 22 274 42 316 8"/><path d="M8 145h315M8 110h315M8 75h315M8 40h315"/><g><path d="M43 80v44m-8-30h16m24-5v43m-8-22h16m24-63v55m-8-34h16m24 6v46m-8-24h16m24-62v45m-8-28h16m24-18v56m-8-35h16m24-39v44m-8-25h16m24-39v53m-8-30h16"/></g></svg></div>
      </section>

      <div className="member-overview-grid">
        <section className="member-overview-panel member-overview-stats">
          <div className="member-panel-heading"><div><h2>Member Overview</h2><p>Your latest platform activity</p></div><span className="member-subtle-badge">LIVE DATA</span></div>
          <div className="member-stat-grid">
            <article className="member-stat-card"><span className="member-stat-icon blue">↗</span><div><span>Total signals</span><strong>{goldSignals.length}</strong><small>Gold setups published</small></div></article>
            <article className="member-stat-card"><span className="member-stat-icon green">◉</span><div><span>Active signals</span><strong>{activeSignals.length}</strong><small>{activeSignals.length ? 'Currently active' : 'No active setups'}</small></div></article>
            <article className="member-stat-card"><span className="member-stat-icon violet">◎</span><div><span>Closed signals</span><strong>{goldSignals.filter((signal) => ['tp', 'sl', 'win', 'loss'].includes(signal.status)).length}</strong><small>Outcomes recorded</small></div></article>
          </div>
          <div className="member-market-strip"><span className="member-market-symbol">XAU</span><div><b>Gold market</b><small>{gold.status === 'live' ? 'Live quote' : gold.status === 'delayed' ? 'Spot quote' : gold.status === 'error' ? 'Quote unavailable' : 'Connecting to quote'}</small></div><strong>{gold.price ? `$${formatSpotPrice('XAUUSD', gold.price)}` : '—'}</strong>{typeof gold.changePercent === 'number' && <em className={gold.changePercent >= 0 ? 'positive' : 'negative'}>{gold.changePercent >= 0 ? '+' : ''}{gold.changePercent.toFixed(2)}%</em>}</div>
        </section>

        <section className="member-overview-panel member-announcement-panel"><div className="member-panel-heading"><div><h2>Latest Announcement</h2><p>News and updates from your team</p></div><span className="member-panel-icon">♢</span></div><div className="member-empty-announcement"><span>✦</span><b>No new announcements</b><p>Updates from your team will show here.</p></div></section>

        <section className="member-overview-panel member-streams-panel"><div className="member-panel-heading"><div><h2>Upcoming Live Streams</h2><p>Learn alongside the trading community</p></div><button className="member-text-action" onClick={() => onNavigate('live-room')}>Open Live Room <span>→</span></button></div><div className="member-empty-stream"><span className="member-video-icon">▷</span><div><b>No sessions scheduled</b><p>Upcoming streams will appear here when they’re announced.</p></div><button onClick={() => onNavigate('live-room')}>View room</button></div></section>

        <section className="member-overview-panel member-activity-panel"><div className="member-panel-heading"><div><h2>Active Signals</h2><p>Current setups with entry, stop loss, and take profit</p></div><button className="member-text-action" onClick={() => onNavigate('signals')}>View history <span>→</span></button></div>{activeRecentSignals.length ? <div className="member-activity-list">{activeRecentSignals.map((signal) => { const direction = String(signal.direction || '').toLowerCase(); const isBuy = direction === 'buy'; const directionClass = isBuy ? 'buy' : direction === 'sell' ? 'sell' : ''; const entry = signal.entry ?? signal.entry_price ?? signal.entryPrice; const stop = signal.sl ?? signal.stop_loss ?? signal.stopLoss; const target = signal.tp1 ?? signal.tp ?? signal.take_profit ?? signal.takeProfit ?? signal.target; const timeframe = signal.timeframe || signal.time_frame || signal.interval || (String(signal.style || '').toLowerCase().includes('scalp') ? '5m' : '15m'); return <article className="member-active-signal-row" key={signal.id}><div className={`member-activity-dot ${directionClass}`}>{isBuy ? '↑' : direction === 'sell' ? '↓' : '•'}</div><div className="member-active-signal-info"><div className="member-active-signal-head"><b>{signal.pair || 'XAUUSD'}</b><span className={`member-signal-tag ${directionClass || 'neutral'}`}>{direction ? direction.toUpperCase() : '—'}</span><span className="member-signal-active-label">ACTIVE</span></div><small>{timeframe} · {signal.style || signal.strategy || 'Trading setup'} · {formatActivityTime(signal)}</small><div className="member-active-signal-levels"><span>ENTRY <b>{displayPrice(entry)}</b></span><span>SL <b className="negative">{displayPrice(stop)}</b></span><span>TP <b className="positive">{displayPrice(target)}</b></span></div></div></article>; })}</div> : <div className="member-activity-empty">There are no active signals right now. New setups will appear here when published.</div>}</section>

        <section className="member-overview-panel member-calendar-panel"><div className="member-panel-heading"><div><h2>Market Calendar</h2><p>Upcoming high-impact USD events · Phnom Penh</p></div><span className="member-calendar-chip">USD</span></div>{calendar.status === 'loading' ? <div className="member-calendar-empty">Loading economic calendar…</div> : calendar.status === 'error' ? <div className="member-calendar-empty">The economic calendar is temporarily unavailable.</div> : upcoming.length ? <div className="member-calendar-list">{upcoming.map((event) => <article key={event.key}><span className="member-impact-dot"/><div><b>{event.event}</b><small>{new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Phnom_Penh', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(event.time))}</small></div><span>HIGH</span></article>)}</div> : <div className="member-calendar-empty">No upcoming high-impact USD events.</div>}</section>
      </div>
    </div>
  );
}
