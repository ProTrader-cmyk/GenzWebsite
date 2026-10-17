/**
 * Signal Validation Service
 * Deterministic validation engine for trading signals before publishing.
 * Strictly prevents fake prices, inverted SL/TP, insufficient R:R, and cross-pair contamination.
 */

export const SUPPORTED_PAIRS = ['XAUUSD', 'XAGUSD', 'BTCUSD'];

export const PAIR_CONFIGS = {
  XAUUSD: {
    symbol: 'XAU/USD',
    name: 'Gold',
    decimals: 2,
    minSlDistScalp: 1.5,
    minTpDistScalp: 3.0,
    minSlDistDaytrade: 5.0,
    minTpDistDaytrade: 12.0,
    minLivePrice: 1500,
    maxLivePrice: 10000,
  },
  XAGUSD: {
    symbol: 'XAG/USD',
    name: 'Silver',
    decimals: 3,
    minSlDistScalp: 0.1,
    minTpDistScalp: 0.2,
    minSlDistDaytrade: 0.35,
    minTpDistDaytrade: 0.8,
    minLivePrice: 10,
    maxLivePrice: 150,
  },
  BTCUSD: {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    decimals: 1,
    minSlDistScalp: 200,
    minTpDistScalp: 400,
    minSlDistDaytrade: 600,
    minTpDistDaytrade: 1500,
    minLivePrice: 15000,
    maxLivePrice: 500000,
  },
};

/**
 * Normalizes asset pair names.
 */
export function normalizePair(pair) {
  if (!pair) return '';
  const clean = String(pair).toUpperCase().replace(/[\/\-_]/g, '').trim();
  if (clean === 'GOLD' || clean === 'XAU') return 'XAUUSD';
  if (clean === 'SILVER' || clean === 'XAG') return 'XAGUSD';
  if (clean === 'BTC' || clean === 'BITCOIN' || clean === 'BTCUSDT') return 'BTCUSD';
  return clean;
}

/**
 * Determines whether a pair is in the strict 3-asset allowlist.
 */
export function isSupportedPair(pair) {
  const norm = normalizePair(pair);
  return SUPPORTED_PAIRS.includes(norm);
}

/**
 * Deterministically validates a signal candidate against market reality.
 * Returns { isValid: boolean, code: string, error?: string, sanitizedSignal?: Object }
 */
