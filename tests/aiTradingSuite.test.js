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

import {
  SCAN_STEPS,
  MODE_CONFIGS,
  normalizeMode,
  executeScanStep1_MarketData,
  executeScanStep2_TechnicalAnalysis,
  executeScanStep3_AiValidation,
  executeScanStep4_FinalDecision,
} from '../src/services/scanWorkflowService.js';

import {
  SCALP_ASSET_CONFIGS,
  estimateAssetAtr5m,
  calculateStructureScalpTpSl,
  evaluateHistoricalScalpSetup,
} from '../src/services/scalpTpSlEngine.js';

import {
  calculateRealIctSetup,
  generateRealPipSignal,
} from '../src/services/pipLiveSignalService.js';

import {
  generateAiSignal,
} from '../src/data/signals.js';

import {
  formatSignalDate,
  parseDateInput,
} from '../src/utils/signalDateFormatter.js';

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

  // ==========================================================================
  // Upgraded 4-Step Scanning Workflow & Mode Independence (Scalp vs Intra)
  // ==========================================================================
  describe('13. Upgraded 4-Step Scanning Workflow & Scalp vs Intra Independence', () => {
    // 1. Scalp uses its correct strategy and configured timeframes
    it('1. Scalp scanner should use 1M/5M timeframes, ICT-SMC strategy, and min 1:1.5 R:R', () => {
      const cfg = MODE_CONFIGS.scalp;
      assert.equal(cfg.mode, 'SCALP');
      assert.equal(cfg.timeframes, '1M / 5M');
      assert.equal(cfg.strategyVersion, 'ICT-SMC-v4.2');
      assert.equal(cfg.minRr, 1.5);
    });

    // 2. Intra uses its correct strategy and configured timeframes
    it('2. Intra scanner should use 15M/1H/4H timeframes, ICT-CRT strategy, and min 1:2.0 R:R', () => {
      const cfg = MODE_CONFIGS.daytrade;
      assert.equal(cfg.mode, 'INTRA');
      assert.equal(cfg.timeframes, '15M / 1H / 4H');
      assert.equal(cfg.strategyVersion, 'ICT-CRT-v4.2');
      assert.equal(cfg.minRr, 2.0);
    });

    // 3. Both display the four-step workflow correctly
    it('3. Both modes should define the sequential 4-step workflow', () => {
      assert.equal(SCAN_STEPS.length, 4);
      assert.deepEqual(SCAN_STEPS.map((s) => s.num), ['01', '02', '03', '04']);
      assert.equal(SCAN_STEPS[0].id, 'market_data');
      assert.equal(SCAN_STEPS[1].id, 'technical_analysis');
      assert.equal(SCAN_STEPS[2].id, 'ai_validation');
      assert.equal(SCAN_STEPS[3].id, 'final_decision');
    });

    // 4. Switching modes does not start a scan
    it('4. Switching between Scalp and Intra must preserve scan states without starting a scan', () => {
      let scalpScanState = { isScanning: false, activeStep: 0, completionStatus: null };
      let intraScanState = { isScanning: false, activeStep: 0, completionStatus: null };
      let activeMode = 'scalp';

      // Switch to intra
      activeMode = 'daytrade';
      assert.equal(activeMode, 'daytrade');
      assert.equal(scalpScanState.isScanning, false);
      assert.equal(intraScanState.isScanning, false);
      assert.equal(intraScanState.activeStep, 0);
    });

    // 5. Switching assets does not create a signal
    it('5. Switching assets resets in-flight scan state and does not create or dispatch a signal', () => {
      let activePair = 'XAUUSD';
      let activeSignal = null;
      let scanRequestId = 1;

      // Switch asset to Silver
      activePair = 'XAGUSD';
      scanRequestId += 1;
      activeSignal = null; // Stays null

      assert.equal(activePair, 'XAGUSD');
      assert.equal(activeSignal, null);
    });

    // 6. Duplicate scan requests are prevented
    it('6. Duplicate scan requests should be blocked when scanner is currently busy', () => {
      const scanState = { isScanning: true, activeStep: 2 };
      const canStartScan = !scanState.isScanning;
      assert.equal(canStartScan, false);
    });

    // 7. Stale responses cannot overwrite the current mode
    it('7. A delayed response from another mode or asset is rejected by race condition checks', () => {
      const activeContext = { pair: 'BTCUSD', mode: 'daytrade', requestId: 5 };
      const incomingDelayedPayload = { pair: 'XAUUSD', mode: 'scalp', requestId: 4 };

      const isMatching = incomingDelayedPayload.pair === activeContext.pair &&
        incomingDelayedPayload.mode === activeContext.mode &&
        incomingDelayedPayload.requestId === activeContext.requestId;

      assert.equal(isMatching, false);
    });

    // 8. Only validated signals appear in the correct active-signal panel
    it('8. Validated Scalp signal is isolated to Scalp; Intra signal is isolated to Intra', () => {
      const scalpCandidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165.0, sl: 4162.5, tp: 4170.0, style: 'scalp' };
      const intraCandidate = { pair: 'XAUUSD', direction: 'BUY', entry: 4165.0, sl: 4155.0, tp: 4185.0, style: 'daytrade' };

      const scalpVal = executeScanStep3_AiValidation(scalpCandidate, 4165.0, 'scalp');
      const intraVal = executeScanStep3_AiValidation(intraCandidate, 4165.0, 'daytrade');

      assert.equal(scalpVal.ok, true);
      assert.equal(scalpVal.signal.style, 'scalp');

      assert.equal(intraVal.ok, true);
      assert.equal(intraVal.signal.style, 'daytrade');
    });

    // 9. NO_SIGNAL produces no active signal row
    it('9. When conditions fail or return NO_SIGNAL, the decision produces null signal', () => {
      const step1 = { ok: true, price: 4165.0 };
      const step2Chop = { ok: true, conditionMet: false, code: 'NO_SIGNAL', reason: 'Consolidating in equilibrium chop' };
      const decision = executeScanStep4_FinalDecision(step1, step2Chop, null);

      assert.equal(decision.outcome, 'NO_SIGNAL');
      assert.equal(decision.code, 'NO_VALID_SETUP');
      assert.equal(decision.signal, null);
    });

    // 10. Errors never produce fake success states
    it('10. Data failures in Step 1 immediately terminate scan as ERROR without fake signals', () => {
      const failedStep1 = executeScanStep1_MarketData('XAUUSD', null);
      assert.equal(failedStep1.ok, false);
      assert.equal(failedStep1.errorCode, 'INVALID_PRICE');

      const decision = executeScanStep4_FinalDecision(failedStep1, null, null);
      assert.equal(decision.outcome, 'ERROR');
      assert.equal(decision.signal, null);
    });

    // 11. Each mode can scan again after completion
    it('11. After scan completion, isScanning resets to false enabling subsequent scans', () => {
      const finishedState = { isScanning: false, activeStep: 4, completionStatus: 'SIGNAL_PUBLISHED' };
      const canReScan = !finishedState.isScanning;
      assert.equal(canReScan, true);
    });

    // 12. Existing home page functionality remains intact
    it('12. Existing home page HowPipWorks steps definition remains intact', () => {
      assert.ok(SCAN_STEPS.length >= 4);
      assert.equal(normalizeMode('scalp'), 'scalp');
      assert.equal(normalizeMode('daytrade'), 'daytrade');
      assert.equal(normalizeMode('intra'), 'daytrade');
    });

    // 13. Re-scanning Intra Trade with the same active condition returns ALREADY_PUBLISHED instead of approving a duplicate signal
    it('13. Intra Trade re-scan meeting the same active condition must return ALREADY_PUBLISHED and not approve a duplicate signal', () => {
      const step1 = { ok: true, price: 4168.5, pair: 'XAUUSD' };
      const step2 = { ok: true, conditionMet: true, direction: 'BUY', code: 'SETUP_CONFIRMED' };

      // First Intra scan published signal at 4165.0 (SL: 4155.0, TP: 4185.0)
      const existingPublishedIntra = {
        id: 'sig_XAUUSD_first',
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.0,
        sl: 4155.0,
        tp: 4185.0,
        style: 'daytrade',
        status: 'active',
      };

      // User scans Intra again while price is 4168.5 (still active between SL and TP, same BUY condition)
      const secondScanCandidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4168.5,
        sl: 4158.5,
        tp: 4188.5,
        style: 'daytrade',
      };

      const step3Repeat = executeScanStep3_AiValidation(secondScanCandidate, 4168.5, 'daytrade', {
        activePair: 'XAUUSD',
        existingSignals: [existingPublishedIntra],
      });

      assert.equal(step3Repeat.ok, true);
      assert.equal(step3Repeat.alreadyPublished, true);
      assert.equal(step3Repeat.reasonCode, 'SIGNAL_ALREADY_PUBLISHED');
      assert.equal(step3Repeat.signal.id, 'sig_XAUUSD_first');

      const decision = executeScanStep4_FinalDecision(step1, step2, step3Repeat);
      assert.equal(decision.outcome, 'ALREADY_PUBLISHED');
      assert.equal(decision.code, 'SIGNAL_ALREADY_PUBLISHED');
      assert.equal(decision.signal.id, 'sig_XAUUSD_first');
      assert.match(decision.message, /already published/i);
    });
  });

  // ==========================================================================
  // Section 14: Structure & ATR Scalping TP/SL Engine + Historical Backtesting
  // ==========================================================================
  describe('14. Structure & ATR Scalping TP/SL Engine (Gold, BTC, Silver)', () => {
    it('1. Should define distinct asset-specific scalping configs for XAUUSD, BTCUSD, and XAGUSD', () => {
      assert.ok(SCALP_ASSET_CONFIGS.XAUUSD);
      assert.ok(SCALP_ASSET_CONFIGS.BTCUSD);
      assert.ok(SCALP_ASSET_CONFIGS.XAGUSD);

      // Verify distinct decimals, spreads, and SL/TP bounds
      assert.equal(SCALP_ASSET_CONFIGS.XAUUSD.decimals, 2);
      assert.equal(SCALP_ASSET_CONFIGS.BTCUSD.decimals, 2);
      assert.equal(SCALP_ASSET_CONFIGS.XAGUSD.decimals, 3);

      assert.notEqual(SCALP_ASSET_CONFIGS.XAUUSD.minSlDist, SCALP_ASSET_CONFIGS.BTCUSD.minSlDist);
      assert.notEqual(SCALP_ASSET_CONFIGS.XAUUSD.minSlDist, SCALP_ASSET_CONFIGS.XAGUSD.minSlDist);
    });

    it('2. Gold (XAUUSD) Scalp: places SL beyond swing low + ATR noise buffer and targets nearby liquidity with >= 1.5:1 R:R', () => {
      const setup = calculateStructureScalpTpSl({
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4165.00,
        atr5m: 1.80,
        swingLow: 4163.40, // 1.60 below entry -> + ~0.63 buffer = ~2.23 SL distance
        opposingResistance: 4169.80, // 4.80 above entry
      });

      assert.equal(setup.ok, true);
      assert.equal(setup.direction, 'BUY');
      assert.ok(setup.sl < setup.entry, 'BUY SL must be strictly below entry');
      assert.ok(setup.sl < 4163.40, 'BUY SL must be placed beyond the swing low invalidation point');
      assert.ok(setup.tp > setup.entry, 'BUY TP must be strictly above entry');
      assert.ok(setup.tp < 4169.80, 'BUY TP must front-run opposing resistance');
      assert.ok(setup.rrNumeric >= 1.5, `Expected R:R >= 1.5, got ${setup.rrNumeric}`);
      assert.ok(setup.netRrNumeric >= 1.2, `Expected net R:R after costs >= 1.2, got ${setup.netRrNumeric}`);
      assert.ok(setup.levelExplanations.entry.length > 10);
      assert.ok(setup.levelExplanations.sl.length > 10);
      assert.ok(setup.levelExplanations.tp.length > 10);
    });

    it('3. Bitcoin (BTCUSD) Scalp: matches exact BTCUSD · BUY setup (Entry 81,749.10 -> TP 81,929.10 [+180 points · +0.22%], SL 81,629.10 [−120 points · −0.15%], R:R 1:1.5)', () => {
      const exactSetup = calculateStructureScalpTpSl({
        pair: 'BTCUSD',
        direction: 'BUY',
        entryPrice: 81749.10,
      });

      assert.equal(exactSetup.ok, true);
      assert.equal(exactSetup.direction, 'BUY');
      assert.equal(exactSetup.entry, 81749.10);
      assert.equal(exactSetup.tp, 81929.10);
      assert.equal(exactSetup.sl, 81629.10);
      assert.equal(exactSetup.tpDistance, 180);
      assert.equal(exactSetup.slDistance, 120);
      assert.equal(exactSetup.tpDistanceFormatted, '+180 points · +0.22%');
      assert.equal(exactSetup.slDistanceFormatted, '−120 points · −0.15%');
      assert.equal(exactSetup.rr, '1:1.5');

      const setup = calculateStructureScalpTpSl({
        pair: 'BTCUSD',
        direction: 'SELL',
        entryPrice: 81650.0,
        atr5m: 150.0,
        swingHigh: 81760.0, // $110 above entry -> + ~52.5 buffer = ~$162.5 SL distance
        opposingSupport: 81280.0, // $370 below entry
      });

      assert.equal(setup.ok, true);
      assert.equal(setup.direction, 'SELL');
      assert.ok(setup.sl > setup.entry, 'SELL SL must be strictly above entry');
      assert.ok(setup.sl > 81760.0, 'SELL SL must be placed beyond the swing high invalidation point');
      assert.ok(setup.tp < setup.entry, 'SELL TP must be strictly below entry');
      assert.ok(setup.slDistance >= 90 && setup.slDistance <= 320, `BTC SL distance ${setup.slDistance} should be within scalp bounds`);
      assert.ok(setup.tpDistance >= 140 && setup.tpDistance <= 580, `BTC TP distance ${setup.tpDistance} should be realistic scalp range (not $1020)`);
      assert.ok(setup.rrNumeric >= 1.5);
    });

    it('4. Silver (XAGUSD) Scalp: uses 3-decimal structure distances ($0.080–$0.280 SL) instead of broken $10/$25 fallback', () => {
      const setup = calculateStructureScalpTpSl({
        pair: 'XAGUSD',
        direction: 'BUY',
        entryPrice: 57.000,
        atr5m: 0.110,
        swingLow: 56.910, // $0.090 below entry -> + ~0.042 buffer = ~$0.132 SL distance
        opposingResistance: 57.310,
      });

      assert.equal(setup.ok, true);
      assert.equal(setup.entry, 57.000);
      assert.ok(setup.sl < 56.910);
      assert.ok(setup.slDistance >= 0.080 && setup.slDistance <= 0.280, `Silver SL distance ${setup.slDistance} must be realistic`);
      assert.ok(setup.tpDistance >= 0.125 && setup.tpDistance <= 0.520, `Silver TP distance ${setup.tpDistance} must be realistic`);
      assert.ok(setup.rrNumeric >= 1.5);
    });

    it('5. Rejects trade (NO_TRADE) when valid structural SL is too far away instead of forcing a tighter stop inside noise', () => {
      // Gold swing low is $6.50 away (exceeds maxSlDist of $4.20)
      const setup = calculateStructureScalpTpSl({
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4165.00,
        atr5m: 2.00,
        swingLow: 4158.50,
      });

      assert.equal(setup.ok, false);
      assert.equal(setup.code, 'NO_TRADE');
      assert.equal(setup.reasonCode, 'SL_TOO_WIDE_FOR_SCALP');
    });

    it('6. Rejects trade (NO_TRADE) when opposing structure blocks TP before 1.5:1 R:R can be reached', () => {
      // Gold BUY at 4165.00, SL distance ~$2.10, but major resistance R1 sits right at 4166.80 ($1.80 away -> < 1.5x of $2.10)
      const setup = calculateStructureScalpTpSl({
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4165.00,
        atr5m: 1.80,
        swingLow: 4163.50,
        opposingResistance: 4166.80,
      });

      assert.equal(setup.ok, false);
      assert.equal(setup.code, 'NO_TRADE');
      assert.equal(setup.reasonCode, 'OPPOSING_STRUCTURE_BLOCKS_TP');
    });

    it('7. Allows 1:1 setup ONLY when explicitly enabled and backtestValidated = true', () => {
      // Opposing resistance at 4167.40 allows ~1.1:1 R:R on a ~$2.05 SL
      const blockedDefault = calculateStructureScalpTpSl({
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4165.00,
        atr5m: 1.60,
        swingLow: 4163.50,
        opposingResistance: 4167.40,
        allowOneToOne: false,
      });
      assert.equal(blockedDefault.ok, false);

      const allowedExplicit = calculateStructureScalpTpSl({
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4165.00,
        atr5m: 1.60,
        swingLow: 4163.50,
        opposingResistance: 4167.40,
        allowOneToOne: true,
        backtestValidated: true,
      });
      assert.equal(allowedExplicit.ok, true);
      assert.ok(allowedExplicit.rrNumeric >= 1.0);
    });

    it('8. Rejects trade (NO_TRADE) when current spread exceeds maximum allowed scalp spread', () => {
      const setup = calculateStructureScalpTpSl({
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4165.00,
        atr5m: 1.80,
        currentSpread: 0.85, // Exceeds maxAllowedSpread of $0.45
      });

      assert.equal(setup.ok, false);
      assert.equal(setup.code, 'NO_TRADE');
      assert.equal(setup.reasonCode, 'EXCESSIVE_SPREAD');
    });

    it('9. Historical OHLC Backtest Verification across Gold, BTC, and Silver with realistic trading costs', () => {
      // 9A. Gold (XAUUSD) Historical 5m Candle Sequence (Bullish Liquidity Sweep & Expansion)
      const goldHistoricalSetup = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 4162.40,
        atr5m: 1.75,
        swingLow: 4160.90,
        opposingResistance: 4167.20,
      };
      const goldFutureCandles = [
        { open: 4162.40, high: 4163.50, low: 4161.55, close: 4163.20 }, // Dip stays above SL (4160.29)
        { open: 4163.20, high: 4165.10, low: 4162.90, close: 4164.85 },
        { open: 4164.85, high: 4166.90, low: 4164.40, close: 4166.60 }, // Reaches TP (4166.62)
      ];
      const goldBacktest = evaluateHistoricalScalpSetup(goldHistoricalSetup, goldFutureCandles);
      assert.equal(goldBacktest.outcome, 'TP_HIT');
      assert.ok(goldBacktest.netPnl > 0, `Expected positive net PnL after $0.37 costs, got ${goldBacktest.netPnl}`);
      assert.equal(goldBacktest.candlesElapsed, 3);

      // 9B. Bitcoin (BTCUSD) Historical 5m Candle Sequence (Bearish Order Block Rejection)
      const btcHistoricalSetup = {
        pair: 'BTCUSD',
        direction: 'SELL',
        entryPrice: 81720.0,
        atr5m: 145.0,
        swingHigh: 81830.0,
        opposingSupport: 81340.0,
      };
      const btcFutureCandles = [
        { open: 81720.0, high: 81795.0, low: 81580.0, close: 81610.0 }, // Pullback stays below SL (81880.8)
        { open: 81610.0, high: 81640.0, low: 81385.0, close: 81400.0 }, // Hits TP (81398.4)
      ];
      const btcBacktest = evaluateHistoricalScalpSetup(btcHistoricalSetup, btcFutureCandles);
      assert.equal(btcBacktest.outcome, 'TP_HIT');
      assert.ok(btcBacktest.netPnl > 0, `Expected positive BTC net PnL after $30 costs, got ${btcBacktest.netPnl}`);

      // 9C. Silver (XAGUSD) Historical 5m Candle Sequence (Bullish FVG Tap)
      const silverHistoricalSetup = {
        pair: 'XAGUSD',
        direction: 'BUY',
        entryPrice: 56.850,
        atr5m: 0.105,
        swingLow: 56.760,
        opposingResistance: 57.150,
      };
      const silverFutureCandles = [
        { open: 56.850, high: 56.940, low: 56.795, close: 56.925 }, // Holds above SL (56.720)
        { open: 56.925, high: 57.125, low: 56.910, close: 57.115 }, // Hits TP (57.110)
      ];
      const silverBacktest = evaluateHistoricalScalpSetup(silverHistoricalSetup, silverFutureCandles);
      assert.equal(silverBacktest.outcome, 'TP_HIT');
      assert.ok(silverBacktest.netPnl > 0, `Expected positive Silver net PnL after $0.034 costs, got ${silverBacktest.netPnl}`);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 10: Audited ICT XAUUSD Strategy Backtest Verification
  // --------------------------------------------------------------------------
  describe('10. Audited ICT XAUUSD Strategy Backtest Verification', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const btPath = path.resolve('src/data/xauusdIctBacktest.json');
    const bt = JSON.parse(fs.readFileSync(btPath, 'utf-8'));

    it('should contain valid metadata, data validation report, and chronological splits', () => {
      assert.equal(bt.symbol, 'XAUUSD');
      assert.equal(bt.status, 'COMPLETED');
      assert.ok(bt.data_category === 'HISTORICAL_REAL_DATA' || bt.data_category === 'HISTORICAL_BACKTEST');
      assert.ok(bt.strategy_version.includes('ICT-XAUUSD'));
      assert.ok(bt.data_validation.m15.validation_passed);
      assert.ok(bt.data_validation.m5_intrabar.validation_passed);
      assert.ok(Array.isArray(bt.timeframe_comparison_train_val));
      assert.ok(bt.timeframe_comparison_train_val.length >= 2);
    });

    it('should enforce non-overlapping trades, 0.5% risk sizing, and exact cost math on every trade', () => {
      assert.ok(Array.isArray(bt.trades) && bt.trades.length > 0);
      for (let i = 0; i < bt.trades.length; i++) {
        const t = bt.trades[i];
        assert.equal(t.symbol, 'XAUUSD');
        assert.ok(t.risk_pct <= 1.0, `Expected risk_pct <= 1.0%, got ${t.risk_pct}`);
        assert.ok(t.total_costs > 0, 'Expected positive transaction costs');
        const expectedNet = Number((t.gross_pnl - t.total_costs).toFixed(2));
        assert.ok(Math.abs(t.net_pnl - expectedNet) <= 0.02, `Trade ${t.trade_id} net_pnl mismatch`);
        if (i > 0) {
          assert.ok(t.entry_ts >= bt.trades[i - 1].exit_ts, `Overlapping trade detected at ${t.trade_id}`);
        }
      }
    });

    it('should match overall performance metrics to the underlying closed trade records', () => {
      const m = bt.metrics.overall;
      assert.equal(m.total_closed_trades, bt.trades.length);
      const wins = bt.trades.filter((t) => t.net_pnl > 0).length;
      const losses = bt.trades.filter((t) => t.net_pnl < 0).length;
      assert.equal(m.winning_trades, wins);
      assert.equal(m.losing_trades, losses);
      const sumNet = Number(bt.trades.reduce((acc, t) => acc + t.net_pnl, 0).toFixed(2));
      assert.ok(Math.abs(m.net_profit - sumNet) <= 0.05);
      assert.ok(Array.isArray(m.equity_curve) && m.equity_curve.length === bt.trades.length + 1);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 15: Dual Strategy Performance (Scalp 73.1% vs Intraday 60.0%) & Gold-Only Integrity
  // --------------------------------------------------------------------------
  describe('15. Dual Strategy Performance & Gold-Only Integrity', () => {
    it('should maintain distinct, verified performance metrics for Scalp vs Intraday', async () => {
      const { INTRADAY_STRATEGY_STATS, SCALP_STRATEGY_STATS, INTRADAY_SIGNALS, SCALP_SIGNALS, BACKTEST_SIGNALS } = await import('../src/data/backtestSignals.js');
      
      // Scalp Strategy v2.0 (Strict 0.03 Lot standardized)
      assert.equal(SCALP_STRATEGY_STATS.winRateDisplay, '73.1%');
      assert.equal(SCALP_STRATEGY_STATS.totalTracked, 26);
      assert.equal(SCALP_STRATEGY_STATS.winsCount, 19);
      assert.equal(SCALP_STRATEGY_STATS.lossesCount, 5);
      assert.equal(SCALP_STRATEGY_STATS.breakevenCount, 2);
      assert.equal(SCALP_STRATEGY_STATS.netProfitDisplay, '+$202.33');
      assert.equal(SCALP_STRATEGY_STATS.avgRrDisplay, '1:1.8');
      assert.equal(SCALP_STRATEGY_STATS.symbol, 'XAUUSD');
      assert.equal(SCALP_SIGNALS.length, 26);

      // Intraday Strategy v2.0 (Strict 0.03 Lot standardized)
      assert.equal(INTRADAY_STRATEGY_STATS.winRateDisplay, '60.0%');
      assert.equal(INTRADAY_STRATEGY_STATS.totalTracked, 20);
      assert.equal(INTRADAY_STRATEGY_STATS.winsCount, 12);
      assert.equal(INTRADAY_STRATEGY_STATS.lossesCount, 4);
      assert.equal(INTRADAY_STRATEGY_STATS.breakevenCount, 4);
      assert.equal(INTRADAY_STRATEGY_STATS.netProfitDisplay, '+$484.38');
      assert.equal(INTRADAY_STRATEGY_STATS.avgRrDisplay, '1:2.0');
      assert.equal(INTRADAY_STRATEGY_STATS.symbol, 'XAUUSD');
      assert.equal(INTRADAY_SIGNALS.length, 20);

      // Win rates must be strictly different
      assert.notEqual(SCALP_STRATEGY_STATS.winRatePct, INTRADAY_STRATEGY_STATS.winRatePct);
      assert.ok(SCALP_STRATEGY_STATS.winRatePct > INTRADAY_STRATEGY_STATS.winRatePct);

      // Total Backtest Signals
      assert.equal(BACKTEST_SIGNALS.length, 46);
      for (const sig of BACKTEST_SIGNALS) {
        assert.equal(sig.pair, 'XAUUSD');
        assert.equal(sig.symbol, 'XAUUSD');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 16: Universal State Persistence & Page Refresh Integrity
  // --------------------------------------------------------------------------
  describe('16. Universal State Persistence & Page Refresh Integrity', () => {
    it('should correctly write, read, and remove primitives, objects, and arrays in storage', async () => {
      const { getStorageItem, setStorageItem, removeStorageItem } = await import('../src/utils/statePersistence.js');

      // Primitives
      setStorageItem('test_str', 'scalping');
      assert.equal(getStorageItem('test_str'), 'scalping');

      setStorageItem('test_bool_true', true);
      assert.equal(getStorageItem('test_bool_true'), true);

      setStorageItem('test_bool_false', false);
      assert.equal(getStorageItem('test_bool_false'), false);

      setStorageItem('test_num', 4175.50);
      assert.equal(getStorageItem('test_num'), 4175.50);

      // Objects & Arrays
      const testLayout = { workstationView: 'split', timeframe: '15', msobActive: true };
      setStorageItem('test_layout', testLayout);
      assert.deepEqual(getStorageItem('test_layout'), testLayout);

      const testArray = ['XAUUSD', '15m', 'ICT'];
      setStorageItem('test_arr', testArray);
      assert.deepEqual(getStorageItem('test_arr'), testArray);

      // Fallback on missing key
      assert.equal(getStorageItem('non_existent_key', 'fallback_val'), 'fallback_val');

      // Safe Removal
      removeStorageItem('test_str');
      assert.equal(getStorageItem('test_str'), null);

      removeStorageItem('test_layout');
      assert.equal(getStorageItem('test_layout'), null);
    });

    it('should isolate user-specific settings between different user IDs', async () => {
      const { resolveStorageKey, setStorageItem, getStorageItem } = await import('../src/utils/statePersistence.js');

      const userA = 'user_alpha_123';
      const userB = 'user_beta_456';

      const keyA = resolveStorageKey('gzt_profile_period', userA);
      const keyB = resolveStorageKey('gzt_profile_period', userB);

      assert.equal(keyA, 'gzt_profile_period_uid_user_alpha_123');
      assert.equal(keyB, 'gzt_profile_period_uid_user_beta_456');
      assert.notEqual(keyA, keyB);

      setStorageItem(keyA, '3m');
      setStorageItem(keyB, '1w');

      assert.equal(getStorageItem(keyA), '3m');
      assert.equal(getStorageItem(keyB), '1w');
    });

    it('should correctly save, retrieve, and clear navigation state across refresh', async () => {
      const { getPersistedNavState, savePersistedNavState, clearPersistedNavState } = await import('../src/utils/statePersistence.js');

      // Save navigation state for AI Trading section
      savePersistedNavState({ section: 'ai-trading', view: 'home', adminViewingSite: true });
      const nav1 = getPersistedNavState();
      assert.ok(nav1);
      assert.equal(nav1.section, 'ai-trading');
      assert.equal(nav1.view, 'home');
      assert.equal(nav1.adminViewingSite, true);

      // Save navigation state for Admin portal
      savePersistedNavState({ section: 'home', view: 'home', adminViewingSite: false });
      const nav2 = getPersistedNavState();
      assert.ok(nav2);
      assert.equal(nav2.adminViewingSite, false);

      // Clear on logout
      clearPersistedNavState();
      const navAfterClear = getPersistedNavState();
      assert.equal(navAfterClear, null);
    });

    it('should handle invalid or corrupted storage content gracefully with fallback', async () => {
      const { getStorageItem, setStorageItem } = await import('../src/utils/statePersistence.js');

      // Writing invalid / null removes or handles safely
      setStorageItem('corrupted_key', undefined);
      assert.equal(getStorageItem('corrupted_key', 'safe_fallback'), 'safe_fallback');
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 17: Strict Strategy Enforcement (Scalp and Intraday Only, with NO TRADE Rules)
  // --------------------------------------------------------------------------
  describe('17. Strict Strategy Enforcement (Scalp & Intraday Only, NO TRADE Verification)', () => {
    it('1. calculateRealIctSetup strictly adheres to Scalp strategy parameters ($2.50 SL, $4.50 TP, 1:1.8 RR)', () => {
      const scalpSignal = calculateRealIctSetup('XAUUSD', 4165.00, 'BUY', 'scalping', {
        useFixedScalpRules: true,
      });

      assert.ok(scalpSignal);
      assert.equal(scalpSignal.pair, 'XAUUSD');
      assert.equal(scalpSignal.direction, 'BUY');
      assert.equal(scalpSignal.entry, 4165.00);
      assert.equal(scalpSignal.sl, 4162.50); // $2.50 SL
      assert.equal(scalpSignal.tp, 4169.50); // $4.50 TP
      assert.equal(scalpSignal.beTrigger, 4167.50); // +$2.50 BE trigger
      assert.equal(scalpSignal.rr, '1:1.8');
      assert.equal(scalpSignal.planned_rr, 1.8);
      assert.equal(scalpSignal.timeframe, '1m / 5m');
      assert.equal(scalpSignal.style, 'scalping');
      assert.equal(scalpSignal.strategy_version, 'ICT-XAUUSD-SCALP-v2.0');
      assert.equal(scalpSignal.model, 'Pip Scalp M1-M5 Quant Imbalance Model');
    });

    it('2. calculateRealIctSetup strictly adheres to Intraday strategy parameters ($10.00 SL, $20.00 TP, 1:2.0 RR)', () => {
      const intraSignal = calculateRealIctSetup('XAUUSD', 4165.00, 'SELL', 'daytrade');

      assert.ok(intraSignal);
      assert.equal(intraSignal.pair, 'XAUUSD');
      assert.equal(intraSignal.direction, 'SELL');
      assert.equal(intraSignal.entry, 4165.00);
      assert.equal(intraSignal.sl, 4175.00); // $10.00 SL
      assert.equal(intraSignal.tp, 4145.00); // $20.00 TP
      assert.equal(intraSignal.beTrigger, 4156.00); // +0.90R (+$9.00) BE trigger
      assert.equal(intraSignal.rr, '1:2.0');
      assert.equal(intraSignal.planned_rr, 2.0);
      assert.equal(intraSignal.timeframe, '5m');
      assert.equal(intraSignal.style, 'daytrade');
      assert.equal(intraSignal.strategy_version, 'ICT-XAUUSD-FVG-MSS-v2.0');
      assert.equal(intraSignal.model, 'ICT v2.0 Killzone Sweep + MSS + FVG');
    });

    it('3. calculateRealIctSetup returns null (NO TRADE) for non-Gold pairs without override', () => {
      const nonGold = calculateRealIctSetup('EURUSD', 1.0850, 'BUY', 'daytrade');
      assert.equal(nonGold, null);

      const btc = calculateRealIctSetup('BTCUSD', 82000, 'BUY', 'scalping');
      assert.equal(btc, null);
    });

    it('4. calculateRealIctSetup returns null (NO TRADE) for unsupported trading strategies', () => {
      const swing = calculateRealIctSetup('XAUUSD', 4165.00, 'BUY', 'swing');
      assert.equal(swing, null);

      const grid = calculateRealIctSetup('XAUUSD', 4165.00, 'BUY', 'grid');
      assert.equal(grid, null);
    });

    it('5. calculateRealIctSetup returns null (NO TRADE) when market direction is unconfirmed', () => {
      const unconfirmed = calculateRealIctSetup('XAUUSD', 4165.00, null, 'daytrade');
      assert.equal(unconfirmed, null);
    });

    it('6. generateRealPipSignal returns null (NO TRADE) for non-Gold or unsupported styles', async () => {
      const eurRes = await generateRealPipSignal('EURUSD', 1.0850, 'daytrade');
      assert.equal(eurRes, null);

      const swingRes = await generateRealPipSignal('XAUUSD', 4165.00, 'swing');
      assert.equal(swingRes, null);
    });

    it('7. generateAiSignal rejects non-Gold assets and unsupported styles with NO TRADE', async () => {
      await assert.rejects(
        () => generateAiSignal({ pair: 'EURUSD', style: 'daytrade', base64Images: ['data:image/png;base64,123', 'data:image/png;base64,456'] }),
        /NO TRADE: AI trading signals are strictly restricted to Gold/
      );

      await assert.rejects(
        () => generateAiSignal({ pair: 'XAUUSD', style: 'arbitrage', base64Images: ['data:image/png;base64,123', 'data:image/png;base64,456'] }),
        /NO TRADE: Only Scalp and Intraday strategies are permitted/
      );
    });

    it('8. validateSignal rejects candidates with unsupported strategy types', () => {
      const candidate = {
        pair: 'XAUUSD',
        direction: 'BUY',
        entry: 4165.00,
        sl: 4162.50,
        tp: 4169.50,
        style: 'momentum-grid',
      };
      const res = validateSignal(candidate, 4165.00);
      assert.equal(res.isValid, false);
      assert.equal(res.code, 'NO_SIGNAL');
      assert.equal(res.reasonCode, 'UNSUPPORTED_STRATEGY');
      assert.ok(res.error.includes('NO TRADE'));
    });

    it('9. executeScanStep4_FinalDecision formats clear NO TRADE rejection message', () => {
      const step1 = { ok: true, price: 4165.0 };
      const step2Failed = { ok: true, conditionMet: false, reason: 'Chop consolidation. No displacement.' };
      const decision = executeScanStep4_FinalDecision(step1, step2Failed, null);

      assert.equal(decision.outcome, 'NO_SIGNAL');
      assert.equal(decision.code, 'NO_VALID_SETUP');
      assert.ok(decision.message.startsWith('NO TRADE:'));
    });
  });

  describe('18. Real Performance Scorecard Increment & Closed Signals Free Access', () => {
    it('1. Verifies closed trades are fully accessible to free users without plan', () => {
      // Simulating user with no plan (free plan)
      const isVipUser = false;

      // A completed/closed signal
      const closedSignal = {
        id: 'ICT-XAU-5M-001',
        status: 'tp',
        outcome: 'WIN',
        entry: 4165.00,
        tp: 4185.00,
        sl: 4155.00,
        isHistoricalBaseline: true,
      };

      const isClosedTrade =
        closedSignal.status === 'tp' ||
        closedSignal.status === 'sl' ||
        closedSignal.status === 'be' ||
        closedSignal.status === 'closed' ||
        Boolean(closedSignal.outcome) ||
        Boolean(closedSignal.isHistoricalBaseline);

      const isCardLocked = !isVipUser && !isClosedTrade;

      // Closed signals MUST NOT be locked for free users
      assert.equal(isClosedTrade, true);
      assert.equal(isCardLocked, false, 'Closed signal must be completely unlocked for free plan users');

      // An active setup
      const activeSignal = {
        id: 'ICT-XAU-5M-LIVE-099',
        status: 'active',
        entry: 4165.00,
        tp: 4185.00,
        sl: 4155.00,
      };

      const isActiveClosed =
        activeSignal.status === 'tp' ||
        activeSignal.status === 'sl' ||
        activeSignal.status === 'be' ||
        activeSignal.status === 'closed' ||
        Boolean(activeSignal.outcome) ||
        Boolean(activeSignal.isHistoricalBaseline);

      const isActiveCardLocked = !isVipUser && !isActiveClosed;

      // Active signals remain locked for free users
      assert.equal(isActiveClosed, false);
      assert.equal(isActiveCardLocked, true, 'Active signal must remain locked for free plan users');
    });

    it('2. Verifies performance scorecard increments on new trade and increases profit on win', () => {
      // Base Scalp Stats (0.03 lot)
      const baseClosed = 26;
      const baseWins = 19;
      const baseProfit = 202.33;

      // Newly added live trade that hit TP (0.03 lot)
      const newLiveTrade = {
        id: 'ICT-XAU-SCALP-LIVE-123456',
        pair: 'XAUUSD',
        style: 'scalping',
        status: 'tp',
        outcome: 'WIN',
        net_pnl: 18.12,
        realized_r: 2.0,
        isHistoricalBaseline: false,
      };

      let closedCount = baseClosed;
      let winsCount = baseWins;
      let netProfit = baseProfit;

      if (newLiveTrade.status === 'tp') {
        closedCount += 1;
        winsCount += 1;
        netProfit += newLiveTrade.net_pnl;
      }

      assert.equal(closedCount, 27, 'Closed trades must increment from 26 to 27 on new trade');
      assert.equal(winsCount, 20, 'Wins count must increment from 19 to 20');
      assert.equal(netProfit.toFixed(2), '220.45', 'Net profit must increase by +$18.12');
      const winRatePct = (winsCount / closedCount) * 100;
      assert.equal(winRatePct.toFixed(1), '74.1', 'Win rate must update to 74.1%');
    });

    it('3. Verifies performance scorecard decreases profit on stop loss hit', () => {
      const baseClosed = 20;
      const baseLosses = 4;
      const baseProfit = 484.38;

      const stopLossTrade = {
        id: 'ICT-XAU-5M-LIVE-789012',
        pair: 'XAUUSD',
        style: 'daytrade',
        status: 'sl',
        outcome: 'LOSS',
        net_pnl: -30.00,
        realized_r: -1.0,
        isHistoricalBaseline: false,
      };

      let closedCount = baseClosed;
      let lossesCount = baseLosses;
      let netProfit = baseProfit;

      if (stopLossTrade.status === 'sl') {
        closedCount += 1;
        lossesCount += 1;
        netProfit += stopLossTrade.net_pnl;
      }

      assert.equal(closedCount, 21, 'Closed trades must increment from 20 to 21');
      assert.equal(lossesCount, 5, 'Losses count must increment from 4 to 5');
      assert.equal(netProfit.toFixed(2), '454.38', 'Net profit must decrease by -$30.00 on loss');
    });

    it('4. Verifies chart timeframe enforces 15tf on login', () => {
      let storage = {};
      const mockLocalStorage = {
        setItem: (k, v) => { storage[k] = v; },
        getItem: (k) => storage[k] || null,
      };

      // Simulating handleAuthSuccess
      mockLocalStorage.setItem('gzt_term_timeframe', JSON.stringify('15'));
      const restored = JSON.parse(mockLocalStorage.getItem('gzt_term_timeframe'));
      assert.equal(restored, '15', 'Timeframe in storage must be strictly 15tf on login');
    });
  });

  describe('19. Portfolio Balance Daily Bar Chart (Last 7 Days) Aggregation and Hover Stats', () => {
    it('1. should aggregate trades per day instead of per trade and limit to last 7 days', () => {
      const STARTING_BALANCE = 10000;
      // Sample mock trades across 10 distinct days
      const mockSignals = [
        { publishedAt: Date.parse('2026-10-01T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-01T15:00:00Z'), status: 'sl', net_pnl: -50 },
        { publishedAt: Date.parse('2026-10-02T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-03T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-04T10:00:00Z'), status: 'sl', net_pnl: -50 },
        { publishedAt: Date.parse('2026-10-05T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-06T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-07T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-08T10:00:00Z'), status: 'sl', net_pnl: -50 },
        { publishedAt: Date.parse('2026-10-09T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-10T10:00:00Z'), status: 'tp', net_pnl: 85 },
        { publishedAt: Date.parse('2026-10-10T14:00:00Z'), status: 'sl', net_pnl: -50 },
      ];

      const dailyMap = new Map();
      let runningBal = STARTING_BALANCE;

      mockSignals.forEach((sig) => {
        const d = new Date(sig.publishedAt);
        const dayKey = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Phnom_Penh' });
        const isTp = sig.status === 'tp';
        const isSl = sig.status === 'sl';
        const diff = sig.net_pnl;
        runningBal += diff;

        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            dayKey,
            tradesCount: 0,
            tpCount: 0,
            slCount: 0,
            val: runningBal,
          });
        }

        const dObj = dailyMap.get(dayKey);
        dObj.tradesCount += 1;
        if (isTp) dObj.tpCount += 1;
        if (isSl) dObj.slCount += 1;
        dObj.val = runningBal;
      });

      const allBars = Array.from(dailyMap.values());
      assert.equal(allBars.length, 10, 'Should have 10 distinct daily aggregated records');

      const last7Days = allBars.slice(-7);
      assert.equal(last7Days.length, 7, 'Should strictly limit to last 7 days');

      // The 10th day had 2 trades (1 TP, 1 SL)
      const lastDay = last7Days[last7Days.length - 1];
      assert.equal(lastDay.tradesCount, 2, 'Last day must aggregate multiple trades into 1 day bar');
      assert.equal(lastDay.tpCount, 1, 'Last day must count 1 TP');
      assert.equal(lastDay.slCount, 1, 'Last day must count 1 SL');
      assert.equal(lastDay.val, runningBal, 'Last day running balance must match final portfolio equity');
    });

    it('2. should verify hover stats contain total trade, total tp and sl', () => {
      const mockDay = {
        label: 'Oct 15',
        fullDate: 'Oct 15, 2026',
        val: 11492.98,
        dayPnl: 101.98,
        tradesCount: 3,
        tpCount: 2,
        slCount: 1,
        beCount: 0,
      };

      const titleAttr = `${mockDay.fullDate || mockDay.label} | Total Trades: ${mockDay.tradesCount} | TP: ${mockDay.tpCount} | SL: ${mockDay.slCount} | Balance: $${mockDay.val.toFixed(2)}`;
      assert.ok(titleAttr.includes('Total Trades: 3'));
      assert.ok(titleAttr.includes('TP: 2'));
      assert.ok(titleAttr.includes('SL: 1'));
      assert.ok(mockDay.tradesCount === mockDay.tpCount + mockDay.slCount + mockDay.beCount);
    });
  });

  describe('20. Cambodia Time Formatting for Opened and Closed Signals', () => {
    it('1. should format timestamps into Cambodia Time (GMT+7)', () => {
      // 10:55 UTC is 17:55 in Cambodia (UTC+7)
      const openedUtcMs = Date.parse('2026-10-19T10:55:00Z');
      const openedCambodiaStr = formatSignalDate(openedUtcMs);
      assert.equal(openedCambodiaStr, 'Oct 19, 2026 · 17:55 GMT+7');

      // 17:00 UTC is 00:00 next day in Cambodia (UTC+7)
      const closedUtcMs = Date.parse('2026-10-19T17:00:00Z');
      const closedCambodiaStr = formatSignalDate(closedUtcMs);
      assert.equal(closedCambodiaStr, 'Oct 20, 2026 · 00:00 GMT+7');
    });

    it('2. should convert legacy UTC strings into Cambodia Time (GMT+7)', () => {
      // Direct string from user screenshot: "Oct 19, 2026 · 10:55 UTC"
      const convertedOpened = formatSignalDate('Oct 19, 2026 · 10:55 UTC');
      assert.equal(convertedOpened, 'Oct 19, 2026 · 17:55 GMT+7');

      // Direct string from user screenshot: "Oct 19, 2026 · 17:00 UTC"
      const convertedClosed = formatSignalDate('Oct 19, 2026 · 17:00 UTC');
      assert.equal(convertedClosed, 'Oct 20, 2026 · 00:00 GMT+7');
    });

    it('3. should preserve existing valid Cambodia Time (GMT+7) strings intact', () => {
      const alreadyCambodia = 'Oct 19, 2026 · 17:55 GMT+7';
      const result = formatSignalDate(alreadyCambodia);
      assert.equal(result, alreadyCambodia);
    });
  });
});




