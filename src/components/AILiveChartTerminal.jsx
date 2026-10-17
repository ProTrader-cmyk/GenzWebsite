import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { updateSignalStatus } from '../data/signals.js';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fetchLivePrice, formatSpotPrice, subscribeLiveTicks, fetchLiveExtremePrices } from '../services/marketPriceService.js';
import { run15mMarketReanalysis, get15mCandleTimeRemaining } from '../services/marketAnalysisService.js';
import { getMarketHoursStatus } from '../services/marketHoursService.js';
import MarketAnalysisPanel from './MarketAnalysisPanel.jsx';

const TV_LOCALE = 'en';

export const SUPPORTED_PAIRS = ['XAUUSD', 'XAGUSD', 'BTCUSD'];

const SYMBOLS = [
  { id: 'gold', symbol: 'OANDA:XAUUSD', label: 'XAU/USD', name: 'Gold', pair: 'XAUUSD', pipScale: 0.1, defaultPrice: 4171.25 },
  { id: 'silver', symbol: 'OANDA:XAGUSD', label: 'XAG/USD', name: 'Silver', pair: 'XAGUSD', pipScale: 0.01, defaultPrice: 57.00 },
  { id: 'btc', symbol: 'BINANCE:BTCUSDT', label: 'BTC/USD', name: 'Bitcoin', pair: 'BTCUSD', pipScale: 1.0, defaultPrice: 81600.00 },
];

const TIMEFRAMES = [
  { id: '1', label: '1m' },
  { id: '5', label: '5m' },
  { id: '15', label: '15m' },
  { id: '60', label: '1H' },
  { id: '240', label: '4H' },
  { id: 'D', label: '1D' },
];

const AI_MODELS = [
  { id: 'smc', name: 'Pip SMC Alpha v4.2', desc: 'Liquidity Pools, FVGs & Order Blocks' },
  { id: 'macro', name: 'Pip Macro Neural Net', desc: 'High-Impact Volatility & News Catalysts' },
  { id: 'scalp', name: 'Pip Micro Scalp Quant', desc: '1M-5M Imbalances & Order Flow' },
];

function playAiBeep(type = 'scan', isMuted = false) {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'trade') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'signal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch {
    // Audio Context not allowed or unsupported
  }
}

