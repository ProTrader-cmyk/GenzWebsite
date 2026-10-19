/**
 * Scan Workflow Service
 * Coordinates the 4-Step Scanning Engine for both Scalp and Intra trading modes:
 * 
 * Step 1 — Market Data: Spot price ingestion, allowlist check, price bounds & freshness validation.
 * Step 2 — Technical Analysis: Mode-specific indicators & strategy condition evaluation.
 * Step 3 — AI Analysis & Validation: Algorithmic model generation & deterministic risk/geometry check.
 * Step 4 — Final Decision: Authoritative commit (Signal Publish vs. NO_VALID_SETUP vs. Error).
 * 
 * Scalp and Intra maintain separate configurations, timeframes, and validation rules.
 */

import {
  SUPPORTED_PAIRS,
  PAIR_CONFIGS,
  normalizePair,
  isSupportedPair,
  validateSignal,
} from './signalValidationService.js';

import {
  formatSpotPrice,
  getLivePriceMeta,
} from './marketPriceService.js';

import {
  evaluateMarketTradingConditions,
} from './marketAnalysisService.js';

export const SCAN_STEPS = [
  {
    step: 1,
    id: 'market_data',
    num: '01',
    title: 'Market Data',
    subTitle: 'Price & Freshness',
  },
  {
    step: 2,
    id: 'technical_analysis',
    num: '02',
    title: 'Technical Analysis',
    subScalp: '1M/5M Momentum & OB',
    subIntra: '15M/1H CRT & MTF',
  },
  {
    step: 3,
    id: 'ai_validation',
    num: '03',
    title: 'AI Validation',
    subTitle: 'Risk & Geometry Check',
  },
  {
    step: 4,
    id: 'final_decision',
    num: '04',
    title: 'Final Decision',
    subTitle: 'Dispatch or Reject',
  },
];

export const MODE_CONFIGS = {
  scalp: {
    mode: 'SCALP',
    label: '1M–5M Ultra Scalper',
    headerTitle: 'SCALP ENGINE',
    timeframes: '1M / 5M',
    style: 'scalp',
    modelName: 'ICT SMC Micro Scalp Model',
    strategyVersion: 'ICT-SMC-v4.2',
    minRr: 1.5,
    targetDesc: '2–3 Numbers Target & SL',
    executionTimeframe: '1m',
    structureTimeframe: '5m',
  },
  daytrade: {
    mode: 'INTRA',
    label: '15M/1H/4H CRT Swings',
    headerTitle: 'INTRA ENGINE',
    timeframes: '15M / 1H / 4H',
    style: 'daytrade',
    modelName: 'ICT SMC Candle Range Theory (CRT) Model',
    strategyVersion: 'ICT-CRT-v4.2',
    minRr: 2.0,
    targetDesc: '$10–$25 CRT Expansion',
    executionTimeframe: '15m',
    structureTimeframe: '1h / 4h',
  },
};

/**
 * Normalizes trading mode ('scalp' vs 'daytrade' / 'intra').
 */
export function normalizeMode(mode) {
  if (!mode) return 'scalp';
  const clean = String(mode).toLowerCase().trim();
  if (clean === 'intra' || clean === 'daytrade' || clean === 'swing') return 'daytrade';
  return 'scalp';
}

/**
 * Step 1 — Market Data
 * Retrieves and validates the latest live spot market data for the asset.
 */
