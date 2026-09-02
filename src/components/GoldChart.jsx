import { useEffect, useId, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import {
  fetchCustomIndicators,
  saveCustomIndicator,
  deleteCustomIndicatorDoc,
  newCustomIndicatorId,
} from '../data/customIndicator.js';
import GoldSignalPanel from './GoldSignalPanel.jsx';

// Starter template shown when the admin starts a fresh (unsaved) indicator.
const CUSTOM_CODE_TEMPLATE = `// bars: array of { time, open, high, low, close }, oldest -> newest
//
// Return an object describing what to draw:
//   lines:   { name: { points: [{ time, value }], color?, lineWidth? }, ... }
//   markers: [{ time, position: 'aboveBar'|'belowBar', color, shape: 'arrowUp'|'arrowDown'|'circle'|'square', text }]
//   boxes:   [{ time1, time2, price1, price2, color?, borderColor? }]  — rectangular zones (e.g. FVGs)
//
// (A plain array of { time, value } still works too, as a single line —
// the older, simpler contract this editor started with.)

return {
  lines: {
    midline: { points: bars.map((b) => ({ time: b.time, value: (b.high + b.low) / 2 })) },
  },
  markers: [],
  boxes: [],
};`;

// Minimal custom primitive for drawing rectangular zones (FVGs, order
// blocks, etc.) on the chart — lightweight-charts has no built-in "box"
// series, so this uses its documented Primitives API to paint directly on
// the canvas. Time/price -> pixel conversion goes through the chart's own
// timeScale and the series' priceToCoordinate, so boxes stay correctly
// positioned through panning/zooming without any extra work here.
class BoxPrimitive {
  constructor() {
    this._boxes = [];
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }
  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;
  }
  detached() {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }
  setBoxes(boxes) {
    this._boxes = Array.isArray(boxes) ? boxes : [];
    this._requestUpdate?.();
  }
  updateAllViews() {}
  paneViews() {
    const chart = this._chart;
    const series = this._series;
    const boxes = this._boxes;
    return [
      {
        renderer: () => ({
          draw: (target) => {
            if (!chart || !series || !boxes.length) return;
            target.useMediaCoordinateSpace(({ context }) => {
              const timeScale = chart.timeScale();
              for (const box of boxes) {
                const x1 = timeScale.timeToCoordinate(box.time1);
                const x2 = timeScale.timeToCoordinate(box.time2);
                const y1 = series.priceToCoordinate(box.price1);
                const y2 = series.priceToCoordinate(box.price2);
                if (x1 == null || x2 == null || y1 == null || y2 == null) continue;
                const left = Math.min(x1, x2);
                const width = Math.max(x1, x2) - left;
                const top = Math.min(y1, y2);
                const height = Math.max(y1, y2) - top;
                context.fillStyle = box.color;
                context.fillRect(left, top, width, height);
                if (box.borderColor) {
                  context.strokeStyle = box.borderColor;
                  context.lineWidth = 1;
                  context.strokeRect(left, top, width, height);
                }
              }
            });
          },
        }),
      },
    ];
  }
}

// All via Kraken's public market-data API — no key/signup, CORS-open direct
// browser calls, and full historical candles + real-time WebSocket
// streaming together (no free real forex/XAUUSD provider offers that
// combination without a paid plan; Binance offers similar data but
// geo-blocks entire regions from api.binance.com with an HTTP 451, unrelated
// to anything in this code — Kraken is US-licensed and doesn't do that).
//
// Gold uses PAXG (Paxos Gold, a token backed 1:1 by physical gold) as a
// stand-in for spot XAUUSD — disclosed to the user via t.disclosure below,
// not presented as literal broker XAUUSD. It tracks spot gold closely but
// isn't identical (small basis, trades 24/7 including when the real gold
// market is closed). The others (BTC/ETH/SOL) are the literal real assets,
// no proxy involved, so no disclosure needed for those.
//
// restPair is the Kraken REST `pair` query value (their historical
// "altname", e.g. Bitcoin is XBT not BTC); wsSymbol is the WS v2 API's
// symbol name — the two don't always match (loadHistory() below finds the
// REST response's data key generically, so a legacy X/Z-prefixed result key
// like XXBTZUSD for Bitcoin doesn't need special-casing here).
const SYMBOLS = [{ id: 'gold', restPair: 'PAXGUSD', wsSymbol: 'PAXG/USD', label: 'Gold' }];
const EMA_FAST = 9;
const EMA_SLOW = 21;

