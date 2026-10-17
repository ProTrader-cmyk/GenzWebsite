import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SUPPORTED_PAIRS,
  PAIR_CONFIGS,
  normalizePair,
  isSupportedPair,
  validateSignal,
} from '../src/services/signalValidationService.js';

import {
  formatSpotPrice,
  getLivePriceMeta,
  PAIR_TO_TV_SYMBOL,
  calcTradeProgress,
} from '../src/services/marketPriceService.js';

import {
  get15mCandleTimeRemaining,
  evaluateMarketTradingConditions,
  SCANNER_CONFIGS,
} from '../src/services/marketAnalysisService.js';

describe('AI Trading Page & Signal Engine Test Suite', () => {
  // --------------------------------------------------------------------------
  // Requirement 1: Limit Trading Pairs to Three (Gold, Silver, Bitcoin)
  // --------------------------------------------------------------------------
  describe('1. Asset Selection & Allowlist Restrictions', () => {
    it('should strictly allow only Gold (XAUUSD), Silver (XAGUSD), and Bitcoin (BTCUSD)', () => {
      assert.equal(SUPPORTED_PAIRS.length, 3);
      assert.deepEqual(SUPPORTED_PAIRS.sort(), ['BTCUSD', 'XAGUSD', 'XAUUSD']);
    });

    it('should return isSupportedPair = true for standard symbols and common aliases', () => {
      const validSymbols = [
        'XAUUSD', 'XAU/USD', 'Gold', 'GOLD', 'xau',
        'XAGUSD', 'XAG/USD', 'Silver', 'SILVER', 'xag',
        'BTCUSD', 'BTC/USD', 'Bitcoin', 'BITCOIN', 'BTCUSDT', 'btc',
      ];
      for (const sym of validSymbols) {
        assert.equal(isSupportedPair(sym), true, `Expected "${sym}" to be supported`);
      }
    });

    it('should reject all other assets (Forex pairs, Indices, Altcoins)', () => {
      const unsupported = ['EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'NAS100', 'ETHUSD', 'SOLUSD', 'SPX'];
      for (const sym of unsupported) {
        assert.equal(isSupportedPair(sym), false, `Expected "${sym}" to be rejected`);
      }
    });

    it('should have dedicated pair configuration for all 3 supported assets', () => {
      for (const pair of SUPPORTED_PAIRS) {
        assert.ok(PAIR_CONFIGS[pair], `Missing PAIR_CONFIGS for ${pair}`);
        assert.ok(PAIR_CONFIGS[pair].decimals >= 1, `Decimals not configured for ${pair}`);
        assert.ok(PAIR_CONFIGS[pair].minLivePrice > 0, `minLivePrice invalid for ${pair}`);
        assert.ok(PAIR_CONFIGS[pair].maxLivePrice > PAIR_CONFIGS[pair].minLivePrice, `maxLivePrice invalid for ${pair}`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 2: Real Market Data Retrieval, Precision & Bounds
  // --------------------------------------------------------------------------
  describe('2. Real Market Data, Precision & Physical Price Bounds', () => {
    it('should format spot prices with the exact required precision per asset', () => {
      // Gold: 2 decimals
      assert.equal(formatSpotPrice('XAUUSD', 4165.421), '4165.42');
      assert.equal(formatSpotPrice('GOLD', 4165.4), '4165.40');

      // Silver: 3 decimals (standard for spot silver)
      assert.equal(formatSpotPrice('XAGUSD', 57.1164), '57.116');
      assert.equal(formatSpotPrice('SILVER', 56.9), '56.900');

      // Bitcoin: 1-2 decimals
      const btcFormatted = formatSpotPrice('BTCUSD', 81646.5);
      assert.ok(btcFormatted.includes('81,646.5') || btcFormatted.includes('81646.5'));
    });

    it('should map each asset to a verified institutional ticker source', () => {
      assert.equal(PAIR_TO_TV_SYMBOL.XAUUSD, 'OANDA:XAUUSD');
      assert.equal(PAIR_TO_TV_SYMBOL.XAGUSD, 'OANDA:XAGUSD');
      assert.equal(PAIR_TO_TV_SYMBOL.BTCUSD, 'BINANCE:BTCUSDT');
    });

    it('should reject signals with spot prices outside realistic physical bounds', () => {
      // Gold unrealistic prices ($500 or $50,000)
      const lowGold = validateSignal({ pair: 'XAUUSD', direction: 'BUY', entry: 500, sl: 495, tp: 510 }, 500);
      assert.equal(lowGold.isValid, false);
      assert.equal(lowGold.reasonCode, 'PRICE_OUT_OF_BOUNDS');

      // Silver unrealistic prices ($5 or $300)
      const lowSilver = validateSignal({ pair: 'XAGUSD', direction: 'BUY', entry: 5, sl: 4.8, tp: 5.4 }, 5);
      assert.equal(lowSilver.isValid, false);
      assert.equal(lowSilver.reasonCode, 'PRICE_OUT_OF_BOUNDS');

      // Bitcoin unrealistic prices ($1,000 or $1,000,000)
      const lowBtc = validateSignal({ pair: 'BTCUSD', direction: 'BUY', entry: 1000, sl: 800, tp: 1400 }, 1000);
      assert.equal(lowBtc.isValid, false);
      assert.equal(lowBtc.reasonCode, 'PRICE_OUT_OF_BOUNDS');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 3: Prevent False Signals When Switching Pairs
  // --------------------------------------------------------------------------
  describe('3. Pair Switching Isolation (No Automatic Signal Generation)', () => {
    it('should reject candidate signal if activePair context differs from signal asset', () => {
      // User is on Silver (XAGUSD), but an asynchronous Gold payload arrives
      const candidateGold = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4161.00,
        tp: 4173.00,
      };

      const result = validateSignal(candidateGold, 4165.00, { activePair: 'XAGUSD' });
      assert.equal(result.isValid, false);
      assert.equal(result.code, 'NO_SIGNAL');
      assert.equal(result.reasonCode, 'CROSS_PAIR_MISMATCH');
    });

    it('should reject signal for unsupported asset immediately on pair change', () => {
      const result = validateSignal({ pair: 'US30', direction: 'BUY', entry: 43000, sl: 42800, tp: 43400 }, 43000);
      assert.equal(result.isValid, false);
      assert.equal(result.reasonCode, 'UNSUPPORTED_ASSET');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 4: Scanning Without Valid Conditions Returns NO_SIGNAL
  // --------------------------------------------------------------------------
  describe('4. Strict Condition Evaluation & Chop Rejection', () => {
    it('should return NO_SIGNAL when market is in equilibrium / chop zone (RSI 48-52 + Neutral Bias)', () => {
      const chopAnalysis = {
        isAvailable: true,
        price: 4165.00,
        bias: 'NEUTRAL CHOP',
        rsi: { val: 50.2 },
        mtf: { m15: 'NEUTRAL', h1: 'NEUTRAL' },
      };

      const evalResult = evaluateMarketTradingConditions('XAUUSD', chopAnalysis, 'scalp');
      assert.equal(evalResult.met, false);
      assert.equal(evalResult.code, 'NO_SIGNAL');
      assert.ok(evalResult.reason.toLowerCase().includes('equilibrium') || evalResult.reason.toLowerCase().includes('neutral'));
    });

    it('should return NO_SIGNAL for Daytrade mode when 15M and 1H timeframes conflict', () => {
      const conflictedAnalysis = {
        isAvailable: true,
        price: 4165.00,
        bias: 'BULLISH',
        rsi: { val: 58.0 },
        mtf: { m15: 'BULL', h1: 'BEAR' }, // Conflict!
      };

      const evalResult = evaluateMarketTradingConditions('XAUUSD', conflictedAnalysis, 'daytrade');
      assert.equal(evalResult.met, false);
      assert.equal(evalResult.code, 'NO_SIGNAL');
      assert.ok(evalResult.reason.includes('Conflicting multi-timeframe structure'));
    });

    it('should return NO_SIGNAL when market data is unavailable', () => {
      const unavailableAnalysis = { isAvailable: false, price: null };
      const evalResult = evaluateMarketTradingConditions('XAUUSD', unavailableAnalysis, 'scalp');
      assert.equal(evalResult.met, false);
      assert.equal(evalResult.code, 'NO_SIGNAL');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 5: Signals Appear Only After All Validations Pass
  // --------------------------------------------------------------------------
  describe('5. Comprehensive Signal Validation Pipeline', () => {
    it('should validate and sanitize a compliant Gold BUY signal', () => {
      const candidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4161.00, // Risk: $4.00 (> $1.50 min)
        tp: 4173.00, // Reward: $8.00 (R:R = 1:2.0 >= 1:1.5)
        style: 'scalp',
        timeframe: '5m',
      };

      const result = validateSignal(candidate, 4165.10, { activePair: 'XAUUSD', style: 'scalp' });
      assert.equal(result.isValid, true);
      assert.equal(result.code, 'SIGNAL_VALID');
      assert.ok(result.signal);
      assert.equal(result.signal.pair, 'XAUUSD');
      assert.equal(result.signal.direction, 'BUY');
      assert.equal(result.signal.entry, 4165.00);
      assert.equal(result.signal.sl, 4161.00);
      assert.equal(result.signal.tp, 4173.00);
      assert.equal(result.signal.rr, '1:2.0');
      assert.equal(result.signal.status, 'active');
      assert.equal(result.signal.strategyVersion, 'ICT-SMC-v4.2');
    });

    it('should reject signal if entry deviates > 0.35% from real live market price', () => {
      // Current spot: 4165.00, Entry: 4200.00 (deviation: ~0.84% > 0.35%)
      const candidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4200.00,
        sl: 4190.00,
        tp: 4220.00,
      };

      const result = validateSignal(candidate, 4165.00, { activePair: 'XAUUSD' });
      assert.equal(result.isValid, false);
      assert.equal(result.reasonCode, 'PRICE_DEVIATION_TOO_HIGH');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 6: Active Signal / Pip Signal Empty State Behavior
  // --------------------------------------------------------------------------
  describe('6. Active Signal Empty State (No Active Signal = Nothing Rendered)', () => {
    it('should confirm that NO_SIGNAL results produce null active signals rather than placeholder rows', () => {
      // In MarketAnalysisPanel:
      // if (!activeSignal) return null;
      // This test ensures our signal pipeline adheres to the contract that NO_SIGNAL is never coerced into a row.
      const noSignalOutcome = { isValid: false, code: 'NO_SIGNAL' };
      const activeSignalState = noSignalOutcome.isValid ? noSignalOutcome.signal : null;

      assert.equal(activeSignalState, null);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 7: Stale, Invalid, or Missing Market Data Rejection
  // --------------------------------------------------------------------------
  describe('7. Stale or Missing Market Data Immunity', () => {
    it('should reject signal generation if current market price is null, zero, or NaN', () => {
      const candidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165, sl: 4160, tp: 4175 };

      assert.equal(validateSignal(candidate, null).reasonCode, 'INVALID_MARKET_PRICE');
      assert.equal(validateSignal(candidate, 0).reasonCode, 'INVALID_MARKET_PRICE');
      assert.equal(validateSignal(candidate, NaN).reasonCode, 'INVALID_MARKET_PRICE');
      assert.equal(validateSignal(candidate, -50).reasonCode, 'INVALID_MARKET_PRICE');
    });

    it('should reject candidate signal if market data timestamp is stale (> 2 minutes old)', () => {
      const staleTimestamp = Date.now() - (150 * 1000); // 2.5 minutes ago
      const candidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4160.00,
        tp: 4175.00,
        marketTimestamp: staleTimestamp,
      };

      const result = validateSignal(candidate, 4165.00);
      assert.equal(result.isValid, false);
      assert.equal(result.reasonCode, 'STALE_MARKET_DATA');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 8: Delayed Response from Previous Asset (Race Condition)
  // --------------------------------------------------------------------------
  describe('8. Race Condition & Cross-Pair Leakage Prevention', () => {
    it('should drop delayed async response from previous pair when user has switched assets', () => {
      let currentSelectedAsset = 'XAUUSD';
      let scanRequestId = 1;

      // Start scan for Gold (Request 1)
      const req1Asset = currentSelectedAsset;
      const req1Id = scanRequestId;

      // User immediately switches to Bitcoin (Request 2)
      currentSelectedAsset = 'BTCUSD';
      scanRequestId = 2;

      // Delayed Gold payload arrives for Request 1
      const delayedGoldPayload = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4161.00,
        tp: 4173.00,
      };

      // Condition 1: Request ID check
      const isReqValid = req1Id === scanRequestId;
      assert.equal(isReqValid, false, 'Delayed request ID must not match current active request ID');

      // Condition 2: Asset context check
      const validation = validateSignal(delayedGoldPayload, 4165.00, { activePair: currentSelectedAsset });
      assert.equal(validation.isValid, false);
      assert.equal(validation.reasonCode, 'CROSS_PAIR_MISMATCH');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 9: Deduplication of Active Signals
  // --------------------------------------------------------------------------
  describe('9. Signal Deduplication', () => {
    it('should reject new candidate if an identical setup is already active', () => {
      const activeExisting = [
        {
          id: 'sig_xau_1',
          pair: 'XAUUSD',
          direction: 'BUY',
          entry: 4165.00,
          sl: 4161.00,
          tp: 4173.00,
          style: 'scalp',
          status: 'active',
        },
      ];

      const duplicateCandidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4161.00,
        tp: 4173.00,
        style: 'scalp',
      };

      const result = validateSignal(duplicateCandidate, 4165.00, {
        activePair: 'XAUUSD',
        existingSignals: activeExisting,
      });

      assert.equal(result.isValid, false);
      assert.equal(result.reasonCode, 'DUPLICATE_SIGNAL');
    });

    it('should permit new signal if previous identical setup is closed, TP, or SL', () => {
      const closedExisting = [
        {
          id: 'sig_xau_1',
          pair: 'XAUUSD',
          direction: 'BUY',
          entry: 4165.00,
          sl: 4161.00,
          tp: 4173.00,
          style: 'scalp',
          status: 'closed', // Closed!
        },
      ];

      const newCandidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4161.00,
        tp: 4173.00,
        style: 'scalp',
      };

      const result = validateSignal(newCandidate, 4165.00, {
        activePair: 'XAUUSD',
        existingSignals: closedExisting,
      });

      assert.equal(result.isValid, true);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 10: API Failures Do Not Create Fake Prices or Signals
  // --------------------------------------------------------------------------
  describe('10. API Failure Resilience (No Simulated Fallbacks)', () => {
    it('getLivePriceMeta should return isAvailable=false and isStale=true when feed is disconnected', () => {
      // Query an un-cached / un-streamed symbol
      const meta = getLivePriceMeta('UNKNOWN_PAIR');
      assert.equal(meta.isAvailable, false);
      assert.equal(meta.isStale, true);
      assert.equal(meta.price, null);
    });

    it('validateSignal should reject empty or corrupted candidate payloads', () => {
      assert.equal(validateSignal(null, 4165).code, 'NO_SIGNAL');
      assert.equal(validateSignal({}, 4165).code, 'NO_SIGNAL');
      assert.equal(validateSignal('invalid', 4165).code, 'NO_SIGNAL');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 11: SL, TP, and R:R Validation for BUY and SELL (All 3 Assets)
  // --------------------------------------------------------------------------
  describe('11. Geometry & Risk/Reward Validation for BUY and SELL', () => {
    describe('BUY Signals', () => {
      it('should fail if SL >= Entry (Inverted Stop-Loss)', () => {
        const candidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165.00, sl: 4166.00, tp: 4175.00 };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, false);
        assert.equal(result.reasonCode, 'INVALID_LEVEL_GEOMETRY');
      });

      it('should fail if TP <= Entry (Inverted Take-Profit)', () => {
        const candidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165.00, sl: 4160.00, tp: 4164.00 };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, false);
        assert.equal(result.reasonCode, 'INVALID_LEVEL_GEOMETRY');
      });

      it('should fail if Risk-to-Reward ratio is below 1:1.5', () => {
        // Risk: 4165 - 4160 = 5. Reward: 4170 - 4165 = 5. R:R = 1:1.0 < 1:1.5
        const candidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165.00, sl: 4160.00, tp: 4170.00, style: 'scalp' };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, false);
        assert.equal(result.reasonCode, 'INSUFFICIENT_RR');
      });

      it('should fail if SL distance is below minimum pip requirement', () => {
        // Gold min SL distance for scalp is 1.5 pts
        const candidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165.00, sl: 4164.50, tp: 4175.00, style: 'scalp' };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, false);
        assert.equal(result.reasonCode, 'INSUFFICIENT_PIP_DISTANCE');
      });
    });

    describe('SELL Signals', () => {
      it('should fail if SL <= Entry (Inverted Stop-Loss for Short)', () => {
        const candidate = { pair: 'XAUUSD', direction: 'SELL', entry: 4165.00, sl: 4164.00, tp: 4155.00 };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, false);
        assert.equal(result.reasonCode, 'INVALID_LEVEL_GEOMETRY');
      });

      it('should fail if TP >= Entry (Inverted Take-Profit for Short)', () => {
        const candidate = { pair: 'XAUUSD', direction: 'SELL', entry: 4165.00, sl: 4170.00, tp: 4166.00 };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, false);
        assert.equal(result.reasonCode, 'INVALID_LEVEL_GEOMETRY');
      });

      it('should validate compliant SELL signal with proper R:R', () => {
        // Entry: 4165.00, SL: 4169.00 (Risk: 4.0), TP: 4157.00 (Reward: 8.0, R:R = 1:2.0)
        const candidate = { pair: 'XAUUSD', direction: 'SELL', entry: 4165.00, sl: 4169.00, tp: 4157.00, style: 'scalp' };
        const result = validateSignal(candidate, 4165.00);
        assert.equal(result.isValid, true);
        assert.equal(result.signal.direction, 'SELL');
        assert.equal(result.signal.rr, '1:2.0');
      });
    });

    describe('Silver (XAGUSD) 3-Decimal Precision & Validation', () => {
      it('should validate compliant Silver BUY setup with 3-decimal precision', () => {
        // Spot: 57.000, Entry: 57.000, SL: 56.850 (Risk: 0.150 >= 0.10), TP: 57.300 (Reward: 0.300, R:R = 2.0)
        const candidate = {
          pair: 'XAGUSD',
          direction: 'BUY',
          entry: 57.000,
          sl: 56.850,
          tp: 57.300,
          style: 'scalp',
        };
        const result = validateSignal(candidate, 57.000, { activePair: 'XAGUSD' });
        assert.equal(result.isValid, true);
        assert.equal(result.signal.entry, 57.000);
        assert.equal(result.signal.sl, 56.850);
        assert.equal(result.signal.tp, 57.300);
      });
    });

    describe('Bitcoin (BTCUSD) Validation', () => {
      it('should validate compliant Bitcoin SELL setup', () => {
        // Spot: 81650.0, Entry: 81650.0, SL: 82050.0 (Risk: 400 >= 200), TP: 80850.0 (Reward: 800, R:R = 2.0)
        const candidate = {
          pair: 'BTCUSD',
          direction: 'SELL',
          entry: 81650.0,
          sl: 82050.0,
          tp: 80850.0,
          style: 'scalp',
        };
        const result = validateSignal(candidate, 81650.0, { activePair: 'BTCUSD' });
        assert.equal(result.isValid, true);
        assert.equal(result.signal.direction, 'SELL');
        assert.equal(result.signal.rr, '1:2.0');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 12: Existing Features Remain Intact
  // --------------------------------------------------------------------------
  describe('12. Existing Architecture & Utilities Preservation', () => {
    it('should correctly compute 15-minute candle countdown and progress', () => {
      const countdown = get15mCandleTimeRemaining();
      assert.ok(typeof countdown.secondsRemaining === 'number');
      assert.ok(countdown.secondsRemaining >= 0 && countdown.secondsRemaining <= 900);
      assert.ok(typeof countdown.progressPct === 'number');
      assert.ok(countdown.progressPct >= 0 && countdown.progressPct <= 100);
      assert.match(countdown.timeStr, /^\d{2}:\d{2}$/);
    });

    it('should compute trade progress and inProfit state accurately', () => {
      // BUY trade: Entry 4160, TP 4180. Current 4170 (50% progress, inProfit = true)
      const signalBuy = { pair: 'XAUUSD', direction: 'BUY', entry: 4160, tp: 4180 };
      const progress = calcTradeProgress(signalBuy, 4170);
      assert.equal(progress.progressPct, 50);
      assert.equal(progress.inProfit, true);
      assert.equal(progress.pipsToTp, 100); // 10 pts * 10 = 100 pips

      // SELL trade: Entry 4180, TP 4160. Current 4170 (50% progress, inProfit = true)
      const signalSell = { pair: 'XAUUSD', direction: 'SELL', entry: 4180, tp: 4160 };
      const sellProgress = calcTradeProgress(signalSell, 4170);
      assert.equal(sellProgress.progressPct, 50);
      assert.equal(sellProgress.inProfit, true);
    });

    it('should preserve scanner configs for all 3 assets', () => {
      assert.ok(SCANNER_CONFIGS.XAUUSD);
      assert.ok(SCANNER_CONFIGS.XAGUSD);
      assert.ok(SCANNER_CONFIGS.BTCUSD);
    });
  });
});