export function executeScanStep1_MarketData(pair, livePrice, options = {}) {
  const norm = normalizePair(pair);
  const { maxDataAgeMs = 120000, marketStatus = { isOpen: true } } = options;

  // 1. Symbol Allowlist Check
  if (!isSupportedPair(norm)) {
    return {
      ok: false,
      step: 1,
      errorCode: 'UNSUPPORTED_ASSET',
      errorMessage: `Asset "${pair}" is not supported. Only Gold, Silver, and Bitcoin are allowed.`,
    };
  }

  // 2. Market Open Check
  if (marketStatus && marketStatus.isOpen === false) {
    return {
      ok: false,
      step: 1,
      errorCode: 'MARKET_CLOSED',
      errorMessage: `Interbank markets are closed for ${norm}. No live prices or trading over the weekend.`,
    };
  }

  // 3. Price Validity & Realism
  const numericPrice = Number(livePrice);
  if (!numericPrice || isNaN(numericPrice) || numericPrice <= 0) {
    return {
      ok: false,
      step: 1,
      errorCode: 'INVALID_PRICE',
      errorMessage: `Live price for ${norm} is unavailable or zero. Cannot run analysis on missing prices.`,
    };
  }

  const cfg = PAIR_CONFIGS[norm];
  if (numericPrice < cfg.minLivePrice || numericPrice > cfg.maxLivePrice) {
    return {
      ok: false,
      step: 1,
      errorCode: 'PRICE_OUT_OF_BOUNDS',
      errorMessage: `Spot price ($${numericPrice}) is out of realistic physical bounds for ${norm}.`,
    };
  }

  // 4. Data Freshness
  const priceMeta = getLivePriceMeta(norm);
  if (priceMeta.timestamp && Date.now() - priceMeta.timestamp > maxDataAgeMs) {
    return {
      ok: false,
      step: 1,
      errorCode: 'STALE_DATA',
      errorMessage: `Market data is stale (> ${Math.round(maxDataAgeMs / 1000)}s old). Fresh feed required.`,
    };
  }

  return {
    ok: true,
    step: 1,
    pair: norm,
    symbol: cfg.symbol,
    price: numericPrice,
    formattedPrice: formatSpotPrice(norm, numericPrice),
    timestamp: Date.now(),
    source: priceMeta.source || 'Live Market Feed',
  };
}

/**
 * Step 2 — Technical Analysis
 * Evaluates mode-specific strategy conditions, indicators, and structure.
 */
export function executeScanStep2_TechnicalAnalysis(pair, mode, marketAnalysis) {
  const norm = normalizePair(pair);
  const normMode = normalizeMode(mode);

  if (!marketAnalysis || !marketAnalysis.isAvailable || !marketAnalysis.price) {
    return {
      ok: false,
      step: 2,
      conditionMet: false,
      errorCode: 'ANALYSIS_UNAVAILABLE',
      errorMessage: 'Market analysis engine is currently offline or disconnected.',
    };
  }

  const cond = evaluateMarketTradingConditions(norm, marketAnalysis, normMode);

  if (!cond.met) {
    return {
      ok: true,
      step: 2,
      conditionMet: false,
      code: 'NO_SIGNAL',
      reason: cond.reason || 'Market conditions do not meet strategy requirements.',
      mode: normMode,
    };
  }

  return {
    ok: true,
    step: 2,
    conditionMet: true,
    direction: cond.direction,
    code: 'SETUP_CONFIRMED',
    reason: cond.reason,
    mode: normMode,
    rsi: marketAnalysis.rsi?.val,
    bias: marketAnalysis.bias,
    mtf: marketAnalysis.mtf,
  };
}

/**
 * Checks whether an active Intra Trade (daytrade) signal for the same pair and
 * same condition/direction has already been published and has not yet hit TP or SL.
 */
export function findActivePublishedIntraSignal(pair, direction, livePrice, existingSignals = []) {
  if (!Array.isArray(existingSignals) || existingSignals.length === 0) return null;
  const normPair = normalizePair(pair);
  const normDir = String(direction || '').toUpperCase();
  if (!normPair || !normDir) return null;

  const curP = Number(livePrice);

  return (
    existingSignals.find((s) => {
      if (!s || typeof s !== 'object') return false;
      const status = String(s.status || 'active').toLowerCase();
      if (status === 'closed' || status === 'tp' || status === 'sl' || status === 'invalidated' || status === 'expired') {
        return false;
      }
      const sPair = normalizePair(s.pair || s.symbol);
      if (sPair !== normPair) return false;

      const sStyle = normalizeMode(s.style || s.mode || 'daytrade');
      if (sStyle !== 'daytrade') return false;

      const sDir = String(s.direction || '').toUpperCase();
      if (sDir !== normDir) return false;

      const sEntry = Number(s.entry ?? s.entry_price);
      const sSl = Number(s.sl ?? s.stop_loss);
      const sTp = Number(s.tp1 ?? s.tp ?? s.take_profit);
      if (!sEntry || isNaN(sEntry) || !sSl || isNaN(sSl) || !sTp || isNaN(sTp)) return false;

      // If live price has already reached TP or SL, the previous setup is finished
      if (curP > 0 && !isNaN(curP)) {
        if (sDir === 'BUY') {
          if (curP >= sTp || curP <= sSl) return false;
        } else if (sDir === 'SELL') {
          if (curP <= sTp || curP >= sSl) return false;
        }
      }

      return true;
    }) || null
  );
}

