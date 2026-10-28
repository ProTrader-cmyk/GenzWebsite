/**
 * Trade Profit & Loss (P/L) & Position Sizing Service
 * 
 * Single source of truth for:
 * 1. Fixed position sizing (Default: 0.03 lots = 3.0 oz on Gold XAUUSD).
 * 2. Unambiguous BUY / SELL Gross P/L and Net P/L calculations.
 * 3. Contract specifications per asset (Gold 100 oz/lot, Silver 5000 oz/lot, BTC 1/lot, Forex 100,000/lot).
 * 4. Separate Risk-to-Reward (R:R) and realized R calculations.
 */

export const STANDARD_LOT_SIZE = 0.03;

export const INSTRUMENT_SPECS = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold Spot / U.S. Dollar',
    contractSize: 100, // 100 troy ounces per lot
    unitName: 'oz',
    unitLabel: 'oz',
    pipScale: 0.1,    // 1 pip = $0.10
    pointScale: 1.0,  // 1 point = $1.00
    decimals: 2,
    defaultSpread: 0.15,     // $0.15 per oz
    defaultCommission: 0.06, // $0.06 per oz
    defaultSlippage: 0.04,   // $0.04 per oz
  },
  XAGUSD: {
    symbol: 'XAGUSD',
    name: 'Silver Spot / U.S. Dollar',
    contractSize: 5000, // 5,000 troy ounces per lot
    unitName: 'oz',
    unitLabel: 'oz',
    pipScale: 0.01,
    pointScale: 0.001,
    decimals: 3,
    defaultSpread: 0.010,
    defaultCommission: 0.005,
    defaultSlippage: 0.005,
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin / U.S. Dollar',
    contractSize: 1, // 1 BTC per lot
    unitName: 'BTC',
    unitLabel: 'BTC',
    pipScale: 1.0,
    pointScale: 1.0,
    decimals: 2,
    defaultSpread: 5.0,
    defaultCommission: 2.0,
    defaultSlippage: 2.0,
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / U.S. Dollar',
    contractSize: 100000,
    unitName: 'units',
    unitLabel: 'units',
    pipScale: 0.0001,
    pointScale: 0.00001,
    decimals: 5,
    defaultSpread: 0.00010,
    defaultCommission: 0.00003,
    defaultSlippage: 0.00002,
  },
};

/**
 * Returns instrument specifications for a given pair symbol.
 */
export function getInstrumentSpecs(pair) {
  const norm = String(pair || 'XAUUSD').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (norm.includes('XAU') || norm.includes('GOLD')) return INSTRUMENT_SPECS.XAUUSD;
  if (norm.includes('XAG') || norm.includes('SILVER')) return INSTRUMENT_SPECS.XAGUSD;
  if (norm.includes('BTC')) return INSTRUMENT_SPECS.BTCUSD;
  if (norm.includes('EUR')) return INSTRUMENT_SPECS.EURUSD;
  return INSTRUMENT_SPECS.XAUUSD; // Default to Gold
}

/**
 * Calculates units/quantity from lot size.
 * For Gold (XAUUSD): 0.03 lots * 100 oz/lot = 3.0 oz.
 */
export function lotsToUnits(lotSize = STANDARD_LOT_SIZE, pair = 'XAUUSD') {
  const specs = getInstrumentSpecs(pair);
  const lots = Number(lotSize) || STANDARD_LOT_SIZE;
  return Number((lots * specs.contractSize).toFixed(4));
}

/**
 * Calculates monetary profit or loss for a completed or simulated trade.
 * 
 * Formula:
 * BUY trade:  Gross P/L = (Exit Price − Entry Price) × Contract Size × Lot Size
 * SELL trade: Gross P/L = (Entry Price − Exit Price) × Contract Size × Lot Size
 * 
 * @param {Object} params
 * @param {string} params.symbol - e.g. 'XAUUSD'
 * @param {string} params.direction - 'BUY' | 'SELL' | 'LONG' | 'SHORT'
 * @param {number} params.entryPrice - Execution entry price
 * @param {number} params.exitPrice - Execution exit price
 * @param {number} [params.lotSize=0.03] - Position size in lots
 * @param {number} [params.stopLoss] - Optional SL for R-multiple calculation
 * @param {number} [params.takeProfit] - Optional TP
 * @param {boolean} [params.includeCosts=false] - Whether to subtract spread & commission costs
 * @param {number} [params.customCosts] - Explicit total trading costs override
 */
