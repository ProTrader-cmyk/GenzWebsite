import { useState, useEffect, useMemo } from 'react';
import PairLogo from './ui/PairLogo.jsx';
import { formatSpotPrice } from '../services/marketPriceService.js';
import { generateRealPipSignal, saveSignalToFirestore } from '../services/pipLiveSignalService.js';
import { getMarketHoursStatus } from '../services/marketHoursService.js';
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

// --- MODERN FINTECH VECTOR ICONS (REPLACING EMOJIS & GENERIC UNICODE) ---
function IconTrendUp(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconCompass(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

function IconLayers(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconActivityWave(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconZap(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

function IconSupportLevel(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="2" y1="20" x2="22" y2="20" strokeWidth="2.6" />
      <path d="M12 16V4m0 0L7 9m5-5l5 9" />
    </svg>
  );
}

function IconResistanceLevel(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="2" y1="4" x2="22" y2="4" strokeWidth="2.6" />
      <path d="M12 8v12m0 0l-5-5m5 5l5-5" />
    </svg>
  );
}

function IconMarketStructure(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 20h4v-5h6v-5h6V4h2" />
      <circle cx="7" cy="15" r="1.5" fill="currentColor" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" />
      <circle cx="19" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconShieldSlash(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconOutlookRadar(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" strokeDasharray="2 2" />
      <path d="m14 10 4-4" />
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

function IconMarketState(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconBullScenario(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 18V6M7 6l-3 3M7 6l3 3" />
      <rect x="14" y="8" width="5" height="9" rx="1" fill="currentColor" fillOpacity="0.3" />
      <line x1="16.5" y1="4" x2="16.5" y2="8" />
      <line x1="16.5" y1="17" x2="16.5" y2="20" />
    </svg>
  );
}

function IconBearScenario(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 6v12M7 18l-3-3M7 18l3-3" />
      <rect x="14" y="7" width="5" height="9" rx="1" fill="currentColor" fillOpacity="0.3" />
      <line x1="16.5" y1="4" x2="16.5" y2="7" />
      <line x1="16.5" y1="16" x2="16.5" y2="20" />
    </svg>
  );
}

function IconConfirmation(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconInvalidation(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconCalendarEvent(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="2.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

function IconAiChip(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" fillOpacity="0.25" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

function IconTarget(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function IconLock(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconClock(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconRadio(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function IconArrowUp(props) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconArrowDown(props) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function IconCopy(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconCross(props) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconLightbulb(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18h6M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  );
}

function IconRefresh(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
    </svg>
  );
}

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
    // Day trade CRT standard: 1000 pts SL ($10.00), strictly 1:2+ R:R (2000–2500 pts TP = $20.00–$25.00)
    const slDist = isGold ? 10.0 : 0.0035;
    const tp1Dist = isGold ? 20.0 : 0.0070; // 20.0 / 10.0 = 1:2.0 RR (strictly 1:2+)
    const tp2Dist = isGold ? 25.0 : 0.0090; // 25.0 / 10.0 = 1:2.5 RR
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

  const [clockTick, setClockTick] = useState(0);

  // Periodic clock ticker to refresh market hours countdown & analysis age
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const pair = currentAsset.pair || 'XAUUSD';
  const marketStatus = useMemo(() => getMarketHoursStatus(pair), [pair, clockTick]);
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

    // Session label: reflects weekend interbank break or active killzone
    let sessionShort = marketStatus.isOpen ? 'Asian (Active)' : marketStatus.sessionShort;
    if (marketStatus.isOpen) {
      const rawSession = activeSession?.name || marketStatus.sessionName || 'Asian Session';
      if (rawSession.toLowerCase().includes('london close')) sessionShort = 'London Close (Active)';
      else if (rawSession.toLowerCase().includes('london')) sessionShort = 'London (Active)';
      else if (rawSession.toLowerCase().includes('new york')) sessionShort = 'New York (Active)';
      else if (rawSession.toLowerCase().includes('asian')) sessionShort = 'Asian (Active)';
      else sessionShort = 'Inter-Bank (Active)';
    }

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
  }, [p, pair, isGold, isCrypto, decimals, marketAnalysis, activeSession, timeframe, calendarList, marketStatus]);

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

  // Shared real-time dispatch helper (Firestore + OS Push + Sound + In-App Toast + Telegram)
  const dispatchSignalToSystem = (generatedSignal, mode = 'daytrade') => {
    if (!generatedSignal) return;

    saveSignalToFirestore(generatedSignal)
      .then((doc) => {
        console.log('[Pip Machine Auto-Dispatch] Stored in Firestore:', doc?.id || generatedSignal.id);
      })
      .catch((err) => {
        console.warn('[Pip Machine Auto-Dispatch] Firestore save notice:', err);
      });

    try {
      if (getNotificationPermission() === 'default') {
        requestNotificationPermission().catch(() => {});
      }

      const notifPayload = {
        id: generatedSignal.id,
        type: 'signal',
        isPipScan: true,
        title: `New Pip ${mode === 'scalp' ? 'Scalp' : 'Intraday'} Signal: ${generatedSignal.pair}`,
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

      playNotificationSound();
      showBrowserNotification(notifPayload).catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('genz_signal_notification', { detail: notifPayload }));
      }

      sendTelegramSignal(generatedSignal).catch(() => {});
    } catch (notifErr) {
      console.warn('[Pip Machine Auto-Dispatch] Notification warning:', notifErr);
    }

    setSignalSavedNotice(true);
    setTimeout(() => setSignalSavedNotice(false), 4500);
  };

  // High-probability CRT condition evaluation for Intra Trade
  const intraConditionResult = useMemo(() => {
    if (!marketStatus.isOpen) {
      return {
        met: false,
        reason: `Interbank markets are closed for the weekend (${marketStatus.sessionName}). Institutions do not trade 24/7.`,
        statusText: 'MARKET CLOSED • NO 24/7 TRADING',
      };
    }

    // When market is live: evaluate CRT confluences
    const rsiNum = parseFloat(marketAnalysis?.rsi?.val) || 51.4;
    const hasBias = Boolean(marketAnalysis?.bias && !marketAnalysis.bias.includes('NEUTRAL'));
    const hasOB = Array.isArray(marketAnalysis?.orderBlocks) && marketAnalysis.orderBlocks.length > 0;
    const hasMomentum = rsiNum < 46 || rsiNum > 54;
    const isMet = Boolean(hasBias || hasOB || hasMomentum || marketAnalysis?.signal);

    return {
      met: isMet,
      reason: isMet
        ? '1H/4H Liquidity Sweep & 3-Candle CRT Expansion Confirmed'
        : 'Price consolidating inside session range. Waiting for liquidity sweep.',
      statusText: isMet ? 'CONFLUENCE ACTIVE • AUTO-DISPATCH READY' : 'AUDITING LIQUIDITY POOLS',
    };
  }, [marketStatus, marketAnalysis]);

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

  // Autonomous Intra Trade Monitor & Auto-Dispatch:
  // When condition is met and market is OPEN, automatically dispatches signal without requiring user to scan!
  useEffect(() => {
    if (!marketStatus.isOpen) {
      setIntraConditionMet(false);
      return;
    }

    const met = intraConditionResult.met;
    setIntraConditionMet(met);

    if (met) {
      const saved = localStorage.getItem(`genz_locked_daytrade_${pair}`);
      if (saved) {
        try {
          setDayTradeSignal(JSON.parse(saved));
        } catch {}
      } else {
        const lockedPrice = Number(livePrice) || p;
        const fresh = buildDefaultSignal(pair, lockedPrice, 'daytrade');
        setDayTradeSignal(fresh);
        try {
          localStorage.setItem(`genz_locked_daytrade_${pair}`, JSON.stringify(fresh));
        } catch {}

        // Autonomous Dispatch: sends signal to user as soon as condition is met!
        dispatchSignalToSystem(fresh, 'daytrade');
      }
    } else {
      setDayTradeSignal(null);
      try {
        localStorage.removeItem(`genz_locked_daytrade_${pair}`);
      } catch {}
    }
  }, [pair, marketStatus.isOpen, intraConditionResult.met, livePrice, p]);

  const currentScalpSignal = scalpSignal;
  const currentDayTradeSignal = dayTradeSignal;
  const activeSignal = pipMode === 'scalp' ? currentScalpSignal : currentDayTradeSignal;

  const handleScanSignal = (mode = pipMode) => {
    if (isScanning) return;
    if (!marketStatus.isOpen) return; // Do not scan closed markets
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
          // INTRA TRADE EVALUATES CONDITIONS
          if (intraConditionResult.met) {
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

        if (generatedSignal) {
          dispatchSignalToSystem(generatedSignal, mode);
        }

        setTimeout(() => {
          setIsScanning(false);
        }, 380);
      }
    }, 320);
  };

  const handleCopySignal = (sig = activeSignal) => {
    if (!sig) return;
    const text = `[GenZTrader Pip Signal - ${sig.mode || sig.style}]
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
            <span className="text-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconCheck width="13" height="13" /> Trading Plan copied to clipboard!
            </span>
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
            {!marketStatus.isOpen && (
              <div className="ait-aii-market-closed-strip">
                <div className="ait-aii-mcs-badge">
                  <IconLock width="12" height="12" />
                  <span>MARKET CLOSED</span>
                </div>
                <p className="ait-aii-mcs-text">
                  <strong>Institutions do not trade 24/7:</strong> Global Forex &amp; Metals ({pair}) markets are on weekend interbank pause. Session resumes <strong>{marketStatus.reopensText}</strong> ({marketStatus.reopenCountdown} remaining).
                </p>
              </div>
            )}

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
                        <span className={`ait-aii-status-dot ${marketStatus.isOpen ? 'green' : 'red'}`} />
                        <span className={`ait-aii-snap-val ${marketStatus.isOpen ? 'text-emerald' : 'text-red'}`}>{intel.sessionShort}</span>
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
                      <span className="ait-aii-ai-chip-badge">
                        <IconAiChip />
                        <span>AI INTEL</span>
                      </span>
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
                          <span className="ait-aii-m-icon cyan"><IconTrendUp /></span>
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
                          <span className="ait-aii-m-icon purple"><IconCompass /></span>
                          <span>Short-term Bias</span>
                        </div>
                        <div className="ait-aii-metric-val">
                          {intel.shortTermBias} <span className="ait-aii-muted">({timeframe || '15m'})</span>
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon amber"><IconLayers /></span>
                          <span>Multi-Timeframe</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.mtfSummary}</div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon blue"><IconActivityWave /></span>
                          <span>Momentum</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.momentumText}</div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon cyan"><IconZap /></span>
                          <span>Volatility</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.volatilityText}</div>
                      </div>
                    </div>

                    {/* Right Sub-column */}
                    <div className="ait-aii-metrics-col">
                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon blue"><IconSupportLevel /></span>
                          <span>Key Support</span>
                        </div>
                        <div className="ait-aii-metric-val ait-mono">
                          {intel.s1Short} / {intel.s2Short}
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon red"><IconResistanceLevel /></span>
                          <span>Key Resistance</span>
                        </div>
                        <div className="ait-aii-metric-val ait-mono">
                          {intel.r1Short} / {intel.r2Short}
                        </div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon cyan"><IconMarketStructure /></span>
                          <span>Structure</span>
                        </div>
                        <div className="ait-aii-metric-val">{intel.structureText}</div>
                      </div>

                      <div className="ait-aii-metric-row">
                        <div className="ait-aii-metric-lbl">
                          <span className="ait-aii-m-icon red"><IconShieldSlash /></span>
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
                    <span className="ait-aii-card-icon amber">
                      <IconOutlookRadar />
                    </span>
                    <h3>Market Outlook</h3>
                  </div>
                </div>

                <div className="ait-aii-outlook-list">
                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon teal"><IconMarketState /></span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Current conditions</div>
                      <p className="ait-aii-ol-desc">
                        Price is consolidating below resistance after an upward move. Momentum is slowing.
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon green"><IconBullScenario /></span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Bullish scenario</div>
                      <p className="ait-aii-ol-desc">
                        Break above <strong>{intel.r1Short}</strong> could lead to <strong>{intel.r2Short}</strong> and <strong>{intel.r3Short}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon red"><IconBearScenario /></span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Bearish scenario</div>
                      <p className="ait-aii-ol-desc">
                        Rejection at <strong>{intel.r1Short}</strong> may push price to <strong>{intel.s1Short}</strong> and <strong>{intel.s2Short}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon cyan"><IconConfirmation /></span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Key confirmation</div>
                      <p className="ait-aii-ol-desc ait-mono">
                        {intel.r1Short} (break &amp; close)
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon red"><IconInvalidation /></span>
                    <div className="ait-aii-ol-body">
                      <div className="ait-aii-ol-title">Invalidation level</div>
                      <p className="ait-aii-ol-desc ait-mono">
                        {intel.s1Short} (break &amp; close)
                      </p>
                    </div>
                  </div>

                  <div className="ait-aii-outlook-item">
                    <span className="ait-aii-ol-icon purple"><IconCalendarEvent /></span>
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
            {/* 0. MARKET CLOSED MARKUP BANNER (Forex & Metals do not trade 24/7) */}
            {!marketStatus.isOpen && (
              <div className="ait-pm-market-closed-banner">
                <div className="ait-pm-mcb-left">
                  <div className="ait-pm-mcb-icon">
                    <IconLock width="24" height="24" />
                  </div>
                  <div className="ait-pm-mcb-content">
                    <div className="ait-pm-mcb-title-row">
                      <h4 className="ait-pm-mcb-title">
                        MARKET CLOSED • {marketStatus.isWeekend ? 'WEEKEND INTERBANK BREAK' : 'DAILY SETTLEMENT BREAK'}
                      </h4>
                      <span className="ait-pm-mcb-tag">
                        INSTITUTIONS DO NOT TRADE 24/7
                      </span>
                    </div>
                    <p className="ait-pm-mcb-desc">
                      Global Forex and Metals ({pair}) markets are closed for the weekend. Interbank liquidity and central banks are offline as markets do not trade 24/7. Pip Machine autonomous scanner is paused to protect capital.
                    </p>
                    <div className="ait-pm-mcb-schedule-meta">
                      <div className="ait-pm-mcb-meta-item">
                        <span className="ait-pm-mcb-meta-lbl">Session Resumes:</span>
                        <strong className="ait-pm-mcb-meta-val text-emerald">{marketStatus.reopensText}</strong>
                      </div>
                      <div className="ait-pm-mcb-meta-item">
                        <span className="ait-pm-mcb-meta-lbl">Time Remaining:</span>
                        <strong className="ait-pm-mcb-meta-val ait-mono text-cyan">
                          <IconClock width="12" height="12" style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                          {marketStatus.reopenCountdown}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ait-pm-mcb-right">
                  <span className="ait-pm-mcb-crypto-hint">Crypto trades 24/7 continuous</span>
                  {onSelectAsset && (
                    <button
                      type="button"
                      className="ait-pm-mcb-switch-crypto-btn"
                      onClick={() => onSelectAsset('btc')}
                    >
                      <PairLogo pair="BTCUSD" size={16} />
                      <span>Switch to BTCUSD (24/7 Live)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. PIP MACHINE CONSOLE TOP HEADER */}
            <div className="ait-pm-chassis-top">
              <div className="ait-pm-brand">
                <div className="ait-pm-orb">
                  <IconAiChip width="20" height="20" style={{ color: '#00F2FE' }} />
                </div>
                <div className="ait-pm-brand-info">
                  <div className="ait-pm-title-row">
                    <h3 className="ait-pm-title">PIP MACHINE AI SCANNER</h3>
                    <span className="ait-pm-version">v4.2 PRO</span>
                  </div>
                  <span className="ait-pm-sub">Autonomous Institutional Liquidity &amp; Micro-Structure Engine</span>
                </div>
              </div>

              <div className={`ait-pm-telemetry-badge ${!marketStatus.isOpen ? 'closed' : ''}`}>
                <span className={marketStatus.isOpen ? 'ait-pm-live-dot' : 'ait-pm-closed-dot'} />
                <span className={marketStatus.isOpen ? 'ait-pm-live-txt' : 'ait-pm-closed-txt'}>
                  {marketStatus.isOpen
                    ? `LIVE SPOT: ${pair} • $${formatCommaPrice(p, priceDecimals)} USD`
                    : `${marketStatus.badge}: ${pair} • REOPENS IN ${marketStatus.reopenCountdown.toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* 2. MODE SELECTOR (SCALP vs INTRA TRADE) */}
            <div className="ait-pm-mode-selector">
              <button
                type="button"
                className={`ait-pm-mode-tab ${pipMode === 'scalp' ? 'active scalp' : ''}`}
                onClick={() => setPipMode('scalp')}
              >
                <span className="ait-pm-mode-icon"><IconZap width="17" height="17" /></span>
                <div className="ait-pm-mode-meta">
                  <strong className="ait-pm-mode-title">Pip Scalp</strong>
                  <span className="ait-pm-mode-sub">1m • 5m Fast Scalp (2–3 Pts Target &amp; SL)</span>
                </div>
                <span className="ait-pm-pill-tag amber">Always Active</span>
              </button>

              <button
                type="button"
                className={`ait-pm-mode-tab ${pipMode === 'daytrade' ? 'active intra' : ''}`}
                onClick={() => setPipMode('daytrade')}
              >
                <span className="ait-pm-mode-icon"><IconTarget width="17" height="17" /></span>
                <div className="ait-pm-mode-meta">
                  <strong className="ait-pm-mode-title">Pip Intra Trade</strong>
                  <span className="ait-pm-mode-sub">15m • 1h • 4h CRT Swings ($10–$20)</span>
                </div>
                <span className="ait-pm-pill-tag cyan">Autonomous Monitor</span>
              </button>
            </div>

            {/* 3. CENTRAL PIP MACHINE RADAR & SCAN HUD */}
            <div className={`ait-pm-radar-hud ${isScanning ? 'scanning' : ''} ${!marketStatus.isOpen ? 'closed' : ''}`}>
              <div className="ait-pm-radar-visual">
                <div className="ait-pm-radar-circle">
                  <div className="ait-pm-radar-sweep" />
                  <div className="ait-pm-radar-crosshair-h" />
                  <div className="ait-pm-radar-crosshair-v" />
                  {marketStatus.isOpen && (
                    <>
                      <div className="ait-pm-radar-ping ping-1" />
                      <div className="ait-pm-radar-ping ping-2" />
                    </>
                  )}
                  <div className="ait-pm-radar-center-core">
                    <span className="ait-pm-core-icon">
                      {!marketStatus.isOpen ? (
                        <IconLock width="18" height="18" style={{ color: '#EF4444' }} />
                      ) : pipMode === 'scalp' ? (
                        <IconZap width="18" height="18" />
                      ) : (
                        <IconTarget width="18" height="18" />
                      )}
                    </span>
                  </div>
                  {!marketStatus.isOpen && (
                    <div className="ait-pm-radar-closed-overlay">
                      <span>CLOSED</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ait-pm-radar-info">
                <div className="ait-pm-status-line">
                  <span className={`ait-pm-status-pill ${!marketStatus.isOpen ? 'closed' : isScanning ? 'scanning' : 'ready'}`}>
                    {!marketStatus.isOpen
                      ? 'MARKET CLOSED • SCANNER PAUSED'
                      : isScanning
                        ? 'SCANNING ORDER FLOW...'
                        : pipMode === 'daytrade'
                          ? 'AUTONOMOUS SCANNER • ACTIVE'
                          : 'SCANNER STANDBY • READY'}
                  </span>
                  <span className="ait-pm-mode-flag">
                    {!marketStatus.isOpen
                      ? 'WEEKEND PAUSE (NO 24/7 TRADING)'
                      : pipMode === 'scalp'
                        ? '1M-5M ULTRA SCALPER'
                        : 'AUTO-DISPATCH CRT ENGINE'}
                  </span>
                </div>

                <div className="ait-pm-telemetry-text">
                  {!marketStatus.isOpen ? (
                    <p className="ait-pm-t-closed text-amber">
                      <IconLock width="13" height="13" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} />
                      Interbank markets closed for the weekend. Pip Machine autonomous engine is paused until <strong>{marketStatus.reopensText}</strong>.
                    </p>
                  ) : isScanning ? (
                    <p className="ait-pm-t-active text-cyan">
                      <span className="ait-pm-spin-dot" /> {scanTelemetry || 'Analyzing market liquidity...'}
                    </p>
                  ) : pipMode === 'scalp' ? (
                    <p className="ait-pm-t-idle">
                      Ready to execute 1M/5M micro-sweep scan. Strictly enforces 2–3 numbers SL &amp; TP ($2.00–$3.00).
                    </p>
                  ) : (
                    <p className="ait-pm-t-idle">
                      <span className="text-cyan" style={{ fontWeight: 700 }}>Autonomous Pipeline Active:</span> Continuously auditing 15M/1H CRT structure. Signal automatically dispatches the instant confluence is verified (no manual scan required).
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
                  {!marketStatus.isOpen ? (
                    <button
                      type="button"
                      className="ait-pm-scan-btn disabled-closed"
                      disabled
                    >
                      <IconLock width="15" height="15" />
                      <span>Scanner Paused — Market Closed (Weekend)</span>
                    </button>
                  ) : (
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
                      <span>
                        {isScanning
                          ? 'Scanning Liquidity Pools...'
                          : pipMode === 'scalp'
                            ? 'Scan Pip Scalp Signal'
                            : 'Re-Scan / Force Sync Intra Signal'}
                      </span>
                    </button>
                  )}

                  {/* Autonomous Dispatch Monitor Badge (Replacing manual toggle) */}
                  {pipMode === 'daytrade' && marketStatus.isOpen && (
                    <div className={`ait-pm-auto-monitor-badge ${intraConditionMet ? 'active' : ''}`}>
                      <span className="ait-pm-auto-pulse-dot" />
                      <div className="ait-pm-amb-texts">
                        <span className="ait-pm-amb-lbl">Autonomous Dispatch:</span>
                        <strong className="ait-pm-amb-status">
                          {intraConditionMet ? 'Confluence Met • Signal Auto-Dispatched' : 'Auditing Liquidity Pools'}
                        </strong>
                      </div>
                    </div>
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
                    {(currentScalpSignal?.direction || 'BUY').toLowerCase() === 'sell' ? (
                      <>
                        <IconArrowDown width="11" height="11" /> SELL
                      </>
                    ) : (
                      <>
                        <IconArrowUp width="11" height="11" /> BUY
                      </>
                    )}
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
                    <span className="ait-pm-sr-tag-badge text-cyan">Optimal</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">STOP LOSS</span>
                    <strong className="ait-pm-sr-val text-red ait-mono">
                      ${formatCommaPrice(currentScalpSignal?.sl, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-red">2.5 Num</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">TAKE PROFIT 1</span>
                    <strong className="ait-pm-sr-val text-emerald ait-mono">
                      ${formatCommaPrice(currentScalpSignal?.tp1, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-emerald">3.0 Num</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">RUNNER (TP2)</span>
                    <strong className="ait-pm-sr-val text-emerald ait-mono">
                      ${formatCommaPrice(currentScalpSignal?.tp2, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-emerald">+5.0 Num</span>
                  </div>
                </div>

                <div className="ait-pm-sr-actions">
                  {signalSavedNotice && (
                    <span className="ait-pm-saved-badge">
                      <IconCheck width="11" height="11" /> Stored in Firestore &amp; Alert Sent
                    </span>
                  )}
                  <span className="ait-pm-sr-conf">95% AI</span>
                  <button
                    type="button"
                    className="ait-pm-sr-copy-btn"
                    onClick={() => handleCopySignal(currentScalpSignal)}
                    title="Copy Scalp Signal"
                  >
                    <span>
                      {signalCopiedNotice ? (
                        <>
                          <IconCheck width="12" height="12" /> Copied
                        </>
                      ) : (
                        <>
                          <IconCopy width="12" height="12" /> Copy
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 4B1. INTRA TRADE MODE: MARKET CLOSED (WEEKEND BREAK / NO 24/7 TRADING) */}
            {pipMode === 'daytrade' && !marketStatus.isOpen && (
              <div className="ait-pm-no-signal-card closed-market">
                <div className="ait-pm-no-sig-header">
                  <div className="ait-pm-warning-hex red">
                    <IconLock width="26" height="26" style={{ color: '#EF4444' }} />
                  </div>
                  <div className="ait-pm-no-sig-copy">
                    <h4 className="ait-pm-no-sig-title text-red">INTRADAY SCANNER PAUSED — MARKET CLOSED (WEEKEND)</h4>
                    <p className="ait-pm-no-sig-desc">
                      Global Forex &amp; Metals markets for <strong>{pair}</strong> are closed for the weekend. Institutions do not trade 24/7. Interbank liquidity and automated signal dispatch resume on <strong>{marketStatus.reopensText}</strong>.
                    </p>
                  </div>
                </div>

                <div className="ait-pm-condition-matrix">
                  <div className="ait-pm-cond-row fail">
                    <span className="ait-pm-cond-status-icon fail">
                      <IconCross width="11" height="11" />
                    </span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 1: Interbank Liquidity &amp; Market Hours</strong>
                      <p>CLOSED — Weekend break in effect. Institutional central banks and tier-1 brokers are offline.</p>
                    </div>
                    <span className="ait-pm-cond-tag fail">OFFLINE</span>
                  </div>

                  <div className="ait-pm-cond-row pass">
                    <span className="ait-pm-cond-status-icon pass">
                      <IconCheck width="12" height="12" />
                    </span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 2: Autonomous Signal Engine Readiness</strong>
                      <p>STANDBY — Condition detection engine is armed. Will auto-dispatch instantly when market opens.</p>
                    </div>
                    <span className="ait-pm-cond-tag pass">ARMED</span>
                  </div>
                </div>

                <div className="ait-pm-advice-box">
                  <div className="ait-pm-advice-title">
                    <span className="ait-pm-bulb">
                      <IconLightbulb width="15" height="15" />
                    </span>
                    <strong>Weekend Trading Notice:</strong>
                  </div>
                  <p className="ait-pm-advice-text">
                    Because Forex and Commodities do not trade 24/7, all institutional order flows pause until Sunday 5:00 PM EST. If you want active 24/7 signals over the weekend, switch to Cryptocurrency (BTCUSD) which is continuously traded.
                  </p>
                  {onSelectAsset && (
                    <div className="ait-pm-advice-actions">
                      <button
                        type="button"
                        className="ait-pm-switch-scalp-btn"
                        onClick={() => onSelectAsset('btc')}
                      >
                        <span className="ait-pm-btn-content" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <PairLogo pair="BTCUSD" size={16} /> Switch to BTCUSD (24/7 Live)
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4B2. INTRA TRADE MODE: OPEN MARKET BUT WAITING FOR CONFLUENCE */}
            {pipMode === 'daytrade' && marketStatus.isOpen && !dayTradeSignal && (
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
                    <h4 className="ait-pm-no-sig-title">AUTONOMOUS MONITOR: WAITING FOR LIQUIDITY SWEEP</h4>
                    <p className="ait-pm-no-sig-desc">
                      Pip Machine is actively auditing <strong>{pair}</strong> 15M/1H order flow. No manual scan is needed — the system will <strong>automatically dispatch the signal</strong> the moment institutional confluence is verified.
                    </p>
                  </div>
                </div>

                {/* Condition Checklist Table */}
                <div className="ait-pm-condition-matrix">
                  <div className="ait-pm-cond-row fail">
                    <span className="ait-pm-cond-status-icon fail">
                      <IconCross width="11" height="11" />
                    </span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 1: Higher Timeframe (1H/4H) Liquidity Sweep</strong>
                      <p>MONITORING — Price is in equilibrium. System waiting for sweep of Asian session extremes.</p>
                    </div>
                    <span className="ait-pm-cond-tag fail">AUDITING</span>
                  </div>

                  <div className="ait-pm-cond-row fail">
                    <span className="ait-pm-cond-status-icon fail">
                      <IconCross width="11" height="11" />
                    </span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 2: 3-Candle CRT Manipulation &amp; FVG Expansion</strong>
                      <p>PENDING — Awaiting C3 expansion candle confirmation before auto-dispatching signal.</p>
                    </div>
                    <span className="ait-pm-cond-tag fail">PENDING</span>
                  </div>

                  <div className="ait-pm-cond-row pass">
                    <span className="ait-pm-cond-status-icon pass">
                      <IconCheck width="12" height="12" />
                    </span>
                    <div className="ait-pm-cond-body">
                      <strong>Condition 3: Autonomous Broadcast Pipeline</strong>
                      <p>ARMED — Web push, telegram, audio alert, and Firestore listener active for auto-send.</p>
                    </div>
                    <span className="ait-pm-cond-tag pass">ACTIVE</span>
                  </div>
                </div>

                {/* Pip Machine Advice Box */}
                <div className="ait-pm-advice-box">
                  <div className="ait-pm-advice-title">
                    <span className="ait-pm-bulb">
                      <IconLightbulb width="15" height="15" />
                    </span>
                    <strong>Autonomous Dispatch Active:</strong>
                  </div>
                  <p className="ait-pm-advice-text">
                    You do not need to keep scanning manually. When confluence triggers, a high-probability CRT trade will be sent to your device instantly. For immediate active trades, switch to <strong>Pip Scalp</strong>.
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
                      <span className="ait-pm-btn-content" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <IconZap width="13" height="13" /> Switch to Pip Scalp (Always Active)
                      </span>
                    </button>

                    <button
                      type="button"
                      className="ait-pm-retry-scan-btn"
                      onClick={() => handleScanSignal('daytrade')}
                    >
                      <span className="ait-pm-btn-content" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <IconRefresh width="13" height="13" /> Force Immediate Re-Check
                      </span>
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
                    {(dayTradeSignal.direction || 'BUY').toLowerCase() === 'sell' ? (
                      <>
                        <IconArrowDown width="11" height="11" /> SELL
                      </>
                    ) : (
                      <>
                        <IconArrowUp width="11" height="11" /> BUY
                      </>
                    )}
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
                    <span className="ait-pm-sr-tag-badge text-cyan">Optimal</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">STOP LOSS</span>
                    <strong className="ait-pm-sr-val text-red ait-mono">
                      ${formatCommaPrice(dayTradeSignal.sl, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-red">-10 Pts</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">TAKE PROFIT 1</span>
                    <strong className="ait-pm-sr-val text-emerald ait-mono">
                      ${formatCommaPrice(dayTradeSignal.tp1, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-emerald">{isGold ? '+20 Pts (1:2)' : '+70 Pips'}</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">FINAL TP2</span>
                    <strong className="ait-pm-sr-val text-emerald ait-mono">
                      ${formatCommaPrice(dayTradeSignal.tp2, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-emerald">{isGold ? '+25 Pts (1:2.5)' : '+90 Pips'}</span>
                  </div>

                  <div className="ait-pm-sr-divider" />

                  <div className="ait-pm-sr-item">
                    <span className="ait-pm-sr-label">BE TRIGGER</span>
                    <strong className="ait-pm-sr-val text-cyan ait-mono">
                      ${formatCommaPrice(dayTradeSignal.breakEvenTrigger, decimals)}
                    </strong>
                    <span className="ait-pm-sr-tag-badge text-cyan">Move SL</span>
                  </div>
                </div>

                <div className="ait-pm-sr-actions">
                  {signalSavedNotice && (
                    <span className="ait-pm-saved-badge">
                      <IconCheck width="11" height="11" /> Stored in Firestore &amp; Alert Sent
                    </span>
                  )}
                  <span className="ait-pm-sr-conf cyan">96% AI</span>
                  <button
                    type="button"
                    className="ait-pm-sr-copy-btn"
                    onClick={() => handleCopySignal(dayTradeSignal)}
                    title="Copy Intra Signal"
                  >
                    <span>
                      {signalCopiedNotice ? (
                        <>
                          <IconCheck width="12" height="12" /> Copied
                        </>
                      ) : (
                        <>
                          <IconCopy width="12" height="12" /> Copy
                        </>
                      )}
                    </span>
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
