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

  let calculatedRr = rr ? parseFloat(rr) : 2.0;
  if (!rr && numEntry && numSl && numTp) {
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
 * Uses Google Gemini AI to analyze market context/chart and generate a complete ICT Signal.
 * @param {Object} options
 * @param {string} options.notes - market notes, price, or description
 * @param {string} options.pair - e.g. 'XAUUSD'
 * @param {string|null} options.base64Image - optional chart screenshot
 * @returns {Promise<Object>} structured signal data
 */
export async function generateAiSignal({ notes = '', pair = 'XAUUSD', base64Image = null }) {
  const apiKey = getPipApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY in your environment or Settings.');
  }

  const systemInstruction = `You are the GenZ Trader Institutional ICT Signal Engine.
You specialize in Gold (XAU/USD) and major Forex pairs using Inner Circle Trader (ICT) Smart Money Concepts (SMC):
- Dealing Ranges, Liquidity Sweeps (BSL/SSL), Fair Value Gaps (FVG), Order Blocks (OB), Optimal Trade Entry (OTE 62%-79%), and Session Killzones (Asia, London 14:00-17:00 GMT+7, New York 19:00-22:00 GMT+7).
- Strict minimum Risk to Reward: 1:2.0 or higher.
- Gold $1 move = 10 pips.

When provided market notes, current prices, or a chart image:
Generate a high-probability ICT setup and return ONLY a valid, raw JSON object (without markdown code fences, no extra commentary) matching this exact format:
{
  "pair": "${pair || 'XAUUSD'}",
  "direction": "buy" or "sell",
  "entry": 2685.50,
  "sl": 2679.00,
  "tp": 2698.50,
  "rr": 2.0,
  "session": "London Killzone" or "New York AM Killzone",
  "reason": "Detailed institutional ICT narrative: swept Asian Low into 15m Bullish FVG with 5m MSS displacement. Clear draw on Buy-side liquidity."
}`;

  const userPrompt = notes.trim()
    ? `Analyze this market context for ${pair}: "${notes}". Provide an institutional ICT setup with specific entry, sl, and tp.`
    : `Generate a high-probability institutional ICT setup for ${pair} during the current market session.`;

  const contents = [];
  const currentParts = [];

  if (base64Image) {
    const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
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
      temperature: 0.3,
      maxOutputTokens: 1000,
    },
  };

  const models = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
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
        throw new Error(`Gemini HTTP ${res.status}`);
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
  if (!rawText) throw new Error('No analysis returned from Gemini.');

  // Robustly extract JSON block
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse valid JSON signal from Gemini response: ' + rawText.slice(0, 100));
  }
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    pair: (parsed.pair || pair || 'XAUUSD').toUpperCase().replace('/', '').trim(),
    direction: String(parsed.direction || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
    entry: parseFloat(parsed.entry) || 0,
    sl: parseFloat(parsed.sl) || 0,
    tp: parseFloat(parsed.tp) || 0,
    rr: parseFloat(parsed.rr) || 2.0,
    session: parsed.session || 'London Killzone',
    reason: parsed.reason || 'Confluence of ICT FVG and Liquidity sweep.',
  };
}
