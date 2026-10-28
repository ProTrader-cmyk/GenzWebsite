import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, createChart, createSeriesMarkers, CrosshairMode } from 'lightweight-charts';
import { API_BASE_URL } from '../services/marketPriceService.js';

// Live candle chart with the AI setup drawn on it: entry / stop-loss / take-profit lines, shaded
// profit and risk zones, a live P/L tag at the current price and a marker on the signal candle.
// Candles come from the backend (/api/trading/candles). Times are shifted to GMT+7 for display.

const TZ_OFFSET = 7 * 3600;
const TF_SECONDS = 900; // M15, the timeframe the AI trades

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function AiLiveChart({ pair, setup, isLight, onUnavailable }) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const markersRef = useRef(null);
  const linesRef = useRef([]);
  const levelsRef = useRef(null);
  const lastCloseRef = useRef(null);
  const metaRef = useRef({ precision: 2, pipSize: 0.1 });
  const zonesRef = useRef({});
  const [state, setState] = useState({ loading: true, error: null });

  const levels = (() => {
    const entry = num(setup?.entry ?? setup?.entry_price);
    const sl = num(setup?.sl ?? setup?.stop_loss);
    const tp = num(setup?.tp ?? setup?.take_profit);
    if (!entry || !sl || !tp) return null;
    const dir = String(setup?.direction || '').toLowerCase() === 'sell' ? 'sell' : 'buy';
    return { entry, sl, tp, dir, time: Number(setup?.publishedAt || setup?._timeMs || 0) || null, lot: Number(setup?.lotSize || setup?.lot) || 0.03 };
  })();
  levelsRef.current = levels;
  const levelsKey = levels ? `${levels.entry}|${levels.sl}|${levels.tp}|${levels.dir}|${levels.time}` : 'none';

  // ---- create the chart once ----
  useEffect(() => {
    const el = wrapRef.current.querySelector('.ait-ai-chart-canvas');
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#94A3B8', fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(148,163,184,0.08)' }, horzLines: { color: 'rgba(148,163,184,0.08)' } },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.2)', scaleMargins: { top: 0.12, bottom: 0.12 } },
      timeScale: { borderColor: 'rgba(148,163,184,0.2)', timeVisible: true, secondsVisible: false, rightOffset: 14, barSpacing: 9 },
      crosshair: { mode: CrosshairMode.Normal },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E', downColor: '#F87171', borderUpColor: '#22C55E', borderDownColor: '#F87171',
      wickUpColor: '#22C55E', wickDownColor: '#F87171',
      // keep entry / SL / TP inside the visible price range
      autoscaleInfoProvider: (orig) => {
        const r = orig();
        const lv = levelsRef.current;
        if (!r || !lv) return r;
        const lo = Math.min(lv.entry, lv.sl, lv.tp);
        const hi = Math.max(lv.entry, lv.sl, lv.tp);
        const pad = (hi - lo) * 0.08;
        return { ...r, priceRange: { minValue: Math.min(r.priceRange.minValue, lo - pad), maxValue: Math.max(r.priceRange.maxValue, hi + pad) } };
      },
    });
    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    // reposition the zone overlay every frame (cheap: only touches styles that changed)
    let raf = 0;
    const cache = {};
    const setStyle = (node, key, props) => {
      const sig = JSON.stringify(props);
      if (cache[key] === sig || !node) return;
      cache[key] = sig;
      Object.assign(node.style, props);
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const z = zonesRef.current;
      const lv = levelsRef.current;
      const priceScaleW = chart.priceScale('right').width();
      const plotW = Math.max(0, el.clientWidth - priceScaleW);
      const plotH = Math.max(0, el.clientHeight - chart.timeScale().height());
      setStyle(z.root, 'root', { width: `${plotW}px`, height: `${plotH}px` });
      if (!lv) { setStyle(z.root, 'vis', { display: 'none' }); return; }
      const yE = series.priceToCoordinate(lv.entry);
      const yS = series.priceToCoordinate(lv.sl);
      const yT = series.priceToCoordinate(lv.tp);
      if (yE == null || yS == null || yT == null) { setStyle(z.root, 'vis', { display: 'none' }); return; }
      setStyle(z.root, 'vis', { display: 'block' });
      setStyle(z.tp, 'tp', { top: `${Math.min(yE, yT)}px`, height: `${Math.abs(yT - yE)}px` });
      setStyle(z.sl, 'sl', { top: `${Math.min(yE, yS)}px`, height: `${Math.abs(yS - yE)}px` });
      setStyle(z.tpLabel, 'tpl', { top: `${yT}px` });
      setStyle(z.slLabel, 'sll', { top: `${yS}px` });
      setStyle(z.entryLabel, 'enl', { top: `${yE}px` });

      const last = lastCloseRef.current;
      const yL = last != null ? series.priceToCoordinate(last) : null;
      if (yL == null) { setStyle(z.live, 'live', { display: 'none' }); return; }
      const dirSign = lv.dir === 'buy' ? 1 : -1;
      const pts = (last - lv.entry) * dirSign;
      const { pipSize } = metaRef.current;
      const isGold = /^XAU/.test(pair);
      const usd = isGold ? pts * lv.lot * 100 : null;
      if (z.liveText) {
        const txt = `${pts >= 0 ? '+' : ''}${pts.toFixed(2)} pts${isGold ? ` · ${usd >= 0 ? '+' : '-'}$${Math.abs(usd).toFixed(2)}` : ` · ${(pts / pipSize).toFixed(1)} pips`}`;
        if (z.liveText.textContent !== txt) z.liveText.textContent = txt;
      }
      setStyle(z.live, 'live', { display: 'flex', top: `${yL}px` });
      z.live.dataset.pnl = pts >= 0 ? 'up' : 'down';
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
      linesRef.current = [];
    };
  }, [pair]);

  // ---- theme ----
  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor: isLight ? '#475569' : '#94A3B8' },
      grid: { vertLines: { color: isLight ? 'rgba(15,23,42,0.07)' : 'rgba(148,163,184,0.08)' }, horzLines: { color: isLight ? 'rgba(15,23,42,0.07)' : 'rgba(148,163,184,0.08)' } },
    });
  }, [isLight]);

  // ---- candles: initial load + live polling ----
  useEffect(() => {
    let alive = true;
    const toBar = (c) => ({ time: Math.floor(c.time / 1000) + TZ_OFFSET, open: c.open, high: c.high, low: c.low, close: c.close });
    const fetchCandles = async (count) => {
      const res = await fetch(`${API_BASE_URL}/api/trading/candles?pair=${encodeURIComponent(pair)}&tf=M15&count=${count}`, { cache: 'no-cache' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Chart data unavailable (${res.status}).`);
      return json;
    };

    (async () => {
      try {
        const json = await fetchCandles(320);
        if (!alive || !seriesRef.current) return;
        metaRef.current = { precision: json.precision, pipSize: json.pipSize };
        seriesRef.current.applyOptions({ priceFormat: { type: 'price', precision: json.precision, minMove: 1 / 10 ** json.precision } });
        const bars = json.candles.map(toBar);
        seriesRef.current.setData(bars);
        lastCloseRef.current = bars.length ? bars[bars.length - 1].close : null;
        // start zoomed on the most recent ~120 candles, with room on the right for the setup
        chartRef.current?.timeScale().setVisibleLogicalRange({ from: Math.max(0, bars.length - 120), to: bars.length + 14 });
        setState({ loading: false, error: null });
      } catch (err) {
        if (!alive) return;
        setState({ loading: false, error: err.message });
        onUnavailable?.(err.message);
      }
    })();

    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const json = await fetchCandles(3);
        if (!alive || !seriesRef.current) return;
        json.candles.map(toBar).forEach((b) => { seriesRef.current.update(b); lastCloseRef.current = b.close; });
      } catch { /* keep the last picture; the next poll retries */ }
    }, 3000);

    return () => { alive = false; clearInterval(timer); };
  }, [pair]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- entry / SL / TP lines + signal marker ----
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    markersRef.current?.setMarkers([]);
    if (!levels) return;
    const mk = (price, color, title, style) => series.createPriceLine({ price, color, lineWidth: 2, lineStyle: style, axisLabelVisible: true, title });
    linesRef.current = [
      mk(levels.tp, '#22C55E', 'TP', 2),
      mk(levels.entry, '#38BDF8', 'ENTRY', 0),
      mk(levels.sl, '#F87171', 'SL', 2),
    ];
    if (levels.time) {
      const t = Math.floor(levels.time / 1000 / TF_SECONDS) * TF_SECONDS + TZ_OFFSET;
      markersRef.current?.setMarkers([{
        time: t, position: levels.dir === 'buy' ? 'belowBar' : 'aboveBar', shape: levels.dir === 'buy' ? 'arrowUp' : 'arrowDown',
        color: levels.dir === 'buy' ? '#22C55E' : '#F87171', text: `AI ${levels.dir.toUpperCase()}`,
      }]);
    }
  }, [levelsKey, state.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (p) => p.toFixed(metaRef.current.precision);

  return (
    <div className="ait-ai-chart" ref={wrapRef}>
      <div className="ait-ai-chart-canvas" />
      <div className="ait-ai-zones" ref={(n) => { zonesRef.current.root = n; }}>
        <div className="ait-ai-zone tp" ref={(n) => { zonesRef.current.tp = n; }} />
        <div className="ait-ai-zone sl" ref={(n) => { zonesRef.current.sl = n; }} />
        {levels && (
          <>
            <div className="ait-ai-zlabel tp" ref={(n) => { zonesRef.current.tpLabel = n; }}>TAKE PROFIT · {fmt(levels.tp)}</div>
            <div className="ait-ai-zlabel entry" ref={(n) => { zonesRef.current.entryLabel = n; }}>{levels.dir.toUpperCase()} ENTRY · {fmt(levels.entry)}</div>
            <div className="ait-ai-zlabel sl" ref={(n) => { zonesRef.current.slLabel = n; }}>STOP LOSS · {fmt(levels.sl)}</div>
          </>
        )}
        <div className="ait-ai-live" ref={(n) => { zonesRef.current.live = n; }}>
          <i />
          <span ref={(n) => { zonesRef.current.liveText = n; }} />
        </div>
      </div>
      {state.loading && <div className="ait-ai-chart-msg">Loading live candles…</div>}
      {state.error && <div className="ait-ai-chart-msg err">{state.error}</div>}
      {!levels && !state.loading && !state.error && <div className="ait-ai-chart-hint">AI is scanning. Entry, stop-loss and take-profit will appear here when a setup is found.</div>}
    </div>
  );
}
