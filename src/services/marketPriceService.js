/**
 * Service for fetching real-time market spot prices (Gold, Forex, Crypto)
 * and evaluating automated Take Profit (TP) and Stop Loss (SL) triggers.
 */

const cache = {}; // { [pair]: { price: number, timestamp: number } }
const CACHE_TTL_MS = 2500; // 2.5 seconds cache for real-time tick streaming

/**
 * Normalizes asset pair names (e.g. 'XAU/USD' -> 'XAUUSD')
 */
export function normalizePair(pair = 'XAUUSD') {
  return String(pair).toUpperCase().replace(/[\/\-_]/g, '').trim();
}

/**
 * Fetches real-time price for a given pair.
 * Supports XAUUSD, BTCUSD, EURUSD, GBPUSD, AUDUSD, USDJPY.
 * @param {string} pair
 * @returns {Promise<number|null>}
 */
export async function fetchLivePrice(pair = 'XAUUSD') {
  const norm = normalizePair(pair);
  const now = Date.now();

  // Return cached price if fresh
  if (cache[norm] && now - cache[norm].timestamp < CACHE_TTL_MS) {
    return cache[norm].price;
  }

  try {
    if (norm === 'XAUUSD' || norm === 'GOLD' || norm === 'XAU') {
      const price = await fetchGoldPrice();
      if (price) {
        cache[norm] = { price, timestamp: now };
        return price;
      }
    }

    if (norm === 'BTCUSD' || norm === 'BTC') {
      const price = await fetchBtcPrice();
      if (price) {
        cache[norm] = { price, timestamp: now };
        return price;
      }
    }

    // Forex pairs via open exchange rate API
    const forexPrice = await fetchForexPrice(norm);
    if (forexPrice) {
      cache[norm] = { price: forexPrice, timestamp: now };
      return forexPrice;
    }
  } catch (err) {
    console.warn(`[marketPriceService] Error fetching price for ${norm}:`, err);
  }

  return cache[norm]?.price || null;
}

/**
 * Fetches the official TradingView OANDA quote for Gold and Forex.
 * This guarantees the live spot price matches the OANDA chart on screen 1:1.
 */
async function fetchTradingViewOandaPrice(symbol) {
  // If Gold / Silver, use CFD scanner
  if (symbol === 'OANDA:XAUUSD' || symbol === 'OANDA:XAGUSD') {
    try {
      const res = await fetch('https://scanner.tradingview.com/cfd/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          symbols: { tickers: [symbol] },
          columns: ['close']
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const price = data.data?.[0]?.d?.[0];
        if (typeof price === 'number') {
          return Math.round(price * 100) / 100;
        }
      }
    } catch (err) {
      console.warn(`[marketPriceService] TV CFD quote error for ${symbol}:`, err);
    }
  }

  // If Forex, use Forex scanner
  try {
    const res = await fetch('https://scanner.tradingview.com/forex/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        symbols: { tickers: [symbol] },
        columns: ['close']
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const price = data.data?.[0]?.d?.[0];
      if (typeof price === 'number') {
        return price;
      }
    }
  } catch (err) {
    console.warn(`[marketPriceService] TV Forex quote error for ${symbol}:`, err);
  }

  return null;
}

/**
 * Spot Gold (XAU/USD) fetcher — Primary: Official TradingView OANDA feed
 */
async function fetchGoldPrice() {
  // Primary: Official TradingView OANDA:XAUUSD
  const oandaPrice = await fetchTradingViewOandaPrice('OANDA:XAUUSD');
  if (oandaPrice) return oandaPrice;

  // Secondary: gold-api.com
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number') {
        return Math.round(data.price * 100) / 100;
      }
    }
  } catch {}

  // Fallback: Yahoo Finance COMEX Gold Futures
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-cache',
    });
    if (res.ok) {
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      if (typeof price === 'number') {
        return Math.round(price * 100) / 100;
      }
    }
  } catch {}

  return null;
}