// Maps our shared timeframe-in-minutes value to a TradingView `interval`
// param for the embedded OANDA:XAUUSD widget below.
function tvInterval(minutes) {
  return minutes === 1440 ? 'D' : String(minutes);
}

// TradingView doesn't have a Khmer locale for its embed widget — falls back
// to English rather than silently 404ing/erroring inside the iframe.
const TV_LOCALE = { kh: 'en', en: 'en', zh: 'zh' };

// Loads TradingView's real "Advanced Chart" widget script once (module-level
// promise cached across every mount/remount so switching timeframes doesn't
// re-fetch it) — this is a different, more capable embed than the plain
// widgetembed iframe URL: it includes TradingView's own full drawing toolbar
// (trendlines, Fibonacci, shapes, text, measure), not something we build.
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

// Kraken's valid OHLC interval values, in minutes.
const TIMEFRAMES = [
  { value: 1, label: '1m' },
  { value: 5, label: '5m' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1H' },
  { value: 240, label: '4H' },
  { value: 1440, label: '1D' },
];

// Cycled by position for default line/legend colors when an indicator's
// code doesn't specify its own.
const PALETTE = ['--dn', '--gold2', '--warn', '--up'];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ---------------------------------------------------------------------------
// INDICATORS. computeEma is the one built-in indicator (see
// "ADD MORE INDICATORS HERE" below for where a new one plugs in). Add a
// sibling function here for anything else you want computed from the closes
// array — e.g. RSI, SMA, Bollinger Bands.
// ---------------------------------------------------------------------------

// Seeds with a simple moving average at the first full period (standard EMA
// warm-up), then applies the EMA recurrence forward. Returns one entry per
// input value — null before the series has enough history to seed.
function computeEma(values, period) {
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[j];
      prev = sum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}

function restBarFromOhlc(row) {
  // Kraken REST OHLC row: [time, open, high, low, close, vwap, volume, count]
  // — `time` is already in whole seconds.
  return { time: row[0], open: +row[1], high: +row[2], low: +row[3], close: +row[4] };
}

function wsBarFromOhlc(d) {
  // Kraken WS v2 ohlc channel data entry.
  return {
    time: Math.floor(new Date(d.interval_begin).getTime() / 1000),
    open: +d.open,
    high: +d.high,
    low: +d.low,
    close: +d.close,
  };
}

export default function GoldChart({ isAdmin }) {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const t = getStrings(lang).newProduct;
  const tvContainerId = `tv-gold-${useId().replace(/:/g, '')}`;
  const [intervalMinutes, setIntervalMinutes] = useState(15); // see TIMEFRAMES
  const symbolId = 'gold'; // only symbol left — see SYMBOLS
  const symbol = SYMBOLS[0];
  // Gold shows a real OANDA:XAUUSD forex feed via TradingView's own embedded
  // widget instead of our Kraken-driven canvas below — there's no free
  // provider for genuine forex XAUUSD data otherwise (see the old PAXG
  // proxy note this replaced). BTC/ETH/SOL are already the literal real
  // assets on Kraken, so they keep the full custom-indicator chart as is.
  const isGold = symbolId === 'gold';
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

  const tvContainerRef = useRef(null);
  const tvWidgetRef = useRef(null);

  useEffect(() => {
    if (!isGold || !tvContainerRef.current) return undefined;
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !tvContainerRef.current) return;
      tvContainerRef.current.innerHTML = ''; // clear any previous widget instance before re-creating
      tvWidgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: 'OANDA:XAUUSD',
        interval: tvInterval(intervalMinutes),
        timezone: 'Etc/UTC',
        theme: theme === 'light' ? 'light' : 'dark',
        style: '1',
        locale: TV_LOCALE[lang] || 'en',
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
  }, [isGold, intervalMinutes, theme, lang]);

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const emaFastSeriesRef = useRef(null);
  const emaSlowSeriesRef = useRef(null);
  const markersApiRef = useRef(null);
  const markersRef = useRef([]);
  const closesRef = useRef([]); // finalized closes only, oldest -> newest
  const emaFastRef = useRef(null); // last finalized EMA(9)
  const emaSlowRef = useRef(null); // last finalized EMA(21)
  const formingTimeRef = useRef(null); // time of the currently-open candle
  const formingRef = useRef(null); // { bar, trialFast, trialSlow } for that candle
  const [price, setPrice] = useState(null);
  const [priceDir, setPriceDir] = useState(null); // 'up' | 'down' | null
  const [status, setStatus] = useState('loading'); // 'loading' | 'live' | 'error'

  // Built-in EMA 9/21 crossover indicator — off by default (plain candles),
  // toggled on via the Indicators menu. emaEnabledRef is read inside the
  // chart effect's closures; the state is just for the menu's UI.
  const emaEnabledRef = useRef(false);
  const setEmaVisibilityRef = useRef(() => {}); // set inside the chart effect
  const [emaEnabled, setEmaEnabled] = useState(false);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // --- Admin-only custom indicators (private — only admin ever sees the
  // editor, the Indicators menu entries for these, OR their plotted result;
  // the code only ever executes in the admin's own browser, never anyone
  // else's). Each is a named, independently saved + independently
  // toggleable indicator, like a personal script library. ---
  const barsRef = useRef([]); // full bar history incl. the forming candle
  const customIndicatorsRef = useRef([]); // mirrors customIndicators, read inside the chart effect
  const applyCustomIndicatorRef = useRef(() => {}); // set inside the chart effect
  const [customIndicators, setCustomIndicators] = useState([]); // [{ id, name, code, enabled }]
  const [editingId, setEditingId] = useState(null); // null = unsaved new draft
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState(CUSTOM_CODE_TEMPLATE);
  const [customError, setCustomError] = useState(null);
  const [customSaving, setCustomSaving] = useState(false);
  const [customSaved, setCustomSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

  // Load every saved indicator once — each starts disabled; the admin turns
  // on whichever ones they want to see via the Indicators menu.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchCustomIndicators()
      .then((list) => {
        if (cancelled) return;
        setCustomIndicators(list.map((ind) => ({ ...ind, enabled: false })));
      })
      .catch(() => {
        // Nothing saved yet, or a transient read error — start with an
        // empty list; the editor's own "+ New" draft still works fine.
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Keeps the chart effect's ref in sync and re-applies whenever any
  // indicator's code/name/enabled state changes (add, edit, delete, toggle).
  useEffect(() => {
    customIndicatorsRef.current = customIndicators;
    applyCustomIndicatorRef.current?.();
  }, [customIndicators]);

  // Chart + data lifecycle — re-created whenever the timeframe or symbol
  // changes (torn down via the cleanup function, then rebuilt fresh below).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    // Clear the previous symbol's last price immediately so it can't
    // linger on screen while the new one loads.
    setPrice(null);
    setPriceDir(null);
    setStatus('loading');
    let cancelled = false;
    let ohlcWs = null;
    let tickerWs = null;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: cssVar('--bg1') },
        textColor: cssVar('--text'),
      },
      grid: {
        vertLines: { color: cssVar('--faint') },
        horzLines: { color: cssVar('--faint') },
      },
      timeScale: { borderColor: cssVar('--faint'), timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: cssVar('--faint') },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: cssVar('--up'),
      downColor: cssVar('--dn'),
      borderVisible: false,
      wickUpColor: cssVar('--up'),
      wickDownColor: cssVar('--dn'),
    });
    candleSeriesRef.current = candleSeries;

    const emaFastSeries = chart.addSeries(LineSeries, {
      color: cssVar('--gold2'),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    emaFastSeriesRef.current = emaFastSeries;

    const emaSlowSeries = chart.addSeries(LineSeries, {
      color: cssVar('--warn'),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    emaSlowSeriesRef.current = emaSlowSeries;

    // ADD MORE INDICATORS HERE: create another series the same way (e.g.
    // `chart.addSeries(LineSeries, {...})` for an overlay, or a separate
    // pane for something like RSI), compute its values from `closesRef` /
    // the same computeEma-style helper above, and call `.setData()` /
    // `.update()` on it alongside emaFastSeries/emaSlowSeries in
    // loadHistory() and applyTick() below.

    // Custom indicator plumbing only exists at all for an admin — a
    // regular user's chart never has any of these objects, so there's
    // nothing to leak even if `customIndicatorsRef` somehow had content.
    const customLineSeries = new Map(); // "indicatorId::lineName" -> LineSeries
    let customMarkersApi = null;
    let customBoxPrimitive = null;
    if (isAdmin) {
      customMarkersApi = createSeriesMarkers(candleSeries, []);
      customBoxPrimitive = new BoxPrimitive();
      candleSeries.attachPrimitive(customBoxPrimitive);
    }

    // Runs one indicator's saved JS against the current bar history. `new
    // Function` executes with full page access (same as pasting into
    // devtools) — that's acceptable ONLY because this never runs outside
    // the admin's own browser; see the isAdmin guard above.
    //
    // Contract: return { lines?: {name: {points, color?, lineWidth?}},
    // markers?: [...], boxes?: [...] } — see CUSTOM_CODE_TEMPLATE above
    // for the exact shape. A bare array of {time,value} still works too,
    // treated as one line named "custom" (the original, simpler contract
    // this editor started with).
    function runCustomCode(code, bars) {
      if (!code || !code.trim()) return { result: {}, error: null };
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('bars', code);
        const raw = fn(bars);
        if (Array.isArray(raw)) return { result: { lines: { custom: { points: raw } } }, error: null };
        if (raw && typeof raw === 'object') return { result: raw, error: null };
        throw new Error('Code must return an object like { lines, markers, boxes } (or a plain array of points for a single line).');
      } catch (err) {
        return { result: {}, error: err.message || String(err) };
      }
    }

    // Aggregates every ENABLED indicator's output onto the chart. Line
    // series are namespaced per indicator ("id::name") so two indicators
    // can't collide; markers/boxes are combined into one list per type
    // (each plugin instance only ever holds one set at a time).
    function applyCustomIndicator() {
      if (!isAdmin) return;
      const enabled = customIndicatorsRef.current.filter((ind) => ind.enabled);

      const seenLineNames = new Set();
      const allMarkers = [];
      const allBoxes = [];
      const errors = [];

      for (const ind of enabled) {
        const { result, error } = runCustomCode(ind.code, barsRef.current);
        if (error) errors.push(`${ind.name || 'Untitled'}: ${error}`);

        const lines = result.lines && typeof result.lines === 'object' ? result.lines : {};
        Object.keys(lines).forEach((name, i) => {
          const spec = lines[name] || {};
          const points = Array.isArray(spec.points) ? spec.points : Array.isArray(spec) ? spec : [];
          const color = spec.color || cssVar(PALETTE[i % PALETTE.length]);
          const qualifiedName = `${ind.id}::${name}`;
          seenLineNames.add(qualifiedName);
          let series = customLineSeries.get(qualifiedName);
          if (!series) {
            series = chart.addSeries(LineSeries, {
              color,
              lineWidth: spec.lineWidth || 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            customLineSeries.set(qualifiedName, series);
          } else {
            series.applyOptions({ color, lineWidth: spec.lineWidth || 2 });
          }
          series.setData(points);
        });

        if (Array.isArray(result.markers)) allMarkers.push(...result.markers);
        if (Array.isArray(result.boxes)) {
          allBoxes.push(
            ...result.boxes.map((b) => ({
              ...b,
              color: b.color || 'rgba(224,177,85,0.18)',
              borderColor: b.borderColor || cssVar('--warn'),
            }))
          );
        }
      }

      // Drop series for lines no longer produced by any enabled indicator.
      for (const [name, series] of customLineSeries) {
        if (!seenLineNames.has(name)) {
          chart.removeSeries(series);
          customLineSeries.delete(name);
        }
      }

      customMarkersApi?.setMarkers(allMarkers);
      customBoxPrimitive?.setBoxes(allBoxes);
      setCustomError(errors.length ? errors.join(' | ') : null);
    }
    applyCustomIndicatorRef.current = applyCustomIndicator;

    markersApiRef.current = createSeriesMarkers(candleSeries, []);

    // Full recompute of the built-in EMA 9/21 crossover indicator from the
    // whole bar history — cheap enough (a few hundred bars) to just redo
    // from scratch whenever it's turned on or the timeframe changes,
    // rather than maintaining hidden incremental state while it's off.
    function applyBuiltinEma() {
      const bars = barsRef.current;
      const closes = bars.map((b) => b.close);
      const emaFast = computeEma(closes, EMA_FAST);
      const emaSlow = computeEma(closes, EMA_SLOW);

      emaFastSeries.setData(
        bars.map((b, i) => ({ time: b.time, value: emaFast[i] })).filter((d) => d.value != null)
      );
      emaSlowSeries.setData(
        bars.map((b, i) => ({ time: b.time, value: emaSlow[i] })).filter((d) => d.value != null)
      );

      const markers = [];
      for (let i = 1; i < bars.length; i++) {
        const prevDiff = emaFast[i - 1] != null && emaSlow[i - 1] != null ? emaFast[i - 1] - emaSlow[i - 1] : null;
        const diff = emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null;
        if (prevDiff == null || diff == null) continue;
        if (prevDiff <= 0 && diff > 0) {
          markers.push({ time: bars[i].time, position: 'belowBar', color: cssVar('--up'), shape: 'arrowUp', text: t.bullishMark });
        } else if (prevDiff >= 0 && diff < 0) {
          markers.push({ time: bars[i].time, position: 'aboveBar', color: cssVar('--dn'), shape: 'arrowDown', text: t.bearishMark });
        }
      }
      markersRef.current = markers;
      markersApiRef.current.setMarkers(markers);

      emaFastRef.current = emaFast[emaFast.length - 1];
      emaSlowRef.current = emaSlow[emaSlow.length - 1];
    }

    function clearBuiltinEma() {
      emaFastSeries.setData([]);
      emaSlowSeries.setData([]);
      markersRef.current = [];
      markersApiRef.current.setMarkers([]);
    }

    setEmaVisibilityRef.current = (enabled) => {
      emaEnabledRef.current = enabled;
      if (enabled) applyBuiltinEma();
      else clearBuiltinEma();
    };

    // Pushes one bar's OHLC onto the chart, updates the price ticker, and
    // returns a "trial" EMA computed off the last FINALIZED EMA — safe to
    // call repeatedly for the same still-open candle (idempotent, since it
    // never reads its own previous trial output).
    function applyTick(bar) {
      candleSeries.update({ time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });

      // Keep barsRef in sync the same way candleSeries.update() behaves:
      // replace the last entry if it's the same time (still-forming
      // candle), otherwise append a new one.
      const bars = barsRef.current;
      if (bars.length && bars[bars.length - 1].time === bar.time) {
        bars[bars.length - 1] = bar;
      } else {
        barsRef.current = [...bars, bar];
      }

      setPrice((prevPrice) => {
        if (prevPrice != null) setPriceDir(bar.close >= prevPrice ? 'up' : 'down');
        return bar.close;
      });

      let trialFast = null;
      let trialSlow = null;
      if (emaEnabledRef.current) {
        const kFast = 2 / (EMA_FAST + 1);
        const kSlow = 2 / (EMA_SLOW + 1);
        trialFast = emaFastRef.current != null ? bar.close * kFast + emaFastRef.current * (1 - kFast) : null;
        trialSlow = emaSlowRef.current != null ? bar.close * kSlow + emaSlowRef.current * (1 - kSlow) : null;
        if (trialFast != null) emaFastSeries.update({ time: bar.time, value: trialFast });
        if (trialSlow != null) emaSlowSeries.update({ time: bar.time, value: trialSlow });
      }
      applyCustomIndicator();
      return { trialFast, trialSlow };
    }

    // Commits a closed candle's trial EMA as the new finalized baseline and
    // adds a crossover marker if one just happened — a no-op beyond
    // tracking closes while the indicator is off.
    function finalizeBar(bar, trialFast, trialSlow) {
      closesRef.current = [...closesRef.current, bar.close];
      if (!emaEnabledRef.current) return;

      const prevFast = emaFastRef.current;
      const prevSlow = emaSlowRef.current;
      emaFastRef.current = trialFast;
      emaSlowRef.current = trialSlow;

      if (prevFast != null && prevSlow != null && trialFast != null && trialSlow != null) {
        const prevDiff = prevFast - prevSlow;
        const diff = trialFast - trialSlow;
        let marker = null;
        if (prevDiff <= 0 && diff > 0) {
          marker = { time: bar.time, position: 'belowBar', color: cssVar('--up'), shape: 'arrowUp', text: t.bullishMark };
        } else if (prevDiff >= 0 && diff < 0) {
          marker = { time: bar.time, position: 'aboveBar', color: cssVar('--dn'), shape: 'arrowDown', text: t.bearishMark };
        }
        if (marker) {
          markersRef.current = [...markersRef.current, marker];
          markersApiRef.current.setMarkers(markersRef.current);
        }
      }
    }

    async function loadHistory() {
      try {
        const res = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${symbol.restPair}&interval=${intervalMinutes}`);
        if (!res.ok) throw new Error(`Kraken ${res.status}`);
        const json = await res.json();
        if (json.error?.length) throw new Error(json.error.join(', '));
        if (cancelled) return;

        const key = Object.keys(json.result).find((k) => k !== 'last');
        const raw = json.result[key];
        if (!raw?.length) throw new Error('No candles returned');

        // Kraken's last row is the still-forming candle — treat every row
        // before it as finalized history, and feed it to applyTick below
        // as the live stream's starting point (so there's no gap while
        // waiting for the first WebSocket tick).
        const closedRows = raw.slice(0, -1);
        const bars = closedRows.map(restBarFromOhlc);

        candleSeries.setData(bars);
        closesRef.current = bars.map((b) => b.close);
        barsRef.current = bars;

        const formingBar = restBarFromOhlc(raw[raw.length - 1]);
        formingTimeRef.current = formingBar.time;
        const { trialFast, trialSlow } = applyTick(formingBar);
        formingRef.current = { bar: formingBar, trialFast, trialSlow };

        // Restores the indicator's display after a timeframe switch if it
        // was already turned on — plain candles otherwise (default).
        if (emaEnabledRef.current) applyBuiltinEma();

        chart.timeScale().fitContent();
        setStatus('live');
        connectOhlcStream();
        connectTickerStream();
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    // Authoritative candle formation — trade-gated (Kraken only emits an
    // OHLC update when a trade actually happens), so on a quiet pair like
    // PAXG/USD this alone can sit still for long stretches. Drives
    // finalizing candles and the EMA/marker logic.
    function connectOhlcStream() {
      ohlcWs = new WebSocket('wss://ws.kraken.com/v2');
      ohlcWs.onopen = () => {
        ohlcWs.send(
          JSON.stringify({ method: 'subscribe', params: { channel: 'ohlc', symbol: [symbol.wsSymbol], interval: intervalMinutes } })
        );
      };
      ohlcWs.onmessage = (event) => {
        if (cancelled) return;
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        // The first message(s) after subscribing are `type: "snapshot"` —
        // Kraken bulk-sends recent history there, which we already have
        // from the REST fetch above. Only live `"update"` ticks going
        // forward should touch the chart, or their (potentially
        // out-of-order/older) times would violate lightweight-charts'
        // requirement that update() times never move backward.
        if (msg.channel !== 'ohlc' || msg.type !== 'update' || !Array.isArray(msg.data)) return;

        for (const d of msg.data) {
          const bar = wsBarFromOhlc(d);
          if (formingTimeRef.current != null && bar.time < formingTimeRef.current) continue; // stale/out-of-order
          // A new interval_begin means the previously-tracked candle just
          // closed — Kraken's OHLC stream has no explicit "closed" flag.
          if (formingTimeRef.current != null && bar.time > formingTimeRef.current && formingRef.current) {
            finalizeBar(formingRef.current.bar, formingRef.current.trialFast, formingRef.current.trialSlow);
          }
          formingTimeRef.current = bar.time;
          const { trialFast, trialSlow } = applyTick(bar);
          formingRef.current = { bar, trialFast, trialSlow };
        }
      };
      ohlcWs.onerror = () => {
        if (!cancelled) setStatus('error');
      };
    }

    // Cosmetic liveliness layer: Kraken's ticker channel with
    // event_trigger "bbo" fires on every best-bid/ask change, which is far
    // more frequent than actual trades — this is what makes the chart
    // visibly move between trades instead of sitting still. It nudges the
    // CURRENT forming candle's high/low/close toward the live mid-price
    // and re-runs the EMA trial off it, but never finalizes a candle or
    // adds a marker — connectOhlcStream()'s real trade data still owns
    // that, so this can never drift the actual OHLC record.
    function connectTickerStream() {
      tickerWs = new WebSocket('wss://ws.kraken.com/v2');
      tickerWs.onopen = () => {
        tickerWs.send(
          JSON.stringify({
            method: 'subscribe',
            params: { channel: 'ticker', symbol: [symbol.wsSymbol], event_trigger: 'bbo' },
          })
        );
      };
      tickerWs.onmessage = (event) => {
        if (cancelled) return;
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.channel !== 'ticker' || !Array.isArray(msg.data) || !formingRef.current) return;

        for (const d of msg.data) {
          const bid = +d.bid;
          const ask = +d.ask;
          if (!Number.isFinite(bid) || !Number.isFinite(ask)) continue;
          const mid = (bid + ask) / 2;

          const prevBar = formingRef.current.bar;
          const bar = {
            time: prevBar.time,
            open: prevBar.open,
            high: Math.max(prevBar.high, mid),
            low: Math.min(prevBar.low, mid),
            close: mid,
          };
          const { trialFast, trialSlow } = applyTick(bar);
          formingRef.current = { bar, trialFast, trialSlow };
        }
      };
      // No onerror handling here — this stream is a cosmetic bonus, the
      // OHLC stream above is what status/error tracks.
    }

    loadHistory();

    return () => {
      cancelled = true;
      if (ohlcWs) ohlcWs.close();
      if (tickerWs) tickerWs.close();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMinutes, symbolId]);

  // Re-theme the chart in place (no reload/reconnect) when the site's
  // light/dark toggle changes.
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: { background: { color: cssVar('--bg1') }, textColor: cssVar('--text') },
      grid: { vertLines: { color: cssVar('--faint') }, horzLines: { color: cssVar('--faint') } },
      timeScale: { borderColor: cssVar('--faint') },
      rightPriceScale: { borderColor: cssVar('--faint') },
    });
    candleSeriesRef.current?.applyOptions({
      upColor: cssVar('--up'),
      downColor: cssVar('--dn'),
      wickUpColor: cssVar('--up'),
      wickDownColor: cssVar('--dn'),
    });
    emaFastSeriesRef.current?.applyOptions({ color: cssVar('--gold2') });
    emaSlowSeriesRef.current?.applyOptions({ color: cssVar('--warn') });
    // Custom lines/boxes with no explicit color pick a theme-aware default
    // at apply time — re-run so they pick up the new theme's colors too.
    applyCustomIndicatorRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  function toggleEmaIndicator() {
    const next = !emaEnabled;
    setEmaEnabled(next);
    setEmaVisibilityRef.current?.(next);
    setShowIndicatorMenu(false);
  }

  function toggleCustomIndicator(id) {
    setCustomIndicators((prev) => prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind)));
    setShowIndicatorMenu(false);
  }

  function handleNewIndicator() {
    setEditingId(null);
    setEditingName('');
    setEditingCode(CUSTOM_CODE_TEMPLATE);
    setCustomSaved(false);
    setCustomError(null);
  }

  function handleEditIndicator(ind) {
    setEditingId(ind.id);
    setEditingName(ind.name || '');
    setEditingCode(ind.code || '');
    setCustomSaved(false);
    setCustomError(null);
    setContextMenu(null);
    setShowIndicatorMenu(false);
  }

  async function handleDeleteIndicator(ind) {
    setContextMenu(null);
    setShowIndicatorMenu(false);
    const confirmMsg = t.deleteConfirm.replace('{name}', ind.name || t.untitledIndicator);
    // eslint-disable-next-line no-alert
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteCustomIndicatorDoc(ind.id);
    } catch (err) {
      setCustomError(`Delete failed: ${err.message || err}`);
      return;
    }
    setCustomIndicators((prev) => prev.filter((x) => x.id !== ind.id));
    if (editingId === ind.id) handleNewIndicator();
  }

  function handleContextMenu(e, ind) {
    e.preventDefault();
    setContextMenu({ id: ind.id, x: e.clientX, y: e.clientY });
  }

  // Adds/updates this draft in the live indicator list (enabled) without
  // touching Firestore — lets the admin preview before deciding to Save.
  function upsertDraft(id, name, code) {
    setCustomIndicators((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      const entry = { id, name, code, enabled: true };
      if (idx === -1) return [...prev, entry];
      const next = [...prev];
      next[idx] = entry;
      return next;
    });
  }

  function handleApplyCustomCode() {
    const id = editingId || newCustomIndicatorId();
    if (!editingId) setEditingId(id);
    upsertDraft(id, editingName.trim() || t.untitledIndicator, editingCode);
  }

  async function handleSaveCustomCode() {
    const id = editingId || newCustomIndicatorId();
    if (!editingId) setEditingId(id);
    const name = editingName.trim() || t.untitledIndicator;
    setCustomSaving(true);
    try {
      await saveCustomIndicator(id, name, editingCode);
      setCustomSaved(true);
      upsertDraft(id, name, editingCode);
    } catch (err) {
      setCustomError(`Save failed: ${err.message || err}`);
    } finally {
      setCustomSaving(false);
    }
  }

  const enabledCustomIndicators = customIndicators.filter((ind) => ind.enabled);

  return (
    <div className="gold-chart-card">
      {!isGold && (
        <div className="gold-chart-head">
          <div className="gold-chart-tf">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                className={`gc-tf-btn${tf.value === intervalMinutes ? ' active' : ''}`}
                onClick={() => setIntervalMinutes(tf.value)}
              >
                {tf.label}
              </button>
            ))}
            <div className="gc-indicators">
              <button
                type="button"
                className={`gc-tf-btn${emaEnabled || enabledCustomIndicators.length ? ' active' : ''}`}
                onClick={() => setShowIndicatorMenu((v) => !v)}
              >
                {t.indicatorsBtn} ▾
              </button>
              {showIndicatorMenu && (
                <div className="gc-indicator-menu">
                  <button
                    type="button"
                    className={`gc-indicator-item${emaEnabled ? ' active' : ''}`}
                    onClick={toggleEmaIndicator}
                  >
                    {emaEnabled ? '✓ ' : ''}
                    {t.emaIndicatorName}
                  </button>
                  {isAdmin &&
                    customIndicators.map((ind) => (
                      <button
                        key={ind.id}
                        type="button"
                        className={`gc-indicator-item${ind.enabled ? ' active' : ''}`}
                        onClick={() => toggleCustomIndicator(ind.id)}
                        onContextMenu={(e) => handleContextMenu(e, ind)}
                        title={t.rightClickHint}
                      >
                        {ind.enabled ? '✓ ' : ''}
                        {ind.name || t.untitledIndicator}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
          {price != null && (
            <div className={`gold-chart-price${priceDir ? ` is-${priceDir}` : ''}`}>
              ${price.toFixed(2)}
            </div>
          )}
        </div>
      )}
      {!isGold && (emaEnabled || enabledCustomIndicators.length > 0) && (
        <div className="gold-chart-legend">
          {emaEnabled && (
            <>
              <span className="gc-dot" style={{ background: 'var(--gold2)' }} />
              {t.emaFastLabel}
              <span className="gc-dot" style={{ background: 'var(--warn)', marginLeft: 14 }} />
              {t.emaSlowLabel}
            </>
          )}
          {enabledCustomIndicators.map((ind, i) => (
            <span key={ind.id} style={{ marginLeft: emaEnabled || i > 0 ? 14 : 0 }}>
              <span className="gc-dot" style={{ background: `var(${PALETTE[i % PALETTE.length]})` }} />
              {ind.name || t.untitledIndicator}
            </span>
          ))}
        </div>
      )}
      {isGold ? (
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
          <div
            ref={tvContainerRef}
            id={tvContainerId}
            className="gold-chart-canvas gold-chart-tv-iframe"
          />
        </div>
      ) : (
        <>
          <div ref={containerRef} className="gold-chart-canvas" />
          {status === 'loading' && <div className="gold-chart-status">{t.loading}</div>}
          {status === 'error' && <div className="gold-chart-status">{t.error}</div>}
        </>
      )}

      {isGold && <GoldSignalPanel />}

      {isAdmin && !isGold && (
        <div className="gc-admin-editor">
          <div className="gc-admin-editor-head">
            <span>🔒 {t.adminEditorTitle}</span>
            <button type="button" className="gc-admin-new-btn" onClick={handleNewIndicator}>
              {t.newBtn}
            </button>
          </div>
          <p className="gc-admin-editor-warning">{t.adminEditorWarning}</p>
          <input
            type="text"
            className="gc-admin-name-input"
            placeholder={t.indicatorNamePlaceholder}
            value={editingName}
            onChange={(e) => {
              setEditingName(e.target.value);
              setCustomSaved(false);
            }}
          />
          <textarea
            className="gc-admin-textarea"
            value={editingCode}
            onChange={(e) => {
              setEditingCode(e.target.value);
              setCustomSaved(false);
            }}
            spellCheck={false}
            rows={8}
          />
          {customError && <div className="gc-admin-error">{customError}</div>}
          <div className="gc-admin-actions">
            <button type="button" className="gc-admin-btn" onClick={handleApplyCustomCode}>
              {t.applyBtn}
            </button>
            <button type="button" className="gc-admin-btn gc-admin-btn-primary" onClick={handleSaveCustomCode} disabled={customSaving}>
              {customSaving ? t.saving : customSaved ? t.saved : t.saveBtn}
            </button>
          </div>
        </div>
      )}

      {contextMenu && (
        <>
          <div
            className="gc-context-overlay"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div className="gc-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button
              type="button"
              className="gc-context-item"
              onClick={() => handleEditIndicator(customIndicators.find((x) => x.id === contextMenu.id))}
            >
              {t.editBtn}
            </button>
            <button
              type="button"
              className="gc-context-item gc-context-danger"
              onClick={() => handleDeleteIndicator(customIndicators.find((x) => x.id === contextMenu.id))}
            >
              {t.deleteBtn}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
