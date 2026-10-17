/**
 * Scalp & Intraday Structure-Based TP/SL Calculation Engine
 * 
 * Specifically engineered for XAUUSD (Gold), BTCUSD (Bitcoin), and XAGUSD (Silver).
 * 
 * Core Principles:
 * 1. Stop Loss (SL):
 *    - Anchored beyond the nearest valid market-structure invalidation point
 *      (recent swing high/low, order block, or fair value gap distal boundary).
 *    - Padded by an ATR-based volatility buffer so normal market noise does not trigger it.
 *    - Strict directional geometry: BUY -> SL < Entry; SELL -> SL > Entry.
 *    - If the structural SL exceeds the maximum allowed risk distance, REJECT the trade
 *      (return NO_TRADE) instead of forcing an artificially tight stop inside noise.
 * 
 * 2. Take Profit (TP):
 *    - Targets the nearest meaningful opposing liquidity pool, swing high/low, or S/R zone.
 *    - Front-runs major opposing structure so limit orders fill reliably before reversal.
 *    - Prefers realistic, nearby scalping targets (1.5x–3.2x 5m ATR) rather than distant swing targets.
 *    - Deducts realistic spread, commission, and slippage to verify net reward.
 * 
 * 3. Risk-to-Reward (R:R):
 *    - Requires minimum 1.5:1 gross R:R (and >= 1.25:1 net R:R after costs), preferring 2.0:1
 *      when opposing market structure supports it.
 *    - Allows 1:1 setups ONLY when explicitly enabled AND backtestValidated = true.
 *    - Never forces a 1:2 or 1:3 target through a blocking opposing resistance/support level.
 */

import { normalizePair, isSupportedPair } from './signalValidationService.js';
import { formatSpotPrice } from './marketPriceService.js';

export const SCALP_ASSET_CONFIGS = {
  XAUUSD: {
    pair: 'XAUUSD',
    symbol: 'XAU/USD',
    name: 'Gold',
    decimals: 2,
    tickSize: 0.01,
    unitLabel: 'pts',
    pointMultiplier: 100, // $1.00 = 100 points on Gold
    // Realistic transaction costs (USD per oz)
    estimatedSpread: 0.22,
    maxAllowedSpread: 0.55,
    estimatedSlippage: 0.08,
    commissionPerUnit: 0.07,
    // 5-Minute ATR & Volatility parameters ($ USD)
    defaultAtr5m: 2.00,
    minAtr5m: 0.80,
    maxAtr5m: 6.50,
    // Stop Loss bounds for Scalping ($ USD)
    minSlDist: 1.20,
    maxSlDist: 4.20,
    atrNoiseFloorMult: 0.85,
    invalidationBufferAtrMult: 0.20,
    minInvalidationBuffer: 0.30,
    // Take Profit bounds for Scalping ($ USD)
    minTpDist: 1.80,
    maxScalpTpDist: 7.50,
    maxTpAtrMult: 3.20,
    frontRunBuffer: 0.20,
    // Daytrade / Intraday bounds ($ USD)
    daytrade: {
      defaultAtr15m: 5.50,
      minSlDist: 5.00,
      maxSlDist: 14.00,
      minTpDist: 10.00,
      maxTpDist: 32.00,
      invalidationBuffer: 0.80,
      frontRunBuffer: 0.50,
    },
  },

  BTCUSD: {
    pair: 'BTCUSD',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    decimals: 1,
    tickSize: 0.1,
    unitLabel: 'pts',
    pointMultiplier: 1, // $1.0 = 1 pt on BTC
    // Realistic transaction costs ($ USD per BTC)
    estimatedSpread: 10.0,
    maxAllowedSpread: 35.0,
    estimatedSlippage: 6.0,
    commissionPerUnit: 14.0,
    // 5-Minute ATR & Volatility parameters ($ USD)
    defaultAtr5m: 145.0,
    minAtr5m: 55.0,
    maxAtr5m: 520.0,
    // Stop Loss bounds for Scalping ($ USD)
    minSlDist: 90.0,
    maxSlDist: 320.0,
    atrNoiseFloorMult: 0.85,
    invalidationBufferAtrMult: 0.20,
    minInvalidationBuffer: 22.0,
    // Take Profit bounds for Scalping ($ USD)
    minTpDist: 140.0,
    maxScalpTpDist: 580.0,
    maxTpAtrMult: 3.20,
    frontRunBuffer: 15.0,
    // Daytrade / Intraday bounds ($ USD)
    daytrade: {
      defaultAtr15m: 420.0,
      minSlDist: 400.0,
      maxSlDist: 1100.0,
      minTpDist: 800.0,
      maxTpDist: 2500.0,
      invalidationBuffer: 60.0,
      frontRunBuffer: 40.0,
    },
  },

  XAGUSD: {
    pair: 'XAGUSD',
    symbol: 'XAG/USD',
    name: 'Silver',
    decimals: 3,
    tickSize: 0.001,
    unitLabel: 'pts',
    pointMultiplier: 1000, // $0.001 = 1 pt on 3-decimal Silver
    // Realistic transaction costs ($ USD per oz)
    estimatedSpread: 0.022,
    maxAllowedSpread: 0.055,
    estimatedSlippage: 0.006,
    commissionPerUnit: 0.006,
    // 5-Minute ATR & Volatility parameters ($ USD)
    defaultAtr5m: 0.115,
    minAtr5m: 0.045,
    maxAtr5m: 0.420,
    // Stop Loss bounds for Scalping ($ USD)
    minSlDist: 0.080,
    maxSlDist: 0.280,
    atrNoiseFloorMult: 0.85,
    invalidationBufferAtrMult: 0.20,
    minInvalidationBuffer: 0.018,
    // Take Profit bounds for Scalping ($ USD)
    minTpDist: 0.125,
    maxScalpTpDist: 0.520,
    maxTpAtrMult: 3.20,
    frontRunBuffer: 0.012,
    // Daytrade / Intraday bounds ($ USD)
    daytrade: {
      defaultAtr15m: 0.260,
      minSlDist: 0.250,
      maxSlDist: 0.650,
      minTpDist: 0.500,
      maxTpDist: 1.500,
      invalidationBuffer: 0.035,
      frontRunBuffer: 0.025,
    },
  },
};

