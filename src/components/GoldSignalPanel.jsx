import { useEffect, useState } from 'react';
import { computeGoldSignal } from '../data/goldSignal.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const REFRESH_MS = 60 * 1000; // Kraken has no rate limit worth worrying about, but a live-updating signal doesn't need faster than this

async function fetchPaxgBars() {
  const res = await fetch('https://api.kraken.com/0/public/OHLC?pair=PAXGUSD&interval=15');
  if (!res.ok) throw new Error(`Kraken ${res.status}`);
  const json = await res.json();
  if (json.error?.length) throw new Error(json.error.join(', '));
  const key = Object.keys(json.result).find((k) => k !== 'last');
  const raw = json.result[key];
  if (!raw?.length) throw new Error('No candles returned');
  return raw.map((row) => ({
    time: row[0],
    open: +row[1],
    high: +row[2],
    low: +row[3],
    close: +row[4],
  }));
}

export default function GoldSignalPanel() {
  const { lang } = useLanguage();
  const t = getStrings(lang).newProduct;
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const bars = await fetchPaxgBars();
        if (cancelled) return;
        setResult(computeGoldSignal(bars));
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const signalClass =
    result?.signal === 'BUY' ? 'is-buy' : result?.signal === 'SELL' ? 'is-sell' : 'is-wait';
  const signalLabel =
    result?.signal === 'BUY' ? t.signalBuy : result?.signal === 'SELL' ? t.signalSell : t.signalWait;

  return (
    <div className="gold-signal-card">
      <div className="gold-signal-title">{t.signalTitle}</div>

      {status === 'loading' && <div className="gold-chart-status">{t.signalLoading}</div>}
      {status === 'error' && <div className="gold-chart-status">{t.error}</div>}

      {status === 'ready' && result && (
        <>
          <div className={`gold-signal-badge ${signalClass}`}>{signalLabel}</div>
          <div className="gold-signal-rows">
            <div className="gold-signal-row">
              <span>EMA 9/21</span>
              <span className={result.trend === 'bullish' ? 'is-up' : result.trend === 'bearish' ? 'is-down' : ''}>
                {result.trend === 'bullish' ? t.signalTrendBullish : result.trend === 'bearish' ? t.signalTrendBearish : '—'}
              </span>
            </div>
            <div className="gold-signal-row">
              <span>{t.signalOrderBlockZone}</span>
              <span>
                {result.orderBlock
                  ? `${result.orderBlock.low.toFixed(2)} – ${result.orderBlock.high.toFixed(2)}`
                  : t.signalNoOrderBlock}
              </span>
            </div>
          </div>
        </>
      )}

      <p className="gold-chart-disclosure">{t.signalDisclosure}</p>
    </div>
  );
}
