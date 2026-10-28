import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_LOT_SIZE,
  INSTRUMENT_SPECS,
  getInstrumentSpecs,
  lotsToUnits,
  calculateTradePnl,
  calculatePlannedRiskReward,
  calculateUnrealizedPnl,
} from '../src/services/tradePnlService.js';

describe('tradePnlService - Institutional 0.03 Lot & P/L Engine', () => {
  describe('1. Fixed 0.03 Lot Standard & Specifications', () => {
    it('STANDARD_LOT_SIZE must be strictly 0.03', () => {
      assert.equal(STANDARD_LOT_SIZE, 0.03);
    });

    it('XAUUSD contract size is 100 oz per lot, so 0.03 lot = exactly 3.0 oz', () => {
      const specs = getInstrumentSpecs('XAUUSD');
      assert.equal(specs.contractSize, 100);
      assert.equal(specs.unitLabel, 'oz');
      assert.equal(lotsToUnits(0.03, 'XAUUSD'), 3.0);
    });

    it('XAGUSD contract size is 5000 oz per lot, so 0.03 lot = 150.0 oz', () => {
      const specs = getInstrumentSpecs('XAGUSD');
      assert.equal(specs.contractSize, 5000);
      assert.equal(lotsToUnits(0.03, 'XAGUSD'), 150.0);
    });

    it('BTCUSD contract size is 1 BTC per lot, so 0.03 lot = 0.03 BTC', () => {
      const specs = getInstrumentSpecs('BTCUSD');
      assert.equal(specs.contractSize, 1);
      assert.equal(lotsToUnits(0.03, 'BTCUSD'), 0.03);
    });

    it('falls back to 0.03 lot when lot size is missing or invalid', () => {
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4129.32,
        exitPrice: 4123.28,
        lotSize: null,
      });
      assert.equal(res.lotSize, 0.03);
      assert.equal(res.units, 3.0);
    });
  });

  describe('2. User Exact Real-World Example Verification', () => {
    // User specifications:
    // Symbol: XAUUSD
    // Direction: SELL
    // Entry price: 4,129.32
    // Take-profit price: 4,123.28
    // Position size: 0.03 lots
    // Price movement: $6.04
    // Expected gross profit: (4,129.32 - 4,123.28) * 100 * 0.03 = $18.12 USD
    it('calculates exactly $18.12 USD for the user example trade', () => {
      const result = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4129.32,
        exitPrice: 4123.28,
        lotSize: 0.03,
      });

      assert.equal(result.symbol, 'XAUUSD');
      assert.equal(result.direction, 'SELL');
      assert.equal(result.entryPrice, 4129.32);
      assert.equal(result.exitPrice, 4123.28);
      assert.equal(result.priceChange, 6.04);
      assert.equal(result.units, 3.0);
      assert.equal(result.grossPnl, 18.12);
      assert.equal(result.netPnl, 18.12);
      assert.equal(result.formattedGrossPnl, '+$18.12');
      assert.equal(result.isWin, true);
      assert.equal(result.isLoss, false);
      assert.equal(result.isBreakEven, false);
    });

    it('computes exact 2.00R planned Risk-to-Reward for 4129.32 entry, 4132.34 SL, 4123.28 TP', () => {
      const plan = calculatePlannedRiskReward({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4129.32,
        slPrice: 4132.34,
        tpPrice: 4123.28,
        lotSize: 0.03,
      });

      assert.equal(plan.riskDistance, 3.02);
      assert.equal(plan.rewardDistance, 6.04);
      assert.equal(plan.riskUsd, 9.06);
      assert.equal(plan.rewardUsd, 18.12);
      assert.equal(plan.rrRatio, 2.0);
      assert.equal(plan.rrFormatted, '1:2.0');
    });
  });

  describe('3. Core BUY / SELL Formulas & Outcomes', () => {
    it('BUY trade reaching TP: Gross P/L = (Exit - Entry) * 100 * 0.03', () => {
      // Entry 4100.00, Exit 4105.00 (+5.00 pts move)
      // Units: 3.0 oz. Gross: 5.00 * 3.0 = $15.00
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4100.00,
        exitPrice: 4105.00,
        lotSize: 0.03,
      });
      assert.equal(res.priceChange, 5.00);
      assert.equal(res.grossPnl, 15.00);
      assert.equal(res.formattedGrossPnl, '+$15.00');
      assert.equal(res.isWin, true);
    });

    it('BUY trade hitting SL: Gross P/L = (Exit - Entry) * 100 * 0.03', () => {
      // Entry 4100.00, Exit 4097.50 (-2.50 pts move)
      // Units: 3.0 oz. Gross: -2.50 * 3.0 = -$7.50
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4100.00,
        exitPrice: 4097.50,
        lotSize: 0.03,
      });
      assert.equal(res.priceChange, -2.50);
      assert.equal(res.grossPnl, -7.50);
      assert.equal(res.formattedGrossPnl, '-$7.50');
      assert.equal(res.isLoss, true);
    });

    it('SELL trade hitting SL: Gross P/L = (Entry - Exit) * 100 * 0.03', () => {
      // Entry 4100.00, Exit 4102.50 (adverse move +2.50 on market = -2.50 for short)
      // Units: 3.0 oz. Gross: -2.50 * 3.0 = -$7.50
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4100.00,
        exitPrice: 4102.50,
        lotSize: 0.03,
      });
      assert.equal(res.priceChange, -2.50);
      assert.equal(res.grossPnl, -7.50);
      assert.equal(res.formattedGrossPnl, '-$7.50');
      assert.equal(res.isLoss, true);
    });

    it('Break-even trade: Exit = Entry -> Gross P/L = $0.00', () => {
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4120.00,
        exitPrice: 4120.00,
        lotSize: 0.03,
      });
      assert.equal(res.priceChange, 0.0);
      assert.equal(res.grossPnl, 0.0);
      assert.equal(res.isBreakEven, true);
      assert.equal(res.realizedR, 0.0);
    });

    it('Early / partial exit: calculates actual realized P/L rather than assuming full TP', () => {
      // Intraday SELL: entry 4150.00, SL 4160.00 (Risk: 10 pts = $30.00), target TP 4130.00 (+20 pts = $60.00)
      // Exits early at 4142.00 (Move: +8.00 pts for short)
      // Realized Gross: 8.00 * 3.0 = +$24.00; Realized R: 24.00 / 30.00 = +0.80R
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4150.00,
        exitPrice: 4142.00,
        slPrice: 4160.00,
        tpPrice: 4130.00,
        lotSize: 0.03,
      });
      assert.equal(res.priceChange, 8.00);
      assert.equal(res.grossPnl, 24.00);
      assert.equal(res.realizedR, 0.8);
      assert.equal(res.isWin, true);
    });
  });

  describe('4. Commission, Swap & Net P/L Separation', () => {
    it('deducts commission and swap separately without double-counting', () => {
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4100.00,
        exitPrice: 4110.00,
        lotSize: 0.03,
        commission: 0.21,
        swap: 0.15,
      });
      // Gross: 10.00 * 3 = $30.00
      // Net: 30.00 - 0.21 - 0.15 = $29.64
      assert.equal(res.grossPnl, 30.00);
      assert.equal(res.netPnl, 29.64);
      assert.equal(res.commission, 0.21);
      assert.equal(res.swap, 0.15);
      assert.equal(res.totalCosts, 0.36);
    });
  });

  describe('5. Unrealized Floating P/L Tracking', () => {
    it('tracks floating P/L dynamically with current price for BUY', () => {
      const floatPnl = calculateUnrealizedPnl({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4120.00,
        currentPrice: 4124.50,
        lotSize: 0.03,
      });
      // 4.5 pts * 3 = $13.50 floating
      assert.equal(floatPnl.unrealizedPnl, 13.50);
      assert.equal(floatPnl.unrealizedPts, 4.5);
    });

    it('tracks floating P/L dynamically with current price for SELL', () => {
      const floatPnl = calculateUnrealizedPnl({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4129.32,
        currentPrice: 4126.30,
        lotSize: 0.03,
      });
      // (4129.32 - 4126.30) = 3.02 pts * 3 = $9.06 floating
      assert.equal(floatPnl.unrealizedPnl, 9.06);
      assert.equal(floatPnl.unrealizedPts, 3.02);
    });
  });

  describe('6. Invalid Price and Safety Handling', () => {
    it('returns 0 for missing or non-positive prices safely', () => {
      const res = calculateTradePnl({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 0,
        exitPrice: 4100,
      });
      assert.equal(res.grossPnl, 0);
      assert.equal(res.netPnl, 0);
    });

    it('detects inverted stop-loss safely in planned R:R', () => {
      // Inverted BUY: SL > Entry
      const plan = calculatePlannedRiskReward({
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4100,
        slPrice: 4110,
        tpPrice: 4120,
      });
      assert.equal(plan.isValid, false);
      assert.equal(plan.error, 'Invalid BUY stop loss: SL must be below entry');
    });

    it('detects inverted take-profit safely in planned R:R', () => {
      // Inverted SELL: TP > Entry
      const plan = calculatePlannedRiskReward({
        symbol: 'XAUUSD',
        direction: 'SELL',
        entryPrice: 4100,
        slPrice: 4110,
        tpPrice: 4120,
      });
      assert.equal(plan.isValid, false);
      assert.equal(plan.error, 'Invalid SELL take profit: TP must be below entry');
    });
  });
});