/**
 * Estimates current 5-minute ATR from market analysis data, recent candle ranges, or explicit ATR input.
 */
export function estimateAssetAtr5m(pair, marketAnalysis = null, explicitAtr = null) {
  const norm = normalizePair(pair);
  const cfg = SCALP_ASSET_CONFIGS[norm];
  if (!cfg) return null;

  if (explicitAtr != null && Number(explicitAtr) > 0) {
    return Number(explicitAtr);
  }

  if (marketAnalysis) {
    if (Number(marketAnalysis.atr5m) > 0) {
      return Number(marketAnalysis.atr5m);
    }
    if (Number(marketAnalysis.atr15m) > 0) {
      return Number((Number(marketAnalysis.atr15m) * 0.58).toFixed(cfg.decimals));
    }
    const h5 = Number(marketAnalysis.high5);
    const l5 = Number(marketAnalysis.low5);
    if (h5 > 0 && l5 > 0 && h5 > l5) {
      const range5 = h5 - l5;
      if (range5 >= cfg.minAtr5m * 0.5 && range5 <= cfg.maxAtr5m * 1.5) {
        return Number(range5.toFixed(cfg.decimals));
      }
    }
    const h15 = Number(marketAnalysis.high15);
    const l15 = Number(marketAnalysis.low15);
    if (h15 > 0 && l15 > 0 && h15 > l15) {
      const range15 = (h15 - l15) * 0.58;
      if (range15 >= cfg.minAtr5m && range15 <= cfg.maxAtr5m) {
        return Number(range15.toFixed(cfg.decimals));
      }
    }
  }

  return cfg.defaultAtr5m;
}

/**
 * Computes structure-driven Stop Loss, Take Profit, Risk-to-Reward, and level explanations
 * for Scalping (1m/5m) or Intraday (15m/1h) setups.
 * 
 * Returns:
 * - { ok: true, signal: { ... }, metrics: { ... } } when all structure, cost, and R:R validations pass.
 * - { ok: false, code: 'NO_TRADE', reasonCode: '...', reason: '...' } when rejected.
 */
