/**
 * Market Price Service
 * Strictly supports real-time market data for the 3 authorized trading pairs:
 * 1. Gold (XAU/USD)
 * 2. Silver (XAG/USD)
 * 3. Bitcoin (BTC/USD)
 * 
 * Connects directly to legitimate market data providers:
 * - TradingView OANDA / TVC scanner & real-time WebSocket
 * - Binance Official Public Price API (Zero auth, sub-second latency)
 * - Gold-API Spot Reference
 * - GenZTrader Backend Market API
 */

export const SUPPORTED_PAIRS = ['XAUUSD', 'XAGUSD', 'BTCUSD'];

// Cache structure: { [pair]: { price: number, timestamp: number, source: string, isAvailable: boolean } }
const cache = {};
const CACHE_TTL_MS = 2000; // 2 seconds cache for streaming tick freshness

export const PAIR_TO_TV_SYMBOL = {
  XAUUSD: 'OANDA:XAUUSD',
  GOLD: 'OANDA:XAUUSD',
  XAU: 'OANDA:XAUUSD',
  XAGUSD: 'OANDA:XAGUSD',
  SILVER: 'OANDA:XAGUSD',
  XAG: 'OANDA:XAGUSD',
  BTCUSD: 'BINANCE:BTCUSDT',
  BTC: 'BINANCE:BTCUSDT',
};

export const TV_SYMBOL_TO_PAIR = {
  'OANDA:XAUUSD': 'XAUUSD',
  'OANDA:XAGUSD': 'XAGUSD',
  'TVC:SILVER': 'XAGUSD',
  'BINANCE:BTCUSDT': 'BTCUSD',
};

/**
 * Normalizes asset pair names (e.g. 'XAU/USD' -> 'XAUUSD')
 */
export function normalizePair(pair = 'XAUUSD') {
  if (!pair) return 'XAUUSD';
  const clean = String(pair).toUpperCase().replace(/[\/\-_]/g, '').trim();
  if (clean === 'GOLD' || clean === 'XAU') return 'XAUUSD';
  if (clean === 'SILVER' || clean === 'XAG') return 'XAGUSD';
  if (clean === 'BTC' || clean === 'BITCOIN' || clean === 'BTCUSDT') return 'BTCUSD';
  return clean;
}

/**
 * Returns true only if the pair is one of the three supported assets.
 */
export function isSupportedPair(pair) {
  const norm = normalizePair(pair);
  return SUPPORTED_PAIRS.includes(norm);
}

/**
 * Formats price to match exact asset quote precision:
 * - Gold: 2 decimals ($4,165.42)
 * - Silver: 3 decimals ($56.965)
 * - Bitcoin: 1-2 decimals ($81,646.50)
 */
export function formatSpotPrice(pair, price) {
  if (price == null || isNaN(price) || price === '') return '---';
  const p = normalizePair(pair || 'XAUUSD');
  const num = Number(price);
  if (p === 'XAGUSD') {
    return num.toFixed(3);
  }
  if (p === 'BTCUSD') {
    return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }
  // Gold (XAUUSD)
  return num.toFixed(2);
}

/**
 * Returns latest cached price metadata for UI display.
 */
export function getLivePriceMeta(pair) {
  const norm = normalizePair(pair);
  const entry = cache[norm];
  if (!entry || !entry.price) {
    return {
      price: null,
      timestamp: null,
      source: 'Connecting...',
      isAvailable: false,
      isStale: true,
    };
  }
  const ageMs = Date.now() - entry.timestamp;
  const isStale = ageMs > 60000; // Older than 60 seconds is considered stale
  return {
    price: entry.price,
    timestamp: entry.timestamp,
    source: entry.source || 'Live Market Feed',
    isAvailable: !isStale && entry.isAvailable !== false,
    isStale,
  };
}

