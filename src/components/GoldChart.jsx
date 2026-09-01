import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// PAXG (Paxos Gold) — a token backed 1:1 by physical gold — via Kraken's
// public market-data API. Used as a stand-in for spot XAUUSD because it
// needs no key/signup, allows direct browser calls (CORS-open), and offers
// full historical candles + real-time WebSocket streaming together — no
// free real XAUUSD provider offers that combination without a paid plan.
// It tracks spot gold closely but isn't identical (small basis, and it
// trades 24/7 including when the real gold market is closed) — disclosed to
// the user via t.disclosure below, not presented as literal broker XAUUSD.
//
// Binance offers the same data but geo-blocks entire regions from
// api.binance.com with an HTTP 451 (unrelated to anything in this code) —
// Kraken is US-licensed and doesn't do that, so it's used instead.
const REST_PAIR = 'PAXGUSD';
const WS_SYMBOL = 'PAXG/USD';
const INTERVAL_MINUTES = 15;
const EMA_FAST = 9;
const EMA_SLOW = 21;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

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

export default function GoldChart() {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const t = getStrings(lang).newProduct;
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

  // Chart + data lifecycle — created once per mount, torn down on unmount.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    let cancelled = false;
    let ws = null;

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

    markersApiRef.current = createSeriesMarkers(candleSeries, []);

    // Pushes one bar's OHLC onto the chart, updates the price ticker, and
    // returns a "trial" EMA computed off the last FINALIZED EMA — safe to
    // call repeatedly for the same still-open candle (idempotent, since it
    // never reads its own previous trial output).
    function applyTick(bar) {
      candleSeries.update({ time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
      setPrice((prevPrice) => {
        if (prevPrice != null) setPriceDir(bar.close >= prevPrice ? 'up' : 'down');
        return bar.close;
      });
      const kFast = 2 / (EMA_FAST + 1);
      const kSlow = 2 / (EMA_SLOW + 1);
      const trialFast = emaFastRef.current != null ? bar.close * kFast + emaFastRef.current * (1 - kFast) : null;
      const trialSlow = emaSlowRef.current != null ? bar.close * kSlow + emaSlowRef.current * (1 - kSlow) : null;
      if (trialFast != null) emaFastSeries.update({ time: bar.time, value: trialFast });
      if (trialSlow != null) emaSlowSeries.update({ time: bar.time, value: trialSlow });
      return { trialFast, trialSlow };
    }

    // Commits a closed candle's trial EMA as the new finalized baseline and
    // adds a crossover marker if one just happened.
    function finalizeBar(bar, trialFast, trialSlow) {
      const prevFast = emaFastRef.current;
      const prevSlow = emaSlowRef.current;
      closesRef.current = [...closesRef.current, bar.close];
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
        const res = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${REST_PAIR}&interval=${INTERVAL_MINUTES}`);
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
        const closes = bars.map((b) => b.close);
        const emaFast = computeEma(closes, EMA_FAST);
        const emaSlow = computeEma(closes, EMA_SLOW);

        candleSeries.setData(bars);
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

        closesRef.current = closes;
        emaFastRef.current = emaFast[emaFast.length - 1];
        emaSlowRef.current = emaSlow[emaSlow.length - 1];

        const formingBar = restBarFromOhlc(raw[raw.length - 1]);
        formingTimeRef.current = formingBar.time;
        const { trialFast, trialSlow } = applyTick(formingBar);
        formingRef.current = { bar: formingBar, trialFast, trialSlow };

        chart.timeScale().fitContent();
        setStatus('live');
        connectStream();
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    function connectStream() {
      ws = new WebSocket('wss://ws.kraken.com/v2');
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            method: 'subscribe',
            params: { channel: 'ohlc', symbol: [WS_SYMBOL], interval: INTERVAL_MINUTES },
          })
        );
      };
      ws.onmessage = (event) => {
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
      ws.onerror = () => {
        if (!cancelled) setStatus('error');
      };
    }

    loadHistory();

    return () => {
      cancelled = true;
      if (ws) ws.close();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div className="gold-chart-card">
      <div className="gold-chart-head">
        <div className="gold-chart-legend">
          <span className="gc-dot" style={{ background: 'var(--gold2)' }} />
          {t.emaFastLabel}
          <span className="gc-dot" style={{ background: 'var(--warn)', marginLeft: 14 }} />
          {t.emaSlowLabel}
        </div>
        {price != null && (
          <div className={`gold-chart-price${priceDir ? ` is-${priceDir}` : ''}`}>
            ${price.toFixed(2)}
          </div>
        )}
      </div>
      <div ref={containerRef} className="gold-chart-canvas" />
      {status === 'loading' && <div className="gold-chart-status">{t.loading}</div>}
      {status === 'error' && <div className="gold-chart-status">{t.error}</div>}
      <p className="gold-chart-disclosure">{t.disclosure}</p>
    </div>
  );
}