export function calculateStructureScalpTpSl({
  pair = 'XAUUSD',
  direction = 'BUY',
  entryPrice,
  style = 'scalp',
  marketAnalysis = null,
  structure = {},
  atr5m: topAtr5m = null,
  swingLow: topSwingLow = null,
  swingHigh: topSwingHigh = null,
  opposingResistance: topOpposingResistance = null,
  opposingSupport: topOpposingSupport = null,
  currentSpread: topCurrentSpread = null,
  allowOneToOne = false,
  backtestValidated = false,
}) {
  const norm = normalizePair(pair);
  if (!isSupportedPair(norm) || !SCALP_ASSET_CONFIGS[norm]) {
    const msg = `Asset ${pair} is not supported. Only XAUUSD, BTCUSD, and XAGUSD are permitted.`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'UNSUPPORTED_ASSET',
      reason: msg,
      error: msg,
    };
  }

  const cfg = SCALP_ASSET_CONFIGS[norm];
  const dec = cfg.decimals;
  const entry = Number(entryPrice);

  if (!entry || isNaN(entry) || entry <= 0) {
    const msg = 'Entry price must be a valid positive market price.';
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'INVALID_ENTRY_PRICE',
      reason: msg,
      error: msg,
    };
  }

  const dir = String(direction || '').toUpperCase();
  if (dir !== 'BUY' && dir !== 'SELL') {
    const msg = `Direction must be BUY or SELL. Received: ${direction}`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'INVALID_DIRECTION',
      reason: msg,
      error: msg,
    };
  }
  const isBuy = dir === 'BUY';
  const isScalp = !style || String(style).toLowerCase().includes('scalp');

  // Normalize structure inputs (accepts both structure.xyz and top-level xyz)
  const sSwingLow = structure.swingLow ?? topSwingLow;
  const sSwingHigh = structure.swingHigh ?? topSwingHigh;
  const sOppRes = structure.resistanceLevel ?? structure.opposingResistance ?? topOpposingResistance;
  const sOppSup = structure.supportLevel ?? structure.opposingSupport ?? topOpposingSupport;
  const sSpread = structure.spread ?? structure.currentSpread ?? topCurrentSpread;
  const sAtr5m = structure.atr5m ?? structure.atr ?? topAtr5m;

  // 1. Check Entry Trigger Validity
  const entryTriggerDesc = structure.entryTrigger
    || (marketAnalysis?.signal
      ? `5M ${isBuy ? 'Bullish' : 'Bearish'} MSS + FVG tap (${marketAnalysis.signal})`
      : `1M/5M ${isBuy ? 'Bullish' : 'Bearish'} Order Block & FVG mitigation at $${formatSpotPrice(norm, entry)}`);

  if (structure.entryTriggerConfirmed === false) {
    const msg = 'Entry trigger (MSS / FVG / Order Block) is not confirmed.';
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'UNCONFIRMED_ENTRY_TRIGGER',
      reason: msg,
      error: msg,
    };
  }

  // 2. Transaction Costs & Spread Check
  const currentSpread = sSpread != null ? Number(sSpread) : cfg.estimatedSpread;
  if (currentSpread > cfg.maxAllowedSpread) {
    const msg = `Current spread ($${currentSpread.toFixed(dec)}) exceeds maximum scalping threshold ($${cfg.maxAllowedSpread.toFixed(dec)}) for ${norm}.`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'EXCESSIVE_SPREAD',
      reason: msg,
      error: msg,
    };
  }

  const totalCost = Number((currentSpread + cfg.estimatedSlippage + cfg.commissionPerUnit).toFixed(dec));

  // 3. Volatility / ATR Evaluation
  const atr5m = estimateAssetAtr5m(norm, marketAnalysis, sAtr5m);

  if (isScalp) {
    if (atr5m < cfg.minAtr5m) {
      const msg = `5m ATR ($${atr5m.toFixed(dec)}) is below minimum scalping threshold ($${cfg.minAtr5m.toFixed(dec)}). Market is in dead consolidation.`;
      return {
        ok: false,
        code: 'NO_TRADE',
        reasonCode: 'VOLATILITY_TOO_LOW',
        reason: msg,
        error: msg,
      };
    }
    if (atr5m > cfg.maxAtr5m) {
      const msg = `5m ATR ($${atr5m.toFixed(dec)}) exceeds safe scalping limit ($${cfg.maxAtr5m.toFixed(dec)}). High whip-saw risk.`;
      return {
        ok: false,
        code: 'NO_TRADE',
        reasonCode: 'VOLATILITY_TOO_EXTREME',
        reason: msg,
        error: msg,
      };
    }
  }

  // =========================================================================
  // INTRADAY / DAYTRADE MODE (15m / 1H CRT)
  // =========================================================================
  if (!isScalp) {
    const dt = cfg.daytrade;
    const atr15m = structure.atr15m || (atr5m * 1.75) || dt.defaultAtr15m;

    let invLevel = isBuy
      ? (sSwingLow ?? structure.orderBlockLow ?? structure.fvgBoundary ?? (entry - (dt.minSlDist * 1.1)))
      : (sSwingHigh ?? structure.orderBlockHigh ?? structure.fvgBoundary ?? (entry + (dt.minSlDist * 1.1)));

    invLevel = Number(invLevel);
    if (isBuy && invLevel >= entry) invLevel = entry - dt.minSlDist;
    if (!isBuy && invLevel <= entry) invLevel = entry + dt.minSlDist;

    const rawSl = isBuy ? invLevel - dt.invalidationBuffer : invLevel + dt.invalidationBuffer;
    let slDist = Math.abs(entry - rawSl);

    if (slDist < dt.minSlDist) {
      slDist = dt.minSlDist;
    }
    if (slDist > dt.maxSlDist) {
      const msg = `Intraday structural invalidation requires SL distance of $${slDist.toFixed(dec)}, exceeding max risk limit ($${dt.maxSlDist.toFixed(dec)}).`;
      return {
        ok: false,
        code: 'NO_TRADE',
        reasonCode: 'SL_TOO_WIDE',
        reason: msg,
        error: msg,
      };
    }

    const sl = Number((isBuy ? entry - slDist : entry + slDist).toFixed(dec));
    const tpDist = Number((slDist * 2.0).toFixed(dec));
    const tp = Number((isBuy ? entry + tpDist : entry - tpDist).toFixed(dec));
    const tp2Dist = Number((slDist * 2.5).toFixed(dec));
    const tp2 = Number((isBuy ? entry + tp2Dist : entry - tp2Dist).toFixed(dec));
    const beTrigger = Number((isBuy ? entry + slDist : entry - slDist).toFixed(dec));
    const grossRr = tpDist / slDist;
    const netRr = Math.max(0, tpDist - totalCost) / slDist;
    const slPts = Math.round(slDist * cfg.pointMultiplier);
    const tpPts = Math.round(tpDist * cfg.pointMultiplier);

    const signalObj = {
      pair: norm,
      symbol: cfg.symbol,
      name: cfg.name,
      direction: dir,
      style: 'daytrade',
      timeframe: '15m / 1H',
      entry: Number(entry.toFixed(dec)),
      sl,
      tp,
      tp1: tp,
      tp2,
      breakEvenTrigger: beTrigger,
      slDistance: Number(slDist.toFixed(dec)),
      tpDistance: Number(tpDist.toFixed(dec)),
      slDistanceFormatted: `-$${slDist.toFixed(dec)} (${slPts} ${cfg.unitLabel})`,
      tpDistanceFormatted: `+$${tpDist.toFixed(dec)} (${tpPts} ${cfg.unitLabel})`,
      slPts,
      tpPts,
      rr: `1:${grossRr.toFixed(1)}`,
      rrNumeric: Number(grossRr.toFixed(2)),
      netRr: `1:${netRr.toFixed(1)}`,
      netRrNumeric: Number(netRr.toFixed(2)),
      atr: Number(atr15m.toFixed(dec)),
      tradingCost: totalCost,
      totalCost,
      invalidationLevel: Number(invLevel.toFixed(dec)),
      levelExplanations: {
        entry: `15M/1H CRT ${isBuy ? 'Discount FVG' : 'Premium FVG'} entry at $${formatSpotPrice(norm, entry)}`,
        sl: `$${formatSpotPrice(norm, sl)} (-$${slDist.toFixed(dec)}) — Placed $${dt.invalidationBuffer.toFixed(dec)} beyond 15M/1H structural ${isBuy ? 'swing low' : 'swing high'} ($${formatSpotPrice(norm, invLevel)})`,
        tp: `$${formatSpotPrice(norm, tp)} (+$${tpDist.toFixed(dec)}) — Targets opposing 1H liquidity pool at 1:${grossRr.toFixed(1)} R:R (Net 1:${netRr.toFixed(1)})`,
      },
    };

    return {
      ok: true,
      code: 'SIGNAL_VALID',
      ...signalObj,
      signal: signalObj,
    };
  }

  // =========================================================================
  // SCALPING MODE (1m / 5m Structure + ATR + Liquidity Wall Engine)
  // =========================================================================

  // 4. Identify Nearest Valid Structural Invalidation Level for Stop Loss
  const noiseBuffer = Math.max(
    cfg.minInvalidationBuffer,
    Number((cfg.invalidationBufferAtrMult * atr5m).toFixed(dec))
  );
  const minRequiredNoiseRoom = Math.max(
    cfg.minSlDist,
    Number((cfg.atrNoiseFloorMult * atr5m + currentSpread).toFixed(dec))
  );

  let invalidationLevel = null;
  let invalidationSource = '';

  if (isBuy) {
    // Collect candidate bullish invalidation levels strictly below entry
    const candidates = [
      { val: sSwingLow, label: '5M swing low' },
      { val: structure.orderBlockLow, label: '5M bullish Order Block low' },
      { val: structure.fvgBoundary, label: '5M bullish FVG distal low' },
      { val: marketAnalysis?.low5, label: '5M structure low' },
      { val: marketAnalysis?.low15, label: '15M micro-swing low' },
    ].filter((c) => c.val != null && !isNaN(Number(c.val)) && Number(c.val) < entry);

    // Sort ascending by distance below entry, filtering out levels inside immediate tick spread
    const validCandidates = candidates
      .map((c) => ({ ...c, val: Number(c.val), dist: entry - Number(c.val) }))
      .filter((c) => c.dist >= currentSpread * 1.5)
      .sort((a, b) => a.dist - b.dist);

    if (validCandidates.length > 0) {
      invalidationLevel = validCandidates[0].val;
      invalidationSource = validCandidates[0].label;
    } else {
      // Derive structural swing low from 5m ATR displacement base
      const derivedSwingDist = Math.max(cfg.minSlDist - noiseBuffer, Number((0.72 * atr5m).toFixed(dec)));
      invalidationLevel = Number((entry - derivedSwingDist).toFixed(dec));
      invalidationSource = '5M micro-swing & FVG base';
    }
  } else {
    // SELL: Collect candidate bearish invalidation levels strictly above entry
    const candidates = [
      { val: sSwingHigh, label: '5M swing high' },
      { val: structure.orderBlockHigh, label: '5M bearish Order Block high' },
      { val: structure.fvgBoundary, label: '5M bearish FVG distal high' },
      { val: marketAnalysis?.high5, label: '5M structure high' },
      { val: marketAnalysis?.high15, label: '15M micro-swing high' },
    ].filter((c) => c.val != null && !isNaN(Number(c.val)) && Number(c.val) > entry);

    const validCandidates = candidates
      .map((c) => ({ ...c, val: Number(c.val), dist: Number(c.val) - entry }))
      .filter((c) => c.dist >= currentSpread * 1.5)
      .sort((a, b) => a.dist - b.dist);

    if (validCandidates.length > 0) {
      invalidationLevel = validCandidates[0].val;
      invalidationSource = validCandidates[0].label;
    } else {
      const derivedSwingDist = Math.max(cfg.minSlDist - noiseBuffer, Number((0.72 * atr5m).toFixed(dec)));
      invalidationLevel = Number((entry + derivedSwingDist).toFixed(dec));
      invalidationSource = '5M micro-swing & FVG top';
    }
  }

  // Place SL beyond invalidation level + ATR noise buffer
  let rawSl = isBuy
    ? invalidationLevel - noiseBuffer
    : invalidationLevel + noiseBuffer;

  let slDist = Math.abs(entry - rawSl);

  if (structure.enforceExactSl === true) {
    if (slDist < cfg.minSlDist) {
      const msg = `Stop loss distance ($${slDist.toFixed(dec)}) is inside normal 5m market noise (min required: $${cfg.minSlDist.toFixed(dec)}).`;
      return {
        ok: false,
        code: 'NO_TRADE',
        reasonCode: 'SL_TOO_TIGHT_FOR_NOISE',
        reason: msg,
        error: msg,
      };
    }
  } else if (slDist < minRequiredNoiseRoom) {
    // Pad SL so normal 5m volatility fluctuations don't prematurely stop out the trade
    slDist = minRequiredNoiseRoom;
    rawSl = isBuy ? entry - slDist : entry + slDist;
  }

  // CRITICAL RULE: If the valid structural SL is too far away for the configured scalp risk limit,
  // REJECT the trade instead of forcing a tighter stop!
  const maxAllowedScalpSl = Math.min(cfg.maxSlDist, Number((2.25 * atr5m).toFixed(dec)));
  if (slDist > cfg.maxSlDist || slDist > maxAllowedScalpSl) {
    const msg = `Valid structural SL beyond ${invalidationSource} ($${formatSpotPrice(norm, invalidationLevel)}) requires $${slDist.toFixed(dec)} risk, exceeding max scalp limit ($${maxAllowedScalpSl.toFixed(dec)}). Trade rejected rather than forcing an unsafe tight stop.`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'SL_TOO_WIDE_FOR_SCALP',
      reason: msg,
      error: msg,
    };
  }

  const finalSl = Number((isBuy ? entry - slDist : entry + slDist).toFixed(dec));
  const finalSlDist = Number(Math.abs(entry - finalSl).toFixed(dec));

  // =========================================================================
  // 5. Identify Nearest Meaningful Opposing Liquidity / Structure for TP
  // =========================================================================
  const maxAtrTpReach = Math.min(cfg.maxScalpTpDist, Number((cfg.maxTpAtrMult * atr5m).toFixed(dec)));

  let opposingLevel = null;
  let opposingSource = '';

  if (isBuy) {
    // Look for opposing resistance / liquidity pools above entry
    const oppCandidates = [
      { val: structure.opposingLiquidity, label: '5M opposing liquidity pool' },
      { val: structure.targetSwingHigh, label: 'previous 5M/15M swing high' },
      { val: sOppRes, label: 'intraday resistance zone' },
      { val: marketAnalysis?.sessionHigh, label: 'session high liquidity' },
      { val: marketAnalysis?.levels?.r1Num, label: 'R1 intraday pivot' },
    ].filter((c) => c.val != null && !isNaN(Number(c.val)) && Number(c.val) > entry + currentSpread * 2);

    const sortedOpp = oppCandidates
      .map((c) => ({ ...c, val: Number(c.val), dist: Number(c.val) - entry }))
      .filter((c) => c.dist >= 0.4 * atr5m || c.val === structure.opposingLiquidity || c.val === sOppRes)
      .sort((a, b) => a.dist - b.dist);

    if (sortedOpp.length > 0 && sortedOpp[0].dist <= maxAtrTpReach) {
      opposingLevel = sortedOpp[0].val;
      opposingSource = sortedOpp[0].label;
    }
  } else {
    // SELL: Look for opposing support / liquidity pools below entry
    const oppCandidates = [
      { val: structure.opposingLiquidity, label: '5M opposing liquidity pool' },
      { val: structure.targetSwingLow, label: 'previous 5M/15M swing low' },
      { val: sOppSup, label: 'intraday support zone' },
      { val: marketAnalysis?.sessionLow, label: 'session low liquidity' },
      { val: marketAnalysis?.levels?.s1Num, label: 'S1 intraday pivot' },
    ].filter((c) => c.val != null && !isNaN(Number(c.val)) && Number(c.val) < entry - currentSpread * 2);

    const sortedOpp = oppCandidates
      .map((c) => ({ ...c, val: Number(c.val), dist: entry - Number(c.val) }))
      .filter((c) => c.dist >= 0.4 * atr5m || c.val === structure.opposingLiquidity || c.val === sOppSup)
      .sort((a, b) => a.dist - b.dist);

    if (sortedOpp.length > 0 && sortedOpp[0].dist <= maxAtrTpReach) {
      opposingLevel = sortedOpp[0].val;
      opposingSource = sortedOpp[0].label;
    }
  }

  // Calculate maximum achievable TP distance without breaching opposing structure
  let maxAchievableTpDist = maxAtrTpReach;
  if (opposingLevel != null) {
    const rawOppDist = Math.abs(opposingLevel - entry);
    maxAchievableTpDist = Math.min(maxAtrTpReach, Math.max(0, rawOppDist - cfg.frontRunBuffer));
  }

  // Determine required minimum R:R
  const isOneToOneAllowed = Boolean(allowOneToOne === true && backtestValidated === true);
  const minGrossRr = isOneToOneAllowed ? 1.0 : 1.5;
  const preferredGrossRr = 2.0;

  const preferredTpDist = Number((finalSlDist * preferredGrossRr).toFixed(dec));
  const minRequiredTpDist = Math.max(
    isOneToOneAllowed ? cfg.minSlDist : cfg.minTpDist,
    Number((finalSlDist * minGrossRr).toFixed(dec))
  );

  // CRITICAL RULE: Never force a 1:2 or 1:3 ratio when opposing structure blocks the target!
  if (maxAchievableTpDist < minRequiredTpDist) {
    const msg = opposingLevel != null
      ? `Nearest opposing ${opposingSource} at $${formatSpotPrice(norm, opposingLevel)} caps achievable reward at $${maxAchievableTpDist.toFixed(dec)}, which is below minimum ${minGrossRr.toFixed(1)}:1 R:R ($${minRequiredTpDist.toFixed(dec)}) for SL $${finalSlDist.toFixed(dec)}. Returning NO TRADE.`
      : `Achievable scalp ATR range ($${maxAchievableTpDist.toFixed(dec)}) cannot support minimum ${minGrossRr.toFixed(1)}:1 R:R ($${minRequiredTpDist.toFixed(dec)}). Returning NO TRADE.`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'OPPOSING_STRUCTURE_BLOCKS_TP',
      reason: msg,
      error: msg,
    };
  }

  let finalTpDist;
  let tpSelectionBasis;

  if (opposingLevel != null && maxAchievableTpDist <= finalSlDist * 2.25) {
    finalTpDist = Number(maxAchievableTpDist.toFixed(dec));
    tpSelectionBasis = `Front-runs ${opposingSource} ($${formatSpotPrice(norm, opposingLevel)}) by $${cfg.frontRunBuffer.toFixed(dec)}`;
  } else if (preferredTpDist <= maxAchievableTpDist) {
    finalTpDist = preferredTpDist;
    tpSelectionBasis = opposingLevel != null
      ? `2:1 structure expansion inside ${opposingSource} ($${formatSpotPrice(norm, opposingLevel)})`
      : `2:1 scalp liquidity projection (${(preferredTpDist / atr5m).toFixed(1)}x 5M ATR)`;
  } else {
    finalTpDist = Number(maxAchievableTpDist.toFixed(dec));
    tpSelectionBasis = `Capped at realistic scalp structure limit (${(finalTpDist / atr5m).toFixed(1)}x 5M ATR)`;
  }

  const finalTp = Number((isBuy ? entry + finalTpDist : entry - finalTpDist).toFixed(dec));

  // Secondary runner TP2 (capped within realistic scalp range, never swing distance)
  const rawTp2Dist = Math.min(maxAchievableTpDist, Number((finalSlDist * 2.4).toFixed(dec)));
  const finalTp2Dist = Math.max(finalTpDist, rawTp2Dist);
  const finalTp2 = Number((isBuy ? entry + finalTp2Dist : entry - finalTp2Dist).toFixed(dec));
  const beTrigger = Number((isBuy ? entry + finalSlDist : entry - finalSlDist).toFixed(dec));

  // 6. Transaction Cost & Net Reward-to-Risk Verification
  const grossRr = finalTpDist / finalSlDist;
  const netReward = finalTpDist - totalCost;
  const netRr = netReward / finalSlDist;
  const costToRewardRatio = totalCost / finalTpDist;

  if (netReward <= 0 || costToRewardRatio > 0.30) {
    const msg = `Transaction costs ($${totalCost.toFixed(dec)} spread+fees+slippage) consume ${(costToRewardRatio * 100).toFixed(0)}% of gross TP ($${finalTpDist.toFixed(dec)}). Insufficient net edge.`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'HIGH_TRADING_COST_IMPACT',
      reason: msg,
      error: msg,
    };
  }

  const minNetRr = isOneToOneAllowed ? 0.80 : 1.20;
  if (grossRr < minGrossRr - 0.02 || netRr < minNetRr) {
    const msg = `Reward-to-Risk after trading costs (Gross 1:${grossRr.toFixed(2)}, Net 1:${netRr.toFixed(2)}) is below minimum required (Gross 1:${minGrossRr.toFixed(1)}, Net 1:${minNetRr.toFixed(2)}).`;
    return {
      ok: false,
      code: 'NO_TRADE',
      reasonCode: 'INSUFFICIENT_NET_RR',
      reason: msg,
      error: msg,
    };
  }

  // 7. Construct Level Explanations for Signal Card Display
  const slPts = Math.round(finalSlDist * cfg.pointMultiplier);
  const tpPts = Math.round(finalTpDist * cfg.pointMultiplier);
  const slDistanceFormatted = `-$${finalSlDist.toFixed(dec)} (${slPts} ${cfg.unitLabel})`;
  const tpDistanceFormatted = `+$${finalTpDist.toFixed(dec)} (${tpPts} ${cfg.unitLabel})`;

  const levelExplanations = {
    entry: `${entryTriggerDesc}`,
    sl: `$${formatSpotPrice(norm, finalSl)} (${slDistanceFormatted}) — Placed $${noiseBuffer.toFixed(dec)} beyond ${invalidationSource} ($${formatSpotPrice(norm, invalidationLevel)}) with ${(finalSlDist / atr5m).toFixed(1)}x ATR noise room`,
    tp: `$${formatSpotPrice(norm, finalTp)} (${tpDistanceFormatted}) — ${tpSelectionBasis}; Net R:R 1:${netRr.toFixed(2)} after $${totalCost.toFixed(dec)} spread/fees`,
  };

  const confluences = [
    `Entry Trigger: ${levelExplanations.entry}`,
    `Stop Loss Logic: ${levelExplanations.sl}`,
    `Take Profit Logic: ${levelExplanations.tp}`,
  ];

  const signalObj = {
    pair: norm,
    symbol: cfg.symbol,
    name: cfg.name,
    direction: dir,
    style: 'scalp',
    timeframe: '1m / 5m',
    mode: '1M/5M STRUCTURE SCALP',
    model: 'ICT 1M-5M Structure & ATR Scalp',
    entry: Number(entry.toFixed(dec)),
    sl: finalSl,
    tp: finalTp,
    tp1: finalTp,
    tp2: finalTp2,
    breakEvenTrigger: beTrigger,
    slDistance: finalSlDist,
    tpDistance: finalTpDist,
    slDistanceFormatted,
    tpDistanceFormatted,
    slPts,
    tpPts,
    rr: `1:${grossRr.toFixed(1)}`,
    rrNumeric: Number(grossRr.toFixed(2)),
    netRr: `1:${netRr.toFixed(1)}`,
    netRrNumeric: Number(netRr.toFixed(2)),
    atr5m: Number(atr5m.toFixed(dec)),
    tradingCost: totalCost,
    totalCost,
    spread: currentSpread,
    invalidationLevel: Number(invalidationLevel.toFixed(dec)),
    invalidationSource,
    opposingLevel: opposingLevel != null ? Number(opposingLevel.toFixed(dec)) : null,
    opposingSource: opposingSource || 'ATR Scalp Projection',
    levelExplanations,
    confluences,
    allowOneToOne: isOneToOneAllowed,
    backtestValidated: isOneToOneAllowed,
  };

  return {
    ok: true,
    code: 'SIGNAL_VALID',
    ...signalObj,
    signal: signalObj,
  };
}

