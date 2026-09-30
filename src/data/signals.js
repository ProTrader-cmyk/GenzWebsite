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
import { fetchLivePrice } from '../services/marketPriceService.js';

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

  // Obtain the true real-time spot price
  let activePrice = currentPrice ? parseFloat(currentPrice) : null;
  if (!activePrice || isNaN(activePrice)) {
    try {
      activePrice = await fetchLivePrice(normPair);
    } catch (err) {
      console.warn('[generateAiSignal] Could not fetch live spot price:', err);
    }
  }

  const spotPriceStr = activePrice ? String(activePrice) : '';

  const systemInstruction = `You are Pip, the GenZ Trader Institutional ICT Signal Engine.
You specialize in Gold (XAU/USD), Forex pairs, Crypto, and Indices using Inner Circle Trader (ICT) Smart Money Concepts (SMC) with Top-Down Dual-Timeframe Analysis:
- Higher Timeframe (HTF - 1H/4H): Identify overall orderflow, Dealing Range, HTF Liquidity (BSL/SSL pools), and major PD Arrays (Daily/4H/1H FVG, Order Blocks).
- Lower Timeframe (LTF - 15m/5m): Identify session high/low liquidity sweeps during London (14:00-17:00 GMT+7) or New York (19:00-22:00 GMT+7), Market Structure Shift (MSS) with displacement body, and execution entry inside the FVG / OTE (62%-79%).
- Mandatory Risk-to-Reward: Strict 1:2 Risk to Reward ratio (Reward = 2.0 * Risk).
${spotPriceStr ? `- CRITICAL REAL-TIME SPOT PRICE: The current live market spot price for ${normPair} is ${spotPriceStr}. All generated levels (Entry, Stop Loss, Take Profit) MUST be anchored around this exact live price (${spotPriceStr}). Never hallucinate outdated prices (e.g. 2600-2750 for Gold).` : ''}

Return ONLY a valid, raw JSON object (without markdown code fences, no extra commentary) matching this exact format:
{
  "pair": "${normPair}",
  "direction": "buy" or "sell",
  "entry": ${spotPriceStr || '4174.00'},
  "sl": number,
  "tp": number,
  "rr": 2.0,
  "session": "London Killzone" or "New York AM Killzone",
  "reason": "Detailed institutional ICT narrative citing the liquidity sweep, MSS displacement, and FVG entry anchored to current price ${spotPriceStr || ''}."
}`;

  const allImages = [
    ...(Array.isArray(base64Images) ? base64Images : []),
    ...(base64Image ? [base64Image] : []),
  ].filter(Boolean);

  let userPrompt = '';
  if (allImages.length >= 2) {
    userPrompt = `Perform Top-Down Dual-Timeframe ICT Analysis for ${normPair}.
The screenshots contain:
- Higher Timeframe (HTF 1H/4H): Establish market bias, dealing range, and draw on liquidity.
- Lower Timeframe (LTF 15m/5m): Locate liquidity sweep, MSS displacement, and precision FVG entry.
${spotPriceStr ? `The current live market spot price is ${spotPriceStr}. Anchor all levels around this current price.` : ''}
${notes.trim() ? `Trader Context Notes: "${notes.trim()}".` : ''}
Provide an institutional ICT setup with exact numeric entry, sl, and tp (strict 1:2 R:R) adhering strictly to the HTF bias.`;
  } else if (allImages.length === 1) {
    userPrompt = `Perform Top-Down Dual-Timeframe / ICT Analysis for ${normPair} using this chart screenshot.
If the chart shows a dual split-screen layout (e.g. 1H on left and 15m on right), correlate both timeframes top-down: establish bias from 1H and pinpoint execution entry from 15m.
${spotPriceStr ? `The current live market spot price is ${spotPriceStr}. Anchor all levels around this current price.` : ''}
${notes.trim() ? `Trader Context Notes: "${notes.trim()}".` : ''}
Provide an institutional ICT setup with specific entry, sl, and tp with strict 1:2 R:R.`;
  } else {
    userPrompt = `The trader requested an institutional ICT Smart Money Concept (SMC) setup for ${normPair} without uploading chart screenshots.
${spotPriceStr ? `CRITICAL - CURRENT LIVE MARKET SPOT PRICE: ${spotPriceStr}.` : ''}
MANDATORY RULES:
1. Generate an institutional setup based strictly on the current live market price of ${normPair} (${spotPriceStr || 'live spot price'}).
2. Entry price MUST be positioned at or very close to the live spot price (within a tight retest or immediate execution).
3. If BUY: Entry = ${spotPriceStr || 'current price'}, Stop Loss strictly below Entry, Take Profit strictly above Entry, with strict 1:2 R:R (|TP - Entry| = 2.0 * |Entry - SL|).
4. If SELL: Entry = ${spotPriceStr || 'current price'}, Stop Loss strictly above Entry, Take Profit strictly below Entry, with strict 1:2 R:R (|Entry - TP| = 2.0 * |SL - Entry|).
${notes.trim() ? `Trader Context Notes: "${notes.trim()}".` : ''}
Return ONLY valid JSON with keys: pair, direction, entry, sl, tp, rr, session, reason.`;
  }

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
      maxOutputTokens: 1000,
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

  let entry = parseFloat(parsed.entry) || 0;
  let sl = parseFloat(parsed.sl) || 0;
  let tp = parseFloat(parsed.tp) || 0;
  const rawDir = String(parsed.direction || 'buy').toLowerCase();
  const direction = (rawDir === 'sell' || rawDir === 'short') ? 'sell' : 'buy';

  // 1. Sanity-check entry price against live market spot price
  if (activePrice && (entry <= 0 || Math.abs(entry - activePrice) / activePrice > 0.08)) {
    console.warn(`[Pip AI] Generated entry ${entry} deviates from live price ${activePrice}. Re-anchoring to live price.`);
    entry = activePrice;
  } else if (!entry && activePrice) {
    entry = activePrice;
  }

  // 2. Set realistic risk defaults and precision per asset
  let defaultRisk = 6.0;
  let decimals = 2;

  if (normPair.includes('EUR') || normPair.includes('GBP') || normPair.includes('AUD')) {
    defaultRisk = 0.00200; // 20 pips
    decimals = 5;
  } else if (normPair.includes('JPY')) {
    defaultRisk = 0.250;
    decimals = 3;
  } else if (normPair.includes('BTC')) {
    defaultRisk = Math.round(entry * 0.008) || 600;
    decimals = 1;
  } else if (normPair.includes('US30')) {
    defaultRisk = 120;
    decimals = 1;
  } else if (normPair.includes('XAU') || normPair.includes('GOLD')) {
    defaultRisk = 6.0; // $6 move on Gold
    decimals = 2;
  }

  // 3. Guarantee valid SL, TP, and strict 1:2 Risk to Reward
  if (direction === 'buy') {
    let risk = (sl > 0 && sl < entry) ? (entry - sl) : defaultRisk;
    if (risk < defaultRisk * 0.2 || risk > defaultRisk * 3) {
      risk = defaultRisk;
    }
    sl = Number((entry - risk).toFixed(decimals));
    tp = Number((entry + risk * 2).toFixed(decimals));
  } else {
    // SELL
    let risk = (sl > 0 && sl > entry) ? (sl - entry) : defaultRisk;
    if (risk < defaultRisk * 0.2 || risk > defaultRisk * 3) {
      risk = defaultRisk;
    }
    sl = Number((entry + risk).toFixed(decimals));
    tp = Number((entry - risk * 2).toFixed(decimals));
  }

  const roundFactor = Math.pow(10, decimals);
  entry = Math.round(entry * roundFactor) / roundFactor;

  return {
    pair: normPair,
    direction,
    entry,
    sl,
    tp,
    rr: 2.0,
    session: parsed.session || 'London Killzone',
    reason: parsed.reason || `Confluence of ICT Fair Value Gap (FVG) and liquidity sweep around ${entry}.`,
  };
}