/**
 * Real-time WebSocket streamer connecting to TradingView's OANDA and Binance data pipes.
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
    this.sources = {};
    this.quoteMetrics = {};
  }

  addSubscriber(symbols, callback) {
    const normSymbols = (symbols || []).map(normalizePair).filter(isSupportedPair);
    const sub = { symbols: normSymbols, callback };
    this.listeners.add(sub);

    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

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
        this.disconnectTimer = setTimeout(() => {
          this.disconnectTimer = null;
          if (this.listeners.size === 0 && this.ws) {
            const socket = this.ws;
            this.ws = null;
            this.subscribedSymbols.clear();
            if (socket.readyState === WebSocket.OPEN) {
              try { socket.close(); } catch {}
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
                const pair = TV_SYMBOL_TO_PAIR[sym] || (sym.includes('BTC') ? 'BTCUSD' : sym.includes('XAG') ? 'XAGUSD' : 'XAUUSD');
                if (!isSupportedPair(pair)) return;

                const price = val.lp;
                this.prices[pair] = price;
                this.sources[pair] = sym.includes('BINANCE') ? 'Binance / TradingView' : 'OANDA / TradingView';
                if (typeof val.chp === 'number') {
                  this.quoteMetrics[pair] = {
                    change: typeof val.ch === 'number' ? val.ch : null,
                    changePercent: val.chp,
                  };
                }
                cache[pair] = {
                  price,
                  timestamp: Date.now(),
                  source: this.sources[pair],
                  isAvailable: true,
                };

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
      sub.symbols.forEach((p) => {
        if (isSupportedPair(p)) allPairs.add(p);
      });
    });
    // Default ensure Gold is subscribed
    allPairs.add('XAUUSD');

    const symbolsToAdd = [];
    allPairs.forEach((p) => {
      const tvSym = PAIR_TO_TV_SYMBOL[p];
      if (tvSym && !this.subscribedSymbols.has(tvSym)) {
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
 * Subscribes to live WebSocket ticks for the supported pairs.
 */
export function subscribeLiveTicks(pairs, callback) {
  const filtered = (pairs || []).map(normalizePair).filter(isSupportedPair);
  return tvStreamer.addSubscriber(filtered, callback);
}

/**
 * Subscribes to the live Gold quote plus 24h change.
 */
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
        cache.XAUUSD = {
          price,
          timestamp: Date.now(),
          source: 'OANDA / TradingView',
          isAvailable: true,
        };
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
        cache.XAUUSD = {
          price,
          timestamp: Date.now(),
          source: 'Gold-API Spot Feed',
          isAvailable: true,
        };
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
 * Fetches real-time price extremes (candle wicks, session high/low) from TradingView scanner.
 */
export async function fetchLiveExtremePrices(pair = 'XAUUSD') {
  const norm = normalizePair(pair);
  if (!isSupportedPair(norm)) return null;

  const isCfd = norm === 'XAUUSD' || norm === 'XAGUSD';
  const endpoint = isCfd ? 'cfd' : 'crypto';
  const ticker = norm === 'XAUUSD'
    ? 'OANDA:XAUUSD'
    : norm === 'XAGUSD'
      ? 'TVC:SILVER'
      : 'BINANCE:BTCUSDT';

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
 * Fetches real-time price for the requested pair from legitimate providers.
 * Strictly supports XAUUSD, XAGUSD, BTCUSD.
 * @param {string} pair
 * @returns {Promise<number|null>}
 */
export async function fetchLivePrice(pair = 'XAUUSD') {
  const norm = normalizePair(pair);
  if (!isSupportedPair(norm)) {
    console.warn(`[marketPriceService] Pair ${pair} rejected. Only XAUUSD, XAGUSD, and BTCUSD are supported.`);
    return null;
  }

  const now = Date.now();

  // If live WebSocket streamer has a fresh tick, return it directly
  if (tvStreamer.prices[norm]) {
    cache[norm] = {
      price: tvStreamer.prices[norm],
      timestamp: now,
      source: tvStreamer.sources[norm] || 'TradingView Real-time Stream',
      isAvailable: true,
    };
    return tvStreamer.prices[norm];
  }

  // Return cached price if within TTL
  if (cache[norm] && now - cache[norm].timestamp < CACHE_TTL_MS) {
    return cache[norm].price;
  }

  try {
    if (norm === 'XAUUSD') {
      const price = await fetchGoldPrice();
      if (price) return price;
    } else if (norm === 'XAGUSD') {
      const price = await fetchSilverPrice();
      if (price) return price;
    } else if (norm === 'BTCUSD') {
      const price = await fetchBtcPrice();
      if (price) return price;
    }
  } catch (err) {
    console.warn(`[marketPriceService] Error fetching live price for ${norm}:`, err);
  }

  return cache[norm]?.price || null;
}

/**
 * Gold (XAU/USD) Real Spot Price Fetcher
 */
export async function fetchGoldPrice() {
  const now = Date.now();

  // Primary: TradingView OANDA CFD Scanner
  try {
    const res = await fetch('https://scanner.tradingview.com/cfd/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        symbols: { tickers: ['OANDA:XAUUSD'] },
        columns: ['close'],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const p = data.data?.[0]?.d?.[0];
      if (typeof p === 'number' && p > 1000 && p < 10000) {
        const price = Math.round(p * 100) / 100;
        cache.XAUUSD = { price, timestamp: now, source: 'OANDA / TradingView', isAvailable: true };
        return price;
      }
    }
  } catch {}

  // Secondary: Gold-API
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number' && data.price > 1000) {
        const price = Math.round(data.price * 100) / 100;
        cache.XAUUSD = { price, timestamp: now, source: 'Gold-API Spot Feed', isAvailable: true };
        return price;
      }
    }
  } catch {}

  return cache.XAUUSD?.price || null;
}

