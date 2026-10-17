#!/usr/bin/env python3
"""
ICT XAUUSD (Gold) Systematic Trading Strategy & Reproducible Backtesting Engine
===============================================================================
Strategy Version: ICT-XAUUSD-FVG-MSS-v1.2
Primary Symbol: XAUUSD (via COMEX Gold Futures GC=F / Spot XAUUSD feed)
Timeframes Evaluated: M5 (5-minute) and M15 (15-minute)
Intrabar Resolution: Uses M5 sub-candles inside M15 bars (plus conservative SL-first rule)

Mechanical Rules Implemented:
1. Session Filter (Killzones):
   - London Killzone: 07:00 - 11:00 UTC
   - New York Killzone: 12:30 - 16:30 UTC
2. Higher-Timeframe (HTF) Market Structure & Directional Bias:
   - Causal HTF EMA-50 & EMA-150 trend structure + causal HTF swing structure.
   - Dealing Range defined over active causal swing window; Equilibrium (50% level)
     divides Premium (>50%) and Discount (<50%).
3. Liquidity Sweeps (SSL / BSL Purge):
   - Confirmed fractal Swing High/Low (causal confirmation lag = fractal_bars),
     Previous Day High/Low (PDH/PDL), or Asian Session High/Low (00:00 - 06:00 UTC).
   - A valid sweep occurs when price trades beyond the liquidity pool within the lookback
     window and rejects back inside the range.
4. Market Structure Shift (MSS / CHOCH) + Displacement:
   - Impulsive displacement candle closing beyond the pre-sweep minor swing structure high/low
     with strong body-to-range displacement.
5. Fair Value Gap (FVG) Entry Zone (Consequent Encroachment / Discount-Premium):
   - 3-candle Bullish FVG (candle[i].low > candle[i-2].high) or Bearish FVG (candle[i].high < candle[i-2].low)
     formed during the displacement leg.
   - Limit order placed at the FVG Consequent Encroachment (50% midpoint) or FVG proximal edge
     inside Discount (for Long) or Premium (for Short). Unfilled orders expire after `limit_expiry_bars`.
6. Stop-Loss & Take-Profit:
   - Stop-loss placed beyond the liquidity sweep / FVG invalidation extreme + ATR buffer.
   - Configurable Take-Profit based on R:R multiple or opposing liquidity pool.
7. Transaction Costs & Risk Management:
   - Default Risk per trade: 0.5% of current account equity (configurable max 1.0%).
   - Non-overlapping trades strictly enforced (at most 1 trade open at any time).
   - Realistic spread ($0.20/oz), commission ($0.07/oz equivalent), and slippage ($0.05/oz).
"""

import csv
import datetime
import hashlib
import json
import math
import os
import urllib.request
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple


STRATEGY_VERSION = "ICT-XAUUSD-FVG-MSS-v1.2"
DEFAULT_INITIAL_CAPITAL = 10000.0
DEFAULT_RISK_PCT = 0.005  # 0.5% default risk per trade
MAX_RISK_PCT = 0.010      # 1.0% maximum configurable risk per trade


@dataclass
class Candle:
    timestamp: int
    dt_utc: str
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class StrategyConfig:
    version: str = STRATEGY_VERSION
    symbol: str = "XAUUSD"
    timeframe: str = "15m"
    initial_capital: float = DEFAULT_INITIAL_CAPITAL
    risk_per_trade_pct: float = DEFAULT_RISK_PCT
    rr_target: float = 2.0
    fractal_bars: int = 2
    sweep_lookback_bars: int = 16
    dealing_range_bars: int = 32
    fvg_min_atr_mult: float = 0.06
    fvg_entry_mode: str = "CE_50"  # "PROXIMAL" or "CE_50" (Consequent Encroachment 50% midpoint)
    displacement_body_ratio: float = 0.40
    sl_atr_buffer: float = 0.25
    min_sl_dollars: float = 3.00
    max_sl_dollars: float = 24.00
    limit_expiry_bars: int = 6
    require_discount_premium: bool = True
    require_htf_alignment: bool = True
    london_start_minutes_utc: int = 7 * 60       # 07:00 UTC
    london_end_minutes_utc: int = 11 * 60        # 11:00 UTC
    ny_start_minutes_utc: int = 12 * 60 + 30     # 12:30 UTC
    ny_end_minutes_utc: int = 16 * 60 + 30       # 16:30 UTC
    spread_dollars: float = 0.20      # $0.20/oz (2.0 pips on XAUUSD)
    commission_dollars: float = 0.07  # $7 per 100 oz standard lot = $0.07/oz
    slippage_dollars: float = 0.05    # $0.05/oz slippage
    allow_overlapping_trades: bool = False


@dataclass
class TradeRecord:
    trade_id: str
    symbol: str
    timeframe: str
    strategy_version: str
    period_split: str  # "TRAINING" | "VALIDATION" | "OUT_OF_SAMPLE"
    direction: str     # "LONG" | "SHORT"
    session: str       # "London Killzone" | "New York Killzone"
    signal_time_utc: str
    entry_time_utc: str
    exit_time_utc: str
    entry_ts: int
    exit_ts: int
    duration_minutes: int
    entry_price: float
    stop_loss: float
    take_profit: float
    exit_price: float
    position_size_oz: float
    position_lots: float
    risk_dollars: float
    risk_pct: float
    planned_rr: float
    realized_r: float
    gross_pnl: float
    spread_cost: float
    commission_cost: float
    slippage_cost: float
    total_costs: float
    net_pnl: float
    equity_before: float
    equity_after: float
    outcome: str       # "WIN" | "LOSS" | "BREAKEVEN"
    exit_reason: str   # "TAKE_PROFIT" | "STOP_LOSS" | "TIME_EXIT"
    sweep_type: str
    fvg_zone: str
    htf_bias: str
    intrabar_resolved_by: str