let tvScriptPromise = null;
function loadTradingViewScript() {
  if (window.TradingView) return Promise.resolve();
  if (!tvScriptPromise) {
    tvScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return tvScriptPromise;
}

// Strict Helper: In-Chart Auto Setup is EXCLUSIVELY for Intra Trade / Day Trade (Never for Scalp)
export function isIntraTradeSignal(sig) {
  if (!sig) return false;
  // If explicitly daytrade or intra
  if (sig.style === 'daytrade' || sig.style === 'intra' || sig.style === 'intraday') return true;
  // If explicitly scalping
  if (sig.style === 'scalping' || sig.style === 'scalp') return false;

  const model = String(sig.model || '').toLowerCase();
  const mode = String(sig.mode || '').toLowerCase();
  const id = String(sig.id || '').toLowerCase();
  const tf = String(sig.timeframe || '').toLowerCase();

  // 1. Strictly exclude any scalp characteristics
  if (
    id.includes('scalp') ||
    model.includes('scalp') ||
    mode.includes('scalp') ||
    tf.includes('1m') ||
    tf.includes('5m')
  ) {
    return false;
  }

  // 2. Identify intra trade / day trade / CRT models
  if (
    id.includes('daytrade') ||
    model.includes('crt') ||
    mode.includes('crt') ||
    model.includes('intraday') ||
    mode.includes('day trade') ||
    tf.includes('15m') ||
    tf.includes('1h') ||
    tf.includes('4h')
  ) {
    return true;
  }

  return true;
}

export default function AILiveChartTerminal({
  user,
  onSignalDispatched,
  activeSession = { name: 'London Killzone', status: 'Optimal Volatility', color: '#10B981' },
  activeSignals = [],
}) {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isKhmer = lang === 'km' || lang === 'kh';

  const [symbolId, setSymbolId] = useState('gold');
  const activeSymbolIdRef = useRef(symbolId);
  activeSymbolIdRef.current = symbolId;
  const [timeframe, setTimeframe] = useState('15');
  const [selectedModel, setSelectedModel] = useState('smc');
  const [isMuted, setIsMuted] = useState(false);
  const [tvFullscreen, setTvFullscreen] = useState(false);
  const [isTheatreMode, setIsTheatreMode] = useState(false);
  const [msobActive, setMsobActive] = useState(true);
  const [workstationView, setWorkstationView] = useState('split'); // 'split' | 'chart' | 'analysis'

  // MSOB HUD Position & Drag State (Safe from clickable TradingView header controls)
  const [hudCustomPos, setHudCustomPos] = useState(null); // { left, top }
  const [isDraggingHud, setIsDraggingHud] = useState(false);
  const dragStartRef = useRef(null);
  const hudCardRef = useRef(null);

  // In-Chart Auto Trade Setup State & Drag
  const [liveSignals, setLiveSignals] = useState([]);
  const [closedSignalIds, setClosedSignalIds] = useState(() => new Set());
  const [recentOutcomeNotice, setRecentOutcomeNotice] = useState(null);
  const [autoSetupActive, setAutoSetupActive] = useState(true);
  const [setupCustomPos, setSetupCustomPos] = useState(null);
  const [isDraggingSetup, setIsDraggingSetup] = useState(false);
  const dragSetupStartRef = useRef(null);
  const setupCardRef = useRef(null);

  // Drag handlers for MSOB HUD
  const handleHudDragStart = (e) => {
    if (e.target.closest('button')) return; // Ignore clicks on action buttons
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const cardEl = hudCardRef.current;
    if (!cardEl) return;
    const cardRect = cardEl.getBoundingClientRect();
    const parentRect = cardEl.parentElement.getBoundingClientRect();

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initLeft: cardRect.left - parentRect.left,
      initTop: cardRect.top - parentRect.top,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
    };
    setIsDraggingHud(true);
  };

  useEffect(() => {
    if (!isDraggingHud) return;

    const handleMove = (e) => {
      if (!dragStartRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStartRef.current.startX;
      const dy = clientY - dragStartRef.current.startY;

      const maxLeft = Math.max(8, dragStartRef.current.parentWidth - dragStartRef.current.cardWidth - 8);
      const maxTop = Math.max(8, dragStartRef.current.parentHeight - dragStartRef.current.cardHeight - 40);

      const newLeft = Math.max(8, Math.min(maxLeft, dragStartRef.current.initLeft + dx));
      const newTop = Math.max(8, Math.min(maxTop, dragStartRef.current.initTop + dy));

      setHudCustomPos({ left: newLeft, top: newTop });
    };

    const handleEnd = () => {
      setIsDraggingHud(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingHud]);

  // Drag handlers for Auto Trade Setup HUD
  const handleSetupDragStart = (e) => {
    if (e.target.closest('button')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const cardEl = setupCardRef.current;
    if (!cardEl) return;
    const cardRect = cardEl.getBoundingClientRect();
    const parentRect = cardEl.parentElement.getBoundingClientRect();

    dragSetupStartRef.current = {
      startX: clientX,
      startY: clientY,
      initLeft: cardRect.left - parentRect.left,
      initTop: cardRect.top - parentRect.top,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
    };
    setIsDraggingSetup(true);
  };

  useEffect(() => {
    if (!isDraggingSetup) return;

    const handleMove = (e) => {
      if (!dragSetupStartRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragSetupStartRef.current.startX;
      const dy = clientY - dragSetupStartRef.current.startY;

      const maxLeft = Math.max(8, dragSetupStartRef.current.parentWidth - dragSetupStartRef.current.cardWidth - 8);
      const maxTop = Math.max(8, dragSetupStartRef.current.parentHeight - dragSetupStartRef.current.cardHeight - 40);

      const newLeft = Math.max(8, Math.min(maxLeft, dragSetupStartRef.current.initLeft + dx));
      const newTop = Math.max(8, Math.min(maxTop, dragSetupStartRef.current.initTop + dy));

      setSetupCustomPos({ left: newLeft, top: newTop });
    };

    const handleEnd = () => {
      setIsDraggingSetup(false);
      dragSetupStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingSetup]);

  // Fallback Firestore real-time listener if activeSignals prop is not passed
  useEffect(() => {
    if (activeSignals && activeSignals.length > 0) {
      setLiveSignals(activeSignals);
      return;
    }
    try {
      const q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'), limit(15));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setLiveSignals(list);
      }, (err) => {
        console.warn('[AILiveChartTerminal] Signals subscription notice:', err);
      });
      return () => unsub();
    } catch (err) {
      console.warn('[AILiveChartTerminal] Signals query error:', err);
    }
  }, [activeSignals]);

  // Active Symbol Object
  const currentAsset = SYMBOLS.find((s) => s.id === symbolId) || SYMBOLS[0];
  const currentPairNorm = (currentAsset.pair || 'XAUUSD').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pairMarketStatus = useMemo(() => getMarketHoursStatus(currentAsset.pair), [currentAsset.pair]);

  // Live Spot Prices & Extreme Peak/Trough Prices (Wicks & High/Low)
  const [livePrice, setLivePrice] = useState(currentAsset.defaultPrice);
  const [hasVerifiedLivePrice, setHasVerifiedLivePrice] = useState(false);
  const [priceChangeDirection, setPriceChangeDirection] = useState('neutral');
  const [marketExtremes, setMarketExtremes] = useState(null);
  const [marketAnalysis, setMarketAnalysis] = useState(null);

  // Locate active trade setup for the currently displayed chart asset (STRICTLY INTRA TRADE ONLY)
  const currentActiveSetup = useMemo(() => {
    let candidateSignals = [];
    const baseList = activeSignals && activeSignals.length > 0 ? activeSignals : liveSignals;
    if (Array.isArray(baseList)) {
      candidateSignals.push(...baseList);
    }

    // Include locked intra trade signal from localStorage if available
    try {
      const storedDayTradeRaw =
        localStorage.getItem(`genz_locked_daytrade_${currentAsset.pair}`) ||
        localStorage.getItem(`genz_locked_daytrade_${currentPairNorm}`);
      if (storedDayTradeRaw) {
        const storedDay = JSON.parse(storedDayTradeRaw);
        if (storedDay && !candidateSignals.some((s) => s?.id === storedDay.id)) {
          candidateSignals.push(storedDay);
        }
      }
    } catch {}

    return candidateSignals.find((s) => {
      if (!s) return false;
      const sPair = (s.pair || s.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const isMatch = sPair === currentPairNorm || 
        (currentPairNorm === 'XAUUSD' && (sPair.includes('XAU') || sPair.includes('GOLD')));
      if (!isMatch) return false;

      // 🛑 STRICT REQUIREMENT: Auto setup on the chart is ONLY for Intra Trade, NEVER for Scalp!
      if (!isIntraTradeSignal(s)) return false;

      if (closedSignalIds.has(s.id)) return false;
      const st = (s.status || 'active').toLowerCase();
      const isClosed = st === 'tp' || st === 'sl' || st === 'closed' || st === 'win' || st === 'loss';
      if (isClosed) return false;

      // Pre-flight check only when live price has been verified from real feed
      if (hasVerifiedLivePrice) {
        const isBuy = (s.direction || 'BUY').toUpperCase() === 'BUY';
        const entry = Number(s.entry ?? s.entry_price ?? s.entryPrice);
        const tp = Number(s.tp ?? s.take_profit ?? s.takeProfit);
        const sl = Number(s.sl ?? s.stop_loss ?? s.stopLoss);
        const curr = Number(livePrice);
        const peakHigh = Number(marketExtremes?.peakHigh || marketAnalysis?.sessionHigh || marketAnalysis?.high15 || 0);
        const troughLow = Number(marketExtremes?.troughLow || marketAnalysis?.sessionLow || marketAnalysis?.low15 || 0);

        if (entry > 0 && tp > 0 && sl > 0 && !isNaN(curr) && Math.abs(curr - entry) / entry < 0.15) {
          const alreadyHitTp = isBuy
            ? (curr >= tp || (curr > entry && peakHigh >= tp))
            : (curr <= tp || (curr < entry && troughLow > 0 && troughLow <= tp));
          const alreadyHitSl = isBuy ? (curr <= sl) : (curr >= sl);
          if (alreadyHitTp || alreadyHitSl) {
            return false;
          }
        }
      }

      return true;
    }) || null;
  }, [activeSignals, liveSignals, currentPairNorm, currentAsset.pair, closedSignalIds, marketExtremes, marketAnalysis, livePrice, hasVerifiedLivePrice]);

  // Precision decimals for current asset
  const decimals = currentPairNorm.includes('XAG')
    ? 3
    : currentPairNorm.includes('BTC')
      ? 2
      : 2;

  // Real-time live P&L and target distance meter for the active position (Locked strictly to 0.03 lot size)
  const POSITION_LOT_SIZE = 0.03;

  const setupPnl = useMemo(() => {
    if (!currentActiveSetup) return null;
    const isBuy = (currentActiveSetup.direction || 'BUY').toUpperCase() === 'BUY';
    const entry = Number(currentActiveSetup.entry);
    const tp = Number(currentActiveSetup.tp);
    const sl = Number(currentActiveSetup.sl);
    const curr = hasVerifiedLivePrice && livePrice ? Number(livePrice) : entry;
    const isGold = currentPairNorm.includes('XAU');
    const isSilver = currentPairNorm.includes('XAG');
    const isBtc = currentPairNorm.includes('BTC');

    const mult = isGold ? 10 : isSilver ? 100 : 1;

    const diff = isBuy ? curr - entry : entry - curr;
    const pips = diff * mult;
    const targetDiff = Math.abs(tp - entry);
    const riskDiff = Math.abs(entry - sl);
    const progressPct = targetDiff > 0 ? Math.min(100, Math.max(0, Math.round((Math.max(0, diff) / targetDiff) * 100))) : 50;

    // Real Dollar P&L calculation strictly for 0.03 LOT SIZE
    // For Gold (XAUUSD): 1 standard lot = 100 oz ($100/pt). 0.03 lot = 3 oz ($3.00/pt)
    // For Silver (XAGUSD): 1 standard lot = 5000 oz ($5000/pt). 0.03 lot = 150 oz ($150/pt)
    // For Bitcoin (BTCUSD): 1 standard lot = 1 BTC. 0.03 lot = 0.03 BTC ($0.03/pt)
    let dollarPnl = 0;
    let tpProfitUsd = 0;
    let slLossUsd = 0;

    if (isGold) {
      dollarPnl = diff * 100 * POSITION_LOT_SIZE; // $3.00 per point
      tpProfitUsd = targetDiff * 100 * POSITION_LOT_SIZE;
      slLossUsd = riskDiff * 100 * POSITION_LOT_SIZE;
    } else if (isSilver) {
      dollarPnl = diff * 5000 * POSITION_LOT_SIZE; // $150.00 per point
      tpProfitUsd = targetDiff * 5000 * POSITION_LOT_SIZE;
      slLossUsd = riskDiff * 5000 * POSITION_LOT_SIZE;
    } else if (isBtc) {
      dollarPnl = diff * POSITION_LOT_SIZE; // $0.03 per point
      tpProfitUsd = targetDiff * POSITION_LOT_SIZE;
      slLossUsd = riskDiff * POSITION_LOT_SIZE;
    } else {
      dollarPnl = diff * POSITION_LOT_SIZE;
      tpProfitUsd = targetDiff * POSITION_LOT_SIZE;
      slLossUsd = riskDiff * POSITION_LOT_SIZE;
    }

    return {
      pips: pips >= 0 ? `+${pips.toFixed(1)}` : pips.toFixed(1),
      isProfit: dollarPnl >= 0,
      progressPct,
      pts: diff >= 0 ? `+${diff.toFixed(decimals)} pts` : `-${Math.abs(diff).toFixed(decimals)} pts`,
      dollarPnl: dollarPnl >= 0 ? `+$${dollarPnl.toFixed(2)}` : `-$${Math.abs(dollarPnl).toFixed(2)}`,
      tpProfitUsd: tpProfitUsd > 0 ? `+$${tpProfitUsd.toFixed(2)}` : '',
      slLossUsd: slLossUsd > 0 ? `-$${slLossUsd.toFixed(2)}` : '',
      lotSize: POSITION_LOT_SIZE,
    };
  }, [currentActiveSetup, livePrice, hasVerifiedLivePrice, currentPairNorm, decimals]);

  // Live TP / SL touch detection for the active position (strictly requires verified live price)
  useEffect(() => {
    if (!hasVerifiedLivePrice) return;

    // Find active intra trade setup candidate from list, even if currentActiveSetup already suppressed it
    const list = activeSignals && activeSignals.length > 0 ? activeSignals : liveSignals;
    const targetSetup = currentActiveSetup || list.find((s) => {
      if (!s || closedSignalIds.has(s.id)) return false;
      if (!isIntraTradeSignal(s)) return false;
      const sPair = (s.pair || s.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const isMatch = sPair === currentPairNorm || 
        (currentPairNorm === 'XAUUSD' && (sPair.includes('XAU') || sPair.includes('GOLD')));
      if (!isMatch) return false;
      const st = (s.status || 'active').toLowerCase();
      return st !== 'tp' && st !== 'sl' && st !== 'closed' && st !== 'win' && st !== 'loss';
    });

    if (!targetSetup) return;

    const isBuy = (targetSetup.direction || 'BUY').toUpperCase() === 'BUY';
    const entry = Number(targetSetup.entry ?? targetSetup.entry_price ?? targetSetup.entryPrice);
    const tp = Number(targetSetup.tp ?? targetSetup.take_profit ?? targetSetup.takeProfit);
    const sl = Number(targetSetup.sl ?? targetSetup.stop_loss ?? targetSetup.stopLoss);
    const sId = targetSetup.id;

    if (!entry || !tp || !sl) return;

    const curr = Number(livePrice);
    if (isNaN(curr) || curr <= 0) return;

    // Guard against uninitialized or cross-asset price mismatches
    if (Math.abs(curr - entry) / entry >= 0.15) return;

    const peakHigh = Number(marketExtremes?.peakHigh || marketAnalysis?.sessionHigh || marketAnalysis?.high15 || 0);
    const troughLow = Number(marketExtremes?.troughLow || marketAnalysis?.sessionLow || marketAnalysis?.low15 || 0);

    // Only allow session peakHigh/troughLow to confirm TP when current price is in profit territory relative to entry
    // Never allow pre-entry 24h session lows/highs to falsely trigger SL while price is trading above/below SL
    const hitTp = isBuy
      ? (curr >= tp || (curr > entry && peakHigh >= tp))
      : (curr <= tp || (curr < entry && troughLow > 0 && troughLow <= tp));
    const hitSl = isBuy ? (curr <= sl) : (curr >= sl);

    if (hitTp) {
      setClosedSignalIds((prev) => new Set(prev).add(sId));
      playAiBeep('trade', isMuted);
      const isGold = currentPairNorm.includes('XAU');
      const tpPts = Math.abs(tp - entry);
      const tpProfitUsd = isGold ? tpPts * 100 * 0.03 : tpPts * 10;
      setRecentOutcomeNotice({
        type: 'tp',
        text: isKhmer
          ? `✓ TAKE PROFIT HIT • +$${tpProfitUsd.toFixed(2)} (0.03 Lot) • Position Closed!`
          : `✓ TAKE PROFIT HIT • +$${tpProfitUsd.toFixed(2)} (0.03 Lot) • Position Closed!`,
      });
      try {
        updateSignalStatus(sId, 'tp').catch(() => {});
      } catch {}
      const timer = setTimeout(() => {
        setRecentOutcomeNotice(null);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (hitSl) {
      setClosedSignalIds((prev) => new Set(prev).add(sId));
      const isGold = currentPairNorm.includes('XAU');
      const slPts = Math.abs(entry - sl);
      const slLossUsd = isGold ? slPts * 100 * 0.03 : slPts * 10;
      setRecentOutcomeNotice({
        type: 'sl',
        text: isKhmer
          ? `✕ STOP LOSS HIT • -$${slLossUsd.toFixed(2)} (0.03 Lot) • Position Closed!`
          : `✕ STOP LOSS HIT • -$${slLossUsd.toFixed(2)} (0.03 Lot) • Position Closed!`,
      });
      try {
        updateSignalStatus(sId, 'sl').catch(() => {});
      } catch {}
      const timer = setTimeout(() => {
        setRecentOutcomeNotice(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasVerifiedLivePrice, livePrice, marketExtremes, marketAnalysis, currentActiveSetup, activeSignals, liveSignals, isMuted, isKhmer, currentPairNorm, closedSignalIds]);

  // Real-Time 15M Market Analysis State (Synchronized silently in background across MSOB & Market Analysis Panel)
  const isReanalyzing = false;
  const livePriceRef = useRef(livePrice);
  livePriceRef.current = livePrice;
  const [candleCountdown, setCandleCountdown] = useState(() => get15mCandleTimeRemaining());
  const [lastCandleCloseNotice, setLastCandleCloseNotice] = useState(null);

  // 1-second countdown clock for the current 15m candle
  useEffect(() => {
    const timer = setInterval(() => {
      setCandleCountdown(get15mCandleTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Silent background market re-analysis triggered on initial mount, asset change, manual click, and every 15m candle close
  const triggerReanalysis = useCallback(async (isCandleCloseTrigger = false) => {
    const requestedSymbolId = symbolId;
    const requestedPair = currentAsset.pair;
    try {
      const result = await run15mMarketReanalysis(requestedPair, livePriceRef.current);
      if (activeSymbolIdRef.current !== requestedSymbolId) return;
      if (result) {
        setMarketAnalysis(result);
        if (isCandleCloseTrigger) {
          playAiBeep('signal', isMuted);
          setLastCandleCloseNotice(
            isKhmer
              ? 'Candle 15M បានបញ្ចប់ • ទីផ្សារត្រូវបានវិភាគឡើងវិញដោយជោគជ័យ!'
              : 'M15 Candle Closed • Market Re-analyzed Successfully!'
          );
          setTimeout(() => setLastCandleCloseNotice(null), 8000);
        }
      }
    } catch (err) {
      console.warn('[AILiveChartTerminal] Reanalysis failed:', err);
    }
  }, [currentAsset.pair, symbolId, isMuted, isKhmer]);

  // Synchronized 15m candle close scheduler + background refresh every 60s
  useEffect(() => {
    let isMounted = true;
    triggerReanalysis(false);

    let candleTimeoutId = null;
    const scheduleNext = () => {
      const info = get15mCandleTimeRemaining();
      // Add 1200ms buffer after 15m boundary to ensure candle is stamped
      const delay = Math.max(1000, info.msRemaining + 1200);
      candleTimeoutId = setTimeout(() => {
        if (!isMounted) return;
        triggerReanalysis(true);
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    const bgInterval = setInterval(() => {
      if (isMounted) triggerReanalysis(false);
    }, 60000);

    return () => {
      isMounted = false;
      if (candleTimeoutId) clearTimeout(candleTimeoutId);
      clearInterval(bgInterval);
    };
  }, [currentAsset.pair, symbolId, timeframe, triggerReanalysis]);

  const tvContainerId = `tv-ai-chart-${useId().replace(/:/g, '')}`;
  const tvContainerRef = useRef(null);
  const tvWidgetRef = useRef(null);
  const tvWrapRef = useRef(null);

  // Helper to log if needed
  const addLog = () => {};


  // 1. Fullscreen Handlers (Native + In-App Fullscreen Theatre Mode)
  useEffect(() => {
    function handleFsChange() {
      const isFs = document.fullscreenElement === tvWrapRef.current;
      setTvFullscreen(isFs);
      if (!isFs) setIsTheatreMode(false);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);
    }
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isTheatreMode) {
        setIsTheatreMode(false);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheatreMode]);

  function toggleTvFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      setIsTheatreMode(false);
    } else if (isTheatreMode) {
      setIsTheatreMode(false);
    } else if (tvWrapRef.current?.requestFullscreen) {
      tvWrapRef.current.requestFullscreen().catch(() => {
        setIsTheatreMode(true);
      });
    } else {
      setIsTheatreMode(true);
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }

  // 2. Real-time Live Price Streaming & Candle Wick / Extreme Tracking for the selected asset
  useEffect(() => {
    let isSubscribed = true;
    const requestedSymbolId = symbolId;
    const requestedPair = currentAsset.pair;
    setHasVerifiedLivePrice(false);
    // Instantly set livePrice to currentAsset.defaultPrice so no stale price from previous asset leaks
    setLivePrice(currentAsset.defaultPrice);

    fetchLivePrice(requestedPair).then((price) => {
      if (!isSubscribed || activeSymbolIdRef.current !== requestedSymbolId) return;
      if (price) {
        setLivePrice(price);
        setHasVerifiedLivePrice(true);
        addLog('TICK', `Live Spot synced: $${formatSpotPrice(requestedPair, price)}`);
      }
    });

    fetchLiveExtremePrices(requestedPair).then((ext) => {
      if (!isSubscribed || activeSymbolIdRef.current !== requestedSymbolId) return;
      if (ext) {
        setMarketExtremes(ext);
      }
    });

    const extremesPollTimer = setInterval(() => {
      fetchLiveExtremePrices(requestedPair).then((ext) => {
        if (!isSubscribed || activeSymbolIdRef.current !== requestedSymbolId) return;
        if (ext) {
          setMarketExtremes(ext);
        }
      });
    }, 4000);

    const unsubTicks = subscribeLiveTicks([requestedPair], (tPair, newPrice) => {
      if (!isSubscribed || activeSymbolIdRef.current !== requestedSymbolId) return;
      if (!newPrice) return;
      setHasVerifiedLivePrice(true);
      setLivePrice((prev) => {
        if (newPrice > prev) setPriceChangeDirection('up');
        else if (newPrice < prev) setPriceChangeDirection('down');
        return newPrice;
      });
    });

    return () => {
      isSubscribed = false;
      clearInterval(extremesPollTimer);
      unsubTicks();
    };
  }, [currentAsset.pair, currentAsset.pipScale, symbolId, currentAsset.defaultPrice]);

  // Helper to safely instantiate TradingView widget without duplication
  const initTradingViewWidget = useCallback(() => {
    const el = document.getElementById(tvContainerId);
    if (!el) return;
    try {
      el.innerHTML = '';
      if (window.TradingView && window.TradingView.widget) {
        const isLight = theme === 'light';
        tvWidgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: currentAsset.symbol,
          interval: timeframe,
          timezone: 'Asia/Bangkok', // GMT+7 Cambodia Time
          theme: isLight ? 'light' : 'dark',
          style: '1',
          locale: TV_LOCALE,
          toolbar_bg: isLight ? '#FFFFFF' : '#000000',
          enable_publishing: false,
          allow_symbol_change: true,
          hide_side_toolbar: false,
          withdateranges: true,
          details: true,
          hotlist: true,
          calendar: true,
          container_id: tvContainerId,
          overrides: isLight ? {
            'paneProperties.background': '#FFFFFF',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': 'rgba(0, 0, 0, 0.05)',
            'paneProperties.horzGridProperties.color': 'rgba(0, 0, 0, 0.05)',
            'mainSeriesProperties.style': 1,
            'mainSeriesProperties.candleStyle.upColor': '#16A34A',
            'mainSeriesProperties.candleStyle.downColor': '#DC2626',
            'mainSeriesProperties.candleStyle.drawWick': true,
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.borderColor': '#16A34A',
            'mainSeriesProperties.candleStyle.borderUpColor': '#16A34A',
            'mainSeriesProperties.candleStyle.borderDownColor': '#DC2626',
            'mainSeriesProperties.candleStyle.wickColor': '#64748B',
            'mainSeriesProperties.candleStyle.wickUpColor': '#16A34A',
            'mainSeriesProperties.candleStyle.wickDownColor': '#DC2626',
            'mainSeriesProperties.showCountdown': true,
            'paneProperties.legendProperties.showSeriesTitle': true,
            'scalesProperties.showSeriesLastValue': true,
            'scalesProperties.backgroundColor': '#FFFFFF',
            'scalesProperties.textColor': '#334155',
            'scalesProperties.lineColor': 'rgba(0, 0, 0, 0.1)',
          } : {
            'paneProperties.background': '#000000',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': 'rgba(255, 255, 255, 0.04)',
            'paneProperties.horzGridProperties.color': 'rgba(255, 255, 255, 0.04)',
            'mainSeriesProperties.style': 1,
            'mainSeriesProperties.candleStyle.upColor': '#FFFFFF',
            'mainSeriesProperties.candleStyle.downColor': '#000000',
            'mainSeriesProperties.candleStyle.drawWick': true,
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.borderColor': '#FFFFFF',
            'mainSeriesProperties.candleStyle.borderUpColor': '#FFFFFF',
            'mainSeriesProperties.candleStyle.borderDownColor': '#FFFFFF',
            'mainSeriesProperties.candleStyle.wickColor': '#FFFFFF',
            'mainSeriesProperties.candleStyle.wickUpColor': '#FFFFFF',
            'mainSeriesProperties.candleStyle.wickDownColor': '#FFFFFF',
            'mainSeriesProperties.showCountdown': true,
            'paneProperties.legendProperties.showSeriesTitle': true,
            'scalesProperties.showSeriesLastValue': true,
            'scalesProperties.backgroundColor': '#000000',
            'scalesProperties.textColor': '#94A3B8',
            'scalesProperties.lineColor': 'rgba(255, 255, 255, 0.1)',
          },
        });
        addLog('WIDGET', `TradingView terminal initialized for ${currentAsset.symbol} [${timeframe}m].`);
      }
    } catch (err) {
      console.warn('TradingView initialization error:', err);
    }
  }, [theme, currentAsset.symbol, timeframe, tvContainerId]);

  // 3. Initialize TradingView Advanced Chart Widget
  useEffect(() => {
    if (!tvContainerRef.current) return undefined;
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !tvContainerRef.current) return;
      initTradingViewWidget();
    }).catch((err) => {
      console.warn('TradingView script load error:', err);
    });

    return () => {
      cancelled = true;
      try {
        if (tvWidgetRef.current) {
          const el = document.getElementById(tvContainerId);
          if (el && el.parentNode && typeof tvWidgetRef.current.remove === 'function') {
            tvWidgetRef.current.remove();
          }
        }
      } catch {
        // Suppress TradingView DOM cleanup errors
      }
      tvWidgetRef.current = null;
    };
  }, [initTradingViewWidget]);

  // View switcher that triggers resize recalibration and ensures chart iframe stays valid
  const handleSwitchWorkstationView = (nextView) => {
    setWorkstationView(nextView);
    const fireResize = () => {
      try {
        window.dispatchEvent(new Event('resize'));
      } catch {
        // Suppress window event errors
      }
    };
    requestAnimationFrame(fireResize);
    setTimeout(fireResize, 60);
    setTimeout(fireResize, 180);
    setTimeout(fireResize, 380);

    // Watchdog check: If switching back to chart/split and widget is unexpectedly missing, restore it
    if (nextView === 'split' || nextView === 'chart') {
      setTimeout(() => {
        const el = document.getElementById(tvContainerId);
        if (el && (!el.hasChildNodes() || !el.querySelector('iframe'))) {
          initTradingViewWidget();
        }
      }, 80);
    }
  };

  // Watchdog resize listener on workstationView change
  useEffect(() => {
    const fireResize = () => {
      try {
        window.dispatchEvent(new Event('resize'));
      } catch {
        // Safe fallback
      }
    };
    fireResize();
    const t1 = setTimeout(fireResize, 60);
    const t2 = setTimeout(fireResize, 180);
    const t3 = setTimeout(fireResize, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [workstationView]);



  return (
    <div
      className={`ait-chart-terminal-card${tvFullscreen || isTheatreMode ? ' is-fullscreen' : ''}`}
      ref={tvWrapRef}
    >
      {/* 1. Terminal Top Control Bar */}
      <div className="ait-chart-terminal-top">
        {/* Left: Asset & Timeframe Selectors */}
        <div className="ait-chart-left-controls">
          <div className="ait-chart-selectors-group">
            <span className="ait-chart-group-label">{isKhmer ? 'ទ្រព្យសកម្ម:' : 'ASSET:'}</span>
            <div className="ait-chart-pills-wrap">
              {SYMBOLS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`ait-chart-symbol-pill ${s.id === symbolId ? 'active' : ''}`}
                  onClick={() => {
                    setSymbolId(s.id);
                    setLivePrice(s.defaultPrice);
                    addLog('MARKET', `Switched active feed to ${s.label}`);
                    playAiBeep('scan', isMuted);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ait-chart-selectors-group">
            <span className="ait-chart-group-label">TF:</span>
            <div className="ait-chart-pills-wrap">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  className={`ait-chart-timeframe-pill ${tf.id === timeframe ? 'active' : ''}`}
                  onClick={() => {
                    setTimeframe(tf.id);
                    addLog('TF', `Timeframe adjusted to ${tf.label}`);
                    playAiBeep('scan', isMuted);
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: MSOB HUD Switch + View Toggle + Live Quote Ticker + Audio & Fullscreen */}
        <div className="ait-chart-right-controls">
          <button
            type="button"
            className={`ait-chart-engine-btn ${msobActive ? 'active' : ''}`}
            onClick={() => setMsobActive((v) => !v)}
            title="Toggle Institutional MSOB Dashboard HUD"
          >
            ⚡ MSOB HUD
          </button>

          <button
            type="button"
            className={`ait-chart-engine-btn ${autoSetupActive ? 'active' : ''}`}
            onClick={() => setAutoSetupActive((v) => !v)}
            title="Toggle In-Chart Intra Trade Auto Setup Overlay"
          >
            🎯 {isKhmer ? 'Auto Setup (Intra)' : 'Auto Setup (Intra)'} {currentActiveSetup ? '(1)' : ''}
          </button>

          {/* Workstation Split View Toggle */}
          <div className="ait-chart-view-toggle ait-mono">
            <button
              type="button"
              className={`ait-view-pill ${workstationView === 'split' ? 'active' : ''}`}
              onClick={() => handleSwitchWorkstationView('split')}
              title="Split View: Chart + Market Analysis"
            >
              <span>◫</span>
              <span>{isKhmer ? 'បំបែក' : 'Split'}</span>
            </button>
            <button
              type="button"
              className={`ait-view-pill ${workstationView === 'chart' ? 'active' : ''}`}
              onClick={() => handleSwitchWorkstationView('chart')}
              title="Chart Full View"
            >
              <span>📈</span>
              <span>{isKhmer ? 'ក្រាហ្វិក' : 'Chart'}</span>
            </button>
            <button
              type="button"
              className={`ait-view-pill ${workstationView === 'analysis' ? 'active' : ''}`}
              onClick={() => handleSwitchWorkstationView('analysis')}
              title="Analysis Full View"
            >
              <span>📊</span>
              <span>{isKhmer ? 'វិភាគ' : 'Analysis'}</span>
            </button>
          </div>

          <div className="ait-chart-live-ticker ait-mono">
            <span className="ait-pulse-dot" />
            <span style={{ color: 'var(--mute)', fontSize: 11 }}>SPOT:</span>
            <span className={`ait-ticker-val ${priceChangeDirection === 'up' ? 'up' : priceChangeDirection === 'down' ? 'down' : ''}`}>
              ${formatSpotPrice(currentAsset.pair, livePrice)}
            </span>
          </div>

          <button
            type="button"
            className="ait-chart-icon-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            type="button"
            className="ait-chart-fs-btn"
            onClick={toggleTvFullscreen}
            title={isKhmer ? 'ពង្រីកពេញអេក្រង់' : 'Toggle Fullscreen'}
          >
            {tvFullscreen || isTheatreMode ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry & Model Status Strip */}
      <div className="ait-ai-telemetry-strip">
        <div className="ait-tele-left">
          <div className="ait-hud-radar">
            <span className="ait-radar-ring" />
            <span className="ait-radar-dot" />
            <span className="ait-radar-text">PIP AI CO-PILOT: ACTIVE</span>
          </div>
          <span className="ait-tele-sep">|</span>
          <span className="ait-tele-model-tag ait-mono">
            ENGINE: {AI_MODELS.find((m) => m.id === selectedModel)?.name}
          </span>
          <span className="ait-tele-sep">|</span>
          <span className="ait-tele-session">
            {pairMarketStatus.isOpen
              ? `${pairMarketStatus.sessionName} (${pairMarketStatus.sessionStatus})`
              : `Market Closed (${pairMarketStatus.sessionName})`}
          </span>
          <span className="ait-tele-sep">|</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10B981', fontWeight: 800 }}>
            <span>⏱️ 15M Candle:</span>
            <strong className="ait-mono">{candleCountdown.timeStr}</strong>
          </span>
        </div>

        <div className="ait-tele-right">
          <span className="ait-broker-badge">
            <span className="ait-broker-dot" />
            MT4/MT5 & cTrader Bridge (Connected · 14ms)
          </span>
        </div>
      </div>

      {/* 3. Institutional Workstation Split: Real Live Chart (Left) + Market Analysis Terminal (Right) */}
      <div className={`ait-workstation-split-container view-${workstationView}`} style={{ position: 'relative' }}>
        {/* Floating Notification Toast upon 15m candle close */}
        {lastCandleCloseNotice && (
          <div className="ait-candle-close-toast">
            <span className="ait-toast-dot" />
            <span>{lastCandleCloseNotice}</span>
          </div>
        )}

        {/* Left Column: Real Live Interactive TradingView Candlestick Canvas (Permanently mounted to preserve TV iframe) */}
        <div className={`ait-chart-col ${workstationView === 'analysis' ? 'is-hidden' : ''}`}>
            {/* Floating Institutional MSOB DASHBOARD HUD on Real Live Chart */}
            {msobActive && (
              <div
                ref={hudCardRef}
                className={`pip-msob-hud-card ait-mono ${isDraggingHud ? 'is-dragging' : ''}`}
                style={
                  hudCustomPos
                    ? { left: `${hudCustomPos.left}px`, top: `${hudCustomPos.top}px` }
                    : { left: '14px', top: '72px' }
                }
              >
                <div
                  className="pip-msob-head"
                  onMouseDown={handleHudDragStart}
                  onTouchStart={handleHudDragStart}
                  style={{ cursor: isDraggingHud ? 'grabbing' : 'grab' }}
                  title="Click & drag to reposition HUD anywhere on chart"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="pip-msob-title">MSOB DASHBOARD</span>
                    <span className="pip-msob-ver">v1.20</span>
                  </div>
                  <div className="pip-msob-status-wrap">
                    <span className="pip-msob-dot" />
                    <span className="pip-msob-on">
                      {isReanalyzing ? 'ANALYZING' : 'LIVE'}
                    </span>
                  </div>
                </div>

                {/* Row 1: Trend */}
                <div className="pip-msob-row">
                  <span className="pip-msob-lbl">TREND</span>
                  <span className={`pip-msob-pill ${marketAnalysis?.bias?.includes('BULL') ? 'trend-bull' : marketAnalysis?.bias?.includes('BEAR') ? 'trend-bear' : 'trend-rng'}`}>
                    {marketAnalysis?.bias?.includes('BULL') ? '▲' : marketAnalysis?.bias?.includes('BEAR') ? '▼' : '●'} {marketAnalysis?.bias || 'BULLISH'}
                  </span>
                </div>

                {/* Row 2: Signal */}
                <div className="pip-msob-row">
                  <span className="pip-msob-lbl">SIGNAL</span>
                  <div className="pip-msob-signal-box">
                    {marketAnalysis?.signal || `ChoCH ▲ $${formatSpotPrice(currentAsset.pair, livePrice)}`}
                  </div>
                </div>

                {/* Row 3: Demand & Supply Split */}
                <div className="pip-msob-split-row">
                  <div className="pip-msob-box demand">
                    DEMAND <span className="pip-msob-num">{marketAnalysis?.demandCount ?? 1}</span>
                  </div>
                  <div className="pip-msob-box supply">
                    SUPPLY <span className="pip-msob-num">{marketAnalysis?.supplyCount ?? 1}</span>
                  </div>
                </div>

                {/* Row 4: Fair Value Gaps */}
                <div className="pip-msob-row fvg-row">
                  <span className="pip-msob-lbl">FVG</span>
                  <span className="pip-msob-val fvg-counts">{marketAnalysis?.fvg || 'Bull:4 | Bear:2'}</span>
                </div>

                {/* Row 5: Active Trading Session Killzone */}
                <div className="pip-msob-row session-row">
                  <span className="pip-msob-lbl">SESSION</span>
                  <span className={`pip-msob-val session-name ${!pairMarketStatus.isOpen ? 'text-red' : ''}`}>
                    {(pairMarketStatus.isOpen ? pairMarketStatus.sessionName : `CLOSED (${pairMarketStatus.sessionName})`).toUpperCase()}
                  </span>
                </div>

                {/* Row 6: Confluence Meter */}
                <div className="pip-msob-confluence-block">
                  <div className="pip-msob-conf-head">
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="pip-msob-dot small" />
                      CONFLUENCE
                    </span>
                    <strong style={{ color: '#10B981' }}>{marketAnalysis?.confidence || 96}%</strong>
                  </div>
                  <div className="pip-msob-bar-track">
                    <div
                      className="pip-msob-bar-fill"
                      style={{ width: `${marketAnalysis?.confidence || 96}%` }}
                    />
                  </div>
                </div>

                {/* Row 7: Multi-Timeframe Alignment */}
                <div className="pip-msob-mtf-block">
                  <div className="pip-msob-mtf-head">
                    <span>MULTI-TIMEFRAME</span>
                    <span className="pip-msob-aligned-tag">{marketAnalysis?.mtf?.alignedText || '3/4 aligned'}</span>
                  </div>
                  <div className="pip-msob-mtf-grid">
                    <div className="pip-mtf-col">
                      <span className="pip-mtf-tf">M15</span>
                      <span className={`pip-mtf-badge ${marketAnalysis?.mtf?.m15 === 'BULL' ? 'bull' : marketAnalysis?.mtf?.m15 === 'BEAR' ? 'bear' : 'rng'}`}>
                        {marketAnalysis?.mtf?.m15 || 'BULL'}
                      </span>
                    </div>
                    <div className="pip-mtf-col">
                      <span className="pip-mtf-tf">H1</span>
                      <span className={`pip-mtf-badge ${marketAnalysis?.mtf?.h1 === 'BULL' ? 'bull' : 'bear'}`}>
                        {marketAnalysis?.mtf?.h1 || 'BULL'}
                      </span>
                    </div>
                    <div className="pip-mtf-col">
                      <span className="pip-mtf-tf">H4</span>
                      <span className={`pip-mtf-badge ${marketAnalysis?.mtf?.h4 === 'BULL' ? 'bull' : 'bear'}`}>
                        {marketAnalysis?.mtf?.h4 || 'BEAR'}
                      </span>
                    </div>
                    <div className="pip-mtf-col">
                      <span className="pip-mtf-tf">D1</span>
                      <span className={`pip-mtf-badge ${marketAnalysis?.mtf?.d1 === 'BULL' ? 'bull' : 'bear'}`}>
                        {marketAnalysis?.mtf?.d1 || 'BULL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 8: OB Performance Statistics */}
                <div className="pip-msob-perf-block">
                  <div className="pip-msob-perf-title">OB PERFORMANCE</div>
                  <div className="pip-msob-perf-grid">
                    <div>
                      <span className="pip-p-lbl">DETECTED</span>
                      <span className="pip-p-val">{marketAnalysis?.obPerformance?.detected ?? 2}</span>
                    </div>
                    <div>
                      <span className="pip-p-lbl">ACTIVE</span>
                      <span className="pip-p-val">{marketAnalysis?.obPerformance?.active ?? 2}</span>
                    </div>
                    <div>
                      <span className="pip-p-lbl">MITIGATED</span>
                      <span className="pip-p-val">{marketAnalysis?.obPerformance?.mitigated ?? 0}</span>
                    </div>
                    <div>
                      <span className="pip-p-lbl">HIT RATE</span>
                      <span className="pip-p-val">{marketAnalysis?.obPerformance?.winRate ?? '82%'}</span>
                    </div>
                    <div>
                      <span className="pip-p-lbl">AVG STR</span>
                      <span className="pip-p-val" style={{ color: '#10B981' }}>{marketAnalysis?.obPerformance?.winRate ?? '82%'}</span>
                    </div>
                    <div>
                      <span className="pip-p-lbl">MIT %</span>
                      <span className="pip-p-val">{marketAnalysis?.obPerformance?.mitPct ?? '0%'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Asset, Timeframe & 15m Candle Countdown Tag */}
                <div className="pip-msob-footer">
                  <span>{currentAsset.pair}</span>
                  <span>|</span>
                  <span>15m ({candleCountdown.timeStr})</span>
                  <span style={{ marginLeft: 'auto', color: isReanalyzing ? '#38bdf8' : '#10b981', fontSize: 10 }}>
                    {isReanalyzing ? '⏳ Reanalyzing...' : '● Real Live Feed'}
                  </span>
                </div>
              </div>
            )}

            {/* Floating Outcome Toast upon Position Close */}
            {recentOutcomeNotice && (
              <div className={`ait-chart-outcome-toast ${recentOutcomeNotice.type} ait-mono`}>
                <span>{recentOutcomeNotice.type === 'tp' ? '🎯' : recentOutcomeNotice.type === 'sl' ? '⚠️' : '✓'}</span>
                <span>{recentOutcomeNotice.text}</span>
              </div>
            )}

            {/* In-Chart Auto Trade Setup HUD Overlay */}
            {autoSetupActive && currentActiveSetup && (
              <div
                ref={setupCardRef}
                className={`pip-auto-setup-card ait-mono ${isDraggingSetup ? 'is-dragging' : ''}`}
                style={
                  setupCustomPos
                    ? { left: `${setupCustomPos.left}px`, top: `${setupCustomPos.top}px` }
                    : { left: '16px', top: '72px' }
                }
              >
                {/* Header / Drag Handle */}
                <div
                  className="pip-auto-setup-head"
                  onMouseDown={handleSetupDragStart}
                  onTouchStart={handleSetupDragStart}
                  style={{ cursor: isDraggingSetup ? 'grabbing' : 'grab' }}
                  title="Click & drag to reposition setup anywhere on chart"
                >
                  <div className="pip-auto-setup-title-wrap">
                    <span className="pip-auto-setup-pulse" />
                    <span className="pip-auto-setup-title">AUTO SETUP (INTRA)</span>
                    <span style={{ fontSize: 9, color: 'var(--mute)' }}>{currentAsset.pair}</span>
                  </div>
                </div>

                {/* Body */}
                <>
                    {/* Direction & Model Banner */}
                    <div className={`pip-auto-setup-dir-banner ${currentActiveSetup.direction?.toLowerCase() === 'sell' ? 'sell' : 'buy'}`}>
                      <span className="pip-setup-dir-tag">
                        {currentActiveSetup.direction?.toUpperCase() === 'SELL' ? '▼ SELL / SHORT' : '▲ BUY / LONG'}
                      </span>
                      <span className="pip-setup-lot-tag">
                        0.03 LOT
                      </span>
                      <span className="pip-setup-rr-tag">
                        R:R {currentActiveSetup.rr || '1:2.0'}
                      </span>
                    </div>

                    {/* Matrix of Execution Price Levels */}
                    <div className="pip-setup-matrix">
                      <div className="pip-setup-matrix-row tp-row">
                        <span className="pip-setup-matrix-lbl">TAKE PROFIT (TP)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="pip-setup-matrix-val">
                            ${formatSpotPrice(currentAsset.pair, currentActiveSetup.tp)}
                          </span>
                          <span className="pip-setup-matrix-dist" style={{ color: '#10B981', fontWeight: 700 }}>
                            {setupPnl?.tpProfitUsd ? `${setupPnl.tpProfitUsd} (+${Math.abs(Number(currentActiveSetup.tp) - Number(currentActiveSetup.entry)).toFixed(decimals)})` : `+${Math.abs(Number(currentActiveSetup.tp) - Number(currentActiveSetup.entry)).toFixed(decimals)}`}
                          </span>
                        </div>
                      </div>

                      <div className="pip-setup-matrix-row entry-row">
                        <span className="pip-setup-matrix-lbl">ENTRY ORDER</span>
                        <span className="pip-setup-matrix-val">
                          ${formatSpotPrice(currentAsset.pair, currentActiveSetup.entry)}
                        </span>
                      </div>

                      <div className="pip-setup-matrix-row sl-row">
                        <span className="pip-setup-matrix-lbl">STOP LOSS (SL)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="pip-setup-matrix-val">
                            ${formatSpotPrice(currentAsset.pair, currentActiveSetup.sl)}
                          </span>
                          <span className="pip-setup-matrix-dist" style={{ color: '#EF4444', fontWeight: 700 }}>
                            {setupPnl?.slLossUsd ? `${setupPnl.slLossUsd} (-${Math.abs(Number(currentActiveSetup.entry) - Number(currentActiveSetup.sl)).toFixed(decimals)})` : `-${Math.abs(Number(currentActiveSetup.entry) - Number(currentActiveSetup.sl)).toFixed(decimals)}`}
                          </span>
                        </div>
                      </div>

                      {currentActiveSetup.beTrigger && (
                        <div className="pip-setup-matrix-row be-row">
                          <span className="pip-setup-matrix-lbl">BE MOVE (1:1 RR)</span>
                          <span className="pip-setup-matrix-val" style={{ color: '#F59E0B' }}>
                            ${formatSpotPrice(currentAsset.pair, currentActiveSetup.beTrigger)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Live P&L Meter */}
                    {setupPnl && (
                      <div className="pip-setup-pnl-box">
                        <div className="pip-setup-pnl-top">
                          <span className="pip-setup-pnl-lbl">LIVE STATUS (0.03 LOT):</span>
                          <span className={`pip-setup-pnl-val ${setupPnl.isProfit ? 'profit' : 'loss'}`}>
                            {setupPnl.dollarPnl} ({setupPnl.pips} pips)
                          </span>
                        </div>
                        <div className="pip-setup-pnl-progress">
                          <div
                            className="pip-setup-pnl-progress-fill"
                            style={{ width: `${setupPnl.progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Confluence Snippet */}
                    {Array.isArray(currentActiveSetup.confluences) && currentActiveSetup.confluences.length > 0 && (
                      <div className="pip-setup-confluence-mini">
                        {currentActiveSetup.confluences[0]}
                      </div>
                    )}

                    {/* Institutional Auto-Management Status (Strictly managed by algorithm, no manual closure) */}
                    <div className="pip-setup-locked-footer">
                      <span className="pip-setup-locked-dot" />
                      <span>{isKhmer ? 'ដំណើរការស្វ័យប្រវត្តិតាម TP / SL (Protected)' : 'Institutional Position • Runs until TP or SL'}</span>
                    </div>
                  </>
              </div>
            )}

            {/* Real Live Interactive TradingView Candlestick Canvas (Always 100% Active) */}
            <div
              ref={tvContainerRef}
              id={tvContainerId}
              className="ait-tradingview-container"
              style={{ width: '100%', height: '100%' }}
            />
          </div>

        {/* Right Column: Institutional Market Analysis & Intelligence Terminal (Permanently mounted to preserve state) */}
        <div className={`ait-analysis-col ${workstationView === 'chart' ? 'is-hidden' : ''}`}>
          <MarketAnalysisPanel
            currentAsset={currentAsset}
            livePrice={livePrice}
            timeframe={TIMEFRAMES.find((tf) => tf.id === timeframe)?.label || '15m'}
            activeSession={pairMarketStatus.isOpen ? activeSession : { name: pairMarketStatus.sessionName, status: pairMarketStatus.label, color: pairMarketStatus.color }}
            isKhmer={isKhmer}
            marketAnalysis={marketAnalysis}
            isReanalyzing={isReanalyzing}
            candleCountdown={candleCountdown}
            lastCandleCloseNotice={lastCandleCloseNotice}
            onReanalyze={() => triggerReanalysis(false)}
            onSelectAsset={(id) => {
              const target = SYMBOLS.find((s) => s.id === id);
              setSymbolId(id);
              if (target) setLivePrice(target.defaultPrice);
              addLog('MARKET', `Switched active feed to ${id}`);
              playAiBeep('scan', isMuted);
            }}
          />
        </div>
      </div>
    </div>
  );
}
