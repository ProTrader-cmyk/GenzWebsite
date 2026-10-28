import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { getPipApiKey } from '../services/pipAiService.js';
import { fetchLivePrice, formatSpotPrice } from '../services/marketPriceService.js';

const SIGNALS_COLLECTION = 'signals';

/**
 * Polls the authenticated signal endpoint. The server filters the daily feed
 * by plan; regular members must not query the full Firestore collection.
 * @param {Function} callback - (signals: Array) => void
 * @returns {Function} unsubscribe function
 */
export function subscribeSignals(callback) {
  let active = true;
  let inFlight = false;
  const backendUrl = import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app';
  const refresh = async () => {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Sign in to view trading signals.');
      const response = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/member/signals`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not load signals.');
      if (active) callback(Array.isArray(result.signals) ? result.signals : []);
    } catch (error) {
      console.warn('Could not load plan-filtered signals:', error);
      if (active) callback([]);
    } finally {
      inFlight = false;
    }
  };
  refresh();
  const interval = setInterval(refresh, 15_000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * Publishes a new signal to Firestore.
 */
export async function publishSignal(signalData = {}) {
  const {
    id: customId,
    pair = 'XAUUSD',
    direction = 'buy',
    entry,
    sl,
    tp,
    rr,
    session = 'London Killzone',
    reason = '',
    status = 'active',
    ...extra
  } = signalData;

  const cleanNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/,/g, '').trim());
    return isNaN(num) ? 0 : num;
  };

  const numEntry = cleanNum(entry ?? extra.entry_price ?? extra.entryPrice);
  const numSl = cleanNum(sl ?? extra.stop_loss ?? extra.stopLoss);
  const numTp = cleanNum(tp ?? extra.take_profit ?? extra.takeProfit);

  let calculatedRr = 2.0;
  if (typeof rr === 'string' && rr.includes(':')) {
    const parts = rr.split(':');
    calculatedRr = parseFloat(parts[1]) || 2.0;
  } else if (rr) {
    calculatedRr = parseFloat(rr) || 2.0;
  } else if (numEntry && numSl && numTp) {
    const risk = Math.abs(numEntry - numSl);
    const reward = Math.abs(numTp - numEntry);
    if (risk > 0) {
      calculatedRr = Math.round((reward / risk) * 10) / 10;
    }
  }

  const id = customId || (pair.includes('XAU') ? `ICT-XAU-5M-LIVE-${Date.now().toString().slice(-6)}` : `sig-${Date.now()}`);
  const docRef = doc(db, SIGNALS_COLLECTION, id);
  const data = {
    ...extra,
    pair: pair.toUpperCase().replace('/', '').trim(),
    strategy_version: extra.strategy_version || (pair.includes('XAU') ? 'ICT-XAUUSD-FVG-MSS-v2.0' : undefined),
    isRealData: true,
    isReal: true,
    direction: direction.toLowerCase() === 'sell' ? 'sell' : 'buy',
    entry: numEntry,
    entry_price: numEntry,
    entryPrice: numEntry,
    sl: numSl,
    stop_loss: numSl,
    stopLoss: numSl,
    tp: numTp,
    take_profit: numTp,
    takeProfit: numTp,
    lot: 0.03,
    lot_size: 0.03,
    lotSize: 0.03,
    target_profit_usd: numEntry && numTp ? Math.round(Math.abs(numTp - numEntry) * (pair.includes('XAU') ? 3 : 1) * 100) / 100 : 60,
    risk_usd: numEntry && numSl ? Math.round(Math.abs(numEntry - numSl) * (pair.includes('XAU') ? 3 : 1) * 100) / 100 : 30,
    rr: calculatedRr,
    session: session || 'London Killzone',
    reason: (reason || (Array.isArray(extra.confluences) ? extra.confluences.join('; ') : '')).trim(),
    status: status || 'active',
    createdAt: serverTimestamp(),
    publishedAt: extra.publishedAt || extra.generatedAt || Date.now(),
  };

  await setDoc(docRef, data, { merge: true });
  return { id, ...data };
}

/**
 * Updates a signal's status ('active' | 'tp' | 'sl' | 'be' | 'closed') and optional calculated results.
 */
export async function updateSignalStatus(signalId, status, extraFields = {}) {
  const ref = doc(db, SIGNALS_COLLECTION, signalId);
  await updateDoc(ref, {
    status,
    ...extraFields,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a signal by ID.
 */
export async function deleteSignal(signalId) {
  const ref = doc(db, SIGNALS_COLLECTION, signalId);
  await deleteDoc(ref);
}

/**
 * Uses Google Gemini AI to analyze market context and chart screenshots using Top-Down Dual-Timeframe ICT Analysis.
 * @param {Object} options
 * @param {string} options.notes - market notes, price, or description
 * @param {string} options.pair - e.g. 'XAUUSD'
 * @param {string|null} options.base64Image - single chart screenshot
 * @param {Array<string>} options.base64Images - multiple chart screenshots (e.g. HTF 1H + LTF 15m)
 * @returns {Promise<Object>} structured signal data
 */
export async function generateAiSignal({
  notes = '',
  pair = 'XAUUSD',
  base64Image = null,
  base64Images = [],
  currentPrice = null,
  style = 'daytrade',
}) {
  const normPair = (pair || 'XAUUSD').toUpperCase().replace(/[^A-Z]/g, '').trim();
  const isGold = normPair.includes('XAU') || normPair.includes('GOLD');
  if (!isGold) {
    throw new Error(`NO TRADE: AI trading signals are strictly restricted to Gold (XAUUSD). Rejected: ${normPair}`);
  }

  const normStyle = String(style || 'daytrade').toLowerCase().trim();
  const isScalp = normStyle === 'scalping' || normStyle === 'scalp';
  const isIntra = normStyle === 'daytrade' || normStyle === 'intra' || normStyle === 'intraday';

  if (!isScalp && !isIntra) {
    throw new Error(`NO TRADE: Only Scalp and Intraday strategies are permitted. Rejected: ${style}`);
  }

  const effectiveStyle = isScalp ? 'scalping' : 'daytrade';

  const apiKey = getPipApiKey();
  if (!apiKey) {
    throw new Error('Pip AI API key is not configured. Please add VITE_GEMINI_API_KEY in your environment or Settings.');
  }

  const allImages = [
    ...(Array.isArray(base64Images) ? base64Images : []),
    ...(base64Image ? [base64Image] : []),
  ].filter(Boolean);
  if (allImages.length < 2) {
    throw new Error('Attach both a readable HTF (1H/4H) chart and LTF (15m/5m) chart before asking Pip to create a signal.');
  }

  // Obtain the true real-time spot price
  let activePrice = currentPrice ? parseFloat(currentPrice) : null;
  if (!activePrice || isNaN(activePrice)) {
    try {
      activePrice = await fetchLivePrice('XAUUSD');
    } catch (err) {
      console.warn('[generateAiSignal] Could not fetch live spot price:', err);
    }
  }

  if (!Number.isFinite(activePrice) || activePrice <= 0) {
    throw new Error('Pip cannot verify the chart entry because the live OANDA price is unavailable. Refresh the chart and try again.');
  }
  const spotPriceStr = formatSpotPrice('XAUUSD', activePrice);

  const systemInstruction = isScalp
    ? `You are Pip, the institutional ICT Smart Money Concepts quantitative execution engine for GenZ Trader.
You are evaluating Gold (XAUUSD) for the verified Pip Scalp M1-M5 Quant Imbalance Model (ICT-XAUUSD-SCALP-v2.0).
Never invent chart evidence or force a trade.
You receive exactly two screenshots in order: image 1 is Context (5M), image 2 is Execution (1M/5M). If either chart, timeframe, price scale, swing points, or required evidence is unreadable, set tradeAllowed=false with a clear explanation.

Strict Confirmation Rules for Scalp:
1. Liquidity Sweep: Identify Asian extreme or micro swing high/low liquidity sweep with clear wick rejection.
2. Market Structure Shift (MSS): 1M displacement body break through opposing local swing point.
3. Imbalance Tap: Fresh 1M Fair Value Gap (FVG) or 5M volume imbalance; entry at Consequent Encroachment (50% CE) or proximal edge.
4. Risk Bounds:
   - Stop Loss (SL): Strictly locked to $2.50 (25 pips) from entry.
   - Take Profit (TP): Strictly locked to $4.50 (45 pips / 1:1.8 RR).
   - Break-Even: Move SL to entry at +$2.50 (+1.0R) profit.
5. Live Price Lock: Entry MUST equal the supplied live chart quote (${spotPriceStr}).

If ANY condition is missing or unconfirmed, return tradeAllowed=false.
Return only raw JSON:
{
  "tradeAllowed": boolean,
  "pair": "XAUUSD",
  "direction": "buy" or "sell",
  "timeframe": "1m / 5m",
  "style": "scalping",
  "strategy_version": "ICT-XAUUSD-SCALP-v2.0",
  "model": "Pip Scalp M1-M5 Quant Imbalance Model",
  "htfBias": "bullish" or "bearish",
  "htfStructureEvidence": "string",
  "liquidityEvidence": "string",
  "ltfStructureEvidence": "string",
  "pdArrayType": "1M FVG or 5M Imbalance",
  "pdArrayLow": number,
  "pdArrayHigh": number,
  "fibSwingLow": number,
  "fibSwingHigh": number,
  "fibRetracementPercent": number,
  "entry": ${Number(spotPriceStr)},
  "sl": number (entry - 2.50 for buy, entry + 2.50 for sell),
  "tp": number (entry + 4.50 for buy, entry - 4.50 for sell),
  "beTrigger": number (entry + 2.50 for buy, entry - 2.50 for sell),
  "rr": 1.8,
  "session": "London Killzone" or "New York AM Killzone" or "Other",
  "reason": "Concise setup rationale or specific reason there is NO TRADE."
}`
    : `You are Pip, an evidence-first ICT/SMC signal analyst for GenZ Trader.
You are evaluating Gold (XAUUSD) for the verified ICT XAUUSD Strategy v2.0 (3-Candle CRT Liquidation Model, ICT-XAUUSD-FVG-MSS-v2.0).
Never invent chart evidence or force a trade.
You receive exactly two screenshots in order: image 1 is HTF (1H/4H), image 2 is LTF (15m/5m). If either chart, timeframe, price scale, swing points, or required evidence is unreadable, set tradeAllowed=false and explain why.

Strict Confirmation Rules for Intraday:
1. HTF Reference Structure: Identify HTF 1H/4H Reference Candle mitigating a POI; record High (BSL) and Low (SSL).
2. Liquidation: Active candle sweeps Reference Low (Bullish) or High (Bearish) during London/NY Killzone.
3. 5M Confirmation: 5M body closes back inside HTF range + MSS displacement + FVG. Limit order at proximal edge or Consequent Encroachment (50%).
4. Fibonacci OTE: Require 61.8%-79% OTE overlap with the selected PD-array zone.
5. Risk & Reward:
   - Stop Loss (SL): Strictly locked to 1000 points ($10.00) from entry.
   - Take Profit (TP): Strict 1:2.0 R:R (2000 points / $20.00 move on Gold).
   - Break-Even: Move SL to entry at +0.90R (+900 points / $9.00 profit).
6. Live Price Lock: Entry MUST equal the supplied live chart quote (${spotPriceStr}).

If ANY condition is missing or unconfirmed, return tradeAllowed=false.
Return only raw JSON:
{
  "tradeAllowed": boolean,
  "pair": "XAUUSD",
  "direction": "buy" or "sell",
  "timeframe": "5m",
  "style": "daytrade",
  "strategy_version": "ICT-XAUUSD-FVG-MSS-v2.0",
  "model": "ICT v2.0 Killzone Sweep + MSS + FVG",
  "refCandleHigh": number,
  "refCandleLow": number,
  "htfBias": "bullish" or "bearish",
  "htfStructureEvidence": "string",
  "liquidityEvidence": "string",
  "ltfStructureEvidence": "string",
  "pdArrayType": "FVG, iFVG, order block, breaker, or mitigation block",
  "pdArrayLow": number,
  "pdArrayHigh": number,
  "fibSwingLow": number,
  "fibSwingHigh": number,
  "fibRetracementPercent": number,
  "entry": ${Number(spotPriceStr)},
  "sl": number (entry - 10.00 for buy, entry + 10.00 for sell),
  "tp": number (entry + 20.00 for buy, entry - 20.00 for sell),
  "beTrigger": number (entry + 9.00 for buy, entry - 9.00 for sell),
  "rr": 2.0,
  "session": "London Killzone" or "New York AM Killzone" or "Other",
  "reason": "Concise setup rationale or specific reason there is NO TRADE."
}`;

  const userPrompt = `Analyze ${normPair} using the attached HTF (image 1) and LTF (image 2) charts. Apply every evidence and no-trade rule.
${spotPriceStr ? `Live price: ${spotPriceStr}.` : ''}
${notes.trim() ? `Admin observations (verify against chart; do not assume true): "${notes.trim()}".` : ''}
Use actual visible price-scale values and do not fabricate precision. Return tradeAllowed=false if required evidence is unclear or absent.`;

  const contents = [];
  const currentParts = [];

  for (const img of allImages) {
    const match = img.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      currentParts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  currentParts.push({ text: userPrompt });
  contents.push({ role: 'user', parts: currentParts });

  const requestBody = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 1400,
    },
  };

  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ];

  let rawText = '';
  let lastErr = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 429 || res.status === 503) continue;
        throw new Error(`Pip AI HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        rawText = text.trim();
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }

  if (!rawText && lastErr) throw lastErr;
  if (!rawText) throw new Error('No analysis returned from Pip AI.');

  // Robustly extract JSON block
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse valid JSON signal from Pip AI response: ' + rawText.slice(0, 100));
  }
  const parsed = JSON.parse(jsonMatch[0]);

  if (parsed.tradeAllowed !== true) {
    throw new Error(`NO TRADE: ${parsed.reason || 'Wait for all structure, liquidity, PD-array, and Fibonacci checks to align.'}`);
  }

  const rawDir = String(parsed.direction || '').toLowerCase();
  if (rawDir !== 'buy' && rawDir !== 'sell') throw new Error('NO TRADE: Pip returned an invalid trade direction.');
  const direction = rawDir;
  const htfBias = String(parsed.htfBias || '').toLowerCase();
  const evidenceFields = ['htfStructureEvidence', 'liquidityEvidence', 'ltfStructureEvidence', 'pdArrayType'];
  if (evidenceFields.some((key) => typeof parsed[key] !== 'string' || !parsed[key].trim())) {
    throw new Error('NO TRADE: Pip did not provide all required market-structure and PD-array evidence. Please retry with clearer charts.');
  }
  if ((direction === 'buy' && htfBias !== 'bullish') || (direction === 'sell' && htfBias !== 'bearish')) {
    throw new Error('NO TRADE: Pip signal direction does not match the higher-timeframe market bias.');
  }

  let entry = Number(parsed.entry);
  let sl = Number(parsed.sl);
  let tp = Number(parsed.tp);
  const pdLow = Number(parsed.pdArrayLow);
  const pdHigh = Number(parsed.pdArrayHigh);
  const swingLow = Number(parsed.fibSwingLow);
  const swingHigh = Number(parsed.fibSwingHigh);
  const statedFibPercent = Number(parsed.fibRetracementPercent);
  const swingRange = swingHigh - swingLow;
  if (![entry, sl, tp, pdLow, pdHigh, swingLow, swingHigh, statedFibPercent].every(Number.isFinite) ||
      entry <= 0 || sl <= 0 || tp <= 0 || pdLow <= 0 || pdHigh <= pdLow || swingLow <= 0 || swingRange <= 0) {
    throw new Error('NO TRADE: Pip returned incomplete or invalid price levels. Please retry with readable chart scales.');
  }

  const chartQuote = Number(spotPriceStr);
  const quoteDecimals = spotPriceStr.includes('.') ? spotPriceStr.split('.')[1].length : 0;
  const entryAtChartPrecision = Number(entry.toFixed(quoteDecimals));
  if (entryAtChartPrecision !== chartQuote) {
    throw new Error(`NO TRADE: Pip's entry ${entry} does not exactly match the live chart quote ${spotPriceStr}. Refresh both screenshots and generate again.`);
  }
  entry = chartQuote;

  const fibPercent = direction === 'buy'
    ? ((swingHigh - entry) / swingRange) * 100
    : ((entry - swingLow) / swingRange) * 100;
  const fibBandLow = direction === 'buy'
    ? swingHigh - swingRange * 0.79
    : swingLow + swingRange * 0.618;
  const fibBandHigh = direction === 'buy'
    ? swingHigh - swingRange * 0.618
    : swingLow + swingRange * 0.79;
  const priceTolerance = swingRange * 0.015;
  const arraysOverlapFib = pdHigh >= fibBandLow - priceTolerance && pdLow <= fibBandHigh + priceTolerance;
  const entryInPdArray = entry >= pdLow - priceTolerance && entry <= pdHigh + priceTolerance;
  const entryInOte = entry >= fibBandLow - priceTolerance && entry <= fibBandHigh + priceTolerance;
  if (statedFibPercent < 61.8 || statedFibPercent > 79 || fibPercent < 61.8 - 1.5 || fibPercent > 79 + 1.5 ||
      Math.abs(statedFibPercent - fibPercent) > 3 || !arraysOverlapFib || !entryInPdArray || !entryInOte) {
    throw new Error('NO TRADE: Pip could not verify that the entry overlaps both the PD array and the 61.8%-79% Fibonacci OTE zone. No signal was created.');
  }

  const decimals = 2;
  const roundFactor = 10 ** decimals;
  entry = Math.round(entry * roundFactor) / roundFactor;
  sl = Math.round(sl * roundFactor) / roundFactor;
  tp = Math.round(tp * roundFactor) / roundFactor;
  const risk = direction === 'buy' ? entry - sl : sl - entry;
  const reward = direction === 'buy' ? tp - entry : entry - tp;
  if (risk <= 0 || reward <= 0) throw new Error('NO TRADE: Pip stop loss or target is on the wrong side of the entry.');
  const proposedRr = reward / risk;
  const expectedRr = isScalp ? 1.8 : 2.0;
  if (Math.abs(proposedRr - expectedRr) > 0.4) {
    throw new Error(`NO TRADE: ${isScalp ? 'Scalp' : 'Intraday'} setup does not meet the required 1:${expectedRr} risk-to-reward ratio.`);
  }
  if (activePrice && (direction === 'buy' ? activePrice <= sl || activePrice >= tp : activePrice >= sl || activePrice <= tp)) {
    throw new Error('NO TRADE: The live price has already invalidated or completed this setup. Refresh both charts and analyze again.');
  }

  // Keep Pip's structural entry and invalidation level. Normalize only the target to the strict strategy convention
  tp = Number((direction === 'buy' ? entry + risk * expectedRr : entry - risk * expectedRr).toFixed(decimals));
  const otePercent = fibPercent.toFixed(1);
  const structuralSummary = `HTF ${htfBias}: ${parsed.htfStructureEvidence}. Liquidity: ${parsed.liquidityEvidence}. LTF: ${parsed.ltfStructureEvidence}. PD array: ${parsed.pdArrayType} ${pdLow}-${pdHigh}; ${otePercent}% OTE from swing ${swingLow}-${swingHigh}, overlapping at entry ${entry}.`;

  return {
    pair: 'XAUUSD',
    direction,
    entry,
    sl,
    tp,
    rr: expectedRr,
    style: effectiveStyle,
    model: isScalp ? 'Pip Scalp M1-M5 Quant Imbalance Model' : 'ICT v2.0 Killzone Sweep + MSS + FVG',
    strategy_version: isScalp ? 'ICT-XAUUSD-SCALP-v2.0' : 'ICT-XAUUSD-FVG-MSS-v2.0',
    timeframe: isScalp ? '1m / 5m' : '5m',
    session: parsed.session || 'London Killzone',
    reason: `${parsed.reason || 'Structure, liquidity, PD array, and strategy confirmation verified.'} ${structuralSummary}`,
  };
}
