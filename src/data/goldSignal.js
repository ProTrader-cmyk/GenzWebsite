// EMA + Order Block + ICT-style buy/sell signal for the gold panel
// (src/components/GoldSignalPanel.jsx). Computed from Kraken's free PAXG/USD
// feed — the same data source GoldChart.jsx used before Gold switched to
// showing TradingView's real OANDA chart. The visual price customers see is
// real OANDA; this panel's math runs on the closely-correlated free proxy,
// since there's no free source of real intraday gold-forex OHLC data (see
// the API Ninjas dead end this replaced — its historical endpoint turned
// out to be premium-only).
//
// This is a deliberately simplified combination of three real concepts, not
// a professional ICT system — treat it as educational, not financial advice.

const EMA_FAST = 9;
const EMA_SLOW = 21;
const SWING_LOOKBACK = 10; // bars examined for the "recent structure" an order block's impulse must break
const ORDER_BLOCK_SEARCH_BARS = 60; // how far back to look for the most recent qualifying order block
const ZONE_TOUCH_BARS = 5; // how recent price must have re-entered the order block's range to count as "at the zone"

function computeEma(values, period) {
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[j];
      prev = sum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}

// Walks backward from the most recent bar looking for a "displacement":
// an opposite-colored candle (the order block) immediately followed by a
// strong impulsive candle that breaks the swing high/low set by the bars
// right before it. That's the standard ICT order-block definition — the
// last opposing candle before price aggressively leaves an area.
function findOrderBlock(bars) {
  for (let i = bars.length - 2; i >= Math.max(1, bars.length - ORDER_BLOCK_SEARCH_BARS); i--) {
    const ob = bars[i];
    const impulse = bars[i + 1];
    const priorSlice = bars.slice(Math.max(0, i - SWING_LOOKBACK), i);
    if (!priorSlice.length) continue;

    const priorHigh = Math.max(...priorSlice.map((b) => b.high));
    const priorLow = Math.min(...priorSlice.map((b) => b.low));
    const obBearish = ob.close < ob.open;
    const obBullish = ob.close > ob.open;
    const impulseBullish = impulse.close > impulse.open;
    const impulseBearish = impulse.close < impulse.open;
    const impulseSize = Math.abs(impulse.close - impulse.open);
    const obSize = Math.abs(ob.close - ob.open) || 0.0001;
    const isDisplacement = impulseSize > obSize * 1.2; // impulse candle notably bigger than the block candle

    if (obBearish && impulseBullish && impulse.close > priorHigh && isDisplacement) {
      return { type: 'bullish', low: ob.low, high: ob.high, time: ob.time };
    }
    if (obBullish && impulseBearish && impulse.close < priorLow && isDisplacement) {
      return { type: 'bearish', low: ob.low, high: ob.high, time: ob.time };
    }
  }
  return null;
}

// bars: oldest -> newest, { time, open, high, low, close }. Returns null if
// there isn't enough history yet for EMA(21) to have warmed up.
export function computeGoldSignal(bars) {
  if (bars.length < EMA_SLOW + 5) return null;

  const closes = bars.map((b) => b.close);
  const emaFast = computeEma(closes, EMA_FAST);
  const emaSlow = computeEma(closes, EMA_SLOW);
  const lastFast = emaFast[emaFast.length - 1];
  const lastSlow = emaSlow[emaSlow.length - 1];
  if (lastFast == null || lastSlow == null) return null;

  const trend = lastFast > lastSlow ? 'bullish' : lastFast < lastSlow ? 'bearish' : 'neutral';
  const orderBlock = findOrderBlock(bars);
  const lastPrice = closes[closes.length - 1];

  if (!orderBlock) {
    return { signal: 'WAIT', trend, orderBlock: null, price: lastPrice, emaFast: lastFast, emaSlow: lastSlow };
  }

  // ICT-style entry: don't act on the breakout itself — wait for price to
  // come back and trade inside the order block's own candle range first.
  const recentBars = bars.slice(-ZONE_TOUCH_BARS);
  const atZone = recentBars.some((b) => b.low <= orderBlock.high && b.high >= orderBlock.low);

  let signal = 'WAIT';
  if (atZone && orderBlock.type === 'bullish' && trend === 'bullish') signal = 'BUY';
  else if (atZone && orderBlock.type === 'bearish' && trend === 'bearish') signal = 'SELL';

  return { signal, trend, orderBlock, atZone, price: lastPrice, emaFast: lastFast, emaSlow: lastSlow };
}
