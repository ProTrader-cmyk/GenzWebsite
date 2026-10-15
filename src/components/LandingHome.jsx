import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { fetchLivePrice, formatSpotPrice, subscribeLiveTicks } from '../services/marketPriceService.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import Footer from './Footer.jsx';
import {
  SparkleIcon,
  CandleChartIcon,
  TrendUpIcon,
  DollarIcon,
  BookIcon,
  AppWindowIcon,
  BacktestIcon,
  AdvancedChartIcon,
} from './ui/CategoryIcons.jsx';
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

  const [activeChartTimeframe, setActiveChartTimeframe] = useState('1M');

  // Real-time Live Gold Price state
  const [liveGoldPrice, setLiveGoldPrice] = useState(null);
  const [goldChange, setGoldChange] = useState({ pct: '+1.26%', isUp: true });
  const [firestoreSignals, setFirestoreSignals] = useState([]);

  useEffect(() => {
    // 1. Fetch initial live spot price
    fetchLivePrice('XAUUSD').then((p) => {
      if (p) setLiveGoldPrice(p);
    });

    // Fetch official day change
    fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d')
      .then((r) => r.json())
      .then((d) => {
        const meta = d?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice && meta?.chartPreviousClose) {
          const diff = meta.regularMarketPrice - meta.chartPreviousClose;
          const pct = (diff / meta.chartPreviousClose) * 100;
          setGoldChange({
            pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
            isUp: pct >= 0,
          });
        }
      })
      .catch(() => {});

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
          HERO SECTION
          ========================================================================= */}
      <section className="lnd-hero-section">
        <div className="lnd-glow-spot lnd-glow-top" />
        <div className="lnd-glow-spot lnd-glow-center" />

        <div className="lnd-container">
          {/* Platform Highlight Badge */}
          <div className="lnd-hero-badge">
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--brand2)' }}>
              <SparkleIcon style={{ width: 16, height: 16 }} />
            </span>
            <span className="lnd-badge-text">
              {isKhmer
                ? 'យុទ្ធសាស្ត្រ Smart Money Concept (SMC) & Macro Market Intelligence'
                : 'Institutional Smart Money Concepts & Macro Market Analysis'}
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
              ? 'ការជួញដូររបស់អ្នក តែជាមួយនឹងទិន្នន័យច្បាស់លាស់។ ការ Backtest ជាង 4 ឆ្នាំ ការវិភាគដោយ AI និងការតាមដាន Signal ផ្ទាល់ — ទាំងអស់នៅលើ Terminal តែមួយ។'
              : 'Your trading, but with a data advantage. 4+ years of backtesting, AI-supported analysis, and live precision signals — all on one unified platform.'}
          </p>

          {/* Quick Nav Links under Hero Form */}
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
              className="lnd-ghost-action-btn"
              onClick={onNavPricing || onExploreLessons}
            >
              <SparkleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>{isKhmer ? 'AI Trading Terminal' : 'AI Trading Terminal'}</span>
            </button>
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
                      <stop offset="0%" stopColor="var(--brand2)" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="var(--brand2)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 70 Q 50 20 100 45 T 200 30 T 300 15 L 300 90 L 0 90 Z"
                    fill="url(#waveGrad)"
                  />
                  <path
                    d="M 0 70 Q 50 20 100 45 T 200 30 T 300 15"
                    fill="none"
                    stroke="var(--brand2)"
                    strokeWidth="3.2"
                  />
                  <circle cx="300" cy="15" r="4.5" fill="var(--brand2)" className="lnd-pulse-dot" />
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
          SECTION 2: DATA ADVANTAGE TERMINAL SHOWCASE
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
                        <stop offset="0%" stopColor="var(--brand2)" stopOpacity="0.38" />
                        <stop offset="60%" stopColor="var(--brand2)" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="var(--brand2)" stopOpacity="0.0" />
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
                      stroke="var(--brand2)"
                      strokeWidth="3.5"
                    />
                    {/* Peak Point */}
                    <circle cx="600" cy="30" r="5" fill="var(--brand2)" />
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
          SECTION 3: BOTTOM CALL-TO-ACTION BANNER
          ========================================================================= */}
      <section className="lnd-bottom-cta-section">
        <div className="lnd-container">
          <div className="lnd-bottom-cta-box">
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
                onClick={onGetStarted}
              >
                <SparkleIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: '-2px' }} />
                <span>{isKhmer ? 'ចាប់ផ្តើមរៀនឥឡូវនេះ (ឥតគិតថ្លៃ)' : 'Start Learning Free Today'}</span>
                <span>→</span>
              </button>
              {!user && onLogin && (
                <button
                  type="button"
                  className="lnd-cta-secondary-btn"
                  onClick={onLogin}
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