/**
 * Step 3 — AI Analysis & Validation
 * Constructs candidate levels and validates direction, entry deviation, SL/TP geometry, and R:R.
 */
export function executeScanStep3_AiValidation(candidate, livePrice, mode, options = {}) {
  const normMode = normalizeMode(mode);
  const { existingSignals = [], activePair = null } = options;

  if (!candidate || typeof candidate !== 'object') {
    return {
      ok: false,
      step: 3,
      reasonCode: 'EMPTY_CANDIDATE',
      error: 'Candidate signal payload is empty.',
    };
  }

  const targetPair = normalizePair(activePair || candidate.pair);

  // For Intra Trade (daytrade): if a signal for this same pair & condition/direction is already published and active,
  // do not approve a new duplicate signal — mark as ALREADY_PUBLISHED.
  if (normMode === 'daytrade') {
    const existingIntra = findActivePublishedIntraSignal(
      targetPair,
      candidate.direction,
      livePrice,
      existingSignals
    );
    if (existingIntra) {
      return {
        ok: true,
        alreadyPublished: true,
        step: 3,
        reasonCode: 'SIGNAL_ALREADY_PUBLISHED',
        message: `Signal already published: Active ${existingIntra.direction} ${targetPair} Intra signal (@ $${formatSpotPrice(targetPair, existingIntra.entry)}) already meets this condition.`,
        signal: existingIntra,
        mode: normMode,
      };
    }
  }

  const validation = validateSignal(candidate, livePrice, {
    activePair: activePair || candidate.pair,
    style: normMode,
    existingSignals,
  });

  if (!validation.isValid) {
    return {
      ok: false,
      step: 3,
      reasonCode: validation.reasonCode || 'VALIDATION_FAILED',
      error: validation.error || 'Signal failed deterministic validation.',
    };
  }

  return {
    ok: true,
    alreadyPublished: false,
    step: 3,
    signal: validation.signal,
    mode: normMode,
  };
}

/**
 * Step 4 — Final Decision
 * Formulates the definitive result of the scan.
 */
export function executeScanStep4_FinalDecision(step1Result, step2Result, step3Result) {
  // If Step 1 failed
  if (!step1Result || !step1Result.ok) {
    return {
      outcome: 'ERROR',
      step: 4,
      code: step1Result?.errorCode || 'MARKET_DATA_ERROR',
      message: step1Result?.errorMessage || 'Market data retrieval failed.',
      signal: null,
    };
  }

  // If Step 2 failed or condition not met
  if (!step2Result || !step2Result.ok) {
    return {
      outcome: 'ERROR',
      step: 4,
      code: step2Result?.errorCode || 'ANALYSIS_ERROR',
      message: step2Result?.errorMessage || 'Technical analysis evaluation failed.',
      signal: null,
    };
  }

  if (step2Result.conditionMet === false) {
    return {
      outcome: 'NO_SIGNAL',
      step: 4,
      code: 'NO_VALID_SETUP',
      message: step2Result.reason?.includes('NO TRADE')
        ? step2Result.reason
        : `NO TRADE: ${step2Result.reason || 'No valid trading setup found.'}`,
      signal: null,
    };
  }

  // If Step 3 failed
  if (!step3Result || !step3Result.ok) {
    return {
      outcome: 'NO_SIGNAL',
      step: 4,
      code: step3Result?.reasonCode || 'VALIDATION_REJECTED',
      message: step3Result?.error?.includes('NO TRADE')
        ? step3Result.error
        : `NO TRADE: ${step3Result?.error || 'Candidate signal rejected during validation.'}`,
      signal: null,
    };
  }

  // If Step 3 detected that a signal for this same Intra condition is already published
  if (step3Result.alreadyPublished) {
    return {
      outcome: 'ALREADY_PUBLISHED',
      step: 4,
      code: 'SIGNAL_ALREADY_PUBLISHED',
      message:
        step3Result.message ||
        `Signal already published: ${step3Result.signal.direction} ${step3Result.signal.pair} @ ${step3Result.signal.entry} is already active for this condition.`,
      signal: step3Result.signal,
    };
  }

  // All 4 steps successfully passed
  return {
    outcome: 'SIGNAL_PUBLISHED',
    step: 4,
    code: 'SETUP_CONFIRMED',
    message: `Valid setup confirmed: ${step3Result.signal.direction} ${step3Result.signal.pair} @ ${step3Result.signal.entry}`,
    signal: step3Result.signal,
  };
}

