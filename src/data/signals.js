import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { getPipApiKey } from '../services/pipAiService.js';
import { fetchLivePrice, formatSpotPrice } from '../services/marketPriceService.js';

const SIGNALS_COLLECTION = 'signals';

/**
 * Subscribes to real-time signals from Firestore.
 * @param {Function} callback - (signals: Array) => void
 * @returns {Function} unsubscribe function
 */
export function subscribeSignals(callback) {
  try {
    const q = query(collection(db, SIGNALS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback([]);
        } else {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const createdAtMs = data.createdAt?.toMillis
              ? data.createdAt.toMillis()
              : data.createdAt?.seconds
              ? data.createdAt.seconds * 1000
              : Date.now();
            const minutesAgo = Math.max(0, Math.floor((Date.now() - createdAtMs) / 60000));
            return {
              id: docSnap.id,
              ...data,
              minutesAgo,
            };
          });
          callback(list);
        }
      },
      (err) => {
        console.warn('Could not subscribe to signals:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('Error setting up signals subscription:', err);
    callback([]);
    return () => {};
  }
}

/**
 * Publishes a new signal to Firestore.
 */
export async function publishSignal({
  pair = 'XAUUSD',
  direction = 'buy',
  entry,
  sl,
  tp,
  rr,
  session = 'London Killzone',
  reason = '',
  status = 'active',
}) {
  const numEntry = parseFloat(entry);
  const numSl = parseFloat(sl);
  const numTp = parseFloat(tp);

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

  const id = `sig-${Date.now()}`;
  const docRef = doc(db, SIGNALS_COLLECTION, id);
  const data = {
    pair: pair.toUpperCase().replace('/', '').trim(),
    direction: direction.toLowerCase() === 'sell' ? 'sell' : 'buy',
    entry: numEntry,
    sl: numSl,
    tp: numTp,
    rr: calculatedRr,
    session: session || 'London Killzone',
    reason: reason.trim(),
    status: status || 'active',
    createdAt: serverTimestamp(),
    publishedAt: Date.now(),
  };

  await setDoc(docRef, data);
  return { id, ...data };
}

/**
 * Updates a signal's status ('active' | 'tp' | 'sl').
 */
