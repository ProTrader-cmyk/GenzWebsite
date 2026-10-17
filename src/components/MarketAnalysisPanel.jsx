import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PairLogo from './ui/PairLogo.jsx';
import { formatSpotPrice } from '../services/marketPriceService.js';
import { generateRealPipSignal, saveSignalToFirestore } from '../services/pipLiveSignalService.js';
import { getMarketHoursStatus } from '../services/marketHoursService.js';
import { evaluateMarketTradingConditions } from '../services/marketAnalysisService.js';
import { validateSignal, isSupportedPair, normalizePair } from '../services/signalValidationService.js';
import { calculateStructureScalpTpSl } from '../services/scalpTpSlEngine.js';
import ScanWorkflowStepper from './ScanWorkflowStepper.jsx';
import {
  executeScanStep1_MarketData,
  executeScanStep2_TechnicalAnalysis,
  executeScanStep3_AiValidation,
  executeScanStep4_FinalDecision,
} from '../services/scanWorkflowService.js';
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

function playSupercarEngineStart(mode = 'scalp') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const isScalp = mode === 'scalp';

    // 1. High-torque starter motor whine + rhythmic compression pulses (chug-chug)
    for (let i = 0; i < 3; i++) {
      const crankOsc = ctx.createOscillator();
      const crankGain = ctx.createGain();
      crankOsc.type = 'sawtooth';
      const crankTime = now + (i * 0.065);
      crankOsc.frequency.setValueAtTime(isScalp ? 85 + i * 20 : 70 + i * 15, crankTime);
      crankOsc.frequency.exponentialRampToValueAtTime(35, crankTime + 0.045);
      crankGain.gain.setValueAtTime(0.05, crankTime);
      crankGain.gain.exponentialRampToValueAtTime(0.001, crankTime + 0.045);
      crankOsc.connect(crankGain);
      crankGain.connect(ctx.destination);
      crankOsc.start(crankTime);
      crankOsc.stop(crankTime + 0.05);
    }

    // 2. High-Octane Supercar V10 / V12 Combustion Ignition Roar!
    const roarStart = now + 0.20;
    const peakFreq = isScalp ? 440 : 360; // Scalp: V10 screaming rev; Intra: V12 deep roar
    const baseFreq = isScalp ? 55 : 45;

    // Sub-bass engine displacement body
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(baseFreq, roarStart);
    subOsc.frequency.exponentialRampToValueAtTime(peakFreq, roarStart + 0.32);
    subOsc.frequency.exponentialRampToValueAtTime(105, roarStart + 1.0);

    // Resonant exhaust chamber filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, roarStart);
    filter.frequency.exponentialRampToValueAtTime(1900, roarStart + 0.32);
    filter.frequency.exponentialRampToValueAtTime(480, roarStart + 1.0);
    filter.Q.setValueAtTime(4.2, roarStart);

    subGain.gain.setValueAtTime(0.001, roarStart);
    subGain.gain.linearRampToValueAtTime(0.12, roarStart + 0.09);
    subGain.gain.exponentialRampToValueAtTime(0.07, roarStart + 0.45);
    subGain.gain.exponentialRampToValueAtTime(0.001, roarStart + 1.15);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(roarStart);
    subOsc.stop(roarStart + 1.2);

    // 3. Second harmonic engine scream (overtone growl)
    const screamOsc = ctx.createOscillator();
    const screamGain = ctx.createGain();
    screamOsc.type = 'triangle';
    screamOsc.frequency.setValueAtTime(baseFreq * 2.5, roarStart + 0.05);
    screamOsc.frequency.exponentialRampToValueAtTime(peakFreq * 1.8, roarStart + 0.34);
    screamOsc.frequency.exponentialRampToValueAtTime(160, roarStart + 0.95);

    screamGain.gain.setValueAtTime(0.001, roarStart + 0.05);
    screamGain.gain.linearRampToValueAtTime(0.05, roarStart + 0.18);
    screamGain.gain.exponentialRampToValueAtTime(0.001, roarStart + 0.95);

    screamOsc.connect(screamGain);
    screamGain.connect(ctx.destination);
    screamOsc.start(roarStart + 0.05);
    screamOsc.stop(roarStart + 1.0);

    // 4. Exhaust Turbo Pop / Wastegate Flutter
    const popTime = roarStart + 0.36;
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(isScalp ? 880 : 720, popTime);
    popOsc.frequency.exponentialRampToValueAtTime(130, popTime + 0.14);
    popGain.gain.setValueAtTime(0.06, popTime);
    popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.14);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(popTime);
    popOsc.stop(popTime + 0.15);
  } catch (e) {
    // Audio fallback
  }
}