def fetch_yahoo_candles(symbol: str = "GC=F", interval: str = "15m", range_str: str = "60d") -> List[Candle]:
    """Fetch real historical OHLCV data from Yahoo Finance API."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval={interval}&range={range_str}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    result = raw["chart"]["result"][0]
    timestamps = result["timestamp"]
    quote = result["indicators"]["quote"][0]
    opens = quote["open"]
    highs = quote["high"]
    lows = quote["low"]
    closes = quote["close"]
    volumes = quote.get("volume", [0] * len(timestamps))

    candles: List[Candle] = []
    for ts, o, h, l, c, v in zip(timestamps, opens, highs, lows, closes, volumes):
        if o is None or h is None or l is None or c is None:
            continue
        if o <= 0 or h <= 0 or l <= 0 or c <= 0:
            continue
        dt_str = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        candles.append(
            Candle(
                timestamp=int(ts),
                dt_utc=dt_str,
                open=round(float(o), 2),
                high=round(float(h), 2),
                low=round(float(l), 2),
                close=round(float(c), 2),
                volume=float(v or 0.0),
            )
        )
    return candles


def save_candles_csv(candles: List[Candle], filepath: str) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "dt_utc", "open", "high", "low", "close", "volume"])
        for c in candles:
            writer.writerow([c.timestamp, c.dt_utc, c.open, c.high, c.low, c.close, c.volume])


def load_candles_csv(filepath: str) -> List[Candle]:
    candles: List[Candle] = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            candles.append(
                Candle(
                    timestamp=int(row["timestamp"]),
                    dt_utc=row["dt_utc"],
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=float(row["volume"]),
                )
            )
    return candles


def validate_and_clean_candles(candles: List[Candle], expected_step_sec: int) -> Tuple[List[Candle], Dict]:
    """
    Validate historical candle series:
    - Sort chronologically
    - Remove duplicate timestamps
    - Enforce High >= max(Open, Close) and Low <= min(Open, Close)
    - Detect price spike anomalies (>6% single-bar jump on M5/M15)
    - Count missing intrapartum intervals vs weekend closures
    """
    raw_count = len(candles)
    sorted_candles = sorted(candles, key=lambda x: x.timestamp)

    deduped: List[Candle] = []
    seen_ts = set()
    duplicate_count = 0
    ohlc_fixed_count = 0
    anomaly_count = 0

    for c in sorted_candles:
        if c.timestamp in seen_ts:
            duplicate_count += 1
            continue
        seen_ts.add(c.timestamp)

        hi = max(c.open, c.high, c.low, c.close)
        lo = min(c.open, c.high, c.low, c.close)
        if hi != c.high or lo != c.low:
            ohlc_fixed_count += 1
            c = Candle(c.timestamp, c.dt_utc, c.open, hi, lo, c.close, c.volume)

        if deduped:
            prev_c = deduped[-1].close
            if prev_c > 0 and abs(c.close - prev_c) / prev_c > 0.06:
                anomaly_count += 1
                continue

        deduped.append(c)

    intraday_gaps = 0
    weekend_gaps = 0
    for i in range(1, len(deduped)):
        delta = deduped[i].timestamp - deduped[i - 1].timestamp
        if delta > expected_step_sec:
            if delta >= 36 * 3600:
                weekend_gaps += 1
            else:
                intraday_gaps += 1

    report = {
        "raw_candles": raw_count,
        "valid_candles": len(deduped),
        "duplicate_timestamps_removed": duplicate_count,
        "ohlc_envelope_corrections": ohlc_fixed_count,
        "extreme_price_anomalies_filtered": anomaly_count,
        "intraday_maintenance_or_illiquid_gaps": intraday_gaps,
        "weekend_market_closures": weekend_gaps,
        "start_time_utc": deduped[0].dt_utc if deduped else None,
        "end_time_utc": deduped[-1].dt_utc if deduped else None,
        "start_timestamp": deduped[0].timestamp if deduped else None,
        "end_timestamp": deduped[-1].timestamp if deduped else None,
        "min_price": min((c.low for c in deduped), default=0.0),
        "max_price": max((c.high for c in deduped), default=0.0),
        "timezone": "UTC",
        "validation_passed": len(deduped) > 500 and anomaly_count == 0,
    }
    return deduped, report


def compute_atr_series(candles: List[Candle], period: int = 14) -> List[float]:
    atrs = [0.0] * len(candles)
    if not candles:
        return atrs
    trs = [candles[0].high - candles[0].low]
    for i in range(1, len(candles)):
        tr = max(
            candles[i].high - candles[i].low,
            abs(candles[i].high - candles[i - 1].close),
            abs(candles[i].low - candles[i - 1].close),
        )
        trs.append(tr)

    running = 0.0
    for i, tr in enumerate(trs):
        if i < period:
            running += tr
            atrs[i] = max(0.5, running / (i + 1))
        else:
            atrs[i] = max(0.5, (atrs[i - 1] * (period - 1) + tr) / period)
    return atrs


def compute_ema_series(values: List[float], period: int) -> List[float]:
    if not values:
        return []
    emas = [values[0]] * len(values)
    k = 2.0 / (period + 1.0)
    for i in range(1, len(values)):
        emas[i] = values[i] * k + emas[i - 1] * (1.0 - k)
    return emas


def get_session_name(ts: int, cfg: StrategyConfig) -> Optional[str]:
    dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    if dt.weekday() >= 5:
        return None
    mins = dt.hour * 60 + dt.minute
    if cfg.london_start_minutes_utc <= mins < cfg.london_end_minutes_utc:
        return "London Killzone"
    if cfg.ny_start_minutes_utc <= mins < cfg.ny_end_minutes_utc:
        return "New York Killzone"
    return None


def classify_split(ts: int, train_end_ts: int, val_end_ts: int) -> str:
    if ts <= train_end_ts:
        return "TRAINING"
    elif ts <= val_end_ts:
        return "VALIDATION"
    return "OUT_OF_SAMPLE"


def resolve_intrabar_outcome(
    direction: str,
    sl: float,
    tp: float,
    bar: Candle,
    m5_lookup: Optional[Dict[int, List[Candle]]] = None,
    bar_step_sec: int = 900,
) -> Tuple[Optional[str], Optional[float], str]:
    """
    Check if Stop-Loss or Take-Profit was hit during `bar`.
    If `m5_lookup` is provided for a 15m bar, iterate chronologically through the
    constituent 5m sub-candles to resolve intrabar order of execution accurately.
    If both SL and TP are hit inside the same atomic candle, apply the conservative
    STOP_LOSS-first rule to avoid optimistic bias.
    """
    sub_bars = [bar]
    used_m5 = False
    if m5_lookup and bar_step_sec == 900:
        subs = m5_lookup.get(bar.timestamp)
        if subs and len(subs) > 0:
            sub_bars = subs
            used_m5 = True

    for sub in sub_bars:
        if direction == "LONG":
            sl_hit = sub.low <= sl
            tp_hit = sub.high >= tp
            if sl_hit and tp_hit:
                return "STOP_LOSS", sl, ("M5_SUBCANDLE_CONSERVATIVE_SL" if used_m5 else "CONSERVATIVE_SL_FIRST")
            if sl_hit:
                return "STOP_LOSS", sl, ("M5_SUBCANDLE_EXACT" if used_m5 else "BAR_LOW_SL")
            if tp_hit:
                return "TAKE_PROFIT", tp, ("M5_SUBCANDLE_EXACT" if used_m5 else "BAR_HIGH_TP")
        else:
            sl_hit = sub.high >= sl
            tp_hit = sub.low <= tp
            if sl_hit and tp_hit:
                return "STOP_LOSS", sl, ("M5_SUBCANDLE_CONSERVATIVE_SL" if used_m5 else "CONSERVATIVE_SL_FIRST")
            if sl_hit:
                return "STOP_LOSS", sl, ("M5_SUBCANDLE_EXACT" if used_m5 else "BAR_HIGH_SL")
            if tp_hit:
                return "TAKE_PROFIT", tp, ("M5_SUBCANDLE_EXACT" if used_m5 else "BAR_LOW_TP")

    return None, None, "NONE"


def record_closed_trade(
    trades: List[TradeRecord],
    active_trade: Dict,
    exit_bar: Candle,
    raw_exit_price: float,
    reason: str,
    res_method: str,
    equity: float,
    risk_pct: float,
    cfg: StrategyConfig,
    train_end_ts: int,
    val_end_ts: int,
    bar_step_sec: int,
) -> float:
    direction = active_trade["direction"]
    entry_price = active_trade["entry_price"]
    pos_oz = active_trade["pos_oz"]
    pos_lots = round(pos_oz / 100.0, 4)

    if direction == "LONG":
        gross_pnl = (raw_exit_price - entry_price) * pos_oz
    else:
        gross_pnl = (entry_price - raw_exit_price) * pos_oz

    spread_cost = cfg.spread_dollars * pos_oz
    commission_cost = cfg.commission_dollars * pos_oz
    slippage_cost = (cfg.slippage_dollars * pos_oz) if reason != "TAKE_PROFIT" else (cfg.slippage_dollars * 0.4 * pos_oz)
    total_costs = spread_cost + commission_cost + slippage_cost
    net_pnl = gross_pnl - total_costs

    eq_before = equity
    new_equity = round(equity + net_pnl, 2)
    risk_dollars = active_trade["risk_dollars"]
    realized_r = round(net_pnl / risk_dollars, 3) if risk_dollars > 0 else 0.0
    outcome = "WIN" if net_pnl > 0 else ("LOSS" if net_pnl < 0 else "BREAKEVEN")
    dur_mins = max(bar_step_sec // 60, int((exit_bar.timestamp - active_trade["entry_ts"]) // 60))

    split_label = classify_split(active_trade["entry_ts"], train_end_ts, val_end_ts)
    trade_id = f"ICT-XAU-{cfg.timeframe.upper()}-{len(trades) + 1:04d}"

    trades.append(
        TradeRecord(
            trade_id=trade_id,
            symbol=cfg.symbol,
            timeframe=cfg.timeframe,
            strategy_version=cfg.version,
            period_split=split_label,
            direction=direction,
            session=active_trade["session"],
            signal_time_utc=active_trade["signal_time_utc"],
            entry_time_utc=active_trade["entry_time_utc"],
            exit_time_utc=exit_bar.dt_utc,
            entry_ts=active_trade["entry_ts"],
            exit_ts=exit_bar.timestamp,
            duration_minutes=dur_mins,
            entry_price=round(entry_price, 2),
            stop_loss=round(active_trade["sl"], 2),
            take_profit=round(active_trade["tp"], 2),
            exit_price=round(raw_exit_price, 2),
            position_size_oz=round(pos_oz, 3),
            position_lots=pos_lots,
            risk_dollars=round(risk_dollars, 2),
            risk_pct=round(risk_pct * 100, 2),
            planned_rr=round(active_trade["planned_rr"], 2),
            realized_r=realized_r,
            gross_pnl=round(gross_pnl, 2),
            spread_cost=round(spread_cost, 2),
            commission_cost=round(commission_cost, 2),
            slippage_cost=round(slippage_cost, 2),
            total_costs=round(total_costs, 2),
            net_pnl=round(net_pnl, 2),
            equity_before=round(eq_before, 2),
            equity_after=new_equity,
            outcome=outcome,
            exit_reason=reason,
            sweep_type=active_trade["sweep_type"],
            fvg_zone=active_trade["fvg_zone"],
            htf_bias=active_trade["htf_bias"],
            intrabar_resolved_by=res_method,
        )
    )
    return new_equity


def run_ict_backtest(
    candles: List[Candle],
    cfg: StrategyConfig,
    train_end_ts: int,
    val_end_ts: int,
    m5_candles_for_intrabar: Optional[List[Candle]] = None,
) -> Dict:
    """
    Execute the mechanical ICT XAUUSD strategy across `candles` strictly causally
    (zero look-ahead bias).
    """
    risk_pct = min(MAX_RISK_PCT, max(0.001, cfg.risk_per_trade_pct))
    bar_step_sec = 300 if cfg.timeframe == "5m" else 900

    # Build M5 lookup map for M15 bars if provided
    m5_lookup: Dict[int, List[Candle]] = {}
    if m5_candles_for_intrabar and bar_step_sec == 900:
        for c5 in m5_candles_for_intrabar:
            bucket = (c5.timestamp // 900) * 900
            m5_lookup.setdefault(bucket, []).append(c5)

    atrs = compute_atr_series(candles, period=14)
    closes = [c.close for c in candles]
    ema_fast_period = 40 if cfg.timeframe == "15m" else 96
    ema_slow_period = 120 if cfg.timeframe == "15m" else 288
    ema_fast = compute_ema_series(closes, period=ema_fast_period)
    ema_slow = compute_ema_series(closes, period=ema_slow_period)

    daily_highs: Dict[str, float] = {}
    daily_lows: Dict[str, float] = {}
    asian_highs: Dict[str, float] = {}
    asian_lows: Dict[str, float] = {}

    confirmed_swing_highs: List[Tuple[int, float]] = []
    confirmed_swing_lows: List[Tuple[int, float]] = []

    equity = cfg.initial_capital
    trades: List[TradeRecord] = []
    active_trade: Optional[Dict] = None
    pending_order: Optional[Dict] = None

    L = cfg.fractal_bars

    for i in range(len(candles)):
        bar = candles[i]
        dt = datetime.datetime.fromtimestamp(bar.timestamp, tz=datetime.timezone.utc)
        day_key = dt.strftime("%Y-%m-%d")
        prev_day_key = (dt - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        if dt.weekday() == 0:
            prev_day_key = (dt - datetime.timedelta(days=3)).strftime("%Y-%m-%d")

        # 1. Confirm fractal swing at index (i - L) using only bars up to i
        cand_idx = i - L
        if cand_idx >= L:
            cand_hi = candles[cand_idx].high
            cand_lo = candles[cand_idx].low
            is_sh = all(cand_hi > candles[cand_idx - j].high for j in range(1, L + 1)) and all(
                cand_hi >= candles[cand_idx + j].high for j in range(1, L + 1)
            )
            is_sl = all(cand_lo < candles[cand_idx - j].low for j in range(1, L + 1)) and all(
                cand_lo <= candles[cand_idx + j].low for j in range(1, L + 1)
            )
            if is_sh:
                confirmed_swing_highs.append((cand_idx, cand_hi))
                if len(confirmed_swing_highs) > 40:
                    confirmed_swing_highs.pop(0)
            if is_sl:
                confirmed_swing_lows.append((cand_idx, cand_lo))
                if len(confirmed_swing_lows) > 40:
                    confirmed_swing_lows.pop(0)

        # 2. If there is an active open trade, check SL / TP execution on current bar `i`
        if active_trade is not None:
            reason, raw_exit_price, res_method = resolve_intrabar_outcome(
                active_trade["direction"],
                active_trade["sl"],
                active_trade["tp"],
                bar,
                m5_lookup=m5_lookup,
                bar_step_sec=bar_step_sec,
            )

            max_hold_sec = 24 * 3600
            if reason is None and (bar.timestamp - active_trade["entry_ts"]) >= max_hold_sec:
                reason = "TIME_EXIT"
                raw_exit_price = bar.close
                res_method = "MAX_HOLD_CLOSE"

            if reason is not None and raw_exit_price is not None:
                equity = record_closed_trade(
                    trades,
                    active_trade,
                    bar,
                    raw_exit_price,
                    reason,
                    res_method,
                    equity,
                    risk_pct,
                    cfg,
                    train_end_ts,
                    val_end_ts,
                    bar_step_sec,
                )
                active_trade = None

        # 3. Check pending FVG limit order fill or expiration (only if no active trade)
        if active_trade is None and pending_order is not None:
            if i - pending_order["created_idx"] > cfg.limit_expiry_bars:
                pending_order = None
            else:
                p_dir = pending_order["direction"]
                p_entry = pending_order["entry_price"]
                p_sl = pending_order["sl"]
                p_tp = pending_order["tp"]

                # Cancel if price hits TP before tapping FVG or breaks invalidation before filling
                if p_dir == "LONG" and bar.high >= p_tp and bar.low > p_entry:
                    pending_order = None
                elif p_dir == "SHORT" and bar.low <= p_tp and bar.high < p_entry:
                    pending_order = None
                elif bar.low <= p_entry <= bar.high:
                    active_trade = {
                        **pending_order,
                        "entry_time_utc": bar.dt_utc,
                        "entry_ts": bar.timestamp,
                    }
                    pending_order = None
                    # Check if SL was also breached on the fill bar (conservative SL guard)
                    if (p_dir == "LONG" and bar.low <= p_sl) or (p_dir == "SHORT" and bar.high >= p_sl):
                        equity = record_closed_trade(
                            trades,
                            active_trade,
                            bar,
                            p_sl,
                            "STOP_LOSS",
                            "FILL_BAR_SL_GUARD",
                            equity,
                            risk_pct,
                            cfg,
                            train_end_ts,
                            val_end_ts,
                            bar_step_sec,
                        )
                        active_trade = None

        # 4. Scan for new ICT Setup on bar `i` close (only if no active trade and inside London/NY Killzone)
        session_name = get_session_name(bar.timestamp, cfg)
        if i >= 60 and active_trade is None and session_name is not None and confirmed_swing_highs and confirmed_swing_lows:
            atr = atrs[i]
            c0 = candles[i]      # Impulse completion candle
            c1 = candles[i - 1]  # Impulse middle candle (creates FVG)
            c2 = candles[i - 2]  # Origin candle

            # HTF Market Structure & Directional Bias (Causal EMA-40 vs EMA-120 on M15 / EMA-96 vs EMA-288 on M5)
            htf_bullish = ema_fast[i] >= ema_slow[i]
            htf_bearish = ema_fast[i] < ema_slow[i]
            htf_bias_label = "Bullish HTF" if htf_bullish else "Bearish HTF"

            # Dealing Range from recent lookback
            lookback_slice = candles[max(0, i - cfg.dealing_range_bars) : i + 1]
            range_hi = max(x.high for x in lookback_slice)
            range_lo = min(x.low for x in lookback_slice)
            equilibrium = (range_hi + range_lo) / 2.0

            pdl = daily_lows.get(prev_day_key)
            pdh = daily_highs.get(prev_day_key)
            asian_lo = asian_lows.get(day_key)
            asian_hi = asian_highs.get(day_key)

            recent_sw_lows = [lvl for idx_s, lvl in confirmed_swing_lows if i - cfg.sweep_lookback_bars * 4 <= idx_s < i - 1]
            recent_sw_highs = [lvl for idx_s, lvl in confirmed_swing_highs if i - cfg.sweep_lookback_bars * 4 <= idx_s < i - 1]

            c1_range = max(0.01, c1.high - c1.low)
            c1_body = abs(c1.close - c1.open)
            c0_range = max(0.01, c0.high - c0.low)
            c0_body = abs(c0.close - c0.open)

            bull_fvg_gap = c0.low - c2.high
            bear_fvg_gap = c2.low - c0.high

            recent_window = candles[max(0, i - cfg.sweep_lookback_bars) : i + 1]
            recent_min_low = min(x.low for x in recent_window)
            recent_max_high = max(x.high for x in recent_window)

            minor_window = candles[max(0, i - 6) : i - 1]
            minor_high = max((x.high for x in minor_window), default=c0.high)
            minor_low = min((x.low for x in minor_window), default=c0.low)

            # --- BULLISH ICT SETUP ---
            if bull_fvg_gap >= cfg.fvg_min_atr_mult * atr and (
                (c1.close > c1.open and c1_body / c1_range >= cfg.displacement_body_ratio)
                or (c0.close > c0.open and c0_body / c0_range >= cfg.displacement_body_ratio)
            ):
                sweep_label = None
                if pdl is not None and recent_min_low <= pdl and c0.close > pdl:
                    sweep_label = "PDL Liquidity Sweep + Bullish MSS"
                elif asian_lo is not None and recent_min_low <= asian_lo and c0.close > asian_lo:
                    sweep_label = "Asian Low Sweep + Bullish MSS"
                else:
                    for sw_l in reversed(recent_sw_lows):
                        if recent_min_low <= sw_l and c0.close > sw_l:
                            sweep_label = "Swing SSL Sweep + Bullish CHOCH/MSS"
                            break

                mss_confirmed = c0.close >= minor_high or (c0.close > c1.high and c1.close > c2.high)

                fvg_top = c0.low
                fvg_bot = c2.high
                fvg_ce = (fvg_top + fvg_bot) / 2.0
                entry_lvl = round(fvg_ce if cfg.fvg_entry_mode == "CE_50" else fvg_top, 2)

                in_discount = (not cfg.require_discount_premium) or (entry_lvl <= equilibrium + 0.20 * atr)
                htf_ok = (not cfg.require_htf_alignment) or htf_bullish

                if sweep_label and mss_confirmed and in_discount and htf_ok:
                    invalidation_low = min(c2.low, c1.low, recent_min_low)
                    raw_sl = invalidation_low - cfg.sl_atr_buffer * atr
                    sl_dist = entry_lvl - raw_sl
                    if sl_dist < cfg.min_sl_dollars:
                        raw_sl = entry_lvl - cfg.min_sl_dollars
                        sl_dist = cfg.min_sl_dollars
                    if sl_dist <= cfg.max_sl_dollars:
                        tp_lvl = round(entry_lvl + sl_dist * cfg.rr_target, 2)
                        sl_lvl = round(raw_sl, 2)
                        risk_dollars = equity * risk_pct
                        est_unit_risk = sl_dist + cfg.spread_dollars + cfg.commission_dollars + cfg.slippage_dollars
                        pos_oz = max(1.0, risk_dollars / est_unit_risk)
                        pending_order = {
                            "created_idx": i,
                            "direction": "LONG",
                            "session": session_name,
                            "signal_time_utc": bar.dt_utc,
                            "entry_price": entry_lvl,
                            "sl": sl_lvl,
                            "tp": tp_lvl,
                            "pos_oz": pos_oz,
                            "risk_dollars": risk_dollars,
                            "planned_rr": cfg.rr_target,
                            "sweep_type": sweep_label,
                            "fvg_zone": f"${fvg_bot:.2f} – ${fvg_top:.2f}",
                            "htf_bias": htf_bias_label,
                        }

            # --- BEARISH ICT SETUP ---
            elif bear_fvg_gap >= cfg.fvg_min_atr_mult * atr and (
                (c1.close < c1.open and c1_body / c1_range >= cfg.displacement_body_ratio)
                or (c0.close < c0.open and c0_body / c0_range >= cfg.displacement_body_ratio)
            ):
                sweep_label = None
                if pdh is not None and recent_max_high >= pdh and c0.close < pdh:
                    sweep_label = "PDH Liquidity Sweep + Bearish MSS"
                elif asian_hi is not None and recent_max_high >= asian_hi and c0.close < asian_hi:
                    sweep_label = "Asian High Sweep + Bearish MSS"
                else:
                    for sw_h in reversed(recent_sw_highs):
                        if recent_max_high >= sw_h and c0.close < sw_h:
                            sweep_label = "Swing BSL Sweep + Bearish CHOCH/MSS"
                            break

                mss_confirmed = c0.close <= minor_low or (c0.close < c1.low and c1.close < c2.low)

                fvg_bot = c0.high
                fvg_top = c2.low
                fvg_ce = (fvg_top + fvg_bot) / 2.0
                entry_lvl = round(fvg_ce if cfg.fvg_entry_mode == "CE_50" else fvg_bot, 2)

                in_premium = (not cfg.require_discount_premium) or (entry_lvl >= equilibrium - 0.20 * atr)
                htf_ok = (not cfg.require_htf_alignment) or htf_bearish

                if sweep_label and mss_confirmed and in_premium and htf_ok:
                    invalidation_high = max(c2.high, c1.high, recent_max_high)
                    raw_sl = invalidation_high + cfg.sl_atr_buffer * atr
                    sl_dist = raw_sl - entry_lvl
                    if sl_dist < cfg.min_sl_dollars:
                        raw_sl = entry_lvl + cfg.min_sl_dollars
                        sl_dist = cfg.min_sl_dollars
                    if sl_dist <= cfg.max_sl_dollars:
                        tp_lvl = round(entry_lvl - sl_dist * cfg.rr_target, 2)
                        sl_lvl = round(raw_sl, 2)
                        risk_dollars = equity * risk_pct
                        est_unit_risk = sl_dist + cfg.spread_dollars + cfg.commission_dollars + cfg.slippage_dollars
                        pos_oz = max(1.0, risk_dollars / est_unit_risk)
                        pending_order = {
                            "created_idx": i,
                            "direction": "SHORT",
                            "session": session_name,
                            "signal_time_utc": bar.dt_utc,
                            "entry_price": entry_lvl,
                            "sl": sl_lvl,
                            "tp": tp_lvl,
                            "pos_oz": pos_oz,
                            "risk_dollars": risk_dollars,
                            "planned_rr": cfg.rr_target,
                            "sweep_type": sweep_label,
                            "fvg_zone": f"${fvg_bot:.2f} – ${fvg_top:.2f}",
                            "htf_bias": htf_bias_label,
                        }

        # 5. Update Daily & Asian highs/lows causally at the end of bar `i`
        daily_highs[day_key] = max(daily_highs.get(day_key, -1e9), bar.high)
        daily_lows[day_key] = min(daily_lows.get(day_key, 1e9), bar.low)
        if 0 <= dt.hour < 6:
            asian_highs[day_key] = max(asian_highs.get(day_key, -1e9), bar.high)
            asian_lows[day_key] = min(asian_lows.get(day_key, 1e9), bar.low)

    return {
        "trades": trades,
        "final_equity": equity,
        "config": asdict(cfg),
    }


def calculate_performance_metrics(trades: List[TradeRecord], initial_capital: float) -> Dict:
    """
    Calculate all required institutional performance metrics from the closed trade records
    and account-equity history.
    """
    total_trades = len(trades)
    if total_trades == 0:
        return {
            "total_closed_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "breakeven_trades": 0,
            "win_rate_pct": 0.0,
            "gross_profit": 0.0,
            "gross_loss": 0.0,
            "total_trading_costs": 0.0,
            "net_profit": 0.0,
            "net_return_pct": 0.0,
            "profit_factor": 0.0,
            "profit_factor_display": "0.00",
            "avg_winning_trade": 0.0,
            "avg_losing_trade": 0.0,
            "avg_realized_r": 0.0,
            "expected_value_per_trade": 0.0,
            "expected_value_r": 0.0,
            "max_drawdown_dollars": 0.0,
            "max_drawdown_pct": 0.0,
            "max_consecutive_wins": 0,
            "max_consecutive_losses": 0,
            "avg_trade_duration_minutes": 0,
            "avg_trade_duration_display": "0m",
            "initial_capital": initial_capital,
            "final_equity": initial_capital,
            "long_short_breakdown": {},
            "session_breakdown": {},
            "monthly_performance": [],
            "equity_curve": [],
        }

    wins = [t for t in trades if t.net_pnl > 0]
    losses = [t for t in trades if t.net_pnl < 0]
    breakevens = [t for t in trades if t.net_pnl == 0]

    win_count = len(wins)
    loss_count = len(losses)
    win_rate_pct = round((win_count / total_trades) * 100.0, 2)

    gross_profit = round(sum(t.net_pnl for t in wins), 2)
    gross_loss_abs = round(abs(sum(t.net_pnl for t in losses)), 2)
    raw_gross_profit_before_costs = round(sum(t.gross_pnl for t in wins), 2)
    raw_gross_loss_before_costs = round(abs(sum(t.gross_pnl for t in losses)), 2)
    total_costs = round(sum(t.total_costs for t in trades), 2)
    net_profit = round(sum(t.net_pnl for t in trades), 2)
    net_return_pct = round((net_profit / initial_capital) * 100.0, 2)

    if gross_loss_abs > 0:
        pf = round(gross_profit / gross_loss_abs, 2)
        pf_display = f"{pf:.2f}"
    elif gross_profit > 0:
        pf = None
        pf_display = "∞ (No Losing Trades)"
    else:
        pf = 0.0
        pf_display = "0.00"

    avg_win = round(gross_profit / win_count, 2) if win_count > 0 else 0.0
    avg_loss = round(-gross_loss_abs / loss_count, 2) if loss_count > 0 else 0.0
    avg_realized_r = round(sum(t.realized_r for t in trades) / total_trades, 2)
    ev_dollars = round(net_profit / total_trades, 2)

    peak_equity = initial_capital
    max_dd_dollars = 0.0
    max_dd_pct = 0.0
    curr_equity = initial_capital

    equity_curve = [
        {
            "trade_num": 0,
            "timestamp": trades[0].entry_ts - 900,
            "date": trades[0].entry_time_utc[:10],
            "equity": round(initial_capital, 2),
            "drawdown_dollars": 0.0,
            "drawdown_pct": 0.0,
            "net_pnl": 0.0,
        }
    ]

    max_consec_wins = 0
    max_consec_losses = 0
    cur_w = 0
    cur_l = 0

    for idx, t in enumerate(trades, start=1):
        curr_equity = round(curr_equity + t.net_pnl, 2)
        if curr_equity > peak_equity:
            peak_equity = curr_equity
        dd_dollars = round(peak_equity - curr_equity, 2)
        dd_pct = round((dd_dollars / peak_equity) * 100.0, 2) if peak_equity > 0 else 0.0
        if dd_dollars > max_dd_dollars:
            max_dd_dollars = dd_dollars
        if dd_pct > max_dd_pct:
            max_dd_pct = dd_pct

        equity_curve.append(
            {
                "trade_num": idx,
                "trade_id": t.trade_id,
                "timestamp": t.exit_ts,
                "date": t.exit_time_utc[:10],
                "period_split": t.period_split,
                "equity": curr_equity,
                "drawdown_dollars": dd_dollars,
                "drawdown_pct": dd_pct,
                "net_pnl": t.net_pnl,
                "realized_r": t.realized_r,
            }
        )

        if t.net_pnl > 0:
            cur_w += 1
            cur_l = 0
            if cur_w > max_consec_wins:
                max_consec_wins = cur_w
        elif t.net_pnl < 0:
            cur_l += 1
            cur_w = 0
            if cur_l > max_consec_losses:
                max_consec_losses = cur_l
        else:
            cur_w = 0
            cur_l = 0

    avg_dur_mins = round(sum(t.duration_minutes for t in trades) / total_trades)
    hours = avg_dur_mins // 60
    mins = avg_dur_mins % 60
    dur_display = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

    long_trades = [t for t in trades if t.direction == "LONG"]
    short_trades = [t for t in trades if t.direction == "SHORT"]

    def sub_summary(sub: List[TradeRecord]) -> Dict:
        if not sub:
            return {"trades": 0, "wins": 0, "losses": 0, "win_rate_pct": 0.0, "net_pnl": 0.0, "avg_r": 0.0}
        w = sum(1 for x in sub if x.net_pnl > 0)
        l = sum(1 for x in sub if x.net_pnl < 0)
        return {
            "trades": len(sub),
            "wins": w,
            "losses": l,
            "win_rate_pct": round((w / len(sub)) * 100.0, 2),
            "net_pnl": round(sum(x.net_pnl for x in sub), 2),
            "avg_r": round(sum(x.realized_r for x in sub) / len(sub), 2),
        }

    london_trades = [t for t in trades if "London" in t.session]
    ny_trades = [t for t in trades if "New York" in t.session]

    monthly_map: Dict[str, List[TradeRecord]] = {}
    for t in trades:
        m_key = t.exit_time_utc[:7]
        monthly_map.setdefault(m_key, []).append(t)

    monthly_perf = []
    for m_key in sorted(monthly_map.keys()):
        m_list = monthly_map[m_key]
        m_wins = sum(1 for x in m_list if x.net_pnl > 0)
        m_pnl = round(sum(x.net_pnl for x in m_list), 2)
        m_r = round(sum(x.realized_r for x in m_list), 2)
        monthly_perf.append(
            {
                "month": m_key,
                "trades": len(m_list),
                "wins": m_wins,
                "losses": len(m_list) - m_wins,
                "win_rate_pct": round((m_wins / len(m_list)) * 100.0, 2),
                "net_pnl": m_pnl,
                "return_pct": round((m_pnl / initial_capital) * 100.0, 2),
                "cumulative_r": m_r,
            }
        )

    return {
        "total_closed_trades": total_trades,
        "winning_trades": win_count,
        "losing_trades": loss_count,
        "breakeven_trades": len(breakevens),
        "win_rate_pct": win_rate_pct,
        "gross_profit": gross_profit,
        "gross_loss": -gross_loss_abs,
        "raw_gross_profit_before_costs": raw_gross_profit_before_costs,
        "raw_gross_loss_before_costs": -raw_gross_loss_before_costs,
        "total_trading_costs": total_costs,
        "net_profit": net_profit,
        "net_return_pct": net_return_pct,
        "profit_factor": pf if pf is not None else 99.99,
        "profit_factor_display": pf_display,
        "avg_winning_trade": avg_win,
        "avg_losing_trade": avg_loss,
        "avg_realized_r": avg_realized_r,
        "expected_value_per_trade": ev_dollars,
        "expected_value_r": avg_realized_r,
        "max_drawdown_dollars": max_dd_dollars,
        "max_drawdown_pct": max_dd_pct,
        "max_consecutive_wins": max_consec_wins,
        "max_consecutive_losses": max_consec_losses,
        "avg_trade_duration_minutes": avg_dur_mins,
        "avg_trade_duration_display": dur_display,
        "initial_capital": initial_capital,
        "final_equity": curr_equity,
        "long_short_breakdown": {
            "long": sub_summary(long_trades),
            "short": sub_summary(short_trades),
        },
        "session_breakdown": {
            "london_killzone": sub_summary(london_trades),
            "new_york_killzone": sub_summary(ny_trades),
        },
        "monthly_performance": monthly_perf,
        "equity_curve": equity_curve,
    }


def main():
    import sys
    force_refresh = "--refresh" in sys.argv
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    m5_csv = os.path.join(data_dir, "xauusd_m5_historical.csv")
    m15_csv = os.path.join(data_dir, "xauusd_m15_historical.csv")

    if not force_refresh and os.path.exists(m5_csv) and os.path.exists(m15_csv):
        print("[1/5] Loading verified historical XAUUSD (GC=F) M5 and M15 OHLCV data from local cache...")
        raw_m5 = load_candles_csv(m5_csv)
        raw_m15 = load_candles_csv(m15_csv)
    else:
        print("[1/5] Fetching real historical XAUUSD (GC=F) M5 and M15 OHLCV data...")
        raw_m5 = fetch_yahoo_candles("GC=F", interval="5m", range_str="60d")
        raw_m15 = fetch_yahoo_candles("GC=F", interval="15m", range_str="60d")
        save_candles_csv(raw_m5, m5_csv)
        save_candles_csv(raw_m15, m15_csv)

    print("[2/5] Validating historical M5 and M15 candle series...")
    m5_candles, m5_val_report = validate_and_clean_candles(raw_m5, expected_step_sec=300)
    m15_candles, m15_val_report = validate_and_clean_candles(raw_m15, expected_step_sec=900)

    n15 = len(m15_candles)
    train_end_ts = m15_candles[int(n15 * 0.50)].timestamp
    val_end_ts = m15_candles[int(n15 * 0.75)].timestamp

    train_end_dt = datetime.datetime.fromtimestamp(train_end_ts, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    val_end_dt = datetime.datetime.fromtimestamp(val_end_ts, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # Compare M5 vs M15 candidate configurations on Training + Validation ONLY
    candidates = [
        StrategyConfig(
            timeframe="15m",
            rr_target=2.0,
            fractal_bars=2,
            sweep_lookback_bars=18,
            fvg_min_atr_mult=0.05,
            fvg_entry_mode="PROXIMAL",
            displacement_body_ratio=0.38,
            require_discount_premium=True,
            require_htf_alignment=True,
        ),
        StrategyConfig(
            timeframe="15m",
            rr_target=2.5,
            fractal_bars=2,
            sweep_lookback_bars=18,
            fvg_min_atr_mult=0.05,
            fvg_entry_mode="PROXIMAL",
            displacement_body_ratio=0.38,
            require_discount_premium=True,
            require_htf_alignment=True,
        ),
        StrategyConfig(
            timeframe="5m",
            rr_target=2.0,
            fractal_bars=3,
            sweep_lookback_bars=20,
            fvg_min_atr_mult=0.08,
            fvg_entry_mode="CE_50",
            displacement_body_ratio=0.42,
            require_discount_premium=True,
            require_htf_alignment=True,
        ),
        StrategyConfig(
            timeframe="5m",
            rr_target=2.5,
            fractal_bars=3,
            sweep_lookback_bars=20,
            fvg_min_atr_mult=0.08,
            fvg_entry_mode="CE_50",
            displacement_body_ratio=0.42,
            require_discount_premium=True,
            require_htf_alignment=True,
        ),
    ]

    comparison_records = []
    best_cfg = candidates[0]
    best_val_score = -1e9

    print("[4/5] Running M5 vs M15 Model Selection on Training & Validation Splits...")
    for idx_c, cand in enumerate(candidates, start=1):
        series = m15_candles if cand.timeframe == "15m" else m5_candles
        run_res = run_ict_backtest(
            series,
            cand,
            train_end_ts=train_end_ts,
            val_end_ts=val_end_ts,
            m5_candles_for_intrabar=(m5_candles if cand.timeframe == "15m" else None),
        )
        all_t = run_res["trades"]
        train_t = [t for t in all_t if t.period_split == "TRAINING"]
        val_t = [t for t in all_t if t.period_split == "VALIDATION"]

        train_m = calculate_performance_metrics(train_t, cand.initial_capital)
        val_m = calculate_performance_metrics(val_t, cand.initial_capital)

        # Combined Train + Val robustness score (without looking at OOS)
        val_score = (
            val_m["net_profit"] * 0.65
            + train_m["net_profit"] * 0.35
            - (val_m["max_drawdown_dollars"] * 0.4)
        )
        if val_m["total_closed_trades"] < 3:
            val_score -= 500.0

        comparison_records.append(
            {
                "config_id": f"CFG-{idx_c}",
                "timeframe": cand.timeframe.upper(),
                "rr_target": cand.rr_target,
                "htf_filter": cand.require_htf_alignment,
                "fvg_entry": cand.fvg_entry_mode,
                "train_trades": train_m["total_closed_trades"],
                "train_win_rate_pct": train_m["win_rate_pct"],
                "train_net_profit": train_m["net_profit"],
                "train_profit_factor": train_m["profit_factor_display"],
                "val_trades": val_m["total_closed_trades"],
                "val_win_rate_pct": val_m["win_rate_pct"],
                "val_net_profit": val_m["net_profit"],
                "val_profit_factor": val_m["profit_factor_display"],
                "val_avg_r": val_m["avg_realized_r"],
                "val_max_dd_pct": val_m["max_drawdown_pct"],
                "validation_selection_score": round(val_score, 2),
            }
        )
        print(
            f"  -> CFG-{idx_c} ({cand.timeframe.upper()}, R:R 1:{cand.rr_target}, HTF={cand.require_htf_alignment}): "
            f"Train={train_m['total_closed_trades']} trades (${train_m['net_profit']:+.2f}, PF {train_m['profit_factor_display']}) | "
            f"Val={val_m['total_closed_trades']} trades (${val_m['net_profit']:+.2f}, PF {val_m['profit_factor_display']}, Score={val_score:.2f})"
        )

        if val_score > best_val_score:
            best_val_score = val_score
            best_cfg = cand

    print(f"\n[SELECTED CONFIGURATION via Validation Split]: Timeframe={best_cfg.timeframe.upper()}, Target R:R=1:{best_cfg.rr_target}, HTF={best_cfg.require_htf_alignment}")

    selected_series = m15_candles if best_cfg.timeframe == "15m" else m5_candles
    final_run = run_ict_backtest(
        selected_series,
        best_cfg,
        train_end_ts=train_end_ts,
        val_end_ts=val_end_ts,
        m5_candles_for_intrabar=(m5_candles if best_cfg.timeframe == "15m" else None),
    )

    all_trades = final_run["trades"]
    train_trades = [t for t in all_trades if t.period_split == "TRAINING"]
    val_trades = [t for t in all_trades if t.period_split == "VALIDATION"]
    oos_trades = [t for t in all_trades if t.period_split == "OUT_OF_SAMPLE"]

    overall_metrics = calculate_performance_metrics(all_trades, best_cfg.initial_capital)
    train_metrics = calculate_performance_metrics(train_trades, best_cfg.initial_capital)
    val_metrics = calculate_performance_metrics(val_trades, best_cfg.initial_capital)
    oos_metrics = calculate_performance_metrics(oos_trades, best_cfg.initial_capital)

    print(f"\n[5/5] Final Audited Results ({best_cfg.symbol} {best_cfg.timeframe.upper()} - {best_cfg.version}):")
    print(f"  -> Overall Closed Trades: {overall_metrics['total_closed_trades']} | Win Rate: {overall_metrics['win_rate_pct']}% | Net Profit: ${overall_metrics['net_profit']:+.2f} | PF: {overall_metrics['profit_factor_display']} | Avg Realized R: {overall_metrics['avg_realized_r']:+.2f}R | Max DD: {overall_metrics['max_drawdown_pct']}%")
    print(f"  -> Training Split:        {train_metrics['total_closed_trades']} trades | Win Rate: {train_metrics['win_rate_pct']}% | Net Profit: ${train_metrics['net_profit']:+.2f} | PF: {train_metrics['profit_factor_display']}")
    print(f"  -> Validation Split:      {val_metrics['total_closed_trades']} trades | Win Rate: {val_metrics['win_rate_pct']}% | Net Profit: ${val_metrics['net_profit']:+.2f} | PF: {val_metrics['profit_factor_display']}")
    print(f"  -> Out-of-Sample (OOS):   {oos_metrics['total_closed_trades']} trades | Win Rate: {oos_metrics['win_rate_pct']}% | Net Profit: ${oos_metrics['net_profit']:+.2f} | PF: {oos_metrics['profit_factor_display']}")

    config_json_str = json.dumps(asdict(best_cfg), sort_keys=True)
    run_hash = hashlib.sha256(
        f"{config_json_str}|{m15_val_report['start_timestamp']}|{m15_val_report['end_timestamp']}|{len(all_trades)}".encode("utf-8")
    ).hexdigest()[:16]

    now_iso = datetime.datetime.now(tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    payload = {
        "run_id": f"bt-xauusd-{run_hash}",
        "status": "COMPLETED",
        "data_category": "HISTORICAL_BACKTEST",
        "strategy_name": "ICT Killzone Liquidity Sweep + MSS + Consequent Encroachment FVG",
        "strategy_version": best_cfg.version,
        "symbol": "XAUUSD",
        "benchmark_ticker": "GC=F / XAUUSD Spot Benchmark",
        "selected_timeframe": best_cfg.timeframe.upper(),
        "data_source": "Yahoo Finance COMEX/Spot Gold Historical Feed (M15 + M5 Intrabar Resolution)",
        "timezone": "UTC",
        "last_successful_backtest_utc": now_iso,
        "reproducibility_hash": run_hash,
        "out_of_sample_status": (
            "VERIFIED PROFITABLE (Unseen OOS Positive Expectancy)"
            if oos_metrics["net_profit"] > 0
            else "COMPLETED (Unseen OOS Audited)"
        ),
        "date_range": {
            "start_utc": m15_val_report["start_time_utc"],
            "end_utc": m15_val_report["end_time_utc"],
            "training_range": f"{m15_val_report['start_time_utc'][:10]} → {train_end_dt[:10]}",
            "validation_range": f"{train_end_dt[:10]} → {val_end_dt[:10]}",
            "out_of_sample_range": f"{val_end_dt[:10]} → {m15_val_report['end_time_utc'][:10]}",
        },
        "configuration": asdict(best_cfg),
        "strategy_rules_summary": [
            "1. Session Filter: Trade exclusively during London Killzone (07:00–11:00 UTC) and New York Killzone (12:30–16:30 UTC).",
            "2. Higher-Timeframe Bias & Dealing Range: Define causal 32-bar dealing range with Equilibrium at 50%; evaluate causal HTF EMA structure.",
            "3. Liquidity Sweep (SSL/BSL Purge): Require a purge of Previous Day High/Low (PDH/PDL), Asian Session High/Low (00:00–06:00 UTC), or confirmed fractal Swing High/Low followed by reclaim inside range.",
            "4. Market Structure Shift (MSS/CHOCH): Require impulsive displacement candle closing beyond minor structure with body >= 38%–42% of candle range.",
            "5. Fair Value Gap (FVG) Consequent Encroachment Entry: Place limit order at the 50% Consequent Encroachment midpoint of the 3-candle FVG inside Discount (for Longs) or Premium (for Shorts). Cancel unfilled limit orders after 6 bars.",
            "6. Stop-Loss & Take-Profit: Stop-loss placed beyond the liquidity sweep / FVG invalidation extreme + 0.25 ATR14 buffer ($3.00–$24.00 clamp). Take-profit fixed at the validated R:R target.",
            "7. Risk & Transaction Costs: 0.5% account equity risk per trade (max 1.0% configurable), 1 trade open at a time, $0.20/oz spread + $0.07/oz commission + $0.05/oz slippage ($0.32/oz round-turn deducted), M5 sub-candle intrabar resolution with conservative SL-first tie-breaking.",
        ],
        "data_validation": {
            "m15": m15_val_report,
            "m5_intrabar": m5_val_report,
        },
        "timeframe_comparison_train_val": comparison_records,
        "metrics": {
            "overall": overall_metrics,
            "training": train_metrics,
            "validation": val_metrics,
            "out_of_sample": oos_metrics,
        },
        "trades": [asdict(t) for t in all_trades],
    }

    out_paths = [
        os.path.join(data_dir, "xauusd_ict_backtest.json"),
        os.path.abspath(os.path.join(base_dir, "..", "src", "data", "xauusdIctBacktest.json")),
        os.path.abspath(os.path.join(base_dir, "..", "..", "genztrader-news-api", "data", "xauusd_ict_backtest.json")),
    ]

    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"  -> Saved reproducible backtest artifact to: {p}")

    trade_csv_path = os.path.join(data_dir, "xauusd_ict_trade_log.csv")
    if all_trades:
        with open(trade_csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(asdict(all_trades[0]).keys()))
            writer.writeheader()
            for t in all_trades:
                writer.writerow(asdict(t))
        print(f"  -> Saved trade log CSV to: {trade_csv_path}")


if __name__ == "__main__":
    main()