export function calculateTradePnl({
  symbol = 'XAUUSD',
  direction = 'BUY',
  entryPrice,
  exitPrice,
  lotSize = STANDARD_LOT_SIZE,
  stopLoss = null,
  takeProfit = null,
  slPrice = null,
  tpPrice = null,
  includeCosts = false,
  customCosts = null,
  commission = 0,
  swap = 0,
}) {
  const specs = getInstrumentSpecs(symbol);
  const lots = Number(lotSize) > 0 ? Number(lotSize) : STANDARD_LOT_SIZE;
  const units = lots * specs.contractSize; // e.g. 3.0 oz for 0.03 lot Gold

  const entry = Number(entryPrice);
  const exit = Number(exitPrice);
  const effectiveSl = stopLoss != null ? stopLoss : slPrice;
  const effectiveTp = takeProfit != null ? takeProfit : tpPrice;

  if (isNaN(entry) || isNaN(exit) || entry <= 0 || exit <= 0) {
    return {
      ok: false,
      error: 'Invalid entry or exit price provided.',
      grossPnl: 0,
      netPnl: 0,
      realizedR: 0,
    };
  }

  const isBuy = String(direction).toUpperCase() === 'BUY' || String(direction).toUpperCase() === 'LONG';
  const priceDiff = isBuy ? exit - entry : entry - exit;

  // Gross P/L = priceDiff * contractSize * lotSize = priceDiff * units
  const rawGrossPnl = priceDiff * units;
  const grossPnl = Number(rawGrossPnl.toFixed(2));

  // Costs calculation
  const comm = Number(commission) || 0;
  const sw = Number(swap) || 0;
  let totalCosts = 0;
  if (customCosts !== null && customCosts !== undefined) {
    totalCosts = Math.max(0, Number(customCosts) || 0);
  } else if (includeCosts) {
    const costPerUnit = specs.defaultSpread + specs.defaultCommission + specs.defaultSlippage;
    totalCosts = Number((costPerUnit * units).toFixed(2));
  }
  totalCosts = Number((totalCosts + comm + sw).toFixed(2));

  const netPnl = Number((grossPnl - totalCosts).toFixed(2));

  // Risk & Reward in price points
  let slDistance = null;
  let plannedRisk = null;
  let realizedR = null;

  if (effectiveSl != null && !isNaN(Number(effectiveSl))) {
    const sl = Number(effectiveSl);
    slDistance = Math.abs(entry - sl);
    if (slDistance > 0) {
      plannedRisk = Number((slDistance * units).toFixed(2));
      // Realized R = Net P/L / Planned Initial Risk
      if (plannedRisk > 0) {
        realizedR = Number((netPnl / plannedRisk).toFixed(2));
      }
    }
  }

  let tpDistance = null;
  let plannedReward = null;
  let plannedRr = null;
  if (effectiveTp != null && !isNaN(Number(effectiveTp))) {
    const tp = Number(effectiveTp);
    tpDistance = Math.abs(tp - entry);
    plannedReward = Number((tpDistance * units).toFixed(2));
    if (slDistance && slDistance > 0) {
      plannedRr = Number((tpDistance / slDistance).toFixed(2));
    }
  }

  const formattedGrossPnl = `${grossPnl >= 0 ? '+' : '-'}$${Math.abs(grossPnl).toFixed(2)}`;

  return {
    ok: true,
    symbol: specs.symbol,
    direction: isBuy ? 'BUY' : 'SELL',
    entryPrice: entry,
    exitPrice: exit,
    priceDiff: Number(priceDiff.toFixed(specs.decimals)),
    priceChange: Number(priceDiff.toFixed(specs.decimals)),
    points: Number(Math.abs(priceDiff).toFixed(specs.decimals)),
    pips: Number((Math.abs(priceDiff) / specs.pipScale).toFixed(1)),
    lotSize: lots,
    contractSize: specs.contractSize,
    units,
    unitName: specs.unitName,
    grossPnl,
    formattedGrossPnl,
    commission: comm,
    swap: sw,
    totalCosts,
    netPnl,
    slDistance,
    plannedRisk,
    tpDistance,
    plannedReward,
    plannedRr,
    realizedR: realizedR !== null ? realizedR : (plannedRr && netPnl > 0 ? plannedRr : netPnl < 0 ? -1.0 : 0.0),
    isWin: netPnl > 0,
    isLoss: netPnl < 0,
    isBreakEven: netPnl === 0,
  };
}

/**
 * Calculates planned risk and reward for an active setup (before exit).
 */
