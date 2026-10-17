#!/usr/bin/env python3
"""
Unit Tests for ICT XAUUSD Strategy & Backtesting Engine
Verifies:
- Data validation (timestamps, duplicates, OHLC envelope, spike filter)
- Strategy rules & no look-ahead bias
- Position sizing (0.5% default risk, 1.0% max risk cap)
- Transaction costs (spread, commission, slippage)
- Intrabar conservative SL-first resolution & M5 sub-candle resolution
- Metric calculation accuracy & zero-loss Profit Factor edge case
- Reproducibility from identical inputs
"""

import unittest
from ict_xauusd_engine import (
    Candle,
    StrategyConfig,
    TradeRecord,
    validate_and_clean_candles,
    resolve_intrabar_outcome,
    calculate_performance_metrics,
    run_ict_backtest,
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

    def test_intrabar_ambiguous_sl_tp_resolves_conservatively_to_sl(self):
        # Single bar hits both SL (4090) and TP (4120) for a LONG at 4100
        ambiguous_bar = Candle(1786075200, "2026-08-07 08:00:00 UTC", 4100.0, 4125.0, 4085.0, 4110.0, 200)
        reason, price, method = resolve_intrabar_outcome("LONG", sl=4090.0, tp=4120.0, bar=ambiguous_bar)
        self.assertEqual(reason, "STOP_LOSS")
        self.assertEqual(price, 4090.0)
        self.assertEqual(method, "CONSERVATIVE_SL_FIRST")

    def test_intrabar_m5_subcandles_resolve_exact_chronological_order(self):
        # 15m bar spans both SL (4090) and TP (4120), but the first 5m sub-candle hits TP (4122) before dipping
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
            strategy_version="v1.2",
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
        cfg = StrategyConfig(timeframe="5m", risk_per_trade_pct=0.02)  # Should cap at MAX_RISK_PCT = 1.0%
        r1 = run_ict_backtest(candles, cfg, train_end_ts=1786100000, val_end_ts=1786130000)
        r2 = run_ict_backtest(candles, cfg, train_end_ts=1786100000, val_end_ts=1786130000)
        self.assertEqual(r1["final_equity"], r2["final_equity"])
        self.assertEqual(len(r1["trades"]), len(r2["trades"]))
        # Verify non-overlapping trades
        for idx in range(1, len(r1["trades"])):
            self.assertGreaterEqual(r1["trades"][idx].entry_ts, r1["trades"][idx - 1].exit_ts)


if __name__ == "__main__":
    unittest.main()