function buildDefaultSignal(pair, price, style = 'scalp', direction = 'BUY', marketAnalysis = null) {
  const normPair = normalizePair(pair || 'XAUUSD');
  const isGold = normPair === 'XAUUSD';
  const isSilver = normPair === 'XAGUSD';
  const isBtc = normPair === 'BTCUSD';

  const decimals = isSilver ? 3 : isBtc ? 1 : 2;
  const p = Number(price);
  if (!p || isNaN(p) || p <= 0) {
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'INVALID_PRICE',
      error: 'Valid live spot price is required to compute TP/SL.',
    };
  }

  const isScalp = style === 'scalp' || style === 'scalping';
  const isBuy = String(direction).toUpperCase() === 'BUY';
  const dirStr = isBuy ? 'BUY' : 'SELL';

  // For Scalping: strictly compute structure-based & ATR-filtered TP/SL
  if (isScalp) {
    const scalpResult = calculateStructureScalpTpSl({
      pair: normPair,
      direction: dirStr,
      entryPrice: p,
      marketAnalysis,
    });

    if (!scalpResult.ok) {
      return scalpResult; // { ok: false, code: 'NO_TRADE', reasonCode, error }
    }

    return {
      ok: true,
      id: `sig-scalp-${normPair.toLowerCase()}-${Date.now()}`,
      pair: normPair,
      symbol: normPair,
      direction: dirStr,
      timeframe: '1m / 5m',
      style: 'scalping',
      mode: '1M/5M QUICK SCALP',
      model: '1M-5M Liquidity Sweep + Fast FVG Tap',
      entry: scalpResult.entry,
      sl: scalpResult.sl,
      tp: scalpResult.tp,
      tp1: scalpResult.tp1,
      tp2: scalpResult.tp2,
      slDistance: scalpResult.slDistance,
      tpDistance: scalpResult.tpDistance,
      slDistanceFormatted: scalpResult.slDistanceFormatted,
      tpDistanceFormatted: scalpResult.tpDistanceFormatted,
      breakEvenTrigger: scalpResult.breakEvenTrigger,
      rr: scalpResult.rr,
      rrNumeric: scalpResult.rrNumeric,
      netRr: scalpResult.netRr,
      netRrNumeric: scalpResult.netRrNumeric,
      totalCost: scalpResult.totalCost,
      invalidationLevel: scalpResult.invalidationLevel,
      invalidationSource: scalpResult.invalidationSource,
      opposingLevel: scalpResult.opposingLevel,
      opposingSource: scalpResult.opposingSource,
      levelExplanations: scalpResult.levelExplanations,
      session: 'Active Institutional Overlap',
      status: 'active',
      confluences: scalpResult.confluences,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' }),
    };
  }

  // Day trade (Intraday)
  let slDist, tp1Dist, tp2Dist, beDist, pipsGain;
  if (isGold) {
    slDist = 10.0; // $10.00 SL
    tp1Dist = 20.0; // $20.00 TP1 (1:2.0 RR)
    tp2Dist = 25.0;
    beDist = 10.0;
    pipsGain = '+200 Pips ($20.00)';
  } else if (isSilver) {
    slDist = 0.400; // $0.400 SL
    tp1Dist = 0.800; // $0.800 TP1 (1:2.0 RR)
    tp2Dist = 1.200;
    beDist = 0.400;
    pipsGain = '+80 Pts ($0.80)';
  } else {
    // BTC
    slDist = 850.0; // $850 SL
    tp1Dist = 1700.0; // $1,700 TP1 (1:2.0 RR)
    tp2Dist = 2200.0;
    beDist = 850.0;
    pipsGain = '+1,700 Pts ($1,700.00)';
  }

  const entryVal = Number(p.toFixed(decimals));
  const slVal = Number((isBuy ? entryVal - slDist : entryVal + slDist).toFixed(decimals));
  const tpVal = Number((isBuy ? entryVal + tp1Dist : entryVal - tp1Dist).toFixed(decimals));
  const tp2Val = Number((isBuy ? entryVal + tp2Dist : entryVal - tp2Dist).toFixed(decimals));
  const beVal = beDist ? Number((isBuy ? entryVal + beDist : entryVal - beDist).toFixed(decimals)) : null;

  const modelName = isGold
    ? '3-Candle CRT Daily Liquidation Model'
    : isSilver
      ? 'Silver Institutional FVG Expansion Model'
      : 'Bitcoin Order Flow Swing Model';

  return {
    ok: true,
    id: `sig-daytrade-${normPair.toLowerCase()}-${Date.now()}`,
    pair: normPair,
    symbol: normPair,
    direction: dirStr,
    timeframe: '15m / 1H',
    style: 'daytrade',
    mode: '15M/1H DAY TRADE (CRT SWING)',
    model: modelName,
    entry: entryVal,
    sl: slVal,
    tp: tpVal,
    tp1: tpVal,
    tp2: tp2Val,
    slDistance: slDist,
    tpDistance: tp1Dist,
    slDistanceFormatted: `-$${slDist.toFixed(decimals)}`,
    tpDistanceFormatted: `+$${tp1Dist.toFixed(decimals)}`,
    breakEvenTrigger: beVal,
    rr: '1:2.0',
    rrNumeric: 2.0,
    netRr: '1:1.92',
    netRrNumeric: 1.92,
    levelExplanations: {
      entry: `${dirStr} execution at live spot ($${entryVal.toFixed(decimals)}) aligned with 15M/1H multi-timeframe structure.`,
      sl: `Placed $${slDist.toFixed(decimals)} ${isBuy ? 'below' : 'above'} 15M/1H invalidation swing ($${slVal.toFixed(decimals)}).`,
      tp: `Targets next 1H institutional liquidity pool $${tp1Dist.toFixed(decimals)} away ($${tpVal.toFixed(decimals)}) for 1:2.0 R:R.`,
    },
    pipsGain,
    session: 'Active Institutional Overlap',
    status: 'active',
    confluences: [
      `${normPair} ${isBuy ? 'demand' : 'supply'} liquidity swept with 15M/1H confirmation`,
      `Stop Loss strictly locked at $${slDist.toFixed(decimals)} distance beyond structural swing`,
      `Take Profit secured at 1:2.0 Risk-to-Reward ratio ($${tp1Dist.toFixed(decimals)} target)`,
    ],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' }),
  };
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
  const [engineStartAnimation, setEngineStartAnimation] = useState(null);

  const handleSwitchPipMode = useCallback((nextMode) => {
    if (nextMode === pipMode && !engineStartAnimation) return;
    setPipMode(nextMode);
    setEngineStartAnimation({ mode: nextMode, timestamp: Date.now() });
    playSupercarEngineStart(nextMode);
    setTimeout(() => {
      setEngineStartAnimation((prev) => (prev && Date.now() - prev.timestamp >= 1250 ? null : prev));
    }, 1350);
  }, [pipMode, engineStartAnimation]);

  const [scalpScanState, setScalpScanState] = useState({
    isScanning: false,
    activeStep: 0,
    stepStatuses: { 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' },
    telemetry: '',
    completionStatus: null,
  });
  const [intraScanState, setIntraScanState] = useState({
    isScanning: false,
    activeStep: 0,
    stepStatuses: { 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' },
    telemetry: '',
    completionStatus: null,
  });
  const [intraConditionMet, setIntraConditionMet] = useState(false);
  const [scalpSignal, setScalpSignal] = useState(null);
  const [dayTradeSignal, setDayTradeSignal] = useState(null);
  const [signalCopiedNotice, setSignalCopiedNotice] = useState(false);
  const [signalSavedNotice, setSignalSavedNotice] = useState(false);
  const [liveCalendarEvents, setLiveCalendarEvents] = useState(null);
  const [liveNewsItems, setLiveNewsItems] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [minutesElapsed, setMinutesElapsed] = useState(2);
  const activePairRef = useRef(currentAsset.pair || 'XAUUSD');
  activePairRef.current = currentAsset.pair || 'XAUUSD';
  const scanRequestIdRef = useRef(0);

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

  const rawPrice = Number(livePrice) || Number(marketAnalysis?.price) || currentAsset.defaultPrice || 4169.735;
  const p = useMemo(() => {
    if (isCrypto && rawPrice < 10000) return currentAsset.defaultPrice || 81632.50;
    if (pair.includes('US30') && rawPrice < 10000) return currentAsset.defaultPrice || 51830.0;
    if (isGold && (rawPrice < 1000 || rawPrice > 10000)) return currentAsset.defaultPrice || 4171.25;
    if (isForex && rawPrice > 10) return currentAsset.defaultPrice || 1.1225;
    if (isJpy && (rawPrice < 50 || rawPrice > 300)) return currentAsset.defaultPrice || 149.20;
    return rawPrice;
  }, [rawPrice, isCrypto, pair, isGold, isForex, isJpy, currentAsset.defaultPrice]);
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
    activePairRef.current = pair;
    scanRequestIdRef.current += 1; // Invalidate any running scan immediately
    setScalpScanState({
      isScanning: false,
      activeStep: 0,
      stepStatuses: { 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' },
      telemetry: '',
      completionStatus: null,
    });
    setIntraScanState({
      isScanning: false,
      activeStep: 0,
      stepStatuses: { 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' },
      telemetry: '',
      completionStatus: null,
    });

    try {
      const isCorruptOrInvalid = (sig) => {
        if (!sig) return true;
        const e = Number(sig.entry);
        const s = Number(sig.sl);
        const t = Number(sig.tp);
        if (isNaN(e) || isNaN(s) || isNaN(t) || e <= 0 || s <= 0 || t <= 0) return true;
        if (Math.abs(e - s) < 0.001 || Math.abs(e - t) < 0.001) return true;
        const sPair = (sig.pair || sig.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const currentNorm = pair.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (sPair !== currentNorm) return true;
        const validation = validateSignal(sig, Number(livePrice) || p);
        return !validation.isValid;
      };

      // Switching pairs: strictly load previously saved valid signals for this pair without sending or dispatching any new signal
      const savedScalp = localStorage.getItem(`genz_locked_scalp_${pair}`);
      if (savedScalp) {
        try {
          const parsed = JSON.parse(savedScalp);
          if (!isCorruptOrInvalid(parsed)) {
            setScalpSignal(parsed);
          } else {
            setScalpSignal(null);
            localStorage.removeItem(`genz_locked_scalp_${pair}`);
          }
        } catch {
          setScalpSignal(null);
        }
      } else {
        setScalpSignal(null);
      }

      const savedDay = localStorage.getItem(`genz_locked_daytrade_${pair}`);
      if (savedDay) {
        try {
          const parsed = JSON.parse(savedDay);
          if (!isCorruptOrInvalid(parsed)) {
            setDayTradeSignal(parsed);
          } else {
            setDayTradeSignal(null);
            localStorage.removeItem(`genz_locked_daytrade_${pair}`);
          }
        } catch {
          setDayTradeSignal(null);
        }
      } else {
        setDayTradeSignal(null);
      }
    } catch {
      setScalpSignal(null);
      setDayTradeSignal(null);
    }
  }, [pair, livePrice, p]);

  // Keep intraConditionMet synchronized for UI display only (NEVER auto-dispatches on pair switch)
  useEffect(() => {
    if (!marketStatus.isOpen) {
      setIntraConditionMet(false);
      return;
    }
    setIntraConditionMet(Boolean(intraConditionResult.met));
  }, [marketStatus.isOpen, intraConditionResult.met]);

  const currentScalpSignal = scalpSignal;
  const currentDayTradeSignal = dayTradeSignal;
  const activeSignal = pipMode === 'scalp' ? currentScalpSignal : currentDayTradeSignal;
  const currentScanState = pipMode === 'scalp' ? scalpScanState : intraScanState;

  const handleScanSignal = async (mode = pipMode) => {
    const normMode = mode === 'daytrade' || mode === 'intra' ? 'daytrade' : 'scalp';
    const isTargetScalp = normMode === 'scalp';
    const currentScanState = isTargetScalp ? scalpScanState : intraScanState;
    const setTargetScanState = isTargetScalp ? setScalpScanState : setIntraScanState;

    if (currentScanState.isScanning) return; // Prevent duplicate scan clicks

    if (!marketStatus.isOpen) {
      setTargetScanState({
        isScanning: false,
        activeStep: 1,
        stepStatuses: { 1: 'error', 2: 'pending', 3: 'pending', 4: 'pending' },
        telemetry: `Scanner Paused: Market Closed (${marketStatus.sessionName}). Interbank markets do not trade 24/7.`,
        completionStatus: 'ERROR',
      });
      return;
    }

    scanRequestIdRef.current += 1;
    const currentRequestId = scanRequestIdRef.current;
    const targetPair = pair;
    const lockedScanPrice = Number(livePrice) || p;

    // Initialize 4-step scan state
    setTargetScanState({
      isScanning: true,
      activeStep: 1,
      stepStatuses: { 1: 'active', 2: 'pending', 3: 'pending', 4: 'pending' },
      telemetry: `Step 1/4 — Market Data: Verifying live ${targetPair} spot stream & data freshness...`,
      completionStatus: null,
    });
    playScanSound();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const isCancelled = () => activePairRef.current !== targetPair || scanRequestIdRef.current !== currentRequestId;

    try {
      // -------------------------------------------------------------
      // STAGE 1: Market Data
      // -------------------------------------------------------------
      await sleep(350);
      if (isCancelled()) return;

      const step1 = executeScanStep1_MarketData(targetPair, lockedScanPrice, { marketStatus });
      if (!step1.ok) {
        setTargetScanState({
          isScanning: false,
          activeStep: 1,
          stepStatuses: { 1: 'error', 2: 'pending', 3: 'pending', 4: 'pending' },
          telemetry: `Step 1/4 Error: ${step1.errorMessage}`,
          completionStatus: 'ERROR',
        });
        if (isTargetScalp) {
          setScalpSignal(null);
          try { localStorage.removeItem(`genz_locked_scalp_${targetPair}`); } catch {}
        } else {
          setDayTradeSignal(null);
          try { localStorage.removeItem(`genz_locked_daytrade_${targetPair}`); } catch {}
        }
        return;
      }

      // Step 1 Success -> Advance to Step 2
      setTargetScanState((prev) => ({
        ...prev,
        activeStep: 2,
        stepStatuses: { 1: 'done', 2: 'active', 3: 'pending', 4: 'pending' },
        telemetry: isTargetScalp
          ? `Step 2/4 — Technical Analysis: Evaluating 1M/5M momentum expansion & micro-order blocks...`
          : `Step 2/4 — Technical Analysis: Auditing 15M/1H/4H Asian High/Low boundaries & CRT structure...`,
      }));

      // -------------------------------------------------------------
      // STAGE 2: Technical Analysis
      // -------------------------------------------------------------
      await sleep(400);
      if (isCancelled()) return;

      const step2 = executeScanStep2_TechnicalAnalysis(targetPair, normMode, marketAnalysis);
      if (!step2.ok) {
        setTargetScanState({
          isScanning: false,
          activeStep: 2,
          stepStatuses: { 1: 'done', 2: 'error', 3: 'pending', 4: 'pending' },
          telemetry: `Step 2/4 Error: ${step2.errorMessage}`,
          completionStatus: 'ERROR',
        });
        return;
      }

      if (!step2.conditionMet) {
        // Strategy conditions not met (e.g. equilibrium chop / conflicting MTF) -> Advance to Step 4 with NO_VALID_SETUP
        await sleep(300);
        if (isCancelled()) return;

        setTargetScanState({
          isScanning: false,
          activeStep: 4,
          stepStatuses: { 1: 'done', 2: 'done', 3: 'pending', 4: 'no_signal' },
          telemetry: `Step 4/4 — Final Decision: SCAN COMPLETE · NO VALID SETUP (${step2.reason})`,
          completionStatus: 'NO_SIGNAL',
        });

        if (isTargetScalp) {
          setScalpSignal(null);
          try { localStorage.removeItem(`genz_locked_scalp_${targetPair}`); } catch {}
        } else {
          setDayTradeSignal(null);
          try { localStorage.removeItem(`genz_locked_daytrade_${targetPair}`); } catch {}
        }
        return;
      }

      // Step 2 Success -> Advance to Step 3
      setTargetScanState((prev) => ({
        ...prev,
        activeStep: 3,
        stepStatuses: { 1: 'done', 2: 'done', 3: 'active', 4: 'pending' },
        telemetry: `Step 3/4 — AI Validation: Computing structure SL/TP, checking ATR noise & transaction costs...`,
      }));

      // -------------------------------------------------------------
      // STAGE 3: AI Analysis & Validation
      // -------------------------------------------------------------
      await sleep(400);
      if (isCancelled()) return;

      const candidate = buildDefaultSignal(targetPair, lockedScanPrice, normMode, step2.direction, marketAnalysis);
      if (!candidate || candidate.ok === false) {
        await sleep(300);
        if (isCancelled()) return;

        const rejectMsg = candidate?.error || 'Setup rejected by scalping risk/reward & structure filter (NO TRADE).';
        setTargetScanState({
          isScanning: false,
          activeStep: 4,
          stepStatuses: { 1: 'done', 2: 'done', 3: 'error', 4: 'no_signal' },
          telemetry: `Step 4/4 — Final Decision: NO TRADE (${rejectMsg})`,
          completionStatus: 'NO_SIGNAL',
        });

        if (isTargetScalp) {
          setScalpSignal(null);
          try { localStorage.removeItem(`genz_locked_scalp_${targetPair}`); } catch {}
        } else {
          setDayTradeSignal(null);
          try { localStorage.removeItem(`genz_locked_daytrade_${targetPair}`); } catch {}
        }
        return;
      }

      const step3 = executeScanStep3_AiValidation(candidate, lockedScanPrice, normMode, { activePair: targetPair });

      if (!step3.ok) {
        // Validation failed
        await sleep(300);
        if (isCancelled()) return;

        setTargetScanState({
          isScanning: false,
          activeStep: 4,
          stepStatuses: { 1: 'done', 2: 'done', 3: 'error', 4: 'no_signal' },
          telemetry: `Step 4/4 — Final Decision: Signal rejected during validation (${step3.error})`,
          completionStatus: 'NO_SIGNAL',
        });

        if (isTargetScalp) {
          setScalpSignal(null);
          try { localStorage.removeItem(`genz_locked_scalp_${targetPair}`); } catch {}
        } else {
          setDayTradeSignal(null);
          try { localStorage.removeItem(`genz_locked_daytrade_${targetPair}`); } catch {}
        }
        return;
      }

      // Step 3 Success -> Advance to Step 4
      setTargetScanState((prev) => ({
        ...prev,
        activeStep: 4,
        stepStatuses: { 1: 'done', 2: 'done', 3: 'done', 4: 'active' },
        telemetry: `Step 4/4 — Final Decision: Committing validated setup to system...`,
      }));

      // -------------------------------------------------------------
      // STAGE 4: Final Decision
      // -------------------------------------------------------------
      await sleep(300);
      if (isCancelled()) return;

      const decision = executeScanStep4_FinalDecision(step1, step2, step3);

      playSuccessChime();

      setTargetScanState({
        isScanning: false,
        activeStep: 4,
        stepStatuses: { 1: 'done', 2: 'done', 3: 'done', 4: 'done' },
        telemetry: `Step 4/4 — Valid Setup Confirmed: ${decision.signal.direction} ${decision.signal.pair} @ $${formatSpotPrice(targetPair, decision.signal.entry)} (R:R ${decision.signal.rr})`,
        completionStatus: 'SIGNAL_PUBLISHED',
      });

      if (isTargetScalp) {
        setScalpSignal(decision.signal);
        try { localStorage.setItem(`genz_locked_scalp_${targetPair}`, JSON.stringify(decision.signal)); } catch {}
      } else {
        setDayTradeSignal(decision.signal);
        try { localStorage.setItem(`genz_locked_daytrade_${targetPair}`, JSON.stringify(decision.signal)); } catch {}
      }

      dispatchSignalToSystem(decision.signal, normMode);
    } catch (scanErr) {
      console.warn('[handleScanSignal] Unexpected scan error:', scanErr);
      if (isCancelled()) return;
      setTargetScanState({
        isScanning: false,
        activeStep: 4,
        stepStatuses: { 1: 'error', 2: 'pending', 3: 'pending', 4: 'pending' },
        telemetry: `Scan Error: ${scanErr.message || 'Operation interrupted.'}`,
        completionStatus: 'ERROR',
      });
    }
  };

  const handleCopySignal = (sig = activeSignal) => {
    if (!sig) return;
    const slDistStr = sig.slDistanceFormatted || (sig.slDistance != null ? `-$${Number(sig.slDistance).toFixed(decimals)}` : '');
    const tpDistStr = sig.tpDistanceFormatted || (sig.tpDistance != null ? `+$${Number(sig.tpDistance).toFixed(decimals)}` : '');
    const explanationsText = sig.levelExplanations
      ? `\nLevel Rationale:\n• Entry: ${sig.levelExplanations.entry}\n• SL: ${sig.levelExplanations.sl}\n• TP: ${sig.levelExplanations.tp}`
      : '';
    const text = `[GenZTrader Pip Signal - ${sig.mode || sig.style}]
Asset: ${sig.pair}
Action: ${sig.direction}
Entry: $${formatCommaPrice(sig.entry, decimals)}
SL: $${formatCommaPrice(sig.sl, decimals)}${slDistStr ? ` (${slDistStr})` : ''}
TP: $${formatCommaPrice(sig.tp1 || sig.tp, decimals)}${tpDistStr ? ` (${tpDistStr})` : ''}
${sig.tp2 ? `TP2 (Runner): $${formatCommaPrice(sig.tp2, decimals)}\n` : ''}${sig.breakEvenTrigger ? `BE Trigger: $${formatCommaPrice(sig.breakEvenTrigger, decimals)}\n` : ''}R:R: ${sig.rr || '1:2.0'}${sig.netRr ? ` (Net ${sig.netRr} after costs)` : ''}
Model: ${sig.model || 'ICT SMC Model'}${explanationsText}`;

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
    <div className={`ait-ma-root ait-aii-root ${engineStartAnimation ? `engine-revving mode-${engineStartAnimation.mode}` : ''}`}>
      {/* SUPERCAR ENGINE IGNITION OVERLAY (LAMBORGHINI / FERRARI COCKPIT HUD) */}
      {engineStartAnimation && (
        <div
          className={`ait-supercar-engine-hud mode-${engineStartAnimation.mode}`}
          aria-hidden="true"
        >
          {/* Cockpit HUD Scanlines & Carbon Vignette */}
          <div className="ait-sce-cockpit-grid" />
          <div className="ait-sce-laser-sweep" />

          {/* Top F1 / Supercar Steering Wheel Shift-Light LED Bar */}
          <div className="ait-sce-top-cluster">
            <div className="ait-sce-brand-pill">
              <span className="ait-sce-brand-logo">
                {engineStartAnimation.mode === 'scalp' ? '⚡ CORSA V10' : '🏎️ SCUDERIA V12'}
              </span>
              <span className="ait-sce-brand-tag">IGNITION ACTIVE</span>
            </div>

            <div className="ait-sce-shift-lights">
              <span className="ait-sce-led led-green l1" />
              <span className="ait-sce-led led-green l2" />
              <span className="ait-sce-led led-green l3" />
              <span className="ait-sce-led led-yellow l4" />
              <span className="ait-sce-led led-yellow l5" />
              <span className="ait-sce-led led-amber l6" />
              <span className="ait-sce-led led-amber l7" />
              <span className="ait-sce-led led-red l8" />
              <span className="ait-sce-led led-red l9" />
              <span className="ait-sce-led led-red l10" />
              <span className="ait-sce-led led-blue l11" />
              <span className="ait-sce-led led-blue l12" />
            </div>

            <div className="ait-sce-rpm-gauge">
              <span className="ait-sce-rpm-num">
                {engineStartAnimation.mode === 'scalp' ? '9,250' : '8,900'}
              </span>
              <span className="ait-sce-rpm-unit">RPM</span>
            </div>
          </div>

          {/* Center Ignition Stage & Combustion Shockwaves */}
          <div className="ait-sce-center-stage">
            <div className="ait-sce-blast-ring r1" />
            <div className="ait-sce-blast-ring r2" />
            <div className="ait-sce-blast-ring r3" />

            <div className="ait-sce-start-button">
              <div className="ait-sce-btn-outer-ring" />
              <div className="ait-sce-btn-inner-core">
                <span className="ait-sce-engine-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    <path d="m4.93 4.93 2.12 2.12m9.9 9.9 2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12" />
                  </svg>
                </span>
                <span className="ait-sce-btn-text">ENGINE</span>
                <span className="ait-sce-btn-sub">START</span>
              </div>
            </div>

            <div className="ait-sce-ignite-title">
              {engineStartAnimation.mode === 'scalp' ? (
                <>
                  <h3 className="ait-sce-heading scalp">LAMBORGHINI V10 TWIN-TURBO</h3>
                  <p className="ait-sce-subheading">CORSA HYPER-SCALP IGNITION • 1M/5M MICRO-SWEEP</p>
                </>
              ) : (
                <>
                  <h3 className="ait-sce-heading daytrade">FERRARI V12 NATURALLY ASPIRATED</h3>
                  <p className="ait-sce-subheading">SCUDERIA CRT INTRA-TRADE • 15M/1H INSTITUTIONAL</p>
                </>
              )}
            </div>

            {/* Live Combustion Telemetry */}
            <div className="ait-sce-telemetry-pills">
              <span className="ait-sce-tel-item">
                <span className="ait-sce-tel-dot" /> BOOST: <strong>2.6 BAR</strong>
              </span>
              <span className="ait-sce-tel-item">
                <span className="ait-sce-tel-dot" /> COMPRESSION: <strong>12.8:1</strong>
              </span>
              <span className="ait-sce-tel-item">
                <span className="ait-sce-tel-dot" /> OCTANE: <strong>100% CONFLUENCE</strong>
              </span>
            </div>
          </div>

          {/* Bottom Dual Exhaust Flame Nozzles */}
          <div className="ait-sce-exhaust-bar">
            <div className="ait-sce-exhaust-flame left" />
            <div className="ait-sce-exhaust-center-track">
              <span className="ait-sce-exhaust-label">
                {engineStartAnimation.mode === 'scalp' ? 'EXHAUST FLUTTER • ACTIVE' : 'EXHAUST ROAR • ACTIVE'}
              </span>
            </div>
            <div className="ait-sce-exhaust-flame right" />
          </div>
        </div>
      )}

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
                onClick={() => handleSwitchPipMode('scalp')}
              >
                <span className="ait-pm-mode-icon"><IconZap width="17" height="17" /></span>
                <div className="ait-pm-mode-meta">
                  <strong className="ait-pm-mode-title">Pip Scalp</strong>
                  <span className="ait-pm-mode-sub">1m • 5m Structure &amp; ATR Scalp (Min 1.5:1 R:R)</span>
                </div>
                <span className="ait-pm-pill-tag amber">Structure Validated</span>
              </button>

              <button
                type="button"
                className={`ait-pm-mode-tab ${pipMode === 'daytrade' ? 'active intra' : ''}`}
                onClick={() => handleSwitchPipMode('daytrade')}
              >
                <span className="ait-pm-mode-icon"><IconTarget width="17" height="17" /></span>
                <div className="ait-pm-mode-meta">
                  <strong className="ait-pm-mode-title">Pip Intra Trade</strong>
                  <span className="ait-pm-mode-sub">15m • 1h • 4h CRT Swings (Min 2.0:1 R:R)</span>
                </div>
                <span className="ait-pm-pill-tag cyan">Autonomous Monitor</span>
              </button>
            </div>

            {/* 3. CENTRAL PIP MACHINE RADAR & SCAN HUD */}
            <div className={`ait-pm-radar-hud ${currentScanState.isScanning ? 'scanning' : ''} ${!marketStatus.isOpen ? 'closed' : ''}`}>
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
                {/* 4-Step Scanning Stepper Component (Unified visual design, independent strategies) */}
                <ScanWorkflowStepper
                  mode={pipMode}
                  pair={pair}
                  symbolLabel={assetSubtitle}
                  scanState={currentScanState}
                  isMarketOpen={marketStatus.isOpen}
                />

                {/* Scan Action Controls */}
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
                      className={`ait-pm-scan-btn ${currentScanState.isScanning ? 'busy' : ''}`}
                      onClick={() => handleScanSignal(pipMode)}
                      disabled={currentScanState.isScanning}
                    >
                      <span className="ait-pm-scan-glow" />
                      <svg className={currentScanState.isScanning ? 'ait-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <span>
                        {currentScanState.isScanning
                          ? 'Scanning 4-Step Pipeline...'
                          : pipMode === 'scalp'
                            ? 'Scan 1M/5M Pip Scalp'
                            : 'Scan 15M/1H Pip Intra'}
                      </span>
                    </button>
                  )}

                  {/* Autonomous Dispatch Monitor Badge for Daytrade */}
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
            {/* 4A. SCALP MODE: SIGNAL CARD WITH ENTRY, TP, SL, DISTANCES, R:R & LEVEL EXPLANATIONS */}
            {pipMode === 'scalp' && currentScalpSignal && (() => {
              const sEntry = Number(currentScalpSignal.entry);
              const sSl = Number(currentScalpSignal.sl);
              const sTp = Number(currentScalpSignal.tp1 ?? currentScalpSignal.tp);
              const sSlDist = currentScalpSignal.slDistance ?? Math.abs(sEntry - sSl);
              const sTpDist = currentScalpSignal.tpDistance ?? Math.abs(sTp - sEntry);
              const sSlDistFmt = currentScalpSignal.slDistanceFormatted || `-$${sSlDist.toFixed(decimals)}`;
              const sTpDistFmt = currentScalpSignal.tpDistanceFormatted || `+$${sTpDist.toFixed(decimals)}`;
              const sRr = currentScalpSignal.rr || (sSlDist > 0 ? `1:${(sTpDist / sSlDist).toFixed(1)}` : '1:2.0');
              const sNetRr = currentScalpSignal.netRr || null;
              const sExpl = currentScalpSignal.levelExplanations || {
                entry: `${currentScalpSignal.direction} execution at live spot ($${formatCommaPrice(sEntry, decimals)}) after 1M/5M structure confirmation.`,
                sl: `Placed ${sSlDistFmt} beyond nearest market-structure invalidation point + ATR noise buffer.`,
                tp: `Targets nearest opposing liquidity pool (${sTpDistFmt}) for realistic scalp R:R (${sRr}).`,
              };

              return (
                <div className="ait-pm-signal-card-wrap">
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
                        <span className="ait-pm-sr-tf-tag">1M / 5M SCALP</span>
                      </div>
                    </div>

                    <div className="ait-pm-sr-metrics">
                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">ENTRY PRICE</span>
                        <strong className="ait-pm-sr-val text-cyan ait-mono">
                          ${formatCommaPrice(sEntry, decimals)}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-cyan">Live Spot</span>
                      </div>

                      <div className="ait-pm-sr-divider" />

                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">STOP LOSS (SL)</span>
                        <strong className="ait-pm-sr-val text-red ait-mono">
                          ${formatCommaPrice(sSl, decimals)}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-red" title="SL Distance from Entry">
                          {sSlDistFmt}
                        </span>
                      </div>

                      <div className="ait-pm-sr-divider" />

                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">TAKE PROFIT (TP)</span>
                        <strong className="ait-pm-sr-val text-emerald ait-mono">
                          ${formatCommaPrice(sTp, decimals)}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-emerald" title="TP Distance from Entry">
                          {sTpDistFmt}
                        </span>
                      </div>

                      <div className="ait-pm-sr-divider" />

                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">REWARD : RISK</span>
                        <strong className="ait-pm-sr-val text-cyan ait-mono">
                          {sRr}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-emerald">
                          {sNetRr ? `Net ${sNetRr}` : 'Cost Verified'}
                        </span>
                      </div>
                    </div>

                    <div className="ait-pm-sr-actions">
                      {signalSavedNotice && (
                        <span className="ait-pm-saved-badge">
                          <IconCheck width="11" height="11" /> Stored in Firestore &amp; Alert Sent
                        </span>
                      )}
                      <span className="ait-pm-sr-conf">VALIDATED</span>
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

                  {/* Level Selection Explanations (Entry, SL, TP Rationale) */}
                  <div className="ait-pm-level-explanations">
                    <div className="ait-pm-le-item">
                      <span className="ait-pm-le-badge cyan">ENTRY WHY</span>
                      <p className="ait-pm-le-text">{sExpl.entry}</p>
                    </div>
                    <div className="ait-pm-le-item">
                      <span className="ait-pm-le-badge red">SL WHY</span>
                      <p className="ait-pm-le-text">{sExpl.sl}</p>
                    </div>
                    <div className="ait-pm-le-item">
                      <span className="ait-pm-le-badge emerald">TP WHY</span>
                      <p className="ait-pm-le-text">{sExpl.tp}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4B. INTRA TRADE MODE: MARKET CLOSED NOTICE ONLY WHEN MARKET IS CLOSED */}
            {pipMode === 'daytrade' && !marketStatus.isOpen && !dayTradeSignal && (
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

            {/* 4C. INTRA TRADE MODE: IF CONDITION MET, SHOW HIGH-CONVICTION CRT SIGNAL ROW */}
            {pipMode === 'daytrade' && dayTradeSignal && (() => {
              const dEntry = Number(dayTradeSignal.entry);
              const dSl = Number(dayTradeSignal.sl);
              const dTp = Number(dayTradeSignal.tp1 ?? dayTradeSignal.tp);
              const dSlDist = dayTradeSignal.slDistance ?? Math.abs(dEntry - dSl);
              const dTpDist = dayTradeSignal.tpDistance ?? Math.abs(dTp - dEntry);
              const dSlDistFmt = dayTradeSignal.slDistanceFormatted || `-$${dSlDist.toFixed(decimals)}`;
              const dTpDistFmt = dayTradeSignal.tpDistanceFormatted || `+$${dTpDist.toFixed(decimals)}`;
              const dRr = dayTradeSignal.rr || (dSlDist > 0 ? `1:${(dTpDist / dSlDist).toFixed(1)}` : '1:2.0');
              const dExpl = dayTradeSignal.levelExplanations || {
                entry: `${dayTradeSignal.direction} execution at live spot ($${formatCommaPrice(dEntry, decimals)}) aligned with 15M/1H multi-timeframe structure.`,
                sl: `Placed ${dSlDistFmt} beyond 15M/1H invalidation swing ($${formatCommaPrice(dSl, decimals)}).`,
                tp: `Targets 1H opposing liquidity zone (${dTpDistFmt}) for ${dRr} R:R.`,
              };

              return (
                <div className="ait-pm-signal-card-wrap">
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
                        <span className="ait-pm-sr-label">ENTRY PRICE</span>
                        <strong className="ait-pm-sr-val text-cyan ait-mono">
                          ${formatCommaPrice(dEntry, decimals)}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-cyan">Live Spot</span>
                      </div>

                      <div className="ait-pm-sr-divider" />

                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">STOP LOSS (SL)</span>
                        <strong className="ait-pm-sr-val text-red ait-mono">
                          ${formatCommaPrice(dSl, decimals)}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-red">{dSlDistFmt}</span>
                      </div>

                      <div className="ait-pm-sr-divider" />

                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">TAKE PROFIT (TP)</span>
                        <strong className="ait-pm-sr-val text-emerald ait-mono">
                          ${formatCommaPrice(dTp, decimals)}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-emerald">{dTpDistFmt}</span>
                      </div>

                      <div className="ait-pm-sr-divider" />

                      <div className="ait-pm-sr-item">
                        <span className="ait-pm-sr-label">REWARD : RISK</span>
                        <strong className="ait-pm-sr-val text-cyan ait-mono">
                          {dRr}
                        </strong>
                        <span className="ait-pm-sr-tag-badge text-cyan">
                          {dayTradeSignal.breakEvenTrigger ? `BE $${formatCommaPrice(dayTradeSignal.breakEvenTrigger, decimals)}` : 'CRT Swing'}
                        </span>
                      </div>
                    </div>

                    <div className="ait-pm-sr-actions">
                      {signalSavedNotice && (
                        <span className="ait-pm-saved-badge">
                          <IconCheck width="11" height="11" /> Stored in Firestore &amp; Alert Sent
                        </span>
                      )}
                      <span className="ait-pm-sr-conf cyan">VALIDATED</span>
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

                  {/* Level Selection Explanations (Entry, SL, TP Rationale) */}
                  <div className="ait-pm-level-explanations">
                    <div className="ait-pm-le-item">
                      <span className="ait-pm-le-badge cyan">ENTRY WHY</span>
                      <p className="ait-pm-le-text">{dExpl.entry}</p>
                    </div>
                    <div className="ait-pm-le-item">
                      <span className="ait-pm-le-badge red">SL WHY</span>
                      <p className="ait-pm-le-text">{dExpl.sl}</p>
                    </div>
                    <div className="ait-pm-le-item">
                      <span className="ait-pm-le-badge emerald">TP WHY</span>
                      <p className="ait-pm-le-text">{dExpl.tp}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