export function calculatePlannedRiskReward({
  symbol = 'XAUUSD',
  direction = 'BUY',
  entryPrice,
  slPrice,
  tpPrice,
  lotSize = STANDARD_LOT_SIZE,
}) {
  const specs = getInstrumentSpecs(symbol);
  const lots = Number(lotSize) > 0 ? Number(lotSize) : STANDARD_LOT_SIZE;
  const units = lots * specs.contractSize;

  const entry = Number(entryPrice);
  const sl = Number(slPrice);
  const tp = Number(tpPrice);

  if (isNaN(entry) || isNaN(sl) || isNaN(tp) || entry <= 0 || sl <= 0 || tp <= 0) {
    return {
      ok: false,
      isValid: false,
      error: 'Invalid levels provided.',
      slDistance: 0,
      riskDistance: 0,
      tpDistance: 0,
      rewardDistance: 0,
      riskUsd: 0,
      rewardUsd: 0,
      rrRatio: 2.0,
      rrFormatted: '1:2.0',
      rrNumeric: 2.0,
    };
  }

  const isBuy = String(direction).toUpperCase() === 'BUY' || String(direction).toUpperCase() === 'LONG';

  // Geometry validation
  if (isBuy) {
    if (sl >= entry) {
      return {
        ok: false,
        isValid: false,
        error: 'Invalid BUY stop loss: SL must be below entry',
      };
    }
    if (tp <= entry) {
      return {
        ok: false,
        isValid: false,
        error: 'Invalid BUY take profit: TP must be above entry',
      };
    }
  } else {
    if (sl <= entry) {
      return {
        ok: false,
        isValid: false,
        error: 'Invalid SELL stop loss: SL must be above entry',
      };
    }
    if (tp >= entry) {
      return {
        ok: false,
        isValid: false,
        error: 'Invalid SELL take profit: TP must be below entry',
      };
    }
  }

  const slDist = Math.abs(entry - sl);
  const tpDist = Math.abs(tp - entry);

  const riskUsd = Number((slDist * units).toFixed(2));
  const rewardUsd = Number((tpDist * units).toFixed(2));
  const rrNumeric = slDist > 0 ? Number((tpDist / slDist).toFixed(2)) : 2.0;

  return {
    ok: true,
    isValid: true,
    symbol: specs.symbol,
    direction: isBuy ? 'BUY' : 'SELL',
    entryPrice: entry,
    slPrice: sl,
    tpPrice: tp,
    slDistance: Number(slDist.toFixed(specs.decimals)),
    riskDistance: Number(slDist.toFixed(specs.decimals)),
    tpDistance: Number(tpDist.toFixed(specs.decimals)),
    rewardDistance: Number(tpDist.toFixed(specs.decimals)),
    slPoints: Number(slDist.toFixed(specs.decimals)),
    tpPoints: Number(tpDist.toFixed(specs.decimals)),
    slPips: Number((slDist / specs.pipScale).toFixed(1)),
    tpPips: Number((tpDist / specs.pipScale).toFixed(1)),
    lotSize: lots,
    units,
    riskUsd,
    rewardUsd,
    rrRatio: rrNumeric,
    rrFormatted: `1:${rrNumeric.toFixed(1)}`,
    rrNumeric,
  };
}

/**
 * Calculates unrealized floating P/L for an active position against current price.
 */
export function calculateUnrealizedPnl({
  symbol = 'XAUUSD',
  direction = 'BUY',
  entryPrice,
  currentPrice,
  lotSize = STANDARD_LOT_SIZE,
}) {
  const specs = getInstrumentSpecs(symbol);
  const lots = Number(lotSize) > 0 ? Number(lotSize) : STANDARD_LOT_SIZE;
  const units = lots * specs.contractSize;
  const entry = Number(entryPrice);
  const current = Number(currentPrice);

  if (isNaN(entry) || isNaN(current) || entry <= 0 || current <= 0) {
    return { unrealizedPnl: 0, unrealizedPts: 0, units: 0, lotSize: lots };
  }

  const isBuy = String(direction).toUpperCase() === 'BUY' || String(direction).toUpperCase() === 'LONG';
  const priceDiff = isBuy ? current - entry : entry - current;
  const unrealizedPnl = Number((priceDiff * units).toFixed(2));
  const unrealizedPts = Number(priceDiff.toFixed(specs.decimals));

  return {
    unrealizedPnl,
    unrealizedPts,
    units,
    lotSize: lots,
  };
}

/**
 * Safely format monetary P/L for UI display.
 */
export function formatPnlDisplay(netPnl) {
  if (netPnl === null || netPnl === undefined || isNaN(Number(netPnl))) return '$0.00';
  const num = Number(netPnl);
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  return `${sign}$${Math.abs(num).toFixed(2)}`;
}
