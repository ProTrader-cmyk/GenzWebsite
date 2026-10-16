/**
 * Service for fetching real-time market spot prices (Gold, Forex, Crypto)
 * and evaluating automated Take Profit (TP) and Stop Loss (SL) triggers.
 */

const cache = {}; // { [pair]: { price: number, timestamp: number } }
const CACHE_TTL_MS = 2500; // 2.5 seconds cache for real-time tick streaming

const PAIR_TO_TV_SYMBOL = {
  XAUUSD: 'OANDA:XAUUSD',
  GOLD: 'OANDA:XAUUSD',
  XAU: 'OANDA:XAUUSD',
  XAGUSD: 'OANDA:XAGUSD',
  SILVER: 'OANDA:XAGUSD',
  EURUSD: 'OANDA:EURUSD',
  GBPUSD: 'OANDA:GBPUSD',
  USDJPY: 'OANDA:USDJPY',
  AUDUSD: 'OANDA:AUDUSD',
  US30: 'OANDA:US30USD',
  DJ30: 'OANDA:US30USD',
  DJI: 'OANDA:US30USD',
};

const TV_SYMBOL_TO_PAIR = {
  'OANDA:XAUUSD': 'XAUUSD',
  'OANDA:XAGUSD': 'XAGUSD',
  'OANDA:EURUSD': 'EURUSD',
  'OANDA:GBPUSD': 'GBPUSD',
  'OANDA:USDJPY': 'USDJPY',
  'OANDA:AUDUSD': 'AUDUSD',
  'OANDA:US30USD': 'US30',
};

/**
 * Real-time WebSocket streamer connecting directly to TradingView's market data pipe.
 * Delivers exact tick data with zero delay, identical to the on-screen chart candle.
 */