/**
 * Silver (XAG/USD) Real Spot Price Fetcher
 */
export async function fetchSilverPrice() {
  const now = Date.now();

  // Primary: TradingView TVC / OANDA CFD Scanner
  try {
    const res = await fetch('https://scanner.tradingview.com/cfd/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        symbols: { tickers: ['TVC:SILVER', 'OANDA:XAGUSD'] },
        columns: ['close'],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const rows = data.data || [];
      const validRow = rows.find((r) => typeof r?.d?.[0] === 'number' && r.d[0] > 10 && r.d[0] < 150);
      if (validRow) {
        const price = Math.round(validRow.d[0] * 1000) / 1000;
        cache.XAGUSD = { price, timestamp: now, source: 'TradingView Spot Silver', isAvailable: true };
        return price;
      }
    }
  } catch {}

  // Secondary: Gold-API Silver
  try {
    const res = await fetch('https://api.gold-api.com/price/XAG', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number' && data.price > 10 && data.price < 150) {
        const price = Math.round(data.price * 1000) / 1000;
        cache.XAGUSD = { price, timestamp: now, source: 'Gold-API Silver Feed', isAvailable: true };
        return price;
      }
    }
  } catch {}

  return cache.XAGUSD?.price || null;
}

/**
 * Bitcoin (BTC/USD) Real Spot Price Fetcher
 */
export async function fetchBtcPrice() {
  const now = Date.now();

  // Primary: Binance Official Public Ticker API (Reliable, fast, zero auth required)
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    if (res.ok) {
      const data = await res.json();
      const num = parseFloat(data.price);
      if (!isNaN(num) && num > 10000) {
        const price = Math.round(num * 10) / 10;
        cache.BTCUSD = { price, timestamp: now, source: 'Binance Live Spot', isAvailable: true };
        return price;
      }
    }
  } catch {}

  // Secondary: TradingView Crypto Scanner
  try {
    const res = await fetch('https://scanner.tradingview.com/crypto/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        symbols: { tickers: ['BINANCE:BTCUSDT'] },
        columns: ['close'],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const p = data.data?.[0]?.d?.[0];
      if (typeof p === 'number' && p > 10000) {
        const price = Math.round(p * 10) / 10;
        cache.BTCUSD = { price, timestamp: now, source: 'Binance / TradingView', isAvailable: true };
        return price;
      }
    }
  } catch {}

  // Tertiary: Gold-API BTC
  try {
    const res = await fetch('https://api.gold-api.com/price/BTC', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number' && data.price > 10000) {
        const price = Math.round(data.price * 10) / 10;
        cache.BTCUSD = { price, timestamp: now, source: 'Gold-API Bitcoin', isAvailable: true };
        return price;
      }
    }
  } catch {}

  return cache.BTCUSD?.price || null;
}

/**
 * Evaluates whether an active signal has crossed its Take Profit or Stop Loss level.
 */
export function evaluateSignalOutcome(signal, currentPrice) {
  if (!signal || !currentPrice) {
    return signal?.status || 'active';
  }

  const status = String(signal.status || 'active').toLowerCase();
  if (status !== 'active') {
    return status;
  }

  const isBuy = String(signal.direction).toUpperCase() === 'BUY';
  const entry = parseFloat(signal.entry ?? signal.entry_price ?? signal.entryPrice ?? signal.price);
  const tp = parseFloat(signal.tp ?? signal.take_profit ?? signal.takeProfit);
  const sl = parseFloat(signal.sl ?? signal.stop_loss ?? signal.stopLoss);

  if (!tp || !sl || !entry) return 'active';

  // Sanity check: prevent evaluating against the wrong asset feed (e.g. BTC price against Gold signal)
  if (Math.abs(currentPrice - entry) / entry > 0.25) {
    return 'active';
  }

  if (isBuy) {
    if (currentPrice >= tp) return 'tp';
    if (currentPrice <= sl) return 'sl';
  } else {
    if (currentPrice <= tp) return 'tp';
    if (currentPrice >= sl) return 'sl';
  }

  return 'active';
}

/**
 * Computes trade progress percentage towards TP and remaining distance.
 */
export function calcTradeProgress(signal, currentPrice) {
  if (!signal || !currentPrice) {
    return { progressPct: 0, pipsToTp: 0, inProfit: false };
  }

  const isBuy = String(signal.direction).toUpperCase() === 'BUY';
  const entry = parseFloat(signal.entry);
  const tp = parseFloat(signal.tp);
  const pair = normalizePair(signal.pair);
  const pipMultiplier = pair === 'XAUUSD' ? 10 : pair === 'XAGUSD' ? 100 : 1;

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