export async function updateSignalStatus(signalId, status) {
  const ref = doc(db, SIGNALS_COLLECTION, signalId);
  await updateDoc(ref, {
    status,
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
}) {
  const apiKey = getPipApiKey();
  if (!apiKey) {
    throw new Error('Pip AI API key is not configured. Please add VITE_GEMINI_API_KEY in your environment or Settings.');
  }

  const normPair = (pair || 'XAUUSD').toUpperCase().replace('/', '').trim();
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
      activePrice = await fetchLivePrice(normPair);
    } catch (err) {
      console.warn('[generateAiSignal] Could not fetch live spot price:', err);
    }
  }

  if (!Number.isFinite(activePrice) || activePrice <= 0) {
    throw new Error('Pip cannot verify the chart entry because the live OANDA price is unavailable. Refresh the chart and try again.');
  }
  const spotPriceStr = formatSpotPrice(normPair, activePrice);

  const systemInstruction = `You are Pip, an evidence-first ICT/SMC signal analyst. Never invent chart evidence or force a trade.
You receive exactly two screenshots in order: image 1 is HTF (1H/4H), image 2 is LTF (15m/5m). If either chart, timeframe, price scale, swing points, or required evidence is unreadable, set tradeAllowed=false and explain why. Treat admin notes as hypotheses, not proof.

Before allowing a signal, assess every check:
1. HTF structure: identify the latest meaningful swing high/low and bullish or bearish bias using visible BOS/CHoCH/MSS price action.
2. Liquidity: identify BSL/SSL and a visible sweep/reclaim. An ordinary touch is not a sweep.
3. PD array: identify a visible, unmitigated, directionally aligned FVG/iFVG, order block, breaker, or mitigation block; estimate its exact low/high from the chart scale.
4. Fibonacci: anchor the retracement to the actual displacement swing low/high. For a bullish impulse measure low-to-high and retracement down from the high; for bearish measure high-to-low and retracement up from the low. Report both swing prices and retracement percent. Require 61.8%-79% OTE and overlap between the OTE price and the selected PD-array zone.
5. LTF execution: require a direction-aligned MSS/BOS with displacement after the liquidity event. Entry MUST equal the supplied live chart quote at the quote's displayed precision, and that exact price must be inside the PD-array/OTE overlap. If the quote is not in the overlap, set tradeAllowed=false; never substitute another entry.
6. Risk: SL must be beyond structural invalidation, TP at a logical opposing liquidity target, and the setup must support 1:2 R:R.

Set tradeAllowed=true only when HTF bias, liquidity sweep, valid PD array, independently consistent Fibonacci OTE overlap, and LTF structure confirmation are all clearly visible. If any are missing, unclear, or conflict, set tradeAllowed=false. Never fill gaps with assumptions.
Current live OANDA chart quote for ${normPair}: ${spotPriceStr}. Return this exact value as entry only if it is inside the verified confluence; otherwise return tradeAllowed=false.

Return only raw JSON with these keys:
{
  "tradeAllowed": boolean,
  "pair": "${normPair}",
  "direction": "buy" or "sell",
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
  "entry": number,
  "sl": number,
  "tp": number,
  "rr": 2.0,
  "session": "London Killzone" or "New York AM Killzone" or "Other",
  "reason": "Concise setup rationale or specific reason there is no valid trade."
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
    throw new Error(`Pip found no confirmed setup. ${parsed.reason || 'Wait for all structure, liquidity, PD-array, and Fibonacci checks to align.'}`);
  }

  const rawDir = String(parsed.direction || '').toLowerCase();
  if (rawDir !== 'buy' && rawDir !== 'sell') throw new Error('Pip returned an invalid trade direction.');
  const direction = rawDir;
  const htfBias = String(parsed.htfBias || '').toLowerCase();
  const evidenceFields = ['htfStructureEvidence', 'liquidityEvidence', 'ltfStructureEvidence', 'pdArrayType'];
  if (evidenceFields.some((key) => typeof parsed[key] !== 'string' || !parsed[key].trim())) {
    throw new Error('Pip did not provide all required market-structure and PD-array evidence. Please retry with clearer charts.');
  }
  if ((direction === 'buy' && htfBias !== 'bullish') || (direction === 'sell' && htfBias !== 'bearish')) {
    throw new Error('Pip signal direction does not match the higher-timeframe market bias.');
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
    throw new Error('Pip returned incomplete or invalid price levels. Please retry with readable chart scales.');
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
    throw new Error('Pip could not verify that the entry overlaps both the PD array and the 61.8%-79% Fibonacci OTE zone. No signal was created.');
  }

  const decimals = normPair.includes('EUR') || normPair.includes('GBP') || normPair.includes('AUD') ? 5
    : normPair.includes('JPY') ? 3
      : normPair.includes('BTC') || normPair.includes('US30') ? 1 : 2;
  const roundFactor = 10 ** decimals;
  entry = Math.round(entry * roundFactor) / roundFactor;
  sl = Math.round(sl * roundFactor) / roundFactor;
  tp = Math.round(tp * roundFactor) / roundFactor;
  const risk = direction === 'buy' ? entry - sl : sl - entry;
  const reward = direction === 'buy' ? tp - entry : entry - tp;
  if (risk <= 0 || reward <= 0) throw new Error('Pip stop loss or target is on the wrong side of the entry.');
  const proposedRr = reward / risk;
  if (Math.abs(proposedRr - 2) > 0.3) throw new Error('Pip setup does not meet the required 1:2 risk-to-reward ratio.');
  if (activePrice && (direction === 'buy' ? activePrice <= sl || activePrice >= tp : activePrice >= sl || activePrice <= tp)) {
    throw new Error('The live price has already invalidated or completed this setup. Refresh both charts and analyze again.');
  }

  // Keep Pip's structural entry and invalidation level. Normalize only the
  // target to the app's strict 1:2 convention after checking its proposed RR.
  tp = Number((direction === 'buy' ? entry + risk * 2 : entry - risk * 2).toFixed(decimals));
  const otePercent = fibPercent.toFixed(1);
  const structuralSummary = `HTF ${htfBias}: ${parsed.htfStructureEvidence}. Liquidity: ${parsed.liquidityEvidence}. LTF: ${parsed.ltfStructureEvidence}. PD array: ${parsed.pdArrayType} ${pdLow}-${pdHigh}; ${otePercent}% OTE from swing ${swingLow}-${swingHigh}, overlapping at entry ${entry}.`;

  return {
    pair: normPair,
    direction,
    entry,
    sl,
    tp,
    rr: 2.0,
    session: parsed.session || 'Other',
    reason: `${parsed.reason || 'Structure, liquidity, PD array, and Fibonacci confluence confirmed.'} ${structuralSummary}`,
  };
}
