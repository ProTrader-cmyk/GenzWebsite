import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Real-time gold-token data (Kraken PAXG/USD, free & unlimited) — the only
// data our OWN code can compute against, since custom code can't be
// injected into the TradingView widget above (that's TradingView's own
// iframe, they don't expose that). No persistence: whatever you write here
// runs live in your own browser and resets on reload — this is a scratchpad
// for trying out indicator logic, not a saved-indicator system.
const RESTPAIR = 'PAXGUSD';
const WSSYMBOL = 'PAXG/USD';
const INTERVAL_MINUTES = 15;

const CODE_TEMPLATE = `// bars: array of { time, open, high, low, close }, oldest -> newest
//
// Return an object describing what to draw:
//   lines:   { name: { points: [{ time, value }], color?, lineWidth? }, ... }
//   markers: [{ time, position: 'aboveBar'|'belowBar', color, shape: 'arrowUp'|'arrowDown'|'circle'|'square', text }]
//   boxes:   [{ time1, time2, price1, price2, color?, borderColor? }]  — rectangular zones
//
// (A plain array of { time, value } also works, as a single line.)

return {
  lines: {
    midline: { points: bars.map((b) => ({ time: b.time, value: (b.high + b.low) / 2 })) },
  },
  markers: [],
  boxes: [],
};`;

const PALETTE = ['--dn', '--gold2', '--warn', '--up'];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function restBarFromOhlc(row) {
  return { time: row[0], open: +row[1], high: +row[2], low: +row[3], close: +row[4] };
}

function wsBarFromOhlc(d) {
  return {
    time: Math.floor(new Date(d.interval_begin).getTime() / 1000),
    open: +d.open,
    high: +d.high,
    low: +d.low,
    close: +d.close,
  };
}

// Draws rectangular zones (order blocks, FVGs, etc.) — lightweight-charts
// has no built-in "box" series, so this uses its Primitives API to paint
// directly on the canvas, following the chart's own pan/zoom automatically.
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

export default function CustomIndicatorChart() {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const t = getStrings(lang).customIndicator;
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const markersApiRef = useRef(null);
  const barsRef = useRef([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'live' | 'error'
  const [code, setCode] = useState(CODE_TEMPLATE);
  const [error, setError] = useState(null);
  const applyRef = useRef(() => {});

  useEffect(() => {
    if (!containerRef.current) return undefined;
    setStatus('loading');
    let cancelled = false;
    let ohlcWs = null;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: cssVar('--bg1') }, textColor: cssVar('--text') },
      grid: { vertLines: { color: cssVar('--faint') }, horzLines: { color: cssVar('--faint') } },
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
    markersApiRef.current = createSeriesMarkers(candleSeries, []);

    const lineSeries = new Map(); // name -> LineSeries
    const boxPrimitive = new BoxPrimitive();
    candleSeries.attachPrimitive(boxPrimitive);

    function runCode(rawCode, bars) {
      if (!rawCode || !rawCode.trim()) return { result: {}, error: null };
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('bars', rawCode);
        const raw = fn(bars);
        if (Array.isArray(raw)) return { result: { lines: { custom: { points: raw } } }, error: null };
        if (raw && typeof raw === 'object') return { result: raw, error: null };
        throw new Error('Code must return an object like { lines, markers, boxes } (or a plain array of points for a single line).');
      } catch (err) {
        return { result: {}, error: err.message || String(err) };
      }
    }

    function applyCode() {
      const { result, error: err } = runCode(code, barsRef.current);
      setError(err);

      const seen = new Set();
      const lines = result.lines && typeof result.lines === 'object' ? result.lines : {};
      Object.keys(lines).forEach((name, i) => {
        const spec = lines[name] || {};
        const points = Array.isArray(spec.points) ? spec.points : Array.isArray(spec) ? spec : [];
        const color = spec.color || cssVar(PALETTE[i % PALETTE.length]);
        seen.add(name);
        let series = lineSeries.get(name);
        if (!series) {
          series = chart.addSeries(LineSeries, {
            color,
            lineWidth: spec.lineWidth || 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          lineSeries.set(name, series);
        } else {
          series.applyOptions({ color, lineWidth: spec.lineWidth || 2 });
        }
        series.setData(points);
      });
      for (const [name, series] of lineSeries) {
        if (!seen.has(name)) {
          chart.removeSeries(series);
          lineSeries.delete(name);
        }
      }

      markersApiRef.current.setMarkers(Array.isArray(result.markers) ? result.markers : []);
      boxPrimitive.setBoxes(
        Array.isArray(result.boxes)
          ? result.boxes.map((b) => ({
              ...b,
              color: b.color || 'rgba(224,177,85,0.18)',
              borderColor: b.borderColor || cssVar('--warn'),
            }))
          : []
      );
    }
    applyRef.current = applyCode;

    async function loadHistory() {
      try {
        const res = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${RESTPAIR}&interval=${INTERVAL_MINUTES}`);
        if (!res.ok) throw new Error(`Kraken ${res.status}`);
        const json = await res.json();
        if (json.error?.length) throw new Error(json.error.join(', '));
        if (cancelled) return;

        const key = Object.keys(json.result).find((k) => k !== 'last');
        const raw = json.result[key];
        if (!raw?.length) throw new Error('No candles returned');

        const bars = raw.map(restBarFromOhlc);
        candleSeries.setData(bars);
        barsRef.current = bars;
        chart.timeScale().fitContent();
        applyCode();
        setStatus('live');
        connectOhlcStream();
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    function connectOhlcStream() {
      ohlcWs = new WebSocket('wss://ws.kraken.com/v2');
      ohlcWs.onopen = () => {
        ohlcWs.send(
          JSON.stringify({ method: 'subscribe', params: { channel: 'ohlc', symbol: [WSSYMBOL], interval: INTERVAL_MINUTES } })
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
        if (msg.channel !== 'ohlc' || msg.type !== 'update' || !Array.isArray(msg.data)) return;
        for (const d of msg.data) {
          const bar = wsBarFromOhlc(d);
          const bars = barsRef.current;
          if (bars.length && bars[bars.length - 1].time === bar.time) {
            bars[bars.length - 1] = bar;
          } else {
            barsRef.current = [...bars, bar];
          }
          candleSeries.update(bar);
          applyCode();
        }
      };
      ohlcWs.onerror = () => {
        if (!cancelled) setStatus('error');
      };
    }

    loadHistory();

    return () => {
      cancelled = true;
      if (ohlcWs) ohlcWs.close();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-theme in place when the site's light/dark toggle changes.
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
  }, [theme]);

  return (
    <div className="gold-chart-card">
      <div className="gc-custom-head">
        <span>{t.title}</span>
      </div>
      <p className="gc-custom-sub">{t.subtitle}</p>
      <div className="gold-chart-canvas" ref={containerRef} />
      {status === 'loading' && <div className="gold-chart-status">{t.loading}</div>}
      {status === 'error' && <div className="gold-chart-status">{t.error}</div>}

      <textarea
        className="gc-admin-textarea"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={8}
      />
      {error && <div className="gc-admin-error">{error}</div>}
      <div className="gc-admin-actions">
        <button type="button" className="gc-admin-btn gc-admin-btn-primary" onClick={() => applyRef.current()}>
          {t.applyBtn}
        </button>
      </div>
      <p className="gold-chart-disclosure">{t.disclosure}</p>
    </div>
  );
}
