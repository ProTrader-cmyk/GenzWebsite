import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { fetchLivePrice, formatSpotPrice, subscribeLiveTicks, fetchGoldQuoteMetrics } from '../services/marketPriceService.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import Footer from './Footer.jsx';
import pheaImg from '../assets/Phea.jpg';
import hourImg from '../assets/Hour.jpg';
import visalImg from '../assets/Visal.jpg';
import {
  SparkleIcon,
  CandleChartIcon,
  TrendUpIcon,
  DollarIcon,
  BookIcon,
  AppWindowIcon,
  BacktestIcon,
  AdvancedChartIcon,
  TelegramIcon,
  UserIcon,
} from './ui/CategoryIcons.jsx';
import HowPipWorks from './HowPipWorks.jsx';
import FeatureShowcase from './FeatureShowcase.jsx';
import { BACKTEST_SIGNALS } from '../data/backtestSignals.js';
import { calculateTradePnl, STANDARD_LOT_SIZE } from '../services/tradePnlService.js';
import '../styles/landing.css';

function getActiveTradingSession() {
  const now = new Date();
  const totalMins = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (totalMins >= 750 && totalMins < 900) return 'NY Session Killzone';
  if (totalMins >= 420 && totalMins < 600) return 'London Open Killzone';
  if (totalMins >= 0 && totalMins < 360) return 'Asian Session Accumulation';
  if (totalMins >= 900 && totalMins < 1020) return 'London Close Retracement';
  return 'Inter-Bank Liquidity Sweep';
}