export function validateSignal(candidate, currentPrice, options = {}) {
  const {
    activePair = null,
    style = 'scalp',
    maxPriceDeviationPct = 0.0035, // entry must be within 0.35% of live market price
    maxDataAgeMs = 120000, // market data max 2 minutes old
    existingSignals = [],
  } = options;

  if (!candidate || typeof candidate !== 'object') {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'MISSING_PAYLOAD',
      error: 'Candidate signal payload is missing or empty.',
    };
  }

  // 1. Asset Allowlist Check
  const normPair = normalizePair(candidate.pair || candidate.symbol);
  if (!SUPPORTED_PAIRS.includes(normPair)) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'UNSUPPORTED_ASSET',
      error: `Asset ${candidate.pair || 'unknown'} is not supported. Only Gold (XAUUSD), Silver (XAGUSD), and Bitcoin (BTCUSD) are allowed.`,
    };
  }

  // 2. Active Asset Context Check (Prevents race condition / cross-pair contamination)
  if (activePair && normalizePair(activePair) !== normPair) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'CROSS_PAIR_MISMATCH',
      error: `Signal for ${normPair} does not match currently active asset ${normalizePair(activePair)}.`,
    };
  }

  // 3. Live Price Presence & Freshness
  const curP = Number(currentPrice);
  if (!curP || isNaN(curP) || curP <= 0) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INVALID_MARKET_PRICE',
      error: 'Valid live market spot price is required to generate or publish a signal.',
    };
  }

  const pairConfig = PAIR_CONFIGS[normPair];
  if (curP < pairConfig.minLivePrice || curP > pairConfig.maxLivePrice) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'PRICE_OUT_OF_BOUNDS',
      error: `Current spot price ${curP} is out of realistic physical bounds for ${normPair}.`,
    };
  }

  if (candidate.marketTimestamp && Date.now() - Number(candidate.marketTimestamp) > maxDataAgeMs) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'STALE_MARKET_DATA',
      error: 'Market data timestamp is too old (> 2 minutes). Stale signals are rejected.',
    };
  }

  // 4. Direction Validation
  const dir = String(candidate.direction || candidate.action || '').toUpperCase();
  if (dir !== 'BUY' && dir !== 'SELL') {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INVALID_DIRECTION',
      error: `Trade direction must be strictly BUY or SELL. Received: "${dir}".`,
    };
  }
  const isBuy = dir === 'BUY';

  // 5. Numeric Entry, SL, TP Validation
  const entry = parseFloat(String(candidate.entry ?? candidate.entry_price ?? candidate.price ?? '').replace(/,/g, ''));
  const sl = parseFloat(String(candidate.sl ?? candidate.stop_loss ?? candidate.stopLoss ?? '').replace(/,/g, ''));
  const tp = parseFloat(String(candidate.tp ?? candidate.take_profit ?? candidate.takeProfit ?? candidate.tp1 ?? '').replace(/,/g, ''));

  if (!entry || isNaN(entry) || entry <= 0) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INVALID_ENTRY',
      error: 'Signal entry price must be a valid positive number.',
    };
  }

  if (!sl || isNaN(sl) || sl <= 0) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INVALID_SL',
      error: 'Signal stop-loss price must be a valid positive number.',
    };
  }

  if (!tp || isNaN(tp) || tp <= 0) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INVALID_TP',
      error: 'Signal take-profit price must be a valid positive number.',
    };
  }

  // 6. Entry Price Consistency with Live Market
  const priceDeviation = Math.abs(entry - curP) / curP;
  if (priceDeviation > maxPriceDeviationPct) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'PRICE_DEVIATION_TOO_HIGH',
      error: `Entry price ${entry} deviates ${(priceDeviation * 100).toFixed(2)}% from current live price ${curP} (max allowed: ${(maxPriceDeviationPct * 100).toFixed(2)}%).`,
    };
  }

  // 7. Directional Level Geometry Check
  if (isBuy) {
    if (sl >= entry) {
      return {
        isValid: false,
        code: 'NO_SIGNAL',
        reasonCode: 'INVALID_LEVEL_GEOMETRY',
        error: `For BUY signals, stop-loss (${sl}) must be strictly below entry price (${entry}).`,
      };
    }
    if (tp <= entry) {
      return {
        isValid: false,
        code: 'NO_SIGNAL',
        reasonCode: 'INVALID_LEVEL_GEOMETRY',
        error: `For BUY signals, take-profit (${tp}) must be strictly above entry price (${entry}).`,
      };
    }
  } else {
    // SELL
    if (sl <= entry) {
      return {
        isValid: false,
        code: 'NO_SIGNAL',
        reasonCode: 'INVALID_LEVEL_GEOMETRY',
        error: `For SELL signals, stop-loss (${sl}) must be strictly above entry price (${entry}).`,
      };
    }
    if (tp >= entry) {
      return {
        isValid: false,
        code: 'NO_SIGNAL',
        reasonCode: 'INVALID_LEVEL_GEOMETRY',
        error: `For SELL signals, take-profit (${tp}) must be strictly below entry price (${entry}).`,
      };
    }
  }

  // 8. Minimum Pip Distance & Level Separation
  const slDist = Math.abs(entry - sl);
  const tpDist = Math.abs(tp - entry);

  const isScalp = style === 'scalp' || String(candidate.style || '').toLowerCase() === 'scalp';
  const minSlDist = isScalp ? pairConfig.minSlDistScalp : pairConfig.minSlDistDaytrade;
  const minTpDist = isScalp ? pairConfig.minTpDistScalp : pairConfig.minTpDistDaytrade;

  if (slDist < minSlDist) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INSUFFICIENT_PIP_DISTANCE',
      error: `Stop-loss distance (${slDist.toFixed(pairConfig.decimals)}) is below minimum required for ${normPair} ${style} (${minSlDist}).`,
    };
  }

  if (tpDist < minTpDist) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INSUFFICIENT_PIP_DISTANCE',
      error: `Take-profit distance (${tpDist.toFixed(pairConfig.decimals)}) is below minimum required for ${normPair} ${style} (${minTpDist}).`,
    };
  }

  // 9. Risk/Reward Ratio Requirement
  const calculatedRr = slDist > 0 ? tpDist / slDist : 0;
  const minRr = isScalp ? 1.5 : 2.0;

  if (calculatedRr < minRr - 0.05) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'INSUFFICIENT_RR',
      error: `Risk-to-Reward ratio (1:${calculatedRr.toFixed(2)}) is below strategy minimum (1:${minRr.toFixed(1)}).`,
    };
  }

  // 10. Deduplication against already active signals
  const exactKey = `${normPair}-${dir}-${entry.toFixed(pairConfig.decimals)}-${isScalp ? 'scalp' : 'daytrade'}`;
  const isDuplicate = existingSignals.some((s) => {
    if (!s || s.status === 'closed' || s.status === 'tp' || s.status === 'sl') return false;
    const sPair = normalizePair(s.pair || s.symbol);
    const sDir = String(s.direction || '').toUpperCase();
    const sEntry = Number(s.entry ?? s.entry_price);
    const sKey = `${sPair}-${sDir}-${sEntry.toFixed(pairConfig.decimals)}-${(s.style || 'scalp').toLowerCase()}`;
    return sKey === exactKey;
  });

  if (isDuplicate) {
    return {
      isValid: false,
      code: 'NO_SIGNAL',
      reasonCode: 'DUPLICATE_SIGNAL',
      error: `An identical active setup for ${normPair} @ ${entry} already exists.`,
    };
  }

  // Sanitize validated output payload
  const sanitizedSignal = {
    id: candidate.id || `sig_${normPair}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    pair: normPair,
    symbol: pairConfig.symbol,
    name: pairConfig.name,
    direction: dir,
    entry: Number(entry.toFixed(pairConfig.decimals)),
    sl: Number(sl.toFixed(pairConfig.decimals)),
    tp: Number(tp.toFixed(pairConfig.decimals)),
    tp1: Number(tp.toFixed(pairConfig.decimals)),
    tp2: candidate.tp2 ? Number(Number(candidate.tp2).toFixed(pairConfig.decimals)) : null,
    rr: `1:${calculatedRr.toFixed(1)}`,
    rrNumeric: Number(calculatedRr.toFixed(2)),
    style: isScalp ? 'scalp' : 'daytrade',
    timeframe: candidate.timeframe || (isScalp ? '5m' : '15m'),
    mode: candidate.mode || (isScalp ? '5M SCALP' : '15M INTRADAY (ICT)'),
    status: 'active',
    marketPriceAtGeneration: curP,
    timestamp: candidate.timestamp || Date.now(),
    marketTimestamp: candidate.marketTimestamp || Date.now(),
    strategyVersion: 'ICT-SMC-v4.2',
    confluences: Array.isArray(candidate.confluences) && candidate.confluences.length > 0
      ? candidate.confluences
      : ['Fair Value Gap (FVG) Liquidity Sweep', 'Institutional Order Block Retest', 'Discount / Premium Dealing Range Alignment'],
    model: candidate.model || 'ICT SMC Model',
  };

  return {
    isValid: true,
    code: 'SIGNAL_VALID',
    signal: sanitizedSignal,
  };
}