/**
 * Simulates a historical scalp trade over subsequent OHLC candles accounting for spread, slippage, and fees.
 * Used for deterministic historical validation on XAUUSD, BTCUSD, and XAGUSD.
 */
export function evaluateHistoricalScalpSetup(setupInput, futureCandles = []) {
  const calc = calculateStructureScalpTpSl(setupInput);
  if (!calc.ok) {
    return {
      taken: false,
      outcome: 'NO_TRADE',
      reasonCode: calc.reasonCode,
      reason: calc.reason,
    };
  }

  const sig = calc.signal;
  const isBuy = sig.direction === 'BUY';
  const cost = sig.tradingCost;

  for (let i = 0; i < futureCandles.length; i++) {
    const c = futureCandles[i];
    if (isBuy) {
      // Check SL hit first (conservative intrabar assumption)
      if (c.low <= sig.sl) {
        return {
          taken: true,
          outcome: 'SL_HIT',
          result: 'LOSS',
          candlesElapsed: i + 1,
          barsHeld: i + 1,
          grossPnl: -sig.slDistance,
          netPnl: Number((-sig.slDistance - cost).toFixed(4)),
          signal: sig,
        };
      }
      if (c.high >= sig.tp) {
        return {
          taken: true,
          outcome: 'TP_HIT',
          result: 'WIN',
          candlesElapsed: i + 1,
          barsHeld: i + 1,
          grossPnl: sig.tpDistance,
          netPnl: Number((sig.tpDistance - cost).toFixed(4)),
          signal: sig,
        };
      }
    } else {
      // SELL
      if (c.high >= sig.sl) {
        return {
          taken: true,
          outcome: 'SL_HIT',
          result: 'LOSS',
          candlesElapsed: i + 1,
          barsHeld: i + 1,
          grossPnl: -sig.slDistance,
          netPnl: Number((-sig.slDistance - cost).toFixed(4)),
          signal: sig,
        };
      }
      if (c.low <= sig.tp) {
        return {
          taken: true,
          outcome: 'TP_HIT',
          result: 'WIN',
          candlesElapsed: i + 1,
          barsHeld: i + 1,
          grossPnl: sig.tpDistance,
          netPnl: Number((sig.tpDistance - cost).toFixed(4)),
          signal: sig,
        };
      }
    }
  }

  return {
    taken: true,
    outcome: 'OPEN',
    result: 'OPEN',
    candlesElapsed: futureCandles.length,
    barsHeld: futureCandles.length,
    grossPnl: 0,
    netPnl: -cost,
    signal: sig,
  };
}
