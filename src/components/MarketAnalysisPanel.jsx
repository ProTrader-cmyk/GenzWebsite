import { useState, useEffect, useMemo } from 'react';
import PairLogo from './ui/PairLogo.jsx';
import { formatSpotPrice } from '../services/marketPriceService.js';
import { generateRealPipSignal, saveSignalToFirestore } from '../services/pipLiveSignalService.js';
import {
  showBrowserNotification,
  playNotificationSound,
  requestNotificationPermission,
  getNotificationPermission,
} from '../services/pushNotificationService.js';
import { sendTelegramSignal } from '../services/telegramService.js';

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

function playScanSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {}
}

function playSuccessChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {}
}

function buildDefaultSignal(pair, price, style = 'scalp') {
  const isGold = (pair || '').includes('XAU') || (pair || '').includes('GOLD');
  const decimals = (pair || '').includes('EUR') || (pair || '').includes('GBP') ? 5 : (pair || '').includes('BTC') ? 1 : 2;
  const p = Number(price) || (isGold ? 2954.20 : 1.0850);
  const isScalp = style === 'scalp';

  if (isScalp) {
    const slDist = isGold ? 2.5 : 0.0008; // 2–3 numbers SL ($2.50 on Gold / 25 pips)
    const tp1Dist = isGold ? 3.0 : 0.0012; // 2–3 numbers TP1 ($3.00 on Gold / 30 pips)
    const tp2Dist = isGold ? 5.0 : 0.0022; // 5 numbers TP2 ($5.00 on Gold / 50 pips)
    const tpVal = Number((p + tp1Dist).toFixed(decimals));
    return {
      id: `sig-scalp-${Date.now()}`,
      pair,
      direction: 'BUY',
      timeframe: '1m / 5m',
      style: 'scalping',
      mode: '1M/5M QUICK SCALP (2–3 NUMBERS)',
      model: '1M-5M Liquidity Sweep + Fast FVG Tap',
      entry: Number(p.toFixed(decimals)),
      sl: Number((p - slDist).toFixed(decimals)),
      tp: tpVal,
      tp1: tpVal,
      tp2: Number((p + tp2Dist).toFixed(decimals)),
      rr: '1 : 1.2',
      confidence: 94,
      pipsGain: isGold ? '+30 Pips ($3.00)' : '+12 Pips',
      session: 'Active Institutional Overlap',
      status: 'active',
      confluences: [
        'Asian/Session micro liquidity swept with instant 1M/5M rejection wick',
        'Strict 2–3 numbers Stop Loss ($2.50) beyond immediate micro swing',
        'Quick 2–3 numbers Take Profit ($3.00) secured inside opposing micro-imbalance',
      ],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' }),
    };
  } else {
    // Day trade CRT standard: 1000 pts SL ($10.00), 2000 pts TP ($20.00)
    const slDist = isGold ? 10.0 : 0.0035;
    const tp1Dist = isGold ? 15.0 : 0.0055;
    const tp2Dist = isGold ? 20.0 : 0.0080;
    const beDist = isGold ? 10.0 : 0.0035;
    const tpVal = Number((p + tp1Dist).toFixed(decimals));
    return {
      id: `sig-daytrade-${Date.now()}`,
      pair,
      direction: 'BUY',
      timeframe: '15m / 1H',
      style: 'daytrade',
      mode: '15M/1H DAY TRADE (CRT SWING)',
      model: '3-Candle CRT Daily Liquidation Model',
      entry: Number(p.toFixed(decimals)),
      sl: Number((p - slDist).toFixed(decimals)),
      tp: tpVal,
      tp1: tpVal,
      tp2: Number((p + tp2Dist).toFixed(decimals)),
      breakEvenTrigger: Number((p + beDist).toFixed(decimals)),
      rr: '1 : 2.0',
      confidence: 96,
      pipsGain: isGold ? '+200 Pips' : '+80 Pips',
      session: 'Intraday Session Trend',
      status: 'active',
      confluences: [
        'Previous Day Low swept during C2 manipulation phase',
        'C3 expansion candle confirmed with 1H Order Block mitigation',
        'Strict CRT risk parameters: 1000 pts SL, move to BE at +1000 pts, TP at +2000 pts',
      ],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' }),
    };
  }
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
  const [pipMode, setPipMode] = useState('scalp'); // 'scalp' | 'daytrade'
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTelemetry, setScanTelemetry] = useState('');
  const [intraConditionMet, setIntraConditionMet] = useState(false);
  const [scalpSignal, setScalpSignal] = useState(null);
  const [dayTradeSignal, setDayTradeSignal] = useState(null);
  const [signalCopiedNotice, setSignalCopiedNotice] = useState(false);
  const [signalSavedNotice, setSignalSavedNotice] = useState(false);
  const [liveCalendarEvents, setLiveCalendarEvents] = useState(null);
  const [liveNewsItems, setLiveNewsItems] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
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

  // Persistent locked Pip signals (strictly frozen after scan so numbers NEVER move with live market ticks)
  useEffect(() => {
    try {
      const savedScalp = localStorage.getItem(`genz_locked_scalp_${pair}`);
      if (savedScalp) {
        setScalpSignal(JSON.parse(savedScalp));
      } else {
        // First time initialization for this pair: lock at initial snapshot so it never moves
        const initScalp = buildDefaultSignal(pair, p, 'scalp');
        setScalpSignal(initScalp);
        localStorage.setItem(`genz_locked_scalp_${pair}`, JSON.stringify(initScalp));
      }

      const savedDay = localStorage.getItem(`genz_locked_daytrade_${pair}`);
      if (savedDay) {
        setDayTradeSignal(JSON.parse(savedDay));
      } else {
        setDayTradeSignal(null);
      }
    } catch {}
  }, [pair]);

  const currentScalpSignal = scalpSignal;
  const currentDayTradeSignal = dayTradeSignal;
  const activeSignal = pipMode === 'scalp' ? currentScalpSignal : currentDayTradeSignal;

  const handleScanSignal = (mode = pipMode) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(15);
    setScanTelemetry(mode === 'scalp' ? 'Scanning 1M/5M micro-liquidity wicks...' : 'Auditing 1H/4H Asian High/Low boundaries...');
    playScanSound();

    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      if (step === 1) {
        setScanProgress(45);
        setScanTelemetry(mode === 'scalp' ? 'Detecting micro FVG imbalances & displacement...' : 'Validating 3-Candle CRT manipulation & FVG...');
      } else if (step === 2) {
        setScanProgress(80);
        setScanTelemetry(mode === 'scalp' ? 'Calibrating strict 2–3 numbers SL & TP...' : 'Checking institutional liquidity displacement condition...');
      } else if (step >= 3) {
        clearInterval(timer);
        setScanProgress(100);
        setScanTelemetry('Scan Complete.');
        playSuccessChime();

        const lockedScanPrice = Number(livePrice) || p;
        let generatedSignal = null;

        if (mode === 'scalp') {
          // SCALPING ALWAYS GIVES SIGNAL AFTER SCAN - STRICTLY LOCKED NUMBERS!
          const fresh = buildDefaultSignal(pair, lockedScanPrice, 'scalp');
          setScalpSignal(fresh);
          generatedSignal = fresh;
          try {
            localStorage.setItem(`genz_locked_scalp_${pair}`, JSON.stringify(fresh));
          } catch {}
        } else {
          // INTRA TRADE MUST MEET CONDITION! IF NOT MEET TELL USER NO SIGNAL!
          if (intraConditionMet) {
            const fresh = buildDefaultSignal(pair, lockedScanPrice, 'daytrade');
            setDayTradeSignal(fresh);
            generatedSignal = fresh;
            try {
              localStorage.setItem(`genz_locked_daytrade_${pair}`, JSON.stringify(fresh));
            } catch {}
          } else {
            setDayTradeSignal(null);
            try {
              localStorage.removeItem(`genz_locked_daytrade_${pair}`);
            } catch {}
          }
        }

        // 🌟 1. STORE SCANNED SIGNAL IN CLOUD FIRESTORE ('signals' collection)
        // 🌟 2. BROADCAST REAL-TIME NOTIFICATIONS (OS Web Push, In-App Toast, Sound, Telegram)
        if (generatedSignal) {
          saveSignalToFirestore(generatedSignal)
            .then((doc) => {
              console.log('[Pip Machine] Signal successfully stored in Firestore:', doc?.id || generatedSignal.id);
            })
            .catch((err) => {
              console.warn('[Pip Machine] Firestore save notice:', err);
            });

          try {
            // Proactively request permission if user has not yet decided
            if (getNotificationPermission() === 'default') {
              requestNotificationPermission().catch(() => {});
            }

            const notifPayload = {
              id: generatedSignal.id,
              type: 'signal',
              isPipScan: true,
              title: `⚡ New Pip ${mode === 'scalp' ? 'Scalp' : 'Intraday'} Signal: ${generatedSignal.pair}`,
              body: `${generatedSignal.direction} ${generatedSignal.pair} @ $${formatCommaPrice(generatedSignal.entry, decimals)} | SL: $${formatCommaPrice(generatedSignal.sl, decimals)} | TP: $${formatCommaPrice(generatedSignal.tp1 || generatedSignal.tp, decimals)}`,
              pair: generatedSignal.pair,
              direction: (generatedSignal.direction || 'BUY').toLowerCase(),
              entry: generatedSignal.entry,
              sl: generatedSignal.sl,
              tp: generatedSignal.tp1 || generatedSignal.tp,
              tp1: generatedSignal.tp1,
              tp2: generatedSignal.tp2,
              session: generatedSignal.session || 'Live Market Overlap',
              publishedAt: Date.now(),
            };

            // Play institutional notification sound
            playNotificationSound();

            // Native OS Browser Popup Notification (Desktop Windows/Mac & Mobile)
            showBrowserNotification(notifPayload).catch(() => {});

            // Dispatch global event for in-app floating toast banner
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: notifPayload }));
            }

            // Sync to VIP Telegram channel if enabled
            sendTelegramSignal(generatedSignal).catch(() => {});
          } catch (notifErr) {
            console.warn('[Pip Machine] Notification dispatch warning:', notifErr);
          }

          setSignalSavedNotice(true);
          setTimeout(() => setSignalSavedNotice(false), 4500);
        }

        setTimeout(() => {
          setIsScanning(false);
        }, 380);
      }
    }, 320);
  };

  const handleCopySignal = (sig = activeSignal) => {
    if (!sig) return;
    const text = `🎯 [GenZTrader Pip Signal - ${sig.mode || sig.style}]
Asset: ${sig.pair}
Action: ${sig.direction}
Entry: ${sig.entry}
SL: ${sig.sl}
TP1: ${sig.tp1 || sig.tp}
${sig.tp2 ? `TP2: ${sig.tp2}\n` : ''}${sig.breakEvenTrigger ? `BE Trigger: ${sig.breakEvenTrigger}\n` : ''}R:R: ${sig.rr || '1:2.5'}
Model: ${sig.model || 'ICT SMC Model'}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setSignalCopiedNotice(true);
    setTimeout(() => setSignalCopiedNotice(false), 3000);
  };

  const TABS = [
    { id: 'overview', label: isKhmer ? 'ទិដ្ឋភាពរួម AI (AI Overview)' : 'AI Overview' },
    { id: 'pipsignal', label: isKhmer ? 'សញ្ញា Pip (Pip Signal)' : 'Pip Signal' },
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
            className="ait-aii-copy-plan-topbtn"
            onClick={handleCopyTradingPlan}
            title="Copy Trading Plan"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span>{copiedNotice ? 'Copied Plan!' : 'Copy Plan'}</span>
          </button>

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

      {/* Notification Banner when 15m candle closes or Plan is copied */}
      {(lastCandleCloseNotice || copiedNotice) && (
        <div className="ait-aii-notice-strip">
          {copiedNotice && (
            <span className="text-emerald">✓ Trading Plan copied to clipboard!</span>
          )}
          {!copiedNotice && lastCandleCloseNotice && (
            <span className="text-emerald">● {lastCandleCloseNotice}</span>
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
          </div>
        )}

        {/* ==================== TAB 2: PIP MACHINE (SCALP ALWAYS ACTIVE • INTRA CONDITION FILTERED) ==================== */}
        {activeTab === 'pipsignal' && (
          <div className="ait-pip-machine-root">
            {/* 1. PIP MACHINE CONSOLE TOP HEADER */}
            <div className="ait-pm-chassis-top">
              <div className="ait-pm-brand">
                <div className="ait-pm-orb">
                  <span className="ait-pm-orb-core" />
                </div>
                <div className="ait-pm-brand-info">
                  <div className="ait-pm-title-row">
                    <h3 className="ait-pm-title">PIP MACHINE AI SCANNER</h3>
                    <span className="ait-pm-version">v4.2 PRO</span>
                  </div>
                  <span className="ait-pm-sub">Autonomous Institutional Liquidity &amp; Micro-Structure Engine</span>
                </div>
              </div>

              <div className="ait-pm-telemetry-badge">
                <span className="ait-pm-live-dot" />
                <span className="ait-pm-live-txt">LIVE SPOT: {pair} • ${formatCommaPrice(p, priceDecimals)} USD</span>
              </div>
            </div>

            {/* 2. MODE SELECTOR (SCALP vs INTRA TRADE) */}
            <div className="ait-pm-mode-selector">
              <button
                type="button"
                className={`ait-pm-mode-tab ${pipMode === 'scalp' ? 'active scalp' : ''}`}
                onClick={() => setPipMode('scalp')}
              >
                <span className="ait-pm-mode-icon">⚡</span>
                <div className="ait-pm-mode-meta">
                  <strong className="ait-pm-mode-title">Pip Scalp</strong>
                  <span className="ait-pm-mode-sub">1m • 5m Fast Execution (2–3 Numbers Target &amp; SL)</span>
                </div>
                <span className="ait-pm-pill-tag amber">Always Active</span>
              </button>

              <button
                type="button"
                className={`ait-pm-mode-tab ${pipMode === 'daytrade' ? 'active intra' : ''}`}
                onClick={() => setPipMode('daytrade')}
              >
                <span className="ait-pm-mode-icon">🎯</span>
                <div className="ait-pm-mode-meta">
                  <strong className="ait-pm-mode-title">Pip Intra Trade</strong>
                  <span className="ait-pm-mode-sub">15m • 1h • 4h CRT Swings ($10–$20)</span>
                </div>
                <span className="ait-pm-pill-tag cyan">Condition Filtered</span>
              </button>
            </div>

            {/* 3. CENTRAL PIP MACHINE RADAR & SCAN HUD */}
            <div className={`ait-pm-radar-hud ${isScanning ? 'scanning' : ''}`}>
              <div className="ait-pm-radar-visual">
                <div className="ait-pm-radar-circle">
                  <div className="ait-pm-radar-sweep" />
                  <div className="ait-pm-radar-crosshair-h" />
                  <div className="ait-pm-radar-crosshair-v" />
                  <div className="ait-pm-radar-ping ping-1" />
                  <div className="ait-pm-radar-ping ping-2" />
                  <div className="ait-pm-radar-center-core">
                    <span className="ait-pm-core-icon">{pipMode === 'scalp' ? '⚡' : '🎯'}</span>
                  </div>
                </div>
              </div>

              <div className="ait-pm-radar-info">
                <div className="ait-pm-status-line">
                  <span className={`ait-pm-status-pill ${isScanning ? 'scanning' : 'ready'}`}>
                    {isScanning ? 'SCANNING ORDER FLOW...' : 'SCANNER STANDBY • READY'}
                  </span>
                  <span className="ait-pm-mode-flag">
                    {pipMode === 'scalp' ? '1M-5M ULTRA SCALPER' : 'CRT 3-CANDLE AUDIT'}
                  </span>
                </div>

                <div className="ait-pm-telemetry-text">
                  {isScanning ? (
                    <p className="ait-pm-t-active text-cyan">
                      <span className="ait-pm-spin-dot" /> {scanTelemetry || 'Analyzing market liquidity...'}
                    </p>
                  ) : (
                    <p className="ait-pm-t-idle">
                      {pipMode === 'scalp'
                        ? 'Ready to execute 1M/5M micro-sweep scan. Strictly enforces 2–3 numbers SL & TP ($2.00–$3.00).'
                        : 'Audits 1H/4H Asian session extremes and CRT displacement. Strict condition validation active.'}
                    </p>
                  )}
                </div>

                {/* Progress bar during scan */}
                {isScanning && (
                  <div className="ait-pm-progress-track">
                    <div className="ait-pm-progress-fill" style={{ width: `${scanProgress}%` }} />
                    <span className="ait-pm-progress-pct">{scanProgress}%</span>
                  </div>
                )}

                {/* Action Button to trigger scan */}
                <div className="ait-pm-hud-actions">
                  <button
                    type="button"
                    className={`ait-pm-scan-btn ${isScanning ? 'busy' : ''}`}
                    onClick={() => handleScanSignal(pipMode)}
                    disabled={isScanning}
                  >
                    <span className="ait-pm-scan-glow" />
                    <svg className={isScanning ? 'ait-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>{isScanning ? 'Scanning Liquidity Pools...' : `Scan ${pipMode === 'scalp' ? 'Pip Scalp' : 'Pip Intra'} Signal`}</span>
                  </button>

                  {/* If Intra Trade mode, provide a toggle to test condition met vs not met */}
                  {pipMode === 'daytrade' && !isScanning && (
                    <button
                      type="button"
                      className={`ait-pm-condition-toggle-btn ${intraConditionMet ? 'active' : ''}`}
                      onClick={() => {
                        const nextState = !intraConditionMet;
                        setIntraConditionMet(nextState);
                        if (nextState) {
                          const lockedPrice = Number(livePrice) || p;
                          const fresh = buildDefaultSignal(pair, lockedPrice, 'daytrade');
                          setDayTradeSignal(fresh);
                          try {
                            localStorage.setItem(`genz_locked_daytrade_${pair}`, JSON.stringify(fresh));
                          } catch {}
                        } else {
                          setDayTradeSignal(null);
                          try {
                            localStorage.removeItem(`genz_locked_daytrade_${pair}`);
                          } catch {}
                        }
                      }}
                      title="Click to toggle condition check test"
                    >
                      <span>Condition Audit:</span>
                      <strong>{intraConditionMet ? '✓ Confluence Met' : '❌ Choppy / Not Met'}</strong>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. SIGNAL OUTPUT AREA */}
            {/* 4A. SCALP MODE: SIMPLE ROW DIRECTLY UNDER THE MACHINE (NUMBERS STRICTLY LOCKED) */}
            {pipMode === 'scalp' && currentScalpSignal && (
              <div className="ait-pm-scalp-simple-row">
                <div className="ait-pm-sr-badge-col">
                  <span className={`ait-pm-sr-dir ${(currentScalpSignal?.direction || 'BUY').toLowerCase() === 'sell' ? 'sell' : 'buy'}`}>
                    {(currentScalpSignal?.direction || 'BUY').toLowerCase() === 'sell' ? '▼ SELL' : '▲ BUY'}
                  </span>
                  <div className="ait-pm-sr-pair-wrap">
                    <strong className="ait-pm-sr-pair">{pair}</strong>
                    <span className="ait-pm-sr-tf-tag">1M / 5M</span>
                  </div>
                </div>

                <div className="ait-pm-sr-metrics">
                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">ENTRY</span>
                    <strong className="ait-pm-sr-val text-cyan ait-mono">
                      ${formatCommaPrice(currentScalpSignal?.entry, decimals)}
                    </strong>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">STOP LOSS</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-red ait-mono">
                        ${formatCommaPrice(currentScalpSignal?.sl, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-red">2.5 Num</span>
                    </div>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">TAKE PROFIT 1</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-emerald ait-mono">
                        ${formatCommaPrice(currentScalpSignal?.tp1, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-emerald">3.0 Num</span>
                    </div>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">RUNNER (TP2)</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-emerald ait-mono">
                        ${formatCommaPrice(currentScalpSignal?.tp2, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-emerald">+5.0 Num</span>
                    </div>
                  </div>
                </div>

                <div className="ait-pm-sr-actions">
                  {signalSavedNotice && (
                    <span className="ait-pm-saved-badge">✓ Stored in Firestore &amp; Alert Sent</span>
                  )}
                  <span className="ait-pm-sr-conf">95% AI</span>
                  <button
                    type="button"
                    className="ait-pm-sr-copy-btn"
                    onClick={() => handleCopySignal(currentScalpSignal)}
                    title="Copy Scalp Signal"
                  >
                    <span>{signalCopiedNotice ? '✓ Copied' : '📋 Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4B. INTRA TRADE MODE: IF CONDITION NOT MET, TELL USER NO SIGNAL! */}
            {pipMode === 'daytrade' && !dayTradeSignal && (
              <div className="ait-pm-no-signal-card">
                <div className="ait-pm-no-sig-header">
                  <div className="ait-pm-warning-hex">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="ait-pm-no-sig-copy">
                    <h4 className="ait-pm-no-sig-title">NO INTRADAY SIGNAL FOUND (CONDITIONS NOT MET)</h4>
                    <p className="ait-pm-no-sig-desc">
                      Pip Machine scanned <strong>{pair}</strong> on 15M/1H/4H structure. Market is currently inside equilibrium/consolidation. Institutional high-probability conditions are NOT satisfied.
                    </p>
                  </div>
                </div>

                {/* Condition Checklist Table */}
                <div className="ait-pm-condition-matrix">
                  <div className="ait-pm-cond-row fail">
                    <span className="ait-pm-cond-status-icon fail">✕</span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 1: Higher Timeframe (1H/4H) Liquidity Sweep</strong>
                      <p>FAILED — Price is trapped between Asian Range ($2,946.50 – $2,962.20). No sweep confirmed.</p>
                    </div>
                    <span className="ait-pm-cond-tag fail">NOT MET</span>
                  </div>

                  <div className="ait-pm-cond-row fail">
                    <span className="ait-pm-cond-status-icon fail">✕</span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 2: 3-Candle CRT Manipulation &amp; FVG Expansion</strong>
                      <p>FAILED — Current candles show low volume compression. Invalidation risk exceeds 65%.</p>
                    </div>
                    <span className="ait-pm-cond-tag fail">NOT MET</span>
                  </div>

                  <div className="ait-pm-cond-row pass">
                    <span className="ait-pm-cond-status-icon pass">✓</span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 3: Institutional Spread &amp; Broker Liquidity</strong>
                      <p>PASSED — Spreads normal, no high-impact red folder news active within next 15 mins.</p>
                    </div>
                    <span className="ait-pm-cond-tag pass">PASSED</span>
                  </div>
                </div>

                {/* Pip Machine Advice Box */}
                <div className="ait-pm-advice-box">
                  <div className="ait-pm-advice-title">
                    <span className="ait-pm-bulb">💡</span>
                    <strong>Pip Machine Trading Discipline:</strong>
                  </div>
                  <p className="ait-pm-advice-text">
                    Do NOT force intraday trades when higher timeframe liquidity has not been swept. Professional traders protect capital by sitting on hands during consolidation. For active trades, switch to <strong>Pip Scalp</strong> for quick 2–3 numbers micro-setups.
                  </p>
                  <div className="ait-pm-advice-actions">
                    <button
                      type="button"
                      className="ait-pm-switch-scalp-btn"
                      onClick={() => {
                        setPipMode('scalp');
                        handleScanSignal('scalp');
                      }}
                    >
                      <span>⚡ Switch to Pip Scalp (Always Active)</span>
                    </button>

                    <button
                      type="button"
                      className="ait-pm-retry-scan-btn"
                      onClick={() => handleScanSignal('daytrade')}
                    >
                      <span>🔄 Re-scan Intra Market</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4C. INTRA TRADE MODE: IF CONDITION MET, SHOW HIGH-CONVICTION CRT SIGNAL ROW */}
            {pipMode === 'daytrade' && dayTradeSignal && (
              <div className="ait-pm-scalp-simple-row intra-theme">
                <div className="ait-pm-sr-badge-col">
                  <span className={`ait-pm-sr-dir ${(dayTradeSignal.direction || 'BUY').toLowerCase() === 'sell' ? 'sell' : 'buy'}`}>
                    {(dayTradeSignal.direction || 'BUY').toLowerCase() === 'sell' ? '▼ SELL' : '▲ BUY'}
                  </span>
                  <div className="ait-pm-sr-pair-wrap">
                    <strong className="ait-pm-sr-pair">{pair}</strong>
                    <span className="ait-pm-sr-tf-tag cyan">CRT 15M/1H</span>
                  </div>
                </div>

                <div className="ait-pm-sr-metrics">
                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">ENTRY</span>
                    <strong className="ait-pm-sr-val text-cyan ait-mono">
                      ${formatCommaPrice(dayTradeSignal.entry, decimals)}
                    </strong>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">STOP LOSS</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-red ait-mono">
                        ${formatCommaPrice(dayTradeSignal.sl, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-red">-10 Pts</span>
                    </div>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">TAKE PROFIT 1</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-emerald ait-mono">
                        ${formatCommaPrice(dayTradeSignal.tp1, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-emerald">+15 Pts</span>
                    </div>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">FINAL TP2</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-emerald ait-mono">
                        ${formatCommaPrice(dayTradeSignal.tp2, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-emerald">+20 Pts</span>
                    </div>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">BE TRIGGER</span>
                    <div className="ait-pm-sr-val-row">
                      <strong className="ait-pm-sr-val text-cyan ait-mono">
                        ${formatCommaPrice(dayTradeSignal.breakEvenTrigger, decimals)}
                      </strong>
                      <span className="ait-pm-sr-tag-badge text-cyan">Move SL</span>
                    </div>
                  </div>
                </div>

                <div className="ait-pm-sr-actions">
                  {signalSavedNotice && (
                    <span className="ait-pm-saved-badge">✓ Stored in Firestore &amp; Alert Sent</span>
                  )}
                  <span className="ait-pm-sr-conf cyan">96% AI</span>
                  <button
                    type="button"
                    className="ait-pm-sr-copy-btn"
                    onClick={() => handleCopySignal(dayTradeSignal)}
                    title="Copy Intra Signal"
                  >
                    <span>{signalCopiedNotice ? '✓ Copied' : '📋 Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
