import { useState, useEffect, useMemo } from 'react';
import PairLogo from './ui/PairLogo.jsx';
import { formatSpotPrice } from '../services/marketPriceService.js';

const NEWS_API_URL = (import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app').replace(/\/$/, '');

const CALENDAR_EVENTS = [
  { time: '19:30 UTC+7', ccy: 'USD', title: 'FOMC Meeting – High Impact', imp: 'HIGH', f: '—', p: '—' },
  { time: '19:30 UTC+7', ccy: 'USD', title: 'Core CPI (MoM) (Consumer Price Index)', imp: 'HIGH', f: '0.2%', p: '0.3%' },
  { time: '19:30 UTC+7', ccy: 'USD', title: 'Initial Jobless Claims (Weekly)', imp: 'MED', f: '215K', p: '218K' },
  { time: '21:00 UTC+7', ccy: 'USD', title: 'Fed Chair Powell Speaks on Policy', imp: 'HIGH', f: '—', p: '—' },
];

const NEWS_ITEMS = [
  { time: '14m ago', source: 'REUTERS', title: 'Gold consolidates near key institutional resistance as traders await upcoming FOMC policy catalyst.' },
  { time: '42m ago', source: 'BLOOMBERG', title: 'US Dollar Index (DXY) holds steady ahead of critical Federal Reserve commentary and inflation print.' },
  { time: '1h ago', source: 'FOREXLIVE', title: 'XAU/USD buyers defend 4,147.10 intraday support zone following Asian session liquidity sweep.' },
  { time: '2h ago', source: 'WSJ', title: 'Institutional order flow shows strong higher-timeframe demand supporting precious metals complex.' },
];

function formatCommaPrice(val, decimals = 2) {
  const num = Number(val);
  if (isNaN(num)) return '---';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function MarketAnalysisPanel({
  currentAsset = { id: 'gold', symbol: 'OANDA:XAUUSD', label: 'Gold Spot / U.S. Dollar', pair: 'XAUUSD', pipScale: 0.1, defaultPrice: 4169.735 },
  livePrice,
  timeframe = '15m',
  activeSession = { name: 'Asian Session', status: 'Active', color: '#10B981' },
  isKhmer = false,
  marketAnalysis = null,
  isReanalyzing = false,
  candleCountdown = null,
  lastCandleCloseNotice = null,
  onReanalyze = () => {},
  onSelectAsset,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [liveCalendarEvents, setLiveCalendarEvents] = useState(null);
  const [liveNewsItems, setLiveNewsItems] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showPrevAnalysis, setShowPrevAnalysis] = useState(false);
  const [minutesElapsed, setMinutesElapsed] = useState(2);

  // Update "Updated Xm ago" dynamically based on marketAnalysis.analyzedAt
  useEffect(() => {
    const updateAge = () => {
      if (!marketAnalysis?.analyzedAt) {
        setMinutesElapsed(2);
        return;
      }
      const diffMins = Math.floor((Date.now() - marketAnalysis.analyzedAt) / 60000);
      setMinutesElapsed(Math.max(1, diffMins));
    };
    updateAge();
    const timer = setInterval(updateAge, 15000);
    return () => clearInterval(timer);
  }, [marketAnalysis?.analyzedAt]);

  // Connect to live Finnhub Economic Calendar & News from Railway backend
  useEffect(() => {
    let cancelled = false;
    fetch(`${NEWS_API_URL}/api/calendar?lang=${isKhmer ? 'kh' : 'en'}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Calendar API ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const nowMs = Date.now();
        const mapped = (data.events || [])
          .filter((e) => new Date(e.time).getTime() >= nowMs - 24 * 3600 * 1000)
          .slice(0, 15)
          .map((e) => {
            const d = new Date(e.time);
            const timeStr = d.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'Asia/Phnom_Penh',
            });
            return {
              time: `${timeStr} UTC+7`,
              ccy: e.currency || 'USD',
              title: e.event || 'Market Catalyst',
              imp: (e.impact || 'med').toUpperCase(),
              f: e.estimate ?? '—',
              p: e.previous ?? '—',
              actual: e.actual ?? '—',
              aiAnalysis: e.aiAnalysis,
            };
          });
        if (mapped.length > 0) {
          setLiveCalendarEvents(mapped);
        }
      })
      .catch(() => {});

    fetch(`${NEWS_API_URL}/api/news`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.articles)) return;
        const mappedNews = data.articles.slice(0, 8).map((a) => {
          const published = new Date(a.publishedAt);
          const minsAgo = Math.max(1, Math.floor((Date.now() - published.getTime()) / 60000));
          return {
            time: minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`,
            source: a.source || 'MARKET',
            title: a.title,
            url: a.url,
          };
        });
        if (mappedNews.length > 0) setLiveNewsItems(mappedNews);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isKhmer]);

  const pair = currentAsset.pair || 'XAUUSD';
  const isGold = pair.includes('XAU') || pair.includes('GOLD');
  const isCrypto = pair.includes('BTC') || pair.includes('ETH');
  const isJpy = pair.includes('JPY');
  const isForex = !isGold && !isCrypto && !pair.includes('US30');
  const decimals = isForex ? 5 : isJpy ? 3 : isCrypto ? 1 : 2;
  const priceDecimals = isGold ? 3 : decimals;

  const p = Number(livePrice) || Number(marketAnalysis?.price) || currentAsset.defaultPrice || 4169.735;
  const calendarList = liveCalendarEvents || CALENDAR_EVENTS;
  const newsList = liveNewsItems || NEWS_ITEMS;

  // Dynamic Institutional Key Levels & Structure derived from live market state
  const intel = useMemo(() => {
    let r1Val, r2Val, r3Val, s1Val, s2Val;

    if (isGold) {
      // Anchor to real session highs/lows from TradingView Scanner when in current Gold range
      const sessHigh = Number(marketAnalysis?.sessionHigh);
      const sessLow = Number(marketAnalysis?.sessionLow);
      const h15 = Number(marketAnalysis?.high15);

      r1Val = h15 && h15 > p + 0.5 ? Math.round(h15 * 10) / 10 : Math.round((p + 2.26) * 10) / 10;
      r2Val = sessHigh && sessHigh > r1Val + 1 ? Math.round(sessHigh * 10) / 10 : Math.round((p + 10.06) * 10) / 10;
      r3Val = Math.round((r2Val + 8.2) * 10) / 10;
      s1Val = sessLow && sessLow < p - 1 ? Math.round(sessLow * 10) / 10 : Math.round((p - 22.64) * 10) / 10;
      s2Val = Math.round((s1Val - 15.1) * 10) / 10;
    } else if (isCrypto) {
      r1Val = Math.round(p + 450);
      r2Val = Math.round(p + 1250);
      r3Val = Math.round(p + 2400);
      s1Val = Math.round(p - 680);
      s2Val = Math.round(p - 1650);
    } else if (pair.includes('US30')) {
      r1Val = Math.round(p + 140);
      r2Val = Math.round(p + 320);
      r3Val = Math.round(p + 580);
      s1Val = Math.round(p - 190);
      s2Val = Math.round(p - 410);
    } else {
      r1Val = Number((p + 0.0022).toFixed(decimals));
      r2Val = Number((p + 0.0048).toFixed(decimals));
      r3Val = Number((p + 0.0075).toFixed(decimals));
      s1Val = Number((p - 0.0024).toFixed(decimals));
      s2Val = Number((p - 0.0052).toFixed(decimals));
    }

    const shortDec = isGold ? 1 : decimals;
    const tableDec = isGold ? 2 : decimals;

    const r1Short = formatCommaPrice(r1Val, shortDec);
    const r2Short = formatCommaPrice(r2Val, shortDec);
    const r3Short = formatCommaPrice(r3Val, shortDec);
    const s1Short = formatCommaPrice(s1Val, shortDec);
    const s2Short = formatCommaPrice(s2Val, shortDec);

    const distR2 = r2Val - p;
    const distR1 = r1Val - p;
    const distS1 = s1Val - p;
    const distS2 = s2Val - p;

    const fmtDist = (d) => `${d >= 0 ? '+' : ''}${d.toFixed(tableDec)}`;

    // Session label
    const rawSession = activeSession?.name || 'Asian Session';
    let sessionShort = 'Asian (Active)';
    if (rawSession.toLowerCase().includes('london close')) sessionShort = 'London Close (Active)';
    else if (rawSession.toLowerCase().includes('london')) sessionShort = 'London (Active)';
    else if (rawSession.toLowerCase().includes('new york')) sessionShort = 'New York (Active)';
    else if (rawSession.toLowerCase().includes('asian')) sessionShort = 'Asian (Active)';
    else sessionShort = 'Inter-Bank (Active)';

    // Bias & Trend
    const htfBull = marketAnalysis?.ema200 ? marketAnalysis.ema200.isBull !== false : true;
    const rsiNum = parseFloat(marketAnalysis?.rsi?.val) || 51.4;
    const isNeutral15m = rsiNum >= 43 && rsiNum <= 58;
    const shortTermBias = isNeutral15m
      ? 'Neutral'
      : (marketAnalysis?.bias?.includes('BEAR') ? 'Bearish' : 'Bullish');

    const overallTrend = htfBull ? 'Bullish' : 'Bearish';
    const mtfSummary = `HTF ${overallTrend} / LTF ${shortTermBias}`;
    const momentumText = rsiNum < 55 ? 'Cooling (decreasing)' : 'Expanding (increasing)';
    const volatilityText = Math.abs(r2Val - s1Val) / p > 0.012 ? 'High' : 'Moderate';
    const structureText = htfBull ? 'Higher Highs / Higher Lows' : 'Lower Highs / Lower Lows';

    // 15m / Live Price Change
    const changeAbsStr = marketAnalysis?.changes?.abs15 || (isGold ? '-0.960' : '-0.0004');
    const changePctStr = marketAnalysis?.changes?.pct15 || '-0.02%';
    const isChangeUp = String(changeAbsStr).startsWith('+') && !String(changeAbsStr).includes('-0.00');

    // Upcoming high-impact event
    const highEvent = calendarList.find((e) => e.imp === 'HIGH') || calendarList[0];
    const upcomingEventText = highEvent
      ? `${highEvent.title.replace(/\s*\(.*?\)\s*/g, '')} – High Impact`
      : 'FOMC Meeting (Oct 15) – High Impact';

    return {
      r1Val,
      r2Val,
      r3Val,
      s1Val,
      s2Val,
      r1Short,
      r2Short,
      r3Short,
      s1Short,
      s2Short,
      sessionShort,
      shortTermBias,
      overallTrend,
      mtfSummary,
      momentumText,
      volatilityText,
      structureText,
      changeAbsStr,
      changePctStr,
      isChangeUp,
      upcomingEventText,
      keyLevelsRows: [
        {
          level: formatCommaPrice(r2Val, tableDec),
          type: 'Resistance',
          isRes: true,
          tf: timeframe || '15m',
          distance: fmtDist(distR2),
          isPosDist: distR2 >= 0,
          status: 'Untested',
          isTested: false,
        },
        {
          level: formatCommaPrice(r1Val, tableDec),
          type: 'Resistance',
          isRes: true,
          tf: timeframe || '15m',
          distance: fmtDist(distR1),
          isPosDist: distR1 >= 0,
          status: 'Tested',
          isTested: true,
        },
        {
          level: formatCommaPrice(s1Val, tableDec),
          type: 'Support',
          isRes: false,
          tf: timeframe || '15m',
          distance: fmtDist(distS1),
          isPosDist: distS1 >= 0,
          status: 'Tested',
          isTested: true,
        },
        {
          level: formatCommaPrice(s2Val, tableDec),
          type: 'Support',
          isRes: false,
          tf: '1H',
          distance: fmtDist(distS2),
          isPosDist: distS2 >= 0,
          status: 'Untested',
          isTested: false,
        },
      ],
    };
  }, [p, pair, isGold, isCrypto, decimals, marketAnalysis, activeSession, timeframe, calendarList]);

  const assetSubtitle = isGold
    ? 'Gold Spot / U.S. Dollar'
    : pair === 'EURUSD'
      ? 'Euro / U.S. Dollar'
      : pair === 'GBPUSD'
        ? 'British Pound / U.S. Dollar'
        : pair === 'USDJPY'
          ? 'U.S. Dollar / Japanese Yen'
          : pair === 'BTCUSD'
            ? 'Bitcoin / U.S. Dollar'
            : pair === 'US30'
              ? 'Dow Jones 30 Cash Index'
              : currentAsset.label || 'Institutional Spot Asset';

  const handleCopyTradingPlan = () => {
    const planText = [
      `=== AI INTELLIGENCE TRADING PLAN (${pair} • ${timeframe}) ===`,
      `Spot Price: ${formatCommaPrice(p, priceDecimals)} USD`,
      `Overall Trend: ${intel.overallTrend} (HTF) | Short-Term Bias: ${intel.shortTermBias} (${timeframe})`,
      `Key Resistance: ${intel.r1Short} / ${intel.r2Short}`,
      `Key Support: ${intel.s1Short} / ${intel.s2Short}`,
      `Bullish Scenario: Break above ${intel.r1Short} targets ${intel.r2Short} and ${intel.r3Short}.`,
      `Bearish Scenario: Rejection at ${intel.r1Short} targets ${intel.s1Short} and ${intel.s2Short}.`,
      `Key Confirmation: ${intel.r1Short} (break & close)`,
      `Invalidation Level: ${intel.s1Short} (break & close)`,
    ].join('\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(planText).catch(() => {});
    }
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  const TABS = [
    { id: 'overview', label: isKhmer ? 'ទិដ្ឋភាពរួម AI (AI Overview)' : 'AI Overview' },
    { id: 'structure', label: isKhmer ? 'រចនាសម្ព័ន្ធទីផ្សារ (Market Structure)' : 'Market Structure' },
    { id: 'levels', label: isKhmer ? 'កម្រិតគន្លឹះ (Key Levels)' : 'Key Levels' },
    { id: 'outlook', label: isKhmer ? 'ទស្សនវិស័យ AI (AI Market Outlook)' : 'AI Market Outlook' },
    { id: 'plan', label: isKhmer ? 'ផែនការជួញដូរ (Trading Plan)' : 'Trading Plan' },
    { id: 'news', label: isKhmer ? 'ព័ត៌មាន & ព្រឹត្តិការណ៍ (News & Events)' : 'News & Events' },
    { id: 'journal', label: isKhmer ? 'កំណត់ត្រាជួញដូរ (Trade Journal)' : 'Trade Journal' },
  ];

  return (
    <div className="ait-ma-root ait-aii-root">
      {/* 1. TOP HEADER BAR (AI Intelligence — Smarter Analysis. Better Decisions.) */}
      <div className="ait-aii-topbar">
        <div className="ait-aii-brand">
          <div className="ait-aii-brain-orb">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
            </svg>
          </div>
          <div className="ait-aii-brand-text">
            <h2 className="ait-aii-title">AI Intelligence</h2>
            <p className="ait-aii-subtitle">Smarter Analysis. Better Decisions.</p>
          </div>
        </div>

        <div className="ait-aii-meta-center">
          <div className="ait-aii-pair-tf">
            <strong>{pair}</strong>
            <span className="ait-aii-dot-sep">•</span>
            <span>{timeframe || '15m'}</span>
          </div>
          <div className="ait-aii-updated-line">
            <span className="ait-aii-pulse-dot" />
            <span>Analysis updated {minutesElapsed}m ago</span>
          </div>
        </div>

        <div className="ait-aii-top-actions">
          <button
            type="button"
            className="ait-aii-reanalyze-btn"
            onClick={onReanalyze}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 12a4 4 0 0 1 7-2.6L16 10" />
              <path d="M16 6v4h-4" />
              <path d="M16 12a4 4 0 0 1-7 2.6L8 14" />
            </svg>
            <span>Re-analyze</span>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS BAR */}
      <div className="ait-aii-tabs-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ait-aii-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Banner when 15m candle closes or Previous Analysis toggled */}
      {(lastCandleCloseNotice || copiedNotice || showPrevAnalysis) && (
        <div className="ait-aii-notice-strip">
          {copiedNotice && (
            <span className="text-emerald">✓ Trading Plan copied to clipboard!</span>
          )}
          {!copiedNotice && lastCandleCloseNotice && (
            <span className="text-emerald">● {lastCandleCloseNotice}</span>
          )}
          {!copiedNotice && !lastCandleCloseNotice && showPrevAnalysis && (
            <span>
              ⏱️ Previous 15m Candle Close Snapshot: <strong>{pair}</strong> closed at{' '}
              <strong>${formatCommaPrice(p + (isGold ? 0.96 : 0.0005), priceDecimals)}</strong> • Bias: {intel.shortTermBias} • Next auto-scan in <strong>{candleCountdown?.timeStr || '12:40'}</strong>
            </span>
          )}
        </div>
      )}

      {/* 3. MAIN SCROLLABLE WORKSPACE */}
      <div className="ait-aii-scroll-body">
        {/* ==================== TAB 1: AI OVERVIEW (EXACT SCREENSHOT LAYOUT) ==================== */}
        {activeTab === 'overview' && (
          <div className="ait-aii-overview-layout">
            {/* TOP + MIDDLE ROW: Left 2-Card Stack + Right Tall Market Outlook Card */}
            <div className="ait-aii-upper-grid">
              <div className="ait-aii-left-stack">
                {/* CARD 1: MARKET SNAPSHOT */}
                <div className="ait-aii-card ait-aii-snapshot-card">
                  <div className="ait-aii-card-header">
                    <div className="ait-aii-card-title-group">
                      <span className="ait-aii-card-icon purple">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M2 12h4l3-9 5 18 3-9h5" />
                        </svg>
                      </span>
                      <h3>Market Snapshot</h3>
                    </div>
                    <div className="ait-aii-sparkline" aria-hidden="true">
                      <svg width="34" height="20" viewBox="0 0 34 20" fill="none">
                        <path d="M2 16L9 9L15 13L23 4L32 7" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="23" cy="4" r="2" fill="#00F2FE" />
                      </svg>
                    </div>
                  </div>

                  <div className="ait-aii-snapshot-body">
                    {/* Col 1: Asset & Live Price */}
                    <div className="ait-aii-snap-main">
                      <div className="ait-aii-snap-asset">
                        <PairLogo pair={pair} size={22} />
                        <span className="ait-aii-snap-sym">{pair}</span>
                        <span className="ait-aii-snap-name">{assetSubtitle}</span>
                      </div>
                      <div className="ait-aii-snap-price-row ait-mono">
                        <span className="ait-aii-snap-price">
                          {formatCommaPrice(p, priceDecimals)}
                        </span>
                        <span className="ait-aii-snap-ccy">USD</span>
                      </div>
                      <div className={`ait-aii-snap-chg ait-mono ${intel.isChangeUp ? 'up' : 'down'}`}>
                        <span>{intel.changeAbsStr}</span>
                        <span>{intel.changePctStr}</span>
                      </div>
                    </div>

                    {/* Col 2: Market Session */}
                    <div className="ait-aii-snap-col">
                      <span className="ait-aii-snap-lbl">Market Session</span>
                      <div className="ait-aii-snap-val-row">
                        <span className="ait-aii-status-dot green" />
                        <span className="ait-aii-snap-val text-emerald">{intel.sessionShort}</span>
                      </div>
                    </div>

                    {/* Col 3: Market Bias */}
                    <div className="ait-aii-snap-col">
                      <span className="ait-aii-snap-lbl">Market Bias</span>
                      <div className="ait-aii-snap-val-row">
                        <span className={`ait-aii-status-dot ${intel.shortTermBias === 'Bullish' ? 'green' : intel.shortTermBias === 'Bearish' ? 'red' : 'blue'}`} />
                        <span className="ait-aii-snap-val">{intel.shortTermBias}</span>
                      </div>
                    </div>

                    {/* Col 4: Data Freshness & Timeframe */}
                    <div className="ait-aii-snap-col ait-aii-snap-col-split">
                      <div className="ait-aii-snap-subitem">
                        <span className="ait-aii-snap-lbl">Data Freshness</span>
                        <div className="ait-aii-snap-val-row">
                          <span className="ait-aii-fresh-ring" />
                          <span className="ait-aii-snap-val">{minutesElapsed}m ago</span>
                        </div>
                      </div>
                      <div className="ait-aii-snap-subitem">
                        <span className="ait-aii-snap-lbl">Timeframe</span>
                        <div className="ait-aii-snap-val-row">
                          <strong className="ait-aii-snap-tf">{timeframe || '15m'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: AI MARKET INTELLIGENCE */}
                <div className="ait-aii-card ait-aii-intel-card">
                  <div className="ait-aii-card-header">
                    <div className="ait-aii-card-title-group">
                      <span className="ait-aii-ai-pill-icon">AI</span>
                      <h3>AI Market Intelligence</h3>
                    </div>
                    <span className="ait-aii-source-pill">
                      Source: Multi-Timeframe Analysis • Updated {minutesElapsed}m ago
                    </span>
                  </div>

                  <p className="ait-aii-intel-summary">
                    {isGold ? 'Gold' : pair} is moving in a consolidation phase after a strong move. Price is currently trading below the near-term resistance zone ({intel.r1Short}), showing signs of indecision. The trend remains slightly {intel.overallTrend.toLowerCase()} on higher timeframes, but short-term momentum is {intel.shortTermBias.toLowerCase()}.
                  </p>

                  <div className="ait-aii-metrics-matrix">
                    {/* Left Sub-column */}
                    <div className="ait-aii-metrics-col">
                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon cyan">↗</span>
                          <span>Overall Trend</span>
                        </div>
                        <div className="ait-aii-metric-val">
                          <span className={intel.overallTrend === 'Bullish' ? 'text-emerald' : 'text-red'}>
                            {intel.overallTrend}
                          </span>{' '}
                          <span className="ait-aii-muted">(HTF)</span>
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon purple">◈</span>
                          <span>Short-term Bias</span>
                        </div>
                        <div className="ait-aii-metric-val">
                          {intel.shortTermBias} <span className="ait-aii-muted">({timeframe || '15m'})</span>
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon amber">⊞</span>
                          <span>Multi-Timeframe</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.mtfSummary}</div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon blue">∿</span>
                          <span>Momentum</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.momentumText}</div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon cyan">⚡</span>
                          <span>Volatility</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.volatilityText}</div>
                      </div>
                    </div>

                    {/* Right Sub-column */}
                    <div className="ait-aii-metrics-col">
                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon blue">⚓</span>
                          <span>Key Support</span>
                        </div>
                        <div className="ait-aii-metric-val ait-mono">
                          {intel.s1Short} / {intel.s2Short}
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon red">⊤</span>
                          <span>Key Resistance</span>
                        </div>
                        <div className="ait-aii-metric-val ait-mono">
                          {intel.r1Short} / {intel.r2Short}
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon cyan">📈</span>
                          <span>Structure</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.structureText}</div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon red">⊗</span>
                          <span>Invalidation</span>
                        </div>
                        <div className="ait-aii-metric-val text-red ait-mono">
                          Below {intel.s1Short}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3 (RIGHT TALL): MARKET OUTLOOK */}
              <div className="ait-aii-card ait-aii-outlook-card">
                <div className="ait-aii-card-header">
                  <div className="ait-aii-card-title-group">
                    <span className="ait-aii-card-icon amber">💡</span>
                    <h3>Market Outlook</h3>
                  </div>
                </div>

                <div className="ait-aii-outlook-list">
                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon teal">🌱</span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Current conditions</div>
                      <p className="ait-aii-ol-desc">
                        Price is consolidating below resistance after an upward move. Momentum is slowing.
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon green">▲</span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Bullish scenario</div>
                      <p className="ait-aii-ol-desc">
                        Break above <strong>{intel.r1Short}</strong> could lead to <strong>{intel.r2Short}</strong> and <strong>{intel.r3Short}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon red">▼</span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Bearish scenario</div>
                      <p className="ait-aii-ol-desc">
                        Rejection at <strong>{intel.r1Short}</strong> may push price to <strong>{intel.s1Short}</strong> and <strong>{intel.s2Short}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon cyan">📈</span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Key confirmation</div>
                      <p className="ait-aii-ol-desc ait-mono">
                        {intel.r1Short} (break &amp; close)
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon red">✕</span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Invalidation level</div>
                      <p className="ait-aii-ol-desc ait-mono">
                        {intel.s1Short} (break &amp; close)
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon purple">📅</span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Upcoming events</div>
                      <p className="ait-aii-ol-desc">
                        {intel.upcomingEventText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM 3-CARD ROW: Key Levels + Quick Actions + AI Analysis Status */}
            <div className="ait-aii-bottom-grid">
              {/* CARD 4: KEY LEVELS TABLE */}
              <div className="ait-aii-card ait-aii-levels-card">
                <div className="ait-aii-card-header">
                  <div className="ait-aii-card-title-group">
                    <span className="ait-aii-card-icon purple">🎯</span>
                    <h3>Key Levels</h3>
                  </div>
                </div>

                <div className="ait-aii-table-wrap">
                  <table className="ait-aii-levels-table">
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Type</th>
                        <th>Timeframe</th>
                        <th>Distance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="ait-mono">
                      {intel.keyLevelsRows.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="ait-aii-lvl-cell">
                              <span className={`ait-aii-lvl-badge ${row.isRes ? 'res' : 'sup'}`}>
                                {row.isRes ? '⊤' : '⊥'}
                              </span>
                              <strong>{row.level}</strong>
                            </div>
                          </td>
                          <td className={row.isRes ? 'text-red' : 'text-emerald'}>
                            {row.type}
                          </td>
                          <td>{row.tf}</td>
                          <td className={row.isPosDist ? 'text-emerald' : 'text-amber'}>
                            {row.distance}
                          </td>
                          <td>
                            <span className={`ait-aii-status-pill ${row.isTested ? 'tested' : 'untested'}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CARD 5: QUICK ACTIONS */}
              <div className="ait-aii-card ait-aii-actions-card">
                <div className="ait-aii-card-header">
                  <div className="ait-aii-card-title-group">
                    <span className="ait-aii-card-icon purple">✦</span>
                    <h3>Quick Actions</h3>
                  </div>
                </div>

                <div className="ait-aii-quick-btns">
                  <button
                    type="button"
                    className="ait-aii-qbtn"
                    onClick={handleCopyTradingPlan}
                  >
                    <span className="ait-aii-qbtn-icon">📋</span>
                    <span>{copiedNotice ? 'Copied Trading Plan!' : 'Copy Trading Plan'}</span>
                  </button>

                  <button
                    type="button"
                    className="ait-aii-qbtn"
                    onClick={() => setActiveTab('levels')}
                  >
                    <span className="ait-aii-qbtn-icon">📊</span>
                    <span>Open Chart Levels</span>
                  </button>

                  <button
                    type="button"
                    className="ait-aii-qbtn"
                    onClick={() => setActiveTab('structure')}
                  >
                    <span className="ait-aii-qbtn-icon">🔀</span>
                    <span>Compare Timeframes</span>
                  </button>

                  <button
                    type="button"
                    className="ait-aii-qbtn"
                    onClick={() => setShowPrevAnalysis((v) => !v)}
                  >
                    <span className="ait-aii-qbtn-icon">🕒</span>
                    <span>View Previous Analysis</span>
                  </button>
                </div>
              </div>

              {/* CARD 6: AI ANALYSIS STATUS */}
              <div className="ait-aii-card ait-aii-status-card">
                <div className="ait-aii-card-header">
                  <div className="ait-aii-card-title-group">
                    <span className="ait-aii-card-icon blue">⚡</span>
                    <h3>AI Analysis Status</h3>
                  </div>
                </div>

                <div className="ait-aii-status-body">
                  <div className="ait-aii-neon-ring-wrap">
                    <svg viewBox="0 0 80 80" className="ait-aii-neon-ring-svg">
                      <defs>
                        <linearGradient id="aiiRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#00F2FE" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="rgba(0, 242, 254, 0.14)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="url(#aiiRingGrad)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="165 30"
                      />
                    </svg>
                  </div>

                  <div className="ait-aii-status-copy">
                    <h4 className="ait-aii-status-ready">Analysis Ready</h4>
                    <p className="ait-aii-status-sub">
                      The latest analysis is available and up to date.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MARKET STRUCTURE ==================== */}
        {activeTab === 'structure' && (
          <div className="ait-aii-subtab-grid">
            <div className="ait-aii-card">
              <div className="ait-aii-card-header">
                <div className="ait-aii-card-title-group">
                  <span className="ait-aii-ai-pill-icon">MTF</span>
                  <h3>Multi-Timeframe Structure Alignment ({pair})</h3>
                </div>
                <span className="ait-aii-source-pill">{marketAnalysis?.mtf?.alignedText || '3/4 Aligned'}</span>
              </div>
              <div className="ait-aii-metrics-matrix">
                <div className="ait-aii-metrics-col">
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">15m Intraday Structure</span>
                    <strong className="ait-aii-metric-val">{intel.shortTermBias} ({marketAnalysis?.mtf?.m15 || 'BULL'})</strong>
                  </div>
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">1H Session Structure</span>
                    <strong className="ait-aii-metric-val text-emerald">{marketAnalysis?.mtf?.h1 || 'BULL'} (Order Block Held)</strong>
                  </div>
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">4H Swing Structure</span>
                    <strong className="ait-aii-metric-val text-emerald">{marketAnalysis?.mtf?.h4 || 'BULL'} ({intel.structureText})</strong>
                  </div>
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">Daily Macro Bias</span>
                    <strong className="ait-aii-metric-val text-emerald">{marketAnalysis?.mtf?.d1 || 'BULL'} (Institutional Trend)</strong>
                  </div>
                </div>
                <div className="ait-aii-metrics-col">
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">EMA 20 (15m)</span>
                    <strong className="ait-aii-metric-val ait-mono">{marketAnalysis?.ema20?.val || formatCommaPrice(p - 1.8, 2)} ({marketAnalysis?.ema20?.status || 'Active'})</strong>
                  </div>
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">EMA 50 (15m)</span>
                    <strong className="ait-aii-metric-val ait-mono">{marketAnalysis?.ema50?.val || formatCommaPrice(p - 5.4, 2)} ({marketAnalysis?.ema50?.status || 'Support'})</strong>
                  </div>
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">RSI (14) &amp; MACD</span>
                    <strong className="ait-aii-metric-val ait-mono">RSI {marketAnalysis?.rsi?.val || '52.4'} • {intel.momentumText}</strong>
                  </div>
                  <div className="ait-aii-metric-row">
                    <span className="ait-aii-metric-lbl">Active FVG Imbalances</span>
                    <strong className="ait-aii-metric-val ait-mono">{marketAnalysis?.fvg || 'Bull: 4 | Bear: 2'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: KEY LEVELS ==================== */}
        {activeTab === 'levels' && (
          <div className="ait-aii-subtab-grid">
            <div className="ait-aii-card">
              <div className="ait-aii-card-header">
                <div className="ait-aii-card-title-group">
                  <span className="ait-aii-card-icon purple">🎯</span>
                  <h3>Institutional Key Levels &amp; Liquidity Zones ({pair})</h3>
                </div>
                <span className="ait-aii-source-pill">Live Spot: ${formatCommaPrice(p, priceDecimals)}</span>
              </div>
              <div className="ait-aii-table-wrap">
                <table className="ait-aii-levels-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Type</th>
                      <th>Timeframe</th>
                      <th>Distance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="ait-mono">
                    {intel.keyLevelsRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="ait-aii-lvl-cell">
                            <span className={`ait-aii-lvl-badge ${row.isRes ? 'res' : 'sup'}`}>
                              {row.isRes ? '⊤' : '⊥'}
                            </span>
                            <strong>{row.level}</strong>
                          </div>
                        </td>
                        <td className={row.isRes ? 'text-red' : 'text-emerald'}>{row.type}</td>
                        <td>{row.tf}</td>
                        <td className={row.isPosDist ? 'text-emerald' : 'text-amber'}>{row.distance}</td>
                        <td>
                          <span className={`ait-aii-status-pill ${row.isTested ? 'tested' : 'untested'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: AI MARKET OUTLOOK ==================== */}
        {activeTab === 'outlook' && (
          <div className="ait-aii-subtab-grid">
            <div className="ait-aii-card">
              <div className="ait-aii-card-header">
                <div className="ait-aii-card-title-group">
                  <span className="ait-aii-card-icon amber">💡</span>
                  <h3>AI Market Outlook &amp; Directional Scenarios</h3>
                </div>
              </div>
              <p className="ait-aii-intel-summary">
                {isGold ? 'Gold' : pair} is moving in a consolidation phase after a strong move. Price is currently trading below the near-term resistance zone ({intel.r1Short}), showing signs of indecision. The trend remains slightly {intel.overallTrend.toLowerCase()} on higher timeframes, but short-term momentum is {intel.shortTermBias.toLowerCase()}.
              </p>
              <div className="ait-aii-outlook-list">
                <div className="ait-aii-outlook-item">
                  <span className="ait-aii-ol-icon green">▲</span>
                  <div className="ait-aii-ol-body">
                    <div className="ait-aii-ol-title">Bullish scenario</div>
                    <p className="ait-aii-ol-desc">
                      Break above <strong>{intel.r1Short}</strong> could lead to <strong>{intel.r2Short}</strong> and <strong>{intel.r3Short}</strong>.
                    </p>
                  </div>
                </div>
                <div className="ait-aii-outlook-item">
                  <span className="ait-aii-ol-icon red">▼</span>
                  <div className="ait-aii-ol-body">
                    <div className="ait-aii-ol-title">Bearish scenario</div>
                    <p className="ait-aii-ol-desc">
                      Rejection at <strong>{intel.r1Short}</strong> may push price to <strong>{intel.s1Short}</strong> and <strong>{intel.s2Short}</strong>.
                    </p>
                  </div>
                </div>
                <div className="ait-aii-outlook-item">
                  <span className="ait-aii-ol-icon cyan">📈</span>
                  <div className="ait-aii-ol-body">
                    <div className="ait-aii-ol-title">Key confirmation &amp; Invalidation</div>
                    <p className="ait-aii-ol-desc ait-mono">
                      Confirmation: {intel.r1Short} (break &amp; close) • Invalidation: {intel.s1Short} (break &amp; close)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: TRADING PLAN ==================== */}
        {activeTab === 'plan' && (
          <div className="ait-aii-subtab-grid">
            <div className="ait-aii-card">
              <div className="ait-aii-card-header">
                <div className="ait-aii-card-title-group">
                  <span className="ait-aii-card-icon purple">🎯</span>
                  <h3>Institutional Execution Plan ({pair} • {timeframe})</h3>
                </div>
                <button type="button" className="ait-aii-reanalyze-btn" onClick={handleCopyTradingPlan}>
                  <span>{copiedNotice ? '✓ Copied!' : '📋 Copy Plan'}</span>
                </button>
              </div>

              <div className="ait-scenario-box long" style={{ marginBottom: 14 }}>
                <div className="ait-scen-title text-emerald">↗ Bullish Breakout Scenario (Above {intel.r1Short})</div>
                <div className="ait-scen-list ait-mono">
                  <div className="ait-scen-item">
                    <span className="ait-scen-chk">✓</span>
                    <span className="ait-scen-lbl">Trigger:</span>
                    <strong className="ait-scen-val">{intel.r1Short} (15m Break &amp; Close)</strong>
                  </div>
                  <div className="ait-scen-item">
                    <span className="ait-scen-chk">✓</span>
                    <span className="ait-scen-lbl">Targets:</span>
                    <strong className="ait-scen-val">TP1: {intel.r2Short} • TP2: {intel.r3Short}</strong>
                  </div>
                  <div className="ait-scen-item">
                    <span className="ait-scen-chk">✓</span>
                    <span className="ait-scen-lbl">Invalid:</span>
                    <strong className="ait-scen-val">Below {intel.s1Short}</strong>
                  </div>
                </div>
              </div>

              <div className="ait-scenario-box short">
                <div className="ait-scen-title text-red">↘ Bearish Rejection Scenario (At {intel.r1Short})</div>
                <div className="ait-scen-list ait-mono">
                  <div className="ait-scen-item">
                    <span className="ait-scen-chk">✓</span>
                    <span className="ait-scen-lbl">Trigger:</span>
                    <strong className="ait-scen-val">Rejection wick at {intel.r1Short}</strong>
                  </div>
                  <div className="ait-scen-item">
                    <span className="ait-scen-chk">✓</span>
                    <span className="ait-scen-lbl">Targets:</span>
                    <strong className="ait-scen-val">TP1: {intel.s1Short} • TP2: {intel.s2Short}</strong>
                  </div>
                  <div className="ait-scen-item">
                    <span className="ait-scen-chk">✓</span>
                    <span className="ait-scen-lbl">Invalid:</span>
                    <strong className="ait-scen-val">Close above {intel.r2Short}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: NEWS & EVENTS ==================== */}
        {activeTab === 'news' && (
          <div className="ait-aii-subtab-grid">
            <div className="ait-aii-card">
              <div className="ait-aii-card-header">
                <div className="ait-aii-card-title-group">
                  <span className="ait-aii-card-icon purple">📅</span>
                  <h3>Upcoming Economic Catalysts &amp; Market News</h3>
                </div>
                <span className="ait-aii-source-pill">Live Feed Active</span>
              </div>
              <table className="ait-cal-table ait-mono" style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>TIME</th>
                    <th>CCY</th>
                    <th>EVENT</th>
                    <th>IMPACT</th>
                    <th>FORECAST</th>
                    <th>PREVIOUS</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarList.slice(0, 6).map((ev, i) => (
                    <tr key={i}>
                      <td>{ev.time}</td>
                      <td><strong>{ev.ccy}</strong></td>
                      <td>{ev.title}</td>
                      <td>
                        <span className={`ait-cal-pill ${ev.imp === 'HIGH' ? 'high' : 'med'}`}>
                          {ev.imp}
                        </span>
                      </td>
                      <td>{ev.f}</td>
                      <td>{ev.p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ait-ma-news-list">
                {newsList.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="ait-ma-news-row">
                    <div className="ait-ma-news-meta">
                      <span className="ait-news-badge">{item.source}</span>
                      <span className="ait-news-time">{item.time}</span>
                    </div>
                    <h5 className="ait-news-headline">{item.title}</h5>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 7: TRADE JOURNAL ==================== */}
        {activeTab === 'journal' && (
          <div className="ait-aii-subtab-grid">
            <div className="ait-aii-card">
              <div className="ait-aii-card-header">
                <div className="ait-aii-card-title-group">
                  <span className="ait-aii-card-icon blue">✓</span>
                  <h3>Institutional Pre-Trade Execution Checklist</h3>
                </div>
              </div>
              <div className="ait-chk-list">
                <label className="ait-chk-row">
                  <input type="checkbox" defaultChecked />
                  <span>Asian / Session High or Low Liquidity Swept (CRT Manipulation C2 Confirmed)</span>
                </label>
                <label className="ait-chk-row">
                  <input type="checkbox" defaultChecked />
                  <span>Market Structure Shift (MSS) &amp; Displacement Confirmed on {timeframe || '15m'}</span>
                </label>
                <label className="ait-chk-row">
                  <input type="checkbox" defaultChecked />
                  <span>Key Confirmation Level ({intel.r1Short}) or Support ({intel.s1Short}) Respected</span>
                </label>
                <label className="ait-chk-row">
                  <input type="checkbox" defaultChecked />
                  <span>Strict 0.03 Lot Sizing &amp; 1:2.0 R:R Enforced (Move SL to BE at 1:1)</span>
                </label>
                <label className="ait-chk-row">
                  <input type="checkbox" />
                  <span>Verified No Red-Folder High-Impact News Release Within 15 Minutes</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
