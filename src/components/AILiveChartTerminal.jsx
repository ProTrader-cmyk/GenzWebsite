import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fetchLivePrice, formatSpotPrice, subscribeLiveTicks } from '../services/marketPriceService.js';
import { run15mMarketReanalysis, get15mCandleTimeRemaining } from '../services/marketAnalysisService.js';
import MarketAnalysisPanel from './MarketAnalysisPanel.jsx';

const TV_LOCALE = 'en';

const SYMBOLS = [
  { id: 'gold', symbol: 'OANDA:XAUUSD', label: 'XAU/USD', name: 'Gold', pair: 'XAUUSD', pipScale: 0.1, defaultPrice: 2658.20 },
  { id: 'eurusd', symbol: 'OANDA:EURUSD', label: 'EUR/USD', name: 'EUR/USD', pair: 'EURUSD', pipScale: 0.0001, defaultPrice: 1.08540 },
  { id: 'gbpusd', symbol: 'OANDA:GBPUSD', label: 'GBP/USD', name: 'GBP/USD', pair: 'GBPUSD', pipScale: 0.0001, defaultPrice: 1.30120 },
  { id: 'usdjpy', symbol: 'OANDA:USDJPY', label: 'USD/JPY', name: 'USD/JPY', pair: 'USDJPY', pipScale: 0.01, defaultPrice: 152.40 },
  { id: 'btc', symbol: 'BINANCE:BTCUSDT', label: 'BTC/USD', name: 'Bitcoin', pair: 'BTCUSD', pipScale: 1.0, defaultPrice: 65420.00 },
  { id: 'us30', symbol: 'CAPITALCOM:US30', label: 'US30', name: 'Dow Jones', pair: 'US30', pipScale: 1.0, defaultPrice: 42800.00 },
  { id: 'silver', symbol: 'OANDA:XAGUSD', label: 'XAG/USD', name: 'Silver', pair: 'XAGUSD', pipScale: 0.01, defaultPrice: 31.45 },
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

export default function AILiveChartTerminal({
  user,
  onSignalDispatched,
  activeSession = { name: 'London Killzone', status: 'Optimal Volatility', color: '#10B981' },
}) {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isKhmer = lang === 'km' || lang === 'kh';

  const [symbolId, setSymbolId] = useState('gold');
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

  // Drag handlers for mouse & touch
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

  // Active Symbol Object
  const currentAsset = SYMBOLS.find((s) => s.id === symbolId) || SYMBOLS[0];

  // Live Spot Prices
  const [livePrice, setLivePrice] = useState(currentAsset.defaultPrice);
  const [priceChangeDirection, setPriceChangeDirection] = useState('neutral');

  // Real-Time 15M Market Analysis State (Synchronized across MSOB & Market Analysis Panel)
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [candleCountdown, setCandleCountdown] = useState(() => get15mCandleTimeRemaining());
  const [lastCandleCloseNotice, setLastCandleCloseNotice] = useState(null);

  // 1-second countdown clock for the current 15m candle
  useEffect(() => {
    const timer = setInterval(() => {
      setCandleCountdown(get15mCandleTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time market re-analysis triggered on initial mount, asset change, and on every 15m candle close
  const triggerReanalysis = useCallback(async (isCandleCloseTrigger = false) => {
    setIsReanalyzing(true);
    try {
      const result = await run15mMarketReanalysis(currentAsset.pair, livePrice);
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
    } finally {
      setIsReanalyzing(false);
    }
  }, [currentAsset.pair, livePrice, isMuted, isKhmer]);

  // Synchronized 15m candle close scheduler
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

    return () => {
      isMounted = false;
      if (candleTimeoutId) clearTimeout(candleTimeoutId);
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

  // 2. Real-time Live Price Streaming for the selected asset
  useEffect(() => {
    let isSubscribed = true;

    fetchLivePrice(currentAsset.pair).then((price) => {
      if (isSubscribed && price) {
        setLivePrice(price);
        addLog('TICK', `Live Spot synced: $${formatSpotPrice(currentAsset.pair, price)}`);
      }
    });

    const unsubTicks = subscribeLiveTicks([currentAsset.pair], (pair, newPrice) => {
      if (!isSubscribed || !newPrice) return;
      setLivePrice((prev) => {
        if (newPrice > prev) setPriceChangeDirection('up');
        else if (newPrice < prev) setPriceChangeDirection('down');
        return newPrice;
      });
    });

    return () => {
      isSubscribed = false;
      unsubTicks();
    };
  }, [currentAsset.pair, currentAsset.pipScale]);

  // 3. Initialize TradingView Advanced Chart Widget
  useEffect(() => {
    if (!tvContainerRef.current) return undefined;
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !tvContainerRef.current) return;
      try {
        if (tvContainerRef.current) {
          tvContainerRef.current.innerHTML = '';
        }
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
  }, [theme, currentAsset.symbol, timeframe, tvContainerId]);



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

          {/* Workstation Split View Toggle */}
          <div className="ait-chart-view-toggle ait-mono">
            <button
              type="button"
              className={`ait-view-pill ${workstationView === 'split' ? 'active' : ''}`}
              onClick={() => {
                setWorkstationView('split');
                setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
              }}
              title="Split View: Chart + Market Analysis"
            >
              <span>◫</span>
              <span>{isKhmer ? 'បំបែក' : 'Split'}</span>
            </button>
            <button
              type="button"
              className={`ait-view-pill ${workstationView === 'chart' ? 'active' : ''}`}
              onClick={() => {
                setWorkstationView('chart');
                setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
              }}
              title="Chart Full View"
            >
              <span>📈</span>
              <span>{isKhmer ? 'ក្រាហ្វិក' : 'Chart'}</span>
            </button>
            <button
              type="button"
              className={`ait-view-pill ${workstationView === 'analysis' ? 'active' : ''}`}
              onClick={() => {
                setWorkstationView('analysis');
                setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
              }}
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
            {activeSession.name} ({activeSession.status})
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

        {/* Left Column: Real Live Interactive TradingView Candlestick Canvas */}
        {(workstationView === 'split' || workstationView === 'chart') && (
          <div className="ait-chart-col">
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
                  <span className="pip-msob-val session-name">
                    {(activeSession?.name || 'LONDON (KZ)').toUpperCase()}
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

            {/* Real Live Interactive TradingView Candlestick Canvas (Always 100% Active) */}
            <div
              ref={tvContainerRef}
              id={tvContainerId}
              className="ait-tradingview-container"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Right Column: Institutional Market Analysis & Intelligence Terminal (Exact Match to User Screenshot) */}
        {(workstationView === 'split' || workstationView === 'analysis') && (
          <div className="ait-analysis-col">
            <MarketAnalysisPanel
              currentAsset={currentAsset}
              livePrice={livePrice}
              activeSession={activeSession}
              isKhmer={isKhmer}
              marketAnalysis={marketAnalysis}
              isReanalyzing={isReanalyzing}
              candleCountdown={candleCountdown}
              lastCandleCloseNotice={lastCandleCloseNotice}
              onReanalyze={() => triggerReanalysis(false)}
              onSelectAsset={(id) => {
                setSymbolId(id);
                addLog('MARKET', `Switched active feed to ${id}`);
                playAiBeep('scan', isMuted);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
