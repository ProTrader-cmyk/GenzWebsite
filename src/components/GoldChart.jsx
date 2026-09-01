import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// PAXG (Paxos Gold) — a token backed 1:1 by physical gold, trading on
// Binance. Used as a stand-in for spot XAUUSD because Binance's public
// market-data API needs no key/signup and allows direct browser calls (CORS
// is open) with full historical candles + real-time WebSocket streaming —
// no free real XAUUSD provider offers that combination without a paid plan.
// It tracks spot gold closely but isn't identical (small basis, and it
// trades 24/7 including when the real gold market is closed) — disclosed to
// the user via t.disclosure below, not presented as literal broker XAUUSD.
const SYMBOL = 'paxgusdt';
const INTERVAL = '15m';
const HISTORY_LIMIT = 300;
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

function restBarFromKline(k) {
  // Raw REST kline: [openTime, open, high, low, close, volume, closeTime, ...]
  return {
    time: Math.floor(k[0] / 1000),
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4],
  };
}

function wsBarFromKline(k) {
  // WebSocket kline payload's `k` object.
  return {
    time: Math.floor(k.t / 1000),
    open: +k.o,
    high: +k.h,
    low: +k.l,
    close: +k.c,
    isFinal: k.x,
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

    async function loadHistory() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${SYMBOL.toUpperCase()}&interval=${INTERVAL}&limit=${HISTORY_LIMIT}`
        );
        if (!res.ok) throw new Error(`Binance ${res.status}`);
        const raw = await res.json();
        if (cancelled) return;

        const bars = raw.map(restBarFromKline);
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

        // Crossover markers over the finalized history.
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
        setPrice(closes[closes.length - 1]);
        chart.timeScale().fitContent();
        setStatus('live');
        connectStream();
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    function connectStream() {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL}@kline_${INTERVAL}`);
      ws.onmessage = (event) => {
        if (cancelled) return;
        const msg = JSON.parse(event.data);
        const bar = wsBarFromKline(msg.k);

        candleSeries.update({ time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });

        setPrice((prevPrice) => {
          if (prevPrice != null) setPriceDir(bar.close >= prevPrice ? 'up' : 'down');
          return bar.close;
        });

        // Trial EMA for the still-forming candle, based off the last
        // FINALIZED EMA — deterministic regardless of how many ticks land
        // on this same candle before it closes.
        const kFast = 2 / (EMA_FAST + 1);
        const kSlow = 2 / (EMA_SLOW + 1);
        const trialFast = emaFastRef.current != null ? bar.close * kFast + emaFastRef.current * (1 - kFast) : null;
        const trialSlow = emaSlowRef.current != null ? bar.close * kSlow + emaSlowRef.current * (1 - kSlow) : null;
        if (trialFast != null) emaFastSeries.update({ time: bar.time, value: trialFast });
        if (trialSlow != null) emaSlowSeries.update({ time: bar.time, value: trialSlow });

        if (bar.isFinal) {
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