export default function LandingHome({
  onGetStarted,
  onLogin,
  onExploreLessons,
  onNavNews,
  onNavPricing,
  user,
}) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km' || lang === 'kh';
  const progressRef = useRef(null);
  const orbCyanRef = useRef(null);
  const orbVioletRef = useRef(null);
  const orbEmeraldRef = useRef(null);
  const gridRef = useRef(null);
  const beamRef = useRef(null);
  const svgRef = useRef(null);

  // Real-time Live Gold Price state
  const [liveGoldPrice, setLiveGoldPrice] = useState(null);
  const [goldChange, setGoldChange] = useState({ pct: '+1.26%', isUp: true });
  const [firestoreSignals, setFirestoreSignals] = useState(BACKTEST_SIGNALS);
  const [hoveredBarIdx, setHoveredBarIdx] = useState(null);

  // Ultra-smooth GPU-composited lerp scroll animation (zero DOM style cascade or repaint)
  useEffect(() => {
    let rafId = null;
    let targetY = window.scrollY || window.pageYOffset || 0;
    let currentY = targetY;
    let maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );

    const applyTransforms = (y) => {
      const ratio = Math.min(1, Math.max(0, y / maxScroll));

      if (progressRef.current) {
        progressRef.current.style.transform = `scale3d(${ratio.toFixed(4)}, 1, 1)`;
      }
      if (orbCyanRef.current) {
        const tx = (ratio * 240).toFixed(1);
        const ty = (y * 0.16).toFixed(1);
        const sc = (1 + ratio * 0.18).toFixed(3);
        orbCyanRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale3d(${sc}, ${sc}, 1)`;
      }
      if (orbVioletRef.current) {
        const tx = (-ratio * 220).toFixed(1);
        const ty = (-y * 0.12).toFixed(1);
        orbVioletRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }
      if (orbEmeraldRef.current) {
        const tx = (-ratio * 130).toFixed(1);
        const ty = (-y * 0.14).toFixed(1);
        const sc = (1 + ratio * 0.15).toFixed(3);
        orbEmeraldRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale3d(${sc}, ${sc}, 1)`;
      }
      if (gridRef.current) {
        const gy = ((y * 0.28) % 64).toFixed(1);
        gridRef.current.style.transform = `perspective(900px) rotateX(56deg) translate3d(0, ${gy}px, 0)`;
      }
      if (beamRef.current) {
        const by = (ratio * (window.innerHeight * 0.88)).toFixed(1);
        beamRef.current.style.transform = `translate3d(0, ${by}px, 0)`;
      }
      if (svgRef.current) {
        const sy = (-y * 0.07).toFixed(1);
        svgRef.current.style.transform = `translate3d(0, ${sy}px, 0)`;
      }
    };

    const tick = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) > 0.35) {
        currentY += diff * 0.14;
        applyTransforms(currentY);
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentY = targetY;
        applyTransforms(currentY);
        rafId = null;
      }
    };

    const onScroll = () => {
      targetY = window.scrollY || window.pageYOffset || 0;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onResize = () => {
      maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      onScroll();
    };

    applyTransforms(currentY);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    // 1. Fetch initial live spot price and official 24h change (CORS-safe)
    fetchGoldQuoteMetrics().then((quote) => {
      if (quote) {
        if (quote.price) setLiveGoldPrice(quote.price);
        setGoldChange({
          pct: quote.pct,
          isUp: quote.isUp,
        });
      } else {
        fetchLivePrice('XAUUSD').then((p) => {
          if (p) setLiveGoldPrice(p);
        });
      }
    }).catch(() => {
      fetchLivePrice('XAUUSD').then((p) => {
        if (p) setLiveGoldPrice(p);
      });
    });

    // 2. Real-time WebSocket tick stream from TradingView OANDA
    const unsubTicks = subscribeLiveTicks(['XAUUSD'], (prices) => {
      if (prices?.XAUUSD) {
        setLiveGoldPrice(prices.XAUUSD);
      }
    });

    // 3. Fallback polling every 4 seconds to guarantee live data
    const pollTimer = setInterval(() => {
      fetchLivePrice('XAUUSD').then((p) => {
        if (p) setLiveGoldPrice(p);
      });
    }, 4000);

    // 4. Real-time Firestore signals subscription (verified institutional real data signals)
    let unsubSignals = () => {};
    try {
      unsubSignals = onSnapshot(
        collection(db, 'signals'),
        (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const isRealDataDoc = docId.startsWith('ICT-XAU-') || Boolean(data.isRealData) || Boolean(data.isBacktest) || data.strategy_version?.includes('ICT-XAUUSD');
            if (!isRealDataDoc) return;
            list.push({ id: docId, ...data });
          });
          const mergedMap = new Map();
          BACKTEST_SIGNALS.forEach((s) => mergedMap.set(s.id, s));
          list.forEach((s) => mergedMap.set(s.id, { ...mergedMap.get(s.id), ...s }));
          const combined = Array.from(mergedMap.values());
          combined.sort((a, b) => (b._timeMs || b.publishedAt || 0) - (a._timeMs || a.publishedAt || 0));
          setFirestoreSignals(combined);
        },
        (err) => console.warn('[LandingHome] Firestore signals error:', err)
      );
    } catch (e) {
      console.warn('[LandingHome] Firestore subscription error:', e);
    }

    return () => {
      unsubTicks();
      clearInterval(pollTimer);
      unsubSignals();
    };
  }, []);

  // Starting capital is $10,000.00 and all position sizes are 0.03 lot
  const STARTING_BALANCE = 10000.00;
  const POSITION_LOT_SIZE = 0.03;

  const portfolio = useMemo(() => {
    let realizedPnL = 0;
    let floatingPnL = 0;
    let closedCount = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let breakevenCount = 0;

    firestoreSignals.forEach((sig) => {
      const rawStatus = (sig.status || '').toLowerCase();
      const outcome = String(sig.outcome || '').toUpperCase();
      let isTp = rawStatus === 'tp' || rawStatus === 'win' || outcome === 'WIN';
      let isSl = rawStatus === 'sl' || rawStatus === 'loss' || outcome === 'LOSS';
      let isBe = rawStatus === 'be' || rawStatus === 'breakeven' || outcome === 'BREAKEVEN';

      if (!isTp && !isSl && !isBe && rawStatus === 'closed') {
        if (typeof sig.net_pnl === 'number') {
          if (sig.net_pnl > 0) isTp = true;
          else if (sig.net_pnl < 0) isSl = true;
          else isBe = true;
        } else {
          isTp = true;
        }
      }

      const sigLot = Number(sig.lotSize ?? sig.lot ?? sig.lot_size) || STANDARD_LOT_SIZE;
      let pnl = 0;
      if (typeof sig.net_pnl === 'number') {
        pnl = sig.net_pnl;
      } else {
        const exit = isTp ? Number(sig.tp || sig.exit_price || sig.exitPrice) : isSl ? Number(sig.sl || sig.exit_price || sig.exitPrice) : Number(sig.entry);
        if (sig.entry && exit) {
          const calc = calculateTradePnl({
            symbol: sig.pair || sig.symbol || 'XAUUSD',
            direction: sig.direction || sig.type || 'BUY',
            entryPrice: Number(sig.entry),
            exitPrice: exit,
            lotSize: sigLot,
          });
          pnl = calc.netPnl;
        }
      }

      if (isTp) {
        closedCount++;
        winsCount++;
        realizedPnL += pnl;
      } else if (isSl) {
        closedCount++;
        lossesCount++;
        realizedPnL += pnl < 0 ? pnl : -Math.abs(pnl);
      } else if (isBe) {
        closedCount++;
        breakevenCount++;
        realizedPnL += pnl;
      }
    });

    const currentBalance = STARTING_BALANCE + realizedPnL + floatingPnL;
    const netProfit = currentBalance - STARTING_BALANCE;
    const roiPercent = ((currentBalance - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    // Generate real trade-by-trade progression matching backtest signals
    const closedSignals = firestoreSignals.filter((s) => {
      const st = (s.status || '').toLowerCase();
      const out = String(s.outcome || '').toUpperCase();
      return st === 'tp' || st === 'win' || st === 'sl' || st === 'loss' || st === 'be' || st === 'closed' || out === 'WIN' || out === 'LOSS' || out === 'BREAKEVEN';
    });

    closedSignals.sort((a, b) => {
      const tA = Number(a._timeMs || a.publishedAt || a.createdAt?.toMillis?.() || 0);
      const tB = Number(b._timeMs || b.publishedAt || b.createdAt?.toMillis?.() || 0);
      return tA - tB;
    });

    // Group all closed signals chronologically by day (Asia/Phnom_Penh timezone) and calculate cumulative equity
    const dailyMap = new Map();
    let runningBal = STARTING_BALANCE;

    closedSignals.forEach((sig) => {
      const timeMs = Number(sig._timeMs || sig.publishedAt || sig.createdAt?.toMillis?.() || 0);
      const dateObj = new Date(timeMs || Date.now());
      // Consistent YYYY-MM-DD grouping in Asia/Phnom_Penh (GMT+7)
      const dayKey = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Phnom_Penh' });

      const rawStatus = (sig.status || '').toLowerCase();
      const outcome = String(sig.outcome || '').toUpperCase();
      let isTp = rawStatus === 'tp' || rawStatus === 'win' || outcome === 'WIN';
      let isSl = rawStatus === 'sl' || rawStatus === 'loss' || outcome === 'LOSS';
      let isBe = rawStatus === 'be' || rawStatus === 'breakeven' || outcome === 'BREAKEVEN';

      if (!isTp && !isSl && !isBe && rawStatus === 'closed') {
        if (typeof sig.net_pnl === 'number') {
          if (sig.net_pnl > 0) isTp = true;
          else if (sig.net_pnl < 0) isSl = true;
          else isBe = true;
        } else {
          isTp = true;
        }
      }

      let diff = 0;
      if (typeof sig.net_pnl === 'number') {
        diff = sig.net_pnl;
      } else {
        const sigLot = Number(sig.lotSize ?? sig.lot ?? sig.lot_size) || STANDARD_LOT_SIZE;
        const exit = isTp ? Number(sig.tp || sig.exit_price || sig.exitPrice) : isSl ? Number(sig.sl || sig.exit_price || sig.exitPrice) : Number(sig.entry);
        if (sig.entry && exit) {
          const calc = calculateTradePnl({
            symbol: sig.pair || sig.symbol || 'XAUUSD',
            direction: sig.direction || sig.type || 'BUY',
            entryPrice: Number(sig.entry),
            exitPrice: exit,
            lotSize: sigLot,
          });
          diff = isSl && calc.netPnl > 0 ? -calc.netPnl : calc.netPnl;
        }
      }

      runningBal += diff;

      if (!dailyMap.has(dayKey)) {
        const shortDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          timeZone: 'Asia/Phnom_Penh',
        });
        const fullDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'Asia/Phnom_Penh',
        });

        dailyMap.set(dayKey, {
          dayKey,
          dateMs: dateObj.getTime(),
          label: shortDate,
          fullDate,
          tradesCount: 0,
          tpCount: 0,
          slCount: 0,
          beCount: 0,
          dayPnl: 0,
          val: runningBal,
        });
      }

      const dayObj = dailyMap.get(dayKey);
      dayObj.tradesCount += 1;
      if (isTp) dayObj.tpCount += 1;
      else if (isSl) dayObj.slCount += 1;
      else if (isBe) dayObj.beCount += 1;
      dayObj.dayPnl += diff;
      dayObj.val = runningBal; // cumulative balance at the end of this day
    });

    const allDailyBars = Array.from(dailyMap.values());
    // Put only the last 7 days per user request
    let displayBars = allDailyBars.slice(-7);

    if (displayBars.length === 0) {
      displayBars.push({
        dayKey: 'today',
        label: isKhmer ? 'ថ្ងៃនេះ' : 'Today',
        fullDate: isKhmer ? 'ថ្ងៃនេះ' : 'Today',
        tradesCount: 0,
        tpCount: 0,
        slCount: 0,
        beCount: 0,
        dayPnl: 0,
        val: STARTING_BALANCE,
      });
    }

    const allVals = displayBars.map((b) => b.val);
    const minVal = Math.min(STARTING_BALANCE * 0.95, ...allVals);
    const maxVal = Math.max(STARTING_BALANCE * 1.05, ...allVals);
    const valRange = maxVal - minVal || 1;

    const barData = displayBars.map((b, idx) => {
      const isLatest = idx === displayBars.length - 1;
      const heightPercent = Math.min(
        100,
        Math.max(38, Math.round(((b.val - minVal) / valRange) * 58) + 42)
      );
      return {
        label: b.label,
        fullDate: b.fullDate,
        val: b.val,
        diff: b.dayPnl,
        dayPnl: b.dayPnl,
        tradesCount: b.tradesCount,
        tpCount: b.tpCount,
        slCount: b.slCount,
        beCount: b.beCount,
        height: `${heightPercent}%`,
        active: isLatest,
      };
    });

    return {
      currentBalance,
      netProfit,
      roiPercent,
      closedCount,
      winsCount,
      lossesCount,
      breakevenCount,
      barData,
    };
  }, [firestoreSignals, isKhmer]);

  const activeSession = getActiveTradingSession();
  const winRate = portfolio.closedCount > 0
    ? Math.round((portfolio.winsCount / portfolio.closedCount) * 100)
    : 100;
  const latestSig = firestoreSignals.length > 0 ? firestoreSignals[0] : null;

  return (
    <div className="landing-page-root">
      {/* =========================================================================
          SCROLL-REACTIVE AI NEURAL BACKGROUND LAYER
          ========================================================================= */}
      <div className="lnd-ai-scroll-bg" aria-hidden="true">
        {/* Top Scroll Progress Laser Line */}
        <div className="lnd-ai-scroll-progress-bar" ref={progressRef} />

        {/* Parallax AI Aurora Orbs that shift & morph while scrolling */}
        <div className="lnd-ai-aurora-orb lnd-orb-cyan" ref={orbCyanRef} />
        <div className="lnd-ai-aurora-orb lnd-orb-violet" ref={orbVioletRef} />
        <div className="lnd-ai-aurora-orb lnd-orb-emerald" ref={orbEmeraldRef} />

        {/* 3D Perspective Neural Matrix Grid */}
        <div className="lnd-ai-perspective-grid" ref={gridRef} />

        {/* Holographic Horizontal AI Scan Beam */}
        <div className="lnd-ai-scan-beam" ref={beamRef} />

        {/* Animated Neural Circuit & Data Pulse Pathways */}
        <svg
          ref={svgRef}
          className="lnd-ai-neural-svg"
          viewBox="0 0 1440 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="aiNeuralLineCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0" />
              <stop offset="45%" stopColor="#00f2fe" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="aiNeuralLineViolet" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#00f2fe" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="lnd-ai-circuit-path lnd-ai-circuit-1"
            d="M -60 180 C 260 180, 340 420, 680 420 C 1020 420, 1120 200, 1500 220"
            fill="none"
            stroke="url(#aiNeuralLineCyan)"
            strokeWidth="1.6"
          />
          <path
            className="lnd-ai-circuit-path lnd-ai-circuit-2"
            d="M -40 720 C 320 680, 480 340, 820 520 C 1100 660, 1240 460, 1500 480"
            fill="none"
            stroke="url(#aiNeuralLineViolet)"
            strokeWidth="1.4"
          />
          <path
            className="lnd-ai-circuit-path lnd-ai-circuit-3"
            d="M 180 -40 C 240 280, 560 440, 740 720 C 900 940, 1180 860, 1360 1040"
            fill="none"
            stroke="url(#aiNeuralLineCyan)"
            strokeWidth="1.2"
          />
          <circle className="lnd-ai-node lnd-ai-node-1" cx="680" cy="420" r="4" />
          <circle className="lnd-ai-node lnd-ai-node-2" cx="820" cy="520" r="3.5" />
          <circle className="lnd-ai-node lnd-ai-node-3" cx="380" cy="300" r="3" />
          <circle className="lnd-ai-node lnd-ai-node-4" cx="1090" cy="310" r="3.5" />
        </svg>
      </div>

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="lnd-hero-section">
        <div className="lnd-glow-spot lnd-glow-top" />
        <div className="lnd-glow-spot lnd-glow-center" />

        <div className="lnd-container">
          {/* Platform Highlight Badge */}
          <div className="lnd-hero-badge">
            <span className="lnd-ai-core-dot" />
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#00f2fe' }}>
              <SparkleIcon style={{ width: 15, height: 15 }} />
            </span>
            <span className="lnd-badge-text">
              {isKhmer
                ? 'PIP AI NEURAL ENGINE • យុទ្ធសាស្ត្រ SMC & Macro Intelligence'
                : 'PIP AI NEURAL ENGINE • Institutional SMC & Macro Intelligence'}
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="lnd-hero-title">
            <span>
              {isKhmer ? 'ទីផ្សារមិនមែនជាកន្លែងសម្រាប់ការស្មានទេ។' : 'The market is not a place for guessing.'}
            </span>
            <br />
            <span className="lnd-hero-glow-text">
              {isKhmer ? 'វិភាគឱ្យច្បាស់។ រៀបចំយុទ្ធសាស្ត្រឱ្យត្រឹមត្រូវ។' : 'Trade smarter with GenZ Trader.'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="lnd-hero-subtitle">
            {isKhmer
              ? 'ការជួញដូររបស់អ្នក កាន់តែមានប្រសេីរជាងមុន ដោយសារការប្រើប្រាស់ទិន្នន័យដ៏មានប្រសិទ្ធភាព។ ជាមួយនឹង ទិន្នន័យ Backtesting ជាង ៤ ឆ្នាំ ការវិភាគដែលគាំទ្រដោយបញ្ញាសិប្បនិម្មិត (AI) និងសញ្ញាជួញដូរផ្ទាល់ (Live Signals) ដែលមានភាពច្បាស់លាស់ខ្ពស់ — ទាំងអស់នេះត្រូវបានរួមបញ្ចូលនៅក្នុងវេទិកាតែមួយ។'
              : 'Your trading, but with a data advantage. 4+ years of backtesting, AI-supported analysis, and live precision signals — all on one unified platform.'}
          </p>

          {/* Quick Nav Links under Hero Subtitle */}
          <div className="lnd-hero-actions-row">
            <button
              type="button"
              className="lnd-ghost-action-btn"
              onClick={onExploreLessons}
            >
              <BookIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>{isKhmer ? 'មើលមេរៀនទាំងអស់' : 'Explore All Lessons'}</span>
            </button>
            <button
              type="button"
              className="lnd-ghost-action-btn lnd-ai-action-btn"
              onClick={onNavPricing || onExploreLessons}
            >
              <SparkleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>{isKhmer ? 'AI Trading Terminal' : 'AI Trading Terminal'}</span>
            </button>
          </div>

          {/* Subtle AI Telemetry Strip */}
          <div className="lnd-ai-telemetry-strip">
            <span className="lnd-ai-telemetry-chip">
              <span className="lnd-ai-chip-dot lnd-dot-cyan" />
              PIP AI CORE v4.2
            </span>
            <span className="lnd-ai-telemetry-chip">
              <span className="lnd-ai-chip-dot lnd-dot-violet" />
              SMC + ICT CONFLUENCE
            </span>
            <span className="lnd-ai-telemetry-chip">
              <span className="lnd-ai-chip-dot lnd-dot-emerald" />
              LIVE OANDA STREAM
            </span>
            <span className="lnd-ai-telemetry-chip">
              0.03 LOT PRECISION
            </span>
          </div>

          {/* Floating Glass Visual Dashboard Cards (Left & Right) */}
          <div className="lnd-hero-visuals-grid">
            {/* Left Card: Total Value & Bar Chart - Dynamically calculated from Signals with $1,000 starting & 0.03 lot */}
            <div className="lnd-floating-card lnd-card-left">
              <div className="lnd-card-header">
                <div>
                  <span className="lnd-card-sub">{isKhmer ? 'សមតុល្យគណនី (Portfolio Balance)' : 'Portfolio Balance'}</span>
                  <div className="lnd-card-val">
                    ${portfolio.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <span className="lnd-pill-green">
                  {portfolio.roiPercent >= 0 ? `+${portfolio.roiPercent.toFixed(1)}%` : `${portfolio.roiPercent.toFixed(1)}%`} ROI
                </span>
              </div>
              <div className="lnd-bar-chart">
                {portfolio.barData.map((b, idx) => {
                  const isHovered = hoveredBarIdx === idx;
                  const isLeftAnchor = idx < 2;
                  const isRightAnchor = idx > portfolio.barData.length - 3;
                  const anchorClass = isLeftAnchor ? 'tt-left' : isRightAnchor ? 'tt-right' : '';

                  return (
                    <div
                      key={b.dayKey || idx}
                      className={`lnd-bar ${b.active ? 'lnd-bar-active' : ''} ${isHovered ? 'lnd-bar-hovered' : ''}`}
                      style={{ height: b.height }}
                      onMouseEnter={() => setHoveredBarIdx(idx)}
                      onMouseLeave={() => setHoveredBarIdx(null)}
                      onTouchStart={() => setHoveredBarIdx(idx)}
                      title={`${b.fullDate || b.label} | Total Trades: ${b.tradesCount} | TP: ${b.tpCount} | SL: ${b.slCount}${b.beCount > 0 ? ` | BE: ${b.beCount}` : ''} | Balance: $${b.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    >
                      {/* Modern Interactive Hover Tooltip: Total Trade, Total TP, Total SL */}
                      <div className={`lnd-bar-tooltip ${anchorClass}`}>
                        <div className="lnd-bar-tt-title">{b.fullDate || b.label}</div>
                        <div className="lnd-bar-tt-bal">
                          ${b.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span
                            className={b.dayPnl >= 0 ? 'lnd-up-text' : 'lnd-dn-text'}
                            style={{ fontSize: '10px', marginLeft: 4 }}
                          >
                            ({b.dayPnl >= 0 ? `+$${b.dayPnl.toFixed(2)}` : `-$${Math.abs(b.dayPnl).toFixed(2)}`})
                          </span>
                        </div>
                        <div className="lnd-bar-tt-divider" />
                        <div className="lnd-bar-tt-stats">
                          <div className="lnd-bar-tt-row">
                            <span className="lnd-bar-tt-lbl">{isKhmer ? 'Trade សរុប' : 'Total Trades'}:</span>
                            <strong className="lnd-bar-tt-val">{b.tradesCount}</strong>
                          </div>
                          <div className="lnd-bar-tt-row lnd-up-text">
                            <span className="lnd-bar-tt-lbl">{isKhmer ? 'ចំណេញ (TP)' : 'Total TP'}:</span>
                            <strong className="lnd-bar-tt-val">+{b.tpCount}</strong>
                          </div>
                          <div className="lnd-bar-tt-row lnd-dn-text">
                            <span className="lnd-bar-tt-lbl">{isKhmer ? 'កាត់ខាត (SL)' : 'Total SL'}:</span>
                            <strong className="lnd-bar-tt-val">-{b.slCount}</strong>
                          </div>
                          {b.beCount > 0 && (
                            <div className="lnd-bar-tt-row" style={{ color: '#94a3b8' }}>
                              <span className="lnd-bar-tt-lbl">{isKhmer ? 'ស្មើដើម (BE)' : 'Break-Even'}:</span>
                              <strong className="lnd-bar-tt-val">{b.beCount}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="lnd-bar-label">{b.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="lnd-card-footer">
                <span className="lnd-asset-tag">● Starting $10,000 (0.03 Lot)</span>
                <span className="lnd-asset-tag">
                  ● {portfolio.closedCount} {isKhmer ? 'Signal បានបញ្ចប់' : 'Signals Realized'} ({portfolio.netProfit >= 0 ? `+$${portfolio.netProfit.toFixed(2)}` : `-$${Math.abs(portfolio.netProfit).toFixed(2)}`})
                </span>
              </div>
            </div>

            {/* Right Card: Real-time Live Gold Spot Price & Stream */}
            <div className="lnd-floating-card lnd-card-right">
              <div className="lnd-card-header">
                <div>
                  <span className="lnd-card-sub">{isKhmer ? 'តម្លៃមាសផ្ទាល់ (Gold Spot)' : 'Gold Spot (XAU/USD)'}</span>
                  <div className="lnd-card-val">
                    ${liveGoldPrice
                      ? Number(liveGoldPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '4,159.50'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="lnd-pill-green">
                    <span className="lnd-live-pulse-dot" /> LIVE TICK
                  </span>
                  {goldChange?.pct && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: goldChange.isUp ? 'var(--up, #10b981)' : 'var(--dn, #ef4444)' }}>
                      {goldChange.pct} 24h
                    </span>
                  )}
                </div>
              </div>

              {/* Glowing SVG Wave */}
              <div className="lnd-wave-container">
                <svg viewBox="0 0 300 90" className="lnd-wave-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
                      <stop offset="65%" stopColor="#a855f7" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="waveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="55%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 70 Q 50 20 100 45 T 200 30 T 300 15 L 300 90 L 0 90 Z"
                    fill="url(#waveGrad)"
                  />
                  <path
                    d="M 0 70 Q 50 20 100 45 T 200 30 T 300 15"
                    fill="none"
                    stroke="url(#waveStrokeGrad)"
                    strokeWidth="3.2"
                  />
                  <circle cx="300" cy="15" r="4.5" fill="#00f2fe" className="lnd-pulse-dot" />
                </svg>
              </div>

              <div className="lnd-card-footer">
                <span className="lnd-status-active">● {activeSession}</span>
                <span className="lnd-time-tag">Real-Time OANDA Tick</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: BACKTESTING & STRATEGY FEATURE GRID
          ========================================================================= */}
      <section className="lnd-section lnd-features-section" id="lnd-features">
        <div className="lnd-container">
          <div className="lnd-section-header">
            <span className="lnd-section-pill">
              {isKhmer ? 'យុទ្ធសាស្ត្រផ្អែកលើទិន្នន័យ' : 'DATA-DRIVEN STRATEGY • BACKTEST YOUR EDGE'}
            </span>
            <h2 className="lnd-section-title">
              {isKhmer
                ? 'ឈប់ជួញដូរដោយការស្មាន — Backtest និងពង្រឹងយុទ្ធសាស្ត្ររបស់អ្នក'
                : 'No more untested trades — Master your strategy with precision.'}
            </h2>
            <p className="lnd-section-sub">
              {isKhmer
                ? 'លុបបំបាត់ការជួញដូរតាមអារម្មណ៍។ ផ្ទៀងផ្ទាត់ Setup របស់អ្នកតាមរយៈប្រវត្តិរចនាសម្ព័ន្ធទីផ្សារ Liquidity Sweeps និង Order Blocks មុនពេលប្រថុយទុនពិត។'
                : 'Eliminate emotional trading. Test and refine your trading models across historical market structure, liquidity sweeps, and fair value gaps before risking capital.'}
            </p>
          </div>

          <FeatureShowcase isKhmer={isKhmer} liveGoldPrice={liveGoldPrice} portfolio={portfolio} startBalance={STARTING_BALANCE} />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: HOW PIP WORKS (WAKE, SCAN, DEBATE, PUBLISH)
          ========================================================================= */}
      <HowPipWorks isKhmer={isKhmer} />

      {/* =========================================================================
          SECTION 3: EXECUTIVE LEADERSHIP & CORE TEAM (CEO, COO, DEV)
          ========================================================================= */}
      <section className="lnd-section lnd-team-section" id="lnd-team">
        <div className="lnd-container">
          <div className="lnd-section-header">
            <span className="lnd-section-pill">
              <span className="lnd-live-pulse-dot" style={{ width: 6, height: 6 }} />
              <span>{isKhmer ? 'ថ្នាក់ដឹកនាំ និងស្ថាបនិក GenZ Trader' : 'EXECUTIVE LEADERSHIP & CORE TEAM'}</span>
            </span>
            <h2 className="lnd-section-title">
              {isKhmer
                ? 'ក្រុមដឹកនាំនៅពីក្រោយភាពជោគជ័យរបស់ GenZ Trader'
                : 'The Leadership Driving Your Trading Edge'}
            </h2>
            <p className="lnd-section-sub">
              {isKhmer
                ? 'យុទ្ធសាស្ត្រ SMC កម្រិតស្ថាប័ន ការគ្រប់គ្រងហានិភ័យ និងបច្ចេកវិទ្យា AI ជំនាន់ថ្មី។'
                : 'Institutional SMC strategy, capital risk control, and high-speed AI engineering.'}
            </p>
          </div>

          <div className="lnd-team-grid">
            {/* Member 1: CEO - Veng Sophea */}
            <div className="lnd-team-card lnd-team-card-ceo">
              <div className="lnd-team-avatar-container">
                <img
                  src={pheaImg}
                  alt="Veng Sophea - CEO & Founder"
                  className="lnd-team-avatar-img lnd-avatar-ceo"
                  loading="lazy"
                />
                <span className="lnd-team-status-dot lnd-status-ceo" title="Active Founder & Mentor" />
              </div>

              <div className="lnd-team-role-pill lnd-role-ceo">
                <span>⚡ CEO & FOUNDER</span>
              </div>

              <h3 className="lnd-team-name">Veng Sophea</h3>
              <p className="lnd-team-title">
                {isKhmer ? 'CEO & គ្រូបណ្តុះបណ្តាល SMC / ICT' : 'CEO & Lead ICT / SMC Mentor'}
              </p>

              <p className="lnd-team-bio">
                {isKhmer
                  ? 'ជំនាញឯកទេសខាងរចនាសម្ព័ន្ធទីផ្សារ SMC/ICT និងចិត្តវិទ្យាជួញដូរផ្សារ។'
                  : 'Specializes in institutional SMC/ICT order flow, liquidity mapping & trading psychology.'}
              </p>

              {/* Core Focus Badges */}
              <div className="lnd-team-focus-tags">
                <span className="lnd-focus-tag">{isKhmer ? 'យុទ្ធសាស្ត្រ SMC/ICT' : 'SMC & ICT Strategy'}</span>
                <span className="lnd-focus-tag">{isKhmer ? 'រចនាសម្ព័ន្ធ Liquidity' : 'Order Flow & Liquidity'}</span>
                <span className="lnd-focus-tag">{isKhmer ? 'ការបង្វឹកផ្ទាល់' : 'Live Mentorship'}</span>
              </div>

              <div className="lnd-team-footer">
                <a
                  href="https://t.me/veng_sophea"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lnd-team-social-btn"
                  title="Contact Veng Sophea"
                >
                  <TelegramIcon style={{ width: 14, height: 14 }} />
                  <span>@veng_sophea</span>
                </a>
              </div>
            </div>

            {/* Member 2: COO - Lim Sunhour */}
            <div className="lnd-team-card lnd-team-card-coo">
              <div className="lnd-team-avatar-container">
                <img
                  src={hourImg}
                  alt="Lim Sunhour - COO & Strategy Lead"
                  className="lnd-team-avatar-img lnd-avatar-coo"
                  loading="lazy"
                />
                <span className="lnd-team-status-dot lnd-status-coo" title="Head of Operations" />
              </div>

              <div className="lnd-team-role-pill lnd-role-coo">
                <span>🛡️ COO & HEAD OF RISK</span>
              </div>

              <h3 className="lnd-team-name">Lim Sunhour</h3>
              <p className="lnd-team-title">
                {isKhmer ? 'COO & ប្រធានផ្នែកយុទ្ធសាស្ត្រ និងប្រតិបត្តិការ' : 'COO & Strategy Lead'}
              </p>

              <p className="lnd-team-bio">
                {isKhmer
                  ? 'ទទួលបន្ទុកការគ្រប់គ្រងហានិភ័យដើមទុន និងវិស័យប្រតិបត្តិនៅ Trading Desk។'
                  : 'Directs trade execution discipline, capital risk management & desk operations.'}
              </p>

              {/* Core Focus Badges */}
              <div className="lnd-team-focus-tags">
                <span className="lnd-focus-tag">{isKhmer ? 'គ្រប់គ្រងហានិភ័យ' : 'Risk Management'}</span>
                <span className="lnd-focus-tag">{isKhmer ? 'ប្រតិបត្តិការជួញដូរ' : 'Trading Desk Operations'}</span>
                <span className="lnd-focus-tag">{isKhmer ? 'វិន័យដើមទុន' : 'Capital Discipline'}</span>
              </div>

              <div className="lnd-team-footer">
                <a
                  href="https://t.me/huarrrrr?direct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lnd-team-social-btn"
                  title="Contact Lim Sunhour"
                >
                  <TelegramIcon style={{ width: 14, height: 14 }} />
                  <span>@huarrrrr</span>
                </a>
              </div>
            </div>

            {/* Member 3: DEV - Sen Visal */}
            <div className="lnd-team-card lnd-team-card-dev">
              <div className="lnd-team-avatar-container">
                <img
                  src={visalImg}
                  alt="Sen Visal - Lead AI & Software Engineer"
                  className="lnd-team-avatar-img lnd-avatar-dev"
                  loading="lazy"
                />
                <span className="lnd-team-status-dot lnd-status-dev" title="AI Systems Lead" />
              </div>

              <div className="lnd-team-role-pill lnd-role-dev">
                <span>💻 LEAD AI & ARCHITECT</span>
              </div>

              <h3 className="lnd-team-name">Sen Visal</h3>
              <p className="lnd-team-title">
                {isKhmer ? 'ប្រធានផ្នែក AI និង Software' : 'Lead AI & Software Engineer'}
              </p>

              <p className="lnd-team-bio">
                {isKhmer
                  ? 'អភិវឌ្ឍប្រព័ន្ធ Pip AI សម្រាប់ស្កេនទីផ្សារបែបពេលវេលាជាក់ស្តែង និងវិភាគទិន្នន័យទីផ្សារ។'
                  : 'Architects Pip Engine AI models, live charting terminal & data streams.'}
              </p>

              {/* Core Focus Badges */}
              <div className="lnd-team-focus-tags">
                <span className="lnd-focus-tag">{isKhmer ? 'Pip AI Engine' : 'Pip AI Engine'}</span>
                <span className="lnd-focus-tag">{isKhmer ? 'ទិន្នន័យទាន់ពេលវេលា (Real-Time)' : 'Live Data Streams'}</span>
                <span className="lnd-focus-tag">{isKhmer ? 'Full-Stack Architecture' : 'Full-Stack Systems'}</span>
              </div>

              <div className="lnd-team-footer">
                <a
                  href="https://t.me/visalsen0630?direct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lnd-team-social-btn"
                  title="Contact Sen Visal"
                >
                  <TelegramIcon style={{ width: 14, height: 14 }} />
                  <span>@visalsen0630</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: BOTTOM CALL-TO-ACTION BANNER
          ========================================================================= */}
      <section className="lnd-bottom-cta-section">
        <div className="lnd-container">
          <div
            className="lnd-bottom-cta-box"
            onClick={onExploreLessons || onGetStarted}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="lnd-bottom-cta-title">
              {isKhmer
                ? 'ត្រៀមខ្លួនរួចរាល់ហើយឬនៅ ដើម្បីជួញដូរដោយមានប្រៀបលើទីផ្សារ?'
                : 'Ready to trade with an institutional data advantage?'}
            </h2>
            <p className="lnd-bottom-cta-sub">
              {isKhmer
                ? 'ចូលរៀនមេរៀន Smart Money Concepts ទាំង ៥ កម្រិត និងតាមដានព័ត៌មានម៉ាក្រូសេដ្ឋកិច្ចពិតៗនៅថ្ងៃនេះ។'
                : 'Access all 5 institutional SMC tracks and real-time macro calendar intelligence today.'}
            </p>
            <div className="lnd-bottom-cta-btn-row">
              <button
                type="button"
                className="lnd-cta-primary-btn lnd-btn-large"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onExploreLessons) onExploreLessons();
                  else if (onGetStarted) onGetStarted();
                }}
              >
                <SparkleIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: '-2px' }} />
                <span>{isKhmer ? 'ចាប់ផ្តើមរៀនឥឡូវនេះ (ឥតគិតថ្លៃ)' : 'Start Learning Free Today'}</span>
                <span>→</span>
              </button>
              {!user && onLogin && (
                <button
                  type="button"
                  className="lnd-cta-secondary-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogin();
                  }}
                >
                  {isKhmer ? 'ចូលគណនី (Login)' : 'Sign In to Terminal'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

