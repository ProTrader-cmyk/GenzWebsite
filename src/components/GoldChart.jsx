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

export default function GoldChart() {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const t = getStrings(lang).newProduct;
  const [symbolId, setSymbolId] = useState('gold');
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
        interval: '15',
        timezone: 'Etc/UTC',
        theme: theme === 'light' ? 'light' : 'dark',
        style: '1',
        locale: TV_LOCALE,
        toolbar_bg: cssVar('--bg1'),
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        withdateranges: true,
        container_id: tvContainerId,
      });
    });

    return () => {
      cancelled = true;
      tvWidgetRef.current?.remove?.();
      tvWidgetRef.current = null;
    };
    // The free widget's API has no changeTheme()/setSymbol() method (only
    // the paid Charting Library has that) — a real theme or symbol change
    // genuinely has to tear down and recreate the widget, which loses any
    // drawings. Locale is fixed (TV_LOCALE, module-level) so it's not a
    // dependency here.
  }, [theme, symbol.symbol, tvContainerId]);

  return (
    <div className="gold-chart-card">
      <div className="gold-chart-symbols">
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
      <div ref={tvWrapRef} className={`gold-chart-tv-wrap${tvFullscreen ? ' is-fullscreen' : ''}`}>
        <button
          type="button"
          className="gold-chart-fullscreen-btn"
          onClick={toggleTvFullscreen}
          aria-label={t.fullscreenBtn}
          title={t.fullscreenBtn}
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
