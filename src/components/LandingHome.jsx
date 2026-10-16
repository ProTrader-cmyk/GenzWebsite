import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { fetchLivePrice, formatSpotPrice, subscribeLiveTicks, fetchGoldQuoteMetrics } from '../services/marketPriceService.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import Footer from './Footer.jsx';
import mentorImg from '../assets/mentor.jpg';
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

  const [activeChartTimeframe, setActiveChartTimeframe] = useState('1M');

  // Real-time Live Gold Price state
  const [liveGoldPrice, setLiveGoldPrice] = useState(null);
  const [goldChange, setGoldChange] = useState({ pct: '+1.26%', isUp: true });
  const [firestoreSignals, setFirestoreSignals] = useState([]);

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

    // 4. Real-time Firestore signals subscription
    let unsubSignals = () => {};
    try {
      unsubSignals = onSnapshot(
        collection(db, 'signals'),
        (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setFirestoreSignals(list);
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

  // Starting balance is $1,000 and all position sizes are 0.03 lot
  const STARTING_BALANCE = 1000.00;
  const POSITION_LOT_SIZE = 0.03;

  const portfolio = useMemo(() => {
    let realizedPnL = 0;
    let floatingPnL = 0;
    let closedCount = 0;
    let winsCount = 0;
    let lossesCount = 0;

    firestoreSignals.forEach((sig) => {
      const pair = (sig.pair || sig.symbol || 'XAUUSD').toUpperCase();
      const isGold = pair.includes('XAU') || pair.includes('GOLD');
      const isJpy = pair.includes('JPY');
      const isCrypto = pair.includes('BTC') || pair.includes('ETH') || pair.includes('US30');
      const direction = (sig.direction || 'BUY').toUpperCase();
      const isBuy = direction === 'BUY';

      const entry = parseFloat(sig.entry ?? sig.entry_price ?? sig.entryPrice) || 0;
      const sl = parseFloat(sig.sl ?? sig.stop_loss ?? sig.stopLoss) || 0;
      const tp = parseFloat(sig.tp ?? sig.take_profit ?? sig.takeProfit) || 0;

      const rawStatus = (sig.status || 'active').toLowerCase();
      const isTp = rawStatus === 'tp' || rawStatus === 'win';
      const isSl = rawStatus === 'sl' || rawStatus === 'loss';

      if (isTp) {
        closedCount++;
        winsCount++;
        let tradeProfit = 0;
        if (isGold) {
          const points = (entry > 0 && tp > 0) ? Math.abs(tp - entry) : 30.0;
          tradeProfit = points * 100 * POSITION_LOT_SIZE; // $3.00 per point
        } else if (isJpy) {
          const pips = (entry > 0 && tp > 0) ? Math.abs(tp - entry) * 100 : 70;
          tradeProfit = pips * 0.30;
        } else if (isCrypto) {
          const points = (entry > 0 && tp > 0) ? Math.abs(tp - entry) : 800;
          tradeProfit = points * POSITION_LOT_SIZE;
        } else {
          const pips = (entry > 0 && tp > 0) ? Math.abs(tp - entry) * 10000 : 60;
          tradeProfit = pips * 0.30;
        }
        realizedPnL += tradeProfit;
      } else if (isSl) {
        closedCount++;
        lossesCount++;
        let tradeLoss = 0;
        if (isGold) {
          const points = (entry > 0 && sl > 0) ? Math.abs(entry - sl) : 12.0;
          tradeLoss = points * 100 * POSITION_LOT_SIZE;
        } else if (isJpy) {
          const pips = (entry > 0 && sl > 0) ? Math.abs(entry - sl) * 100 : 25;
          tradeLoss = pips * 0.30;
        } else if (isCrypto) {
          const points = (entry > 0 && sl > 0) ? Math.abs(entry - sl) : 350;
          tradeLoss = points * POSITION_LOT_SIZE;
        } else {
          const pips = (entry > 0 && sl > 0) ? Math.abs(entry - sl) * 10000 : 25;
          tradeLoss = pips * 0.30;
        }
        realizedPnL -= tradeLoss;
      } else if (liveGoldPrice && isGold && entry > 0) {
        const diff = isBuy ? (liveGoldPrice - entry) : (entry - liveGoldPrice);
        floatingPnL += diff * 100 * POSITION_LOT_SIZE;
      }
    });

    const currentBalance = STARTING_BALANCE + realizedPnL + floatingPnL;
    const netProfit = currentBalance - STARTING_BALANCE;
    const roiPercent = ((currentBalance - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    // Generate real trade-by-trade progression bars matching real signals
    const closedSignals = firestoreSignals.filter((s) => {
      const st = (s.status || '').toLowerCase();
      return st === 'tp' || st === 'win' || st === 'sl' || st === 'loss';
    });

    closedSignals.sort((a, b) => {
      const tA = Number(a.publishedAt || a.createdAt?.toMillis?.() || 0);
      const tB = Number(b.publishedAt || b.createdAt?.toMillis?.() || 0);
      return tA - tB;
    });

    let runningBal = STARTING_BALANCE;
    const stepBars = [
      {
        label: isKhmer ? 'ដើមទុន' : 'Start',
        val: STARTING_BALANCE,
        diff: 0,
      },
    ];

    closedSignals.forEach((sig, idx) => {
      const pair = (sig.pair || sig.symbol || 'XAUUSD').toUpperCase();
      const isGold = pair.includes('XAU') || pair.includes('GOLD');
      const isJpy = pair.includes('JPY');
      const isCrypto = pair.includes('BTC') || pair.includes('ETH') || pair.includes('US30');
      const entry = parseFloat(sig.entry ?? sig.entry_price ?? sig.entryPrice) || 0;
      const sl = parseFloat(sig.sl ?? sig.stop_loss ?? sig.stopLoss) || 0;
      const tp = parseFloat(sig.tp ?? sig.take_profit ?? sig.takeProfit) || 0;

      const rawStatus = (sig.status || 'active').toLowerCase();
      const isTp = rawStatus === 'tp' || rawStatus === 'win';

      let diff = 0;
      if (isTp) {
        if (isGold) {
          const pts = (entry > 0 && tp > 0) ? Math.abs(tp - entry) : 30.0;
          diff = pts * 100 * POSITION_LOT_SIZE; // $3.00 per point on 0.03 lot
        } else if (isJpy) {
          const pips = (entry > 0 && tp > 0) ? Math.abs(tp - entry) * 100 : 70;
          diff = pips * 0.30;
        } else if (isCrypto) {
          const pts = (entry > 0 && tp > 0) ? Math.abs(tp - entry) : 800;
          diff = pts * POSITION_LOT_SIZE;
        } else {
          const pips = (entry > 0 && tp > 0) ? Math.abs(tp - entry) * 10000 : 60;
          diff = pips * 0.30;
        }
      } else {
        if (isGold) {
          const pts = (entry > 0 && sl > 0) ? Math.abs(entry - sl) : 12.0;
          diff = -pts * 100 * POSITION_LOT_SIZE;
        } else if (isJpy) {
          const pips = (entry > 0 && sl > 0) ? Math.abs(entry - sl) * 100 : 25;
          diff = -pips * 0.30;
        } else if (isCrypto) {
          const pts = (entry > 0 && sl > 0) ? Math.abs(entry - sl) : 350;
          diff = -pts * POSITION_LOT_SIZE;
        } else {
          const pips = (entry > 0 && sl > 0) ? Math.abs(entry - sl) * 10000 : 25;
          diff = -pips * 0.30;
        }
      }

      runningBal += diff;
      stepBars.push({
        label: isKhmer ? `Signal ${idx + 1}` : `Trade ${idx + 1}`,
        val: runningBal,
        diff,
      });
    });

    // Keep up to 6 bars (Start + most recent 5 trades) for a clean, non-cramped display
    let displayBars = stepBars;
    if (stepBars.length > 6) {
      displayBars = [stepBars[0], ...stepBars.slice(stepBars.length - 5)];
    }

    const allVals = displayBars.map((b) => b.val);
    const minVal = Math.min(STARTING_BALANCE * 0.95, ...allVals);
    const maxVal = Math.max(STARTING_BALANCE * 1.05, ...allVals);
    const valRange = maxVal - minVal || 1;

    const barData = displayBars.map((b, idx) => {
      const isLatest = idx === displayBars.length - 1;
      // Ascends progressively up to 100% on the active current bar
      const heightPercent = Math.min(
        100,
        Math.max(38, Math.round(((b.val - minVal) / valRange) * 58) + 42)
      );
      return {
        label: b.label,
        val: b.val,
        diff: b.diff,
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
      barData,
    };
  }, [firestoreSignals, liveGoldPrice, isKhmer]);

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
                ? 'PIP AI NEURAL ENGINE • យុទ្ធសាស្ត្រ Smart Money Concept (SMC) & Macro Intelligence'
                : 'PIP AI NEURAL ENGINE • Institutional Smart Money Concepts & Macro Intelligence'}
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="lnd-hero-title">
            <span>96.3 % of traders lose money.</span>
            <br />
            <span className="lnd-hero-glow-text">
              {isKhmer ? 'អ្នកឈ្នះសិក្សាជាមួយ GenZ Trader។' : 'The others trade with GenZ Trader.'}
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
                {portfolio.barData.map((b, idx) => (
                  <div
                    key={idx}
                    className={`lnd-bar ${b.active ? 'lnd-bar-active' : ''}`}
                    style={{ height: b.height }}
                    title={`${b.label}: $${b.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  >
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
              <div className="lnd-card-footer">
                <span className="lnd-asset-tag">● Starting $1,000 (0.03 Lot)</span>
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

          <div className="lnd-grid-4">
            {/* Feature Card 1: Real-time Live Gold Spot */}
            <div className="lnd-feature-card">
              <div className="lnd-feat-visual">
                <div className="lnd-mini-ticker">
                  <div className="lnd-ticker-row">
                    <span className="lnd-ticker-sym" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CandleChartIcon style={{ width: 14, height: 14, color: 'var(--brand2)' }} />
                      Gold XAU/USD
                    </span>
                    <span className="lnd-ticker-val" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span className="lnd-live-pulse-dot" style={{ width: 5, height: 5 }} />
                      ${liveGoldPrice
                        ? Number(liveGoldPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '4,159.50'}
                    </span>
                  </div>
                  <div className="lnd-spark-line" />
                </div>
              </div>
              <h3 className="lnd-feat-title">
                {isKhmer ? 'ការវិភាគ AI Fundamental & Macro' : 'AI-Supported Fundamental Analysis'}
              </h3>
              <p className="lnd-feat-desc">
                {isKhmer
                  ? 'ការវិភាគផលប៉ះពាល់លើមាស (Gold Impact) និង Red-Folder USD Events ជួយឱ្យអ្នកធ្វើការសម្រេចចិត្តប្រកបដោយភាពឆ្លាតវៃ។'
                  : 'AI-assisted macroeconomic and technical audits — make calculated, data-backed decisions on every red-folder USD catalyst.'}
              </p>
            </div>

            {/* Feature Card 2: Real Account Balance & Win Rate */}
            <div className="lnd-feature-card">
              <div className="lnd-feat-visual">
                <div className="lnd-mini-stats">
                  <div className="lnd-stats-top">
                    <span>{isKhmer ? 'សមតុល្យគណនី' : 'Account Balance'}</span>
                    <strong className="lnd-up-text">
                      ${portfolio.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="lnd-progress-multi" title={`Win Rate: ${winRate}% (${portfolio.winsCount} Wins / ${portfolio.closedCount} Closed)`}>
                    <div className="lnd-pbar lnd-pbar-green" style={{ width: `${winRate}%` }} />
                    {portfolio.lossesCount > 0 && (
                      <div className="lnd-pbar" style={{ width: `${100 - winRate}%`, background: 'var(--dn, #ef4444)' }} />
                    )}
                  </div>
                </div>
              </div>
              <h3 className="lnd-feat-title">
                {isKhmer ? 'Confluence Tracking & Win-Rate' : 'Confluence Tracking & Win-Rate Analysis'}
              </h3>
              <p className="lnd-feat-desc">
                {isKhmer
                  ? 'តាមដានចំណុចស៊ីសង្វាក់គ្នា (Confluences) ច្រើន Timeframe ដើម្បីស្វែងរក Setup ដែលមានឱកាសឈ្នះខ្ពស់បំផុត។'
                  : 'Multi-timeframe confluence tracking. Detect high-probability order blocks, discount entry zones, and premium risk-reward ratios.'}
              </p>
            </div>

            {/* Feature Card 3: Real Position Sizing (0.03 Lot & Exact $30 Risk / +$90 Target) */}
            <div className="lnd-feature-card">
              <div className="lnd-feat-visual">
                <div className="lnd-mini-swap">
                  <div className="lnd-swap-row">
                    <span>XAU/USD Position</span>
                    <span className="lnd-badge-sm">Lot {POSITION_LOT_SIZE.toFixed(2)}</span>
                  </div>
                  <div className="lnd-swap-row">
                    <span>Risk: 10 Pts ($30)</span>
                    <span className="lnd-up-text">Target: +$90.00</span>
                  </div>
                </div>
              </div>
              <h3 className="lnd-feat-title">
                {isKhmer ? 'ការគណនាហានិភ័យ & Lot Size' : 'Precision Position Sizing & Execution'}
              </h3>
              <p className="lnd-feat-desc">
                {isKhmer
                  ? 'គ្រប់គ្រងដើមទុនប្រកបដោយវិន័យខ្ពស់ ជាមួយក្បួនគណនា Lot Size និងការកំណត់ Stop Loss / Take Profit ច្បាស់លាស់។'
                  : 'Track live market moves and execute with disciplined, institutional position sizing rules and automated risk calculators.'}
              </p>
            </div>

            {/* Feature Card 4: Real Trade Progression Portfolio Growth */}
            <div className="lnd-feature-card">
              <div className="lnd-feat-visual">
                <div className="lnd-mini-portfolio">
                  <div className="lnd-port-top">
                    <span>{isKhmer ? 'កំណើនដើមទុន' : 'Portfolio Growth'}</span>
                    <strong className="lnd-up-text">
                      {portfolio.netProfit >= 0 ? `+$${portfolio.netProfit.toFixed(2)}` : `-$${Math.abs(portfolio.netProfit).toFixed(2)}`}
                      <span style={{ fontSize: '11px', marginLeft: 4, fontWeight: 700, opacity: 0.9 }}>
                        ({portfolio.roiPercent >= 0 ? `+${portfolio.roiPercent.toFixed(1)}%` : `${portfolio.roiPercent.toFixed(1)}%`})
                      </span>
                    </strong>
                  </div>
                  <div className="lnd-port-chart">
                    {portfolio.barData.map((b, idx) => (
                      <span
                        key={idx}
                        className={`lnd-port-bar ${b.active ? 'lnd-port-bar-hi' : ''}`}
                        style={{ height: b.height }}
                        title={`${b.label}: $${b.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="lnd-feat-title">
                {isKhmer ? 'ការការពារដើមទុន & Drawdown' : 'Drawdown Protection & Equity Growth'}
              </h3>
              <p className="lnd-feat-desc">
                {isKhmer
                  ? 'ការពារដើមទុនរបស់អ្នកពីការខាតបង់ធ្ងន់ធ្ងរ តាមរយៈការវិភាគ Drawdown និងយុទ្ធសាស្ត្រដើមទុនរបស់ស្ថាប័នធំៗ។'
                  : 'Institutional-grade drawdown protection and real-time performance analytics to safeguard and steadily grow your capital.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: HOW PIP WORKS (WAKE, SCAN, DEBATE, PUBLISH)
          ========================================================================= */}
      <HowPipWorks isKhmer={isKhmer} />

      {/* =========================================================================
          SECTION 3: DATA ADVANTAGE TERMINAL SHOWCASE
          ========================================================================= */}
      <section className="lnd-section lnd-terminal-section">
        <div className="lnd-container">
          <div className="lnd-section-header">
            <span className="lnd-section-pill">
              {isKhmer ? 'ភាពច្បាស់លាស់កម្រិតស្ថាប័ន' : 'INSTITUTIONAL PRECISION OVER GUESSWORK'}
            </span>
            <h2 className="lnd-section-title">
              {isKhmer
                ? 'អ្នកឈ្នះមិនមែនជួញដូរដោយអារម្មណ៍ទេ — ពួកគេជួញដូរផ្អែកលើទិន្នន័យ'
                : "Winners don't trade smarter — they trade based on data."}
            </h2>
            <p className="lnd-section-sub">
              {isKhmer
                ? 'ការជួញដូរតាមអារម្មណ៍ និងការទាយ គឺជាវិធីលឿនបំផុតក្នុងការដុតបំផ្លាញដើមទុន។ GenZ Trader ផ្តល់ជូននូវភាពច្បាស់លាស់នៃក្បួនដង្ហើមទីផ្សារ (Smart Money)។'
                : 'Trading on gut instinct? The fastest way to burn money. GenZ Trader uses institutional algorithmic clarity to show you what actually works and what costs you money.'}
            </p>

            <button
              type="button"
              className="lnd-cta-primary-btn"
              onClick={onExploreLessons}
            >
              <span>{isKhmer ? 'ចូលរៀនមេរៀនឥឡូវនេះ' : 'Start Free Learning'}</span>
              <span>→</span>
            </button>
          </div>

          {/* Full Dark UI Terminal Mockup */}
          <div className="lnd-terminal-mockup">
            {/* Terminal Top Nav Bar */}
            <div className="lnd-term-header">
              <div className="lnd-term-left">
                <span className="lnd-term-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <AdvancedChartIcon style={{ width: 16, height: 16 }} />
                  GenZ Terminal
                </span>
                <span className="lnd-term-tab active">Overview</span>
                <span className="lnd-term-tab">Live Order Flow</span>
                <span className="lnd-term-tab">SMC Radar</span>
              </div>
              <div className="lnd-term-right">
                <span className="lnd-term-wallet">Main Account (Live)</span>
                <span className="lnd-term-status">● Live Feed Active</span>
              </div>
            </div>

            {/* Terminal Main Grid */}
            <div className="lnd-term-body">
              {/* Left Column: Big Chart & Metric */}
              <div className="lnd-term-main">
                <div className="lnd-term-metric-row">
                  <div>
                    <span className="lnd-term-metric-label">Account Balance / Equity</span>
                    <div className="lnd-term-metric-val">
                      $1,000.00 / <span className="lnd-term-big-num">${portfolio.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <span className="lnd-term-sub-stat lnd-up-text">
                      ▲ +{portfolio.roiPercent.toFixed(1)}% Realized Return ({portfolio.closedCount} Signals Realized)
                    </span>
                  </div>

                  <div className="lnd-term-timeframes">
                    {['1D', '1W', '1M', '1Y'].map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        className={`lnd-tf-btn ${activeChartTimeframe === tf ? 'active' : ''}`}
                        onClick={() => setActiveChartTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Big Glowing Emerald Area Chart */}
                <div className="lnd-term-chart-area">
                  <svg viewBox="0 0 600 220" className="lnd-big-chart-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="termGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.42" />
                        <stop offset="55%" stopColor="#a855f7" stopOpacity="0.14" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="termStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#00f2fe" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="var(--faint)" strokeDasharray="4 4" />
                    <line x1="0" y1="110" x2="600" y2="110" stroke="var(--faint)" strokeDasharray="4 4" />
                    <line x1="0" y1="170" x2="600" y2="170" stroke="var(--faint)" strokeDasharray="4 4" />

                    {/* Gradient Area */}
                    <path
                      d="M 0 180 Q 80 160 140 130 T 260 140 T 380 90 T 480 70 T 600 30 L 600 220 L 0 220 Z"
                      fill="url(#termGrad)"
                    />
                    {/* Glowing Stroke */}
                    <path
                      d="M 0 180 Q 80 160 140 130 T 260 140 T 380 90 T 480 70 T 600 30"
                      fill="none"
                      stroke="url(#termStrokeGrad)"
                      strokeWidth="3.5"
                    />
                    {/* Peak Point */}
                    <circle cx="600" cy="30" r="5" fill="#00f2fe" className="lnd-pulse-dot" />
                  </svg>

                  <div className="lnd-chart-labels">
                    <span>${STARTING_BALANCE.toFixed(2)} Baseline (0.03 Lot)</span>
                    <span className="lnd-up-text">▲ +{portfolio.roiPercent.toFixed(1)}% Realized Edge</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Watchlist & Asset Tickers */}
              <div className="lnd-term-sidebar">
                <div className="lnd-sidebar-section-title">
                  <span>Watchlist & Live Flow</span>
                  <span className="lnd-badge-sm">Live</span>
                </div>

                <div className="lnd-asset-row">
                  <div className="lnd-asset-info">
                    <span className="lnd-asset-sym">Gold (XAU/USD)</span>
                    <span className="lnd-asset-vol">Comex Bullion</span>
                  </div>
                  <div className="lnd-asset-price">
                    <strong>${liveGoldPrice ? Number(liveGoldPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '4,159.50'}</strong>
                    <span className={goldChange?.isUp ? 'lnd-up-text' : 'lnd-dn-text'}>{goldChange?.pct || '+1.42%'}</span>
                  </div>
                </div>

                <div className="lnd-asset-row">
                  <div className="lnd-asset-info">
                    <span className="lnd-asset-sym">Bitcoin (BTC)</span>
                    <span className="lnd-asset-vol">Spot USD</span>
                  </div>
                  <div className="lnd-asset-price">
                    <strong>$66,897.00</strong>
                    <span className="lnd-up-text">+2.45%</span>
                  </div>
                </div>

                <div className="lnd-asset-row">
                  <div className="lnd-asset-info">
                    <span className="lnd-asset-sym">Silver (XAG/USD)</span>
                    <span className="lnd-asset-vol">Precious Metals</span>
                  </div>
                  <div className="lnd-asset-price">
                    <strong>$60.50</strong>
                    <span className="lnd-up-text">+3.10%</span>
                  </div>
                </div>

                <div className="lnd-term-alert-box">
                  <div className="lnd-alert-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SparkleIcon style={{ width: 16, height: 16, color: 'var(--brand2)' }} />
                  </div>
                  <div className="lnd-alert-content">
                    <strong>{isKhmer ? 'សញ្ញាជួញដូរចុងក្រោយ' : 'Latest Verified Signal'}: {latestSig ? `${latestSig.pair || 'XAU/USD'} ${(latestSig.direction || 'SELL').toUpperCase()}` : 'Gold XAU/USD SELL'}</strong>
                    <span>
                      {latestSig
                        ? `Entry: $${latestSig.entry ?? latestSig.entry_price ?? '4,151.50'} · TP: $${latestSig.tp ?? latestSig.take_profit ?? '4,121.50'} (${(latestSig.status || 'tp').toUpperCase()})`
                        : 'Entry: $4,151.50 · TP: $4,121.50 (Take Profit Hit)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: EXECUTIVE LEADERSHIP & CORE TEAM (CEO, COO, DEV)
          ========================================================================= */}
      <section className="lnd-section lnd-team-section" id="lnd-team">
        <div className="lnd-container">
          <div className="lnd-section-header">
            <span className="lnd-section-pill">
              {isKhmer ? 'ថ្នាក់ដឹកនាំ និងក្រុមការងារស្នូល' : 'EXECUTIVE LEADERSHIP & CORE TEAM'}
            </span>
            <h2 className="lnd-section-title">
              {isKhmer
                ? 'ក្រុមការងារ និងថ្នាក់ដឹកនាំនៅពីក្រោយ GenZ Trader'
                : 'The Leadership Driving Your Trading Edge'}
            </h2>
            <p className="lnd-section-sub">
              {isKhmer
                ? 'អ្នកឯកទេសយុទ្ធសាស្ត្រទីផ្សារស្ថាប័ន វិស្វករប្រព័ន្ធស្វ័យប្រវត្តិកម្ម និងអ្នកជំនាញប្រតិបត្តិការដែលប្តេជ្ញាជួយឱ្យអ្នកជួញដូរទទួលបានប្រៀបឈ្នះលើទីផ្សារ។'
                : 'Institutional market strategists, algorithmic engineers, and execution specialists dedicated to empowering retail traders.'}
            </p>
          </div>

          <div className="lnd-team-grid">
            {/* Member 1: CEO - Veng Sophea */}
            <div className="lnd-team-card lnd-team-card-ceo">
              <div className="lnd-team-avatar-container">
                <div className="lnd-team-avatar-glow lnd-glow-ceo" />
                <img
                  src={mentorImg}
                  alt="Veng Sophea - CEO"
                  className="lnd-team-avatar-img"
                  loading="lazy"
                />
                <span className="lnd-team-status-dot" title="Active Founder" />
              </div>

              <div className="lnd-team-role-pill lnd-role-ceo">
                <span>⚡ CEO & FOUNDER</span>
              </div>

              <h3 className="lnd-team-name">Veng Sophea</h3>
              <p className="lnd-team-title">
                {isKhmer ? 'ប្រធាននាយកប្រតិបត្តិ & គ្រូបណ្តុះបណ្តាល SMC / ICT' : 'Chief Executive Officer • Lead ICT & SMC Mentor'}
              </p>

              <p className="lnd-team-bio">
                {isKhmer
                  ? 'បទពិសោធន៍វិភាគទិន្នន័យទីផ្សារជាង ៤ ឆ្នាំ ឯកទេសខាងរចនាសម្ព័ន្ធ Liquidity Sweeps, Order Blocks, និង Macro Economic Catalysts។'
                  : '4+ years of institutional price action experience. Specializes in liquidity engineering, order block validation, and macroeconomic risk navigation.'}
              </p>

              <div className="lnd-team-footer">
                <a
                  href="https://t.me/Vengsopheagenz?direct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lnd-team-social-btn"
                  title="Telegram Veng Sophea"
                >
                  <TelegramIcon style={{ width: 14, height: 14 }} />
                  <span>@Vengsopheagenz</span>
                </a>
              </div>
            </div>

            {/* Member 2: COO - Lim Sunhour */}
            <div className="lnd-team-card lnd-team-card-coo">
              <div className="lnd-team-avatar-container">
                <div className="lnd-team-avatar-glow lnd-glow-coo" />
                <div className="lnd-team-monogram-avatar lnd-monogram-coo">
                  <span>LS</span>
                </div>
                <span className="lnd-team-status-dot lnd-status-coo" title="Head of Operations" />
              </div>

              <div className="lnd-team-role-pill lnd-role-coo">
                <span>🛡️ COO</span>
              </div>

              <h3 className="lnd-team-name">Lim Sunhour</h3>
              <p className="lnd-team-title">
                {isKhmer ? 'ប្រធានផ្នែកប្រតិបត្តិការ & យុទ្ធសាស្ត្រជួញដូរ' : 'Chief Operating Officer • Head of Trading Strategy'}
              </p>

              <p className="lnd-team-bio">
                {isKhmer
                  ? 'ដឹកនាំការគ្រប់គ្រងហានិភ័យដើមទុន វិន័យ Drawdown និងការប្រតិបត្តិការជួញដូរផ្ទាល់នៅលើទីផ្សារអន្តរជាតិ។'
                  : 'Directs institutional desk execution, strict drawdown mitigation, and disciplined portfolio growth.'}
              </p>

              <div className="lnd-team-footer">
                <span className="lnd-team-badge-tag">
                  <span className="lnd-live-pulse-dot" style={{ width: 5, height: 5 }} />
                  Trading Desk & Operations
                </span>
              </div>
            </div>

            {/* Member 3: DEV - Sen Visal */}
            <div className="lnd-team-card lnd-team-card-dev">
              <div className="lnd-team-avatar-container">
                <div className="lnd-team-avatar-glow lnd-glow-dev" />
                <div className="lnd-team-monogram-avatar lnd-monogram-dev">
                  <span>SV</span>
                </div>
                <span className="lnd-team-status-dot lnd-status-dev" title="AI Systems Lead" />
              </div>

              <div className="lnd-team-role-pill lnd-role-dev">
                <span>💻 LEAD DEV</span>
              </div>

              <h3 className="lnd-team-name">Sen Visal</h3>
              <p className="lnd-team-title">
                {isKhmer ? 'ប្រធានវិស្វករអភិវឌ្ឍន៍ប្រព័ន្ធ AI & Software' : 'Lead Software & Algorithmic AI Engineer'}
              </p>

              <p className="lnd-team-bio">
                {isKhmer
                  ? 'រៀបចំប្រព័ន្ធ AI Terminal, ស្ទ្រីមទិន្នន័យ Live Tick WebSocket OANDA, ហេដ្ឋារចនាសម្ព័ន្ធ Cloud និងក្បួនដង្ហើមស្វ័យប្រវត្តិកម្ម។'
                  : 'Architect of PIP AI neural engines, real-time OANDA WebSocket pipelines, high-throughput cloud services, and low-latency terminal feeds.'}
              </p>

              <div className="lnd-team-footer">
                <span className="lnd-team-badge-tag">
                  <span className="lnd-ai-chip-dot lnd-dot-cyan" />
                  AI & Full-Stack Systems
                </span>
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

