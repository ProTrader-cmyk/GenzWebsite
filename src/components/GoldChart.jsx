import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// TradingView's embed widget doesn't have a Khmer locale, so this is always
// English regardless of the site's own selected language.
const TV_LOCALE = 'en';

// All OANDA (same feed/company as the gold chart) — real forex data, not a
// crypto proxy, so no disclosure needed for any of these.
const SYMBOLS = [
  { id: 'gold', symbol: 'OANDA:XAUUSD', label: 'Gold' },
  { id: 'silver', symbol: 'OANDA:XAGUSD', label: 'Silver' },
  { id: 'eurusd', symbol: 'OANDA:EURUSD', label: 'EUR/USD' },
  { id: 'gbpusd', symbol: 'OANDA:GBPUSD', label: 'GBP/USD' },
  { id: 'usdjpy', symbol: 'OANDA:USDJPY', label: 'USD/JPY' },
];

const TIMEFRAMES = [
  { id: '1', label: '⚡ 1m (Live Ticks)' },
  { id: '5', label: '5m' },
  { id: '15', label: '15m (ICT)' },
  { id: '60', label: '1H' },
  { id: '240', label: '4H' },
];

// Loads TradingView's real "Advanced Chart" widget script once (module-level
// promise cached across every mount/remount) — this is their proper
// embeddable widget (not the bare widgetembed iframe URL), which includes
// TradingView's own full drawing toolbar: trendlines, Fibonacci, shapes,
// text, measure. Real functionality, not something we build ourselves.
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

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function GoldChart({ initialSymbol = 'gold', defaultTimeframe = '1' }) {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const t = getStrings(lang)?.newProduct ?? {};
  const [symbolId, setSymbolId] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const symbol = SYMBOLS.find((s) => s.id === symbolId) ?? SYMBOLS[0];
  const tvContainerId = `tv-gold-${useId().replace(/:/g, '')}`;
  const tvContainerRef = useRef(null);
  const tvWidgetRef = useRef(null);
  const tvWrapRef = useRef(null);
  const [tvFullscreen, setTvFullscreen] = useState(false);

  useEffect(() => {
    function handleFsChange() {
      setTvFullscreen(document.fullscreenElement === tvWrapRef.current);
    }
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  function toggleTvFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      tvWrapRef.current?.requestFullscreen?.();
    }
  }

  useEffect(() => {
    if (!tvContainerRef.current) return undefined;
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !tvContainerRef.current) return;
      tvContainerRef.current.innerHTML = ''; // clear any previous widget instance before re-creating
      tvWidgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: symbol.symbol,
        interval: timeframe,
        timezone: 'Asia/Bangkok', // GMT+7 Cambodia Time
        theme: theme === 'light' ? 'light' : 'dark',
        style: '1',
        locale: TV_LOCALE,
        toolbar_bg: cssVar('--bg1'),
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        withdateranges: true,
        details: true,
        hotlist: true,
        calendar: true,
        container_id: tvContainerId,
        overrides: {
          'mainSeriesProperties.showCountdown': true,
          'paneProperties.legendProperties.showSeriesTitle': true,
          'scalesProperties.showSeriesLastValue': true,
        },
      });
    });

    return () => {
      cancelled = true;
      tvWidgetRef.current?.remove?.();
      tvWidgetRef.current = null;
    };
  }, [theme, symbol.symbol, timeframe, tvContainerId]);

  return (
    <div className="gold-chart-card">
      <div className="gold-chart-symbols">
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', marginRight: '2px' }}>ASSET:</span>
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`gold-chart-symbol-btn${s.id === symbolId ? ' active' : ''}`}
              onClick={() => setSymbolId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', marginRight: '2px' }}>TIMEFRAME:</span>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              className={`gold-chart-symbol-btn${tf.id === timeframe ? ' active' : ''}`}
              onClick={() => setTimeframe(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={tvWrapRef} className={`gold-chart-tv-wrap${tvFullscreen ? ' is-fullscreen' : ''}`}>
        <button
          type="button"
          className="gold-chart-fullscreen-btn"
          onClick={toggleTvFullscreen}
          aria-label={t.fullscreenBtn || 'Toggle Fullscreen'}
          title={t.fullscreenBtn || 'Toggle Fullscreen'}
        >
          {tvFullscreen ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </button>
        <div ref={tvContainerRef} id={tvContainerId} className="gold-chart-canvas gold-chart-tv-iframe" />
      </div>
    </div>
  );
}
