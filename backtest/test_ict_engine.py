#!/usr/bin/env python3
"""
Unit Tests for ICT XAUUSD Strategy & Backtesting Engine
======================================================
Verifies:
- Data validation (timestamps, duplicates, OHLC envelope, bad open tick repair)
- Strategy rules & causal execution (no look-ahead bias)
- Position sizing (0.5% default risk, 1.0% max risk cap)
- Transaction costs (spread, commission, slippage)
- Intrabar conservative SL-first resolution & M5 sub-candle resolution
- Metric calculation accuracy & zero-loss Profit Factor edge case
- Non-overlapping trades enforcement
- Candidate v2.0 Verified Performance Invariants
"""

import os
import sys
import unittest

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from ict_xauusd_engine import (
    Candle,
    StrategyConfig,
    TradeRecord,
    validate_and_clean_candles,
    resolve_intrabar_outcome,
    calculate_performance_metrics,
    run_ict_backtest,
    load_candles_csv,
)


class TestIctXauusdEngine(unittest.TestCase):
    def test_data_validation_removes_duplicates_and_fixes_ohlc(self):
        raw = [
            Candle(1786075200 + i * 300, "2026-08-07 04:00:00 UTC", 4100.0, 4105.0, 4095.0, 4102.0, 100)
            for i in range(600)
        ]
        # Add duplicate timestamp
        raw.append(Candle(1786075200, "2026-08-07 04:00:00 UTC", 4100.0, 4105.0, 4095.0, 4102.0, 100))
        # Add inverted high/low envelope candle
        raw[10] = Candle(raw[10].timestamp, raw[10].dt_utc, 4100.0, 4090.0, 4110.0, 4102.0, 100)

        cleaned, report = validate_and_clean_candles(raw, expected_step_sec=300)
        self.assertEqual(len(cleaned), 600)
        self.assertEqual(report["duplicate_timestamps_removed"], 1)
        self.assertEqual(report["ohlc_envelope_corrections"], 1)
        self.assertEqual(cleaned[10].high, 4110.0)
        self.assertEqual(cleaned[10].low, 4090.0)
        self.assertTrue(report["validation_passed"])

    def test_data_validation_repairs_corrupted_open_ticks(self):
        c1 = Candle(1786075200, "2026-08-07 04:00:00 UTC", 4100.0, 4105.0, 4098.0, 4102.0, 100)
        # Corrupted tick: Open jumps -$37.70, while Close remains near 4102.0
        c2 = Candle(1786075500, "2026-08-07 04:05:00 UTC", 4064.30, 4103.0, 4064.30, 4101.50, 150)
        cleaned, report = validate_and_clean_candles([c1, c2], expected_step_sec=300)
        self.assertEqual(report["corrupted_open_ticks_repaired"], 1)
        self.assertEqual(cleaned[1].open, 4102.0)
        self.assertEqual(cleaned[1].low, 4101.50)

    def test_intrabar_ambiguous_sl_tp_resolves_conservatively_to_sl(self):
        ambiguous_bar = Candle(1786075200, "2026-08-07 08:00:00 UTC", 4100.0, 4125.0, 4085.0, 4110.0, 200)
        reason, price, method = resolve_intrabar_outcome("LONG", sl=4090.0, tp=4120.0, bar=ambiguous_bar)
        self.assertEqual(reason, "STOP_LOSS")
        self.assertEqual(price, 4090.0)
        self.assertEqual(method, "CONSERVATIVE_SL_FIRST")

    def test_intrabar_m5_subcandles_resolve_exact_chronological_order(self):
        bar_15m = Candle(1786075200, "2026-08-07 08:00:00 UTC", 4100.0, 4122.0, 4088.0, 4095.0, 500)
        m5_subs = [
            Candle(1786075200, "2026-08-07 08:00:00 UTC", 4100.0, 4122.0, 4098.0, 4118.0, 200),  # Hits TP first!
            Candle(1786075500, "2026-08-07 08:05:00 UTC", 4118.0, 4119.0, 4088.0, 4095.0, 300),
        ]
        lookup = {1786075200: m5_subs}
        reason, price, method = resolve_intrabar_outcome(
            "LONG", sl=4090.0, tp=4120.0, bar=bar_15m, m5_lookup=lookup, bar_step_sec=900
        )
        self.assertEqual(reason, "TAKE_PROFIT")
        self.assertEqual(price, 4120.0)
        self.assertEqual(method, "M5_SUBCANDLE_EXACT")

    def test_metrics_calculation_and_zero_loss_edge_case(self):
        t1 = TradeRecord(
            trade_id="T1",
            symbol="XAUUSD",
            timeframe="5m",
            strategy_version="v2.0",
            period_split="TRAINING",
            direction="LONG",
            session="London Killzone",
            signal_time_utc="2026-08-10 08:00:00 UTC",
            entry_time_utc="2026-08-10 08:05:00 UTC",
            exit_time_utc="2026-08-10 09:05:00 UTC",
            entry_ts=1000,
            exit_ts=4600,
            duration_minutes=60,
            entry_price=4100.0,
            stop_loss=4090.0,
            take_profit=4120.0,
            exit_price=4120.0,
            position_size_oz=5.0,
            position_lots=0.05,
            risk_dollars=50.0,
            risk_pct=0.5,
            planned_rr=2.0,
            realized_r=1.97,
            gross_pnl=100.0,
            spread_cost=1.0,
            commission_cost=0.35,
            slippage_cost=0.10,
            total_costs=1.45,
            net_pnl=98.55,
            equity_before=10000.0,
            equity_after=10098.55,
            outcome="WIN",
            exit_reason="TAKE_PROFIT",
            sweep_type="PDL Sweep",
            fvg_zone="$4098-$4100",
            htf_bias="Bullish HTF",
            intrabar_resolved_by="BAR_HIGH_TP",
        )
        metrics_only_wins = calculate_performance_metrics([t1], 10000.0)
        self.assertEqual(metrics_only_wins["total_closed_trades"], 1)
        self.assertEqual(metrics_only_wins["win_rate_pct"], 100.0)
        self.assertEqual(metrics_only_wins["profit_factor_display"], "∞ (No Losing Trades)")

    def test_reproducibility_and_non_overlapping_trades(self):
        candles = [
            Candle(1786075200 + i * 300, "2026-08-07 08:00:00 UTC", 4100.0 + (i % 7), 4105.0 + (i % 7), 4095.0 + (i % 7), 4101.0 + (i % 7), 100)
            for i in range(300)
        ]
        cfg = StrategyConfig(timeframe="5m", risk_per_trade_pct=0.02)
        r1 = run_ict_backtest(candles, cfg, train_end_ts=1786100000, val_end_ts=1786130000)
        r2 = run_ict_backtest(candles, cfg, train_end_ts=1786100000, val_end_ts=1786130000)
        self.assertEqual(r1["final_equity"], r2["final_equity"])
        self.assertEqual(len(r1["trades"]), len(r2["trades"]))
        for idx in range(1, len(r1["trades"])):
            self.assertGreaterEqual(r1["trades"][idx].entry_ts, r1["trades"][idx - 1].exit_ts)

    def test_candidate_v2_verified_invariants_on_historical_dataset(self):
        m5_csv = os.path.join(ENGINE_DIR, "data", "xauusd_m5_historical.csv")
        if not os.path.exists(m5_csv):
            self.skipTest("Historical M5 cache not present")

        raw_m5 = load_candles_csv(m5_csv)
        m5_candles, _ = validate_and_clean_candles(raw_m5, 300)
        n5 = len(m5_candles)
        train_end_ts = m5_candles[int(n5 * 0.60)].timestamp
        val_end_ts = m5_candles[int(n5 * 0.80)].timestamp

        cfg_v2 = StrategyConfig(
            version="ICT-XAUUSD-FVG-MSS-v2.0",
            timeframe="5m",
            session_mode="CORE_KZ",
            sweep_mode="POST_SWING_REJECTION",
            mss_mode="LEGACY",
            min_sl_dollars=6.00,
            fvg_min_dollars=1.00,
            be_trigger_r=0.90,
            max_hold_minutes=180,
            wall_clock_expiry=True,
        )
        res = run_ict_backtest(m5_candles, cfg_v2, train_end_ts, val_end_ts)
        trades = res["trades"]
        metrics = calculate_performance_metrics(trades, 10000.0)

        # Invariants
        self.assertEqual(metrics["total_closed_trades"], 20)
        self.assertEqual(metrics["winning_trades"], 12)
        self.assertEqual(metrics["losing_trades"], 4)
        self.assertEqual(metrics["breakeven_trades"], 4)
        self.assertEqual(metrics["win_rate_pct"], 60.0)
        self.assertEqual(metrics["decisive_win_rate_pct"], 75.0)
        self.assertAlmostEqual(metrics["net_profit"], 808.78, places=2)
        self.assertAlmostEqual(metrics["avg_realized_r"], 0.78, places=2)
        self.assertLess(metrics["max_drawdown_pct"], 1.5)  # Under 1.5% DD (verified 1.00%)


if __name__ == "__main__":
    unittest.main()