/**
 * Spot Bitcoin (BTC/USD) fetcher
 */
async function fetchBtcPrice() {
  try {
    const res = await fetch('https://api.gold-api.com/price/BTC', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number') {
        return Math.round(data.price * 100) / 100;
      }
    }
  } catch {}
  return null;
}

/**
 * Major Forex Pairs (EURUSD, GBPUSD, AUDUSD, USDJPY)
 */
async function fetchForexPrice(pair) {
  // Primary: Official TradingView OANDA feed
  const oandaPrice = await fetchTradingViewOandaPrice('OANDA:' + pair);
  if (oandaPrice) return oandaPrice;

  // Secondary fallback: open exchange rate
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      const rates = data.rates || {};
      if (pair === 'EURUSD' && rates.EUR) return Math.round((1 / rates.EUR) * 100000) / 100000;
      if (pair === 'GBPUSD' && rates.GBP) return Math.round((1 / rates.GBP) * 100000) / 100000;
      if (pair === 'AUDUSD' && rates.AUD) return Math.round((1 / rates.AUD) * 100000) / 100000;
      if (pair === 'USDJPY' && rates.JPY) return Math.round(rates.JPY * 1000) / 1000;
    }
  } catch {}
  return null;
}

/**
 * Evaluates whether an active signal has crossed its Take Profit or Stop Loss level.
 * @param {Object} signal
 * @param {number} currentPrice
 * @returns {'tp' | 'sl' | 'active'}
 */
export function evaluateSignalOutcome(signal, currentPrice) {
  if (!signal || !currentPrice || signal.status !== 'active') {
    return signal?.status || 'active';
  }

  const isBuy = String(signal.direction).toLowerCase() === 'buy';
  const isSell = String(signal.direction).toLowerCase() === 'sell';
  const tp = parseFloat(signal.tp);
  const sl = parseFloat(signal.sl);

  if (!tp || !sl) return 'active';

  if (isBuy) {
    if (currentPrice >= tp) return 'tp';
    if (currentPrice <= sl) return 'sl';
  } else if (isSell) {
    if (currentPrice <= tp) return 'tp';
    if (currentPrice >= sl) return 'sl';
  }

  return 'active';
}

/**
 * Computes trade progress percentage towards TP and remaining distance.
 * @param {Object} signal
 * @param {number} currentPrice
 * @returns {{ progressPct: number, pipsToTp: number, inProfit: boolean }}
 */
export function calcTradeProgress(signal, currentPrice) {
  if (!signal || !currentPrice) {
    return { progressPct: 0, pipsToTp: 0, inProfit: false };
  }

  const isBuy = String(signal.direction).toLowerCase() === 'buy';
  const entry = parseFloat(signal.entry);
  const tp = parseFloat(signal.tp);
  const isGold = normalizePair(signal.pair) === 'XAUUSD';
  const pipMultiplier = isGold ? 10 : 10000;

  if (!entry || !tp) {
    return { progressPct: 0, pipsToTp: 0, inProfit: false };
  }

  let progress = 0;
  let pipsToTp = 0;
  let inProfit = false;

  if (isBuy) {
    pipsToTp = Math.max(0, (tp - currentPrice) * pipMultiplier);
    inProfit = currentPrice >= entry;
    const totalDist = tp - entry;
    if (totalDist > 0) {
      progress = ((currentPrice - entry) / totalDist) * 100;
    }
  } else {
    pipsToTp = Math.max(0, (currentPrice - tp) * pipMultiplier);
    inProfit = currentPrice <= entry;
    const totalDist = entry - tp;
    if (totalDist > 0) {
      progress = ((entry - currentPrice) / totalDist) * 100;
    }
  }

  const clampedProgress = Math.round(Math.min(100, Math.max(0, progress)));
  const roundedPips = Math.round(pipsToTp * 10) / 10;

  return {
    progressPct: clampedProgress,
    pipsToTp: roundedPips,
    inProfit,
  };
}