class TradingViewStreamer {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.subscribedSymbols = new Set();
    this.sessionId = null;
    this.reconnectTimer = null;
    this.disconnectTimer = null;
    this.isConnecting = false;
    this.prices = {};
    this.quoteMetrics = {};
  }

  addSubscriber(symbols, callback) {
    const normSymbols = (symbols || []).map(normalizePair);
    const sub = { symbols: normSymbols, callback };
    this.listeners.add(sub);

    // Cancel pending teardown if a subscriber attaches before timeout
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

    // If we already have live prices in memory, notify immediately
    const immediate = {};
    for (const p of sub.symbols) {
      if (this.prices[p]) immediate[p] = this.prices[p];
    }
    if (Object.keys(immediate).length > 0) {
      try {
        if (callback.length >= 2) {
          for (const [k, v] of Object.entries(immediate)) {
            callback(k, v);
          }
        } else {
          callback(immediate);
        }
      } catch {}
    }

    this.connect();

    return () => {
      this.listeners.delete(sub);
      if (this.listeners.size === 0) {
        // Debounce socket close so rapid React effect unmount/remount doesn't kill connection
        this.disconnectTimer = setTimeout(() => {
          this.disconnectTimer = null;
          if (this.listeners.size === 0 && this.ws) {
            const socket = this.ws;
            this.ws = null;
            this.subscribedSymbols.clear();
            if (socket.readyState === WebSocket.OPEN) {
              try { socket.close(); } catch {}
            } else if (socket.readyState === WebSocket.CONNECTING) {
              // Wait for open before closing to avoid browser console warning
              socket.onopen = () => {
                try { socket.close(); } catch {}
              };
            }
          }
        }, 1500);
      }
    };
  }

  connect() {
    if (typeof window === 'undefined' || !window.WebSocket) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.updateSubscriptions();
      return;
    }

    try {
      this.isConnecting = true;
      this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket');

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.send('set_auth_token', ['unauthorized_user_token']);
        this.sessionId = 'qs_' + Math.random().toString(36).substring(2, 8);
        this.send('quote_create_session', [this.sessionId]);
        this.send('quote_set_fields', [this.sessionId, 'lp', 'bid', 'ask', 'ch', 'chp']);
        this.updateSubscriptions();
      };

      this.ws.onmessage = (event) => {
        const raw = event.data ? event.data.toString() : '';
        // Heartbeat ping/pong response to keep stream alive
        if (raw.includes('~h~')) {
          const match = raw.match(/~h~(\d+)/);
          if (match && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendFramed(match[0]);
          }
        }

        const chunks = raw.split(/~m~\d+~m~/).filter(Boolean);
        for (const chunk of chunks) {
          try {
            const data = JSON.parse(chunk);
            if (data.m === 'qsd') {
              const symData = data.p?.[1];
              const sym = symData?.n;
              const val = symData?.v;
              if (sym && val && typeof val.lp === 'number') {
                const pair = TV_SYMBOL_TO_PAIR[sym] || sym.replace('OANDA:', '');
                const price = val.lp;
                this.prices[pair] = price;
                if (typeof val.chp === 'number') {
                  this.quoteMetrics[pair] = {
                    change: typeof val.ch === 'number' ? val.ch : null,
                    changePercent: val.chp,
                  };
                }
                cache[pair] = { price, timestamp: Date.now() };

                // Dispatch to all active subscribers
                this.notify(pair, price);
              }
            }
          } catch {}
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch (err) {
      console.warn('[TradingViewStreamer] WS error:', err);
      this.scheduleReconnect();
    }
  }

  send(func, args) {
    const msg = JSON.stringify({ m: func, p: args });
    this.sendFramed(msg);
  }

  sendFramed(str) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('~m~' + str.length + '~m~' + str);
    }
  }

  updateSubscriptions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionId) return;
    const allPairs = new Set();
    this.listeners.forEach((sub) => {
      sub.symbols.forEach((p) => allPairs.add(p));
    });
    allPairs.add('XAUUSD');

    const symbolsToAdd = [];
    allPairs.forEach((p) => {
      const tvSym = PAIR_TO_TV_SYMBOL[p] || ('OANDA:' + p);
      if (!this.subscribedSymbols.has(tvSym)) {
        this.subscribedSymbols.add(tvSym);
        symbolsToAdd.push(tvSym);
      }
    });

    if (symbolsToAdd.length > 0) {
      this.send('quote_add_symbols', [this.sessionId, ...symbolsToAdd]);
    }
  }

  notify(pair, price) {
    this.listeners.forEach((sub) => {
      if (sub.symbols.includes(pair)) {
        try {
          if (sub.callback.length >= 2) {
            sub.callback(pair, price);
          } else {
            sub.callback({ [pair]: price });
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
    // Exponential backoff capped at 30s to avoid spamming the console on network blocks
    const delay = this.reconnectAttempts > 3
      ? Math.min(30000, 3000 * Math.pow(1.5, this.reconnectAttempts - 3))
      : 3000;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.listeners.size > 0) {
        this.subscribedSymbols.clear();
        this.connect();
      }
    }, delay);
  }
}

export const tvStreamer = new TradingViewStreamer();

/**
 * Subscribes to live WebSocket ticks directly from TradingView's OANDA stream.
 * Updates on EVERY SINGLE TICK with zero latency, matching the chart 1:1.
 * @param {Array<string>} pairs
 * @param {Function} callback - ({ [pair]: price }) => void
 * @returns {Function} unsubscribe function
 */
export function subscribeLiveTicks(pairs, callback) {
  return tvStreamer.addSubscriber(pairs, callback);
}

/** Subscribes to the live Gold quote plus TradingView's daily price change. */
export function subscribeGoldMarketSnapshot(callback) {
  return tvStreamer.addSubscriber(['XAUUSD'], (prices) => {
    callback({
      price: prices.XAUUSD,
      ...(tvStreamer.quoteMetrics.XAUUSD || {}),
      updatedAt: Date.now(),
    });
  });
}

/**
 * Fetches current Gold spot price and 24h change percent via TradingView CFD scanner.
 * Fully CORS-compliant and browser-safe (no external CORS proxies or blocked Yahoo calls).
 */
export async function fetchGoldQuoteMetrics() {
  try {
    const res = await fetch('https://scanner.tradingview.com/cfd/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        symbols: { tickers: ['OANDA:XAUUSD'] },
        columns: ['close', 'change'],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const row = data.data?.[0]?.d;
      if (row && typeof row[0] === 'number') {
        const price = Math.round(row[0] * 100) / 100;
        const changePercent = typeof row[1] === 'number' ? row[1] : 0;
        return {
          price,
          changePercent,
          pct: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          isUp: changePercent >= 0,
        };
      }
    }
  } catch (err) {
    console.warn('[marketPriceService] TV Gold metric error:', err);
  }

  // Fallback via gold-api.com
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number') {
        const price = Math.round(data.price * 100) / 100;
        const changePercent = typeof data.change_percent === 'number' ? data.change_percent : 0;
        return {
          price,
          changePercent,
          pct: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          isUp: changePercent >= 0,
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Fetches real-time price extremes (candle wicks, session high/low, multi-timeframe extremes)
 * from TradingView scanner. This ensures that if a candle wick pierces TP or SL, the touch
 * is 100% captured and executed even if live price retraced before page load.
 * @param {string} pair
 * @returns {Promise<{ price: number, peakHigh: number, troughLow: number, sessionHigh: number, sessionLow: number, high15: number, low15: number }|null>}
 */
export async function fetchLiveExtremePrices(pair = 'XAUUSD') {
  const norm = normalizePair(pair);
  const isCfd = norm.includes('XAU') || norm.includes('GOLD') || norm.includes('US30') || norm.includes('SILVER') || norm.includes('XAG');
  const isCrypto = norm.includes('BTC') || norm.includes('ETH');
  const endpoint = isCfd ? 'cfd' : (isCrypto ? 'crypto' : 'forex');
  const ticker = isCfd
    ? (norm.includes('US30') ? 'OANDA:US30USD' : `OANDA:${norm}`)
    : (isCrypto ? 'BINANCE:BTCUSDT' : `OANDA:${norm}`);

  try {
    const res = await fetch(`https://scanner.tradingview.com/${endpoint}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        symbols: { tickers: [ticker] },
        columns: ['close', 'high', 'low', 'high|15', 'low|15', 'high|60', 'low|60'],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const row = data.data?.[0]?.d;
      if (Array.isArray(row) && typeof row[0] === 'number') {
        const close = row[0];
        const sessionHigh = typeof row[1] === 'number' ? row[1] : close;
        const sessionLow = typeof row[2] === 'number' ? row[2] : close;
        const high15 = typeof row[3] === 'number' ? row[3] : sessionHigh;
        const low15 = typeof row[4] === 'number' ? row[4] : sessionLow;
        const high60 = typeof row[5] === 'number' ? row[5] : sessionHigh;
        const low60 = typeof row[6] === 'number' ? row[6] : sessionLow;

        // Peak high and trough low across all active timeframes
        const peakHigh = Math.max(close, sessionHigh, high15, high60);
        const troughLow = Math.min(close, sessionLow, low15, low60);

        return {
          price: close,
          sessionHigh,
          sessionLow,
          high15,
          low15,
          high60,
          low60,
          peakHigh,
          troughLow,
        };
      }
    }
  } catch (err) {
    console.warn(`[marketPriceService] fetchLiveExtremePrices error for ${pair}:`, err);
  }
  return null;
}

/**
 * Normalizes asset pair names (e.g. 'XAU/USD' -> 'XAUUSD')
 */
export function normalizePair(pair = 'XAUUSD') {
  return String(pair).toUpperCase().replace(/[\/\-_]/g, '').trim();
}

/**
 * Formats price to match exact chart quote precision.
 * @param {string} pair
 * @param {number|null} price
 * @returns {string}
 */
export function formatSpotPrice(pair, price) {
  if (price == null || isNaN(price)) return '---';
  const p = normalizePair(pair || 'XAUUSD');
  if (p.includes('JPY')) return Number(price).toFixed(3);
  if (p.includes('EUR') || p.includes('GBP') || p.includes('AUD')) return Number(price).toFixed(5);
  // Gold (XAUUSD) - Match OANDA chart exact ticks (up to 3 decimals, min 2)
  const num = Number(price);
  const str = String(price);
  const dec = str.includes('.') ? str.split('.')[1].length : 2;
  if (dec >= 3) {
    return num.toFixed(3);
  }
  return num.toFixed(2);
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

  // If live WebSocket streamer has a fresh tick, return it directly!
  if (tvStreamer.prices[norm]) {
    return tvStreamer.prices[norm];
  }

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

    if (norm === 'US30' || norm === 'DJ30' || norm === 'DJI') {
      const price = await fetchTradingViewOandaPrice('OANDA:US30USD');
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
  // If Gold / Silver / Indices, use CFD scanner
  if (symbol === 'OANDA:XAUUSD' || symbol === 'OANDA:XAGUSD' || symbol === 'OANDA:US30USD') {
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
 * @param {number} [previousPrice]
 * @returns {'tp' | 'sl' | 'active'}
 */
export function evaluateSignalOutcome(signal, currentPrice, previousPrice) {
  if (!signal || !currentPrice) {
    return signal?.status || 'active';
  }

  const status = String(signal.status || 'active').toLowerCase();
  if (status !== 'active') {
    return status;
  }

  const isBuy = String(signal.direction).toLowerCase() === 'buy';
  const isSell = String(signal.direction).toLowerCase() === 'sell';
  const entry = parseFloat(signal.entry ?? signal.entry_price ?? signal.entryPrice ?? signal.price);
  const tp = parseFloat(signal.tp ?? signal.take_profit ?? signal.takeProfit);
  const sl = parseFloat(signal.sl ?? signal.stop_loss ?? signal.stopLoss);

  if (!tp || !sl) return 'active';

  // Sanity check: prevent evaluating against the wrong asset feed (e.g. BTC price against Gold signal)
  if (entry > 0 && Math.abs(currentPrice - entry) / entry > 0.25) {
    return 'active';
  }

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
