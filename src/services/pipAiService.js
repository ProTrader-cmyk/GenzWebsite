// Pip Coach Service — GenZ Trader ICT System Prompt
import { auth } from '../firebase.js';

const SYSTEM_PROMPT = `You are Pip, the official Trading Coach for GenZ Trader.
You were taught directly by GenZ Trader to help traders master financial markets, ICT (Inner Circle Trader) Smart Money Concepts (SMC), and algorithmic price delivery for Forex, Crypto, and Gold (XAU/USD).

CORE DIRECTIVES (CRITICAL):
1. BE CONCISE & TO THE POINT — DO NOT TALK TOO MUCH:
   - Keep all responses sharp, structured, and actionable.
   - Avoid long-winded essays, unnecessary filler, or bloated greetings.

2. NO LIVE PRICE FEED / NEVER INVENT FAKE GOLD DATA:
   - CRITICAL: You do NOT have real-time live market price feeds.
   - If the user asks for a trade signal, entry, or current Gold/XAUUSD price WITHOUT uploading a chart image:
     DO NOT invent fake prices, do NOT fabricate fake Gold signals out of nowhere.
     Instead, politely tell them in 1-2 sentences:
     "I do not have real-time live market data for Gold. Please upload or paste a screenshot of your chart (with visible price scale and timeframe), and I will run Pip's 5-Point ICT Audit and estimate a setup for you! 📊"
     (In Khmer: "ខ្ញុំមិនមានទិន្នន័យផ្សារផ្ទាល់ (Live Market Data) សម្រាប់ Gold នោះទេ។ សូម Upload ឬ Paste រូបភាព Chart របស់អ្នក (ដែលមានកម្រិតតម្លៃ និង Timeframe) ដើម្បីឱ្យខ្ញុំធ្វើការវិភាគ 5-Point ICT Audit និងប៉ាន់ស្មាន Signal ជូន! 📊")

3. 5-POINT ICT INSTITUTIONAL AUDIT & ESTIMATED SIGNAL (ONLY WHEN A CHART IMAGE IS ATTACHED):
   - When a user sends a chart screenshot, analyze the actual visible chart:
   - Read the actual asset pair and price scale from the user's uploaded image. Do NOT default to Gold unless the chart is clearly XAUUSD!

   📊 **Pip's 5-Point ICT Audit:**
   1. 💧 **Liquidity Sweep**: [Pass / Fail — e.g. Asian Low swept / Buy-side liquidity raided]
   2. ⚡ **Market Structure Shift (MSS)**: [Pass / Fail — e.g. 15m Displacement with candle close]
   3. 📐 **PD Array (FVG / OB)**: [Pass / Fail — e.g. Valid 15m Bullish FVG / Bearish Order Block]
   4. ⚖️ **Premium vs. Discount**: [Pass / Fail — e.g. Buying in Discount <50% / Selling in Premium >50%]
   5. ⏰ **Session & Killzone**: [Pass / Fail — e.g. Active London / NY AM Killzone (GMT+7)]
   🎯 **Setup Probability Score**: [e.g. 8.5/10 — High Probability]

   🎯 **Estimated Signal: [PAIR FROM CHART] [BUY / SELL]**
   📍 **Entry**: [Estimated entry price or zone read from chart]
   🛑 **Stop Loss (SL)**: [Invalidation level read from chart]
   🎯 **Take Profit (TP)**: [Target level(s), minimum 1:2 R:R]
   ⚠️ **Note**: Take your own risk. Always apply proper risk management.

   - If the user asks in Khmer, provide the same clean structure in natural Khmer:
   📊 **ការត្រួតពិនិត្យ 5-Point ICT Audit ដោយ Pip:**
   1. 💧 **Liquidity Sweep (ការបោសសម្អាតសាច់ប្រាក់)**: [ជាប់ / មិនទាន់]
   2. ⚡ **Market Structure Shift (MSS)**: [ជាប់ / មិនទាន់]
   3. 📐 **PD Array (FVG / OB)**: [ជាប់ / មិនទាន់]
   4. ⚖️ **Premium vs. Discount**: [ជាប់ / មិនទាន់]
   5. ⏰ **Session & Killzone**: [ជាប់ / មិនទាន់]
   🎯 **ពិន្ទុឱកាសជោគជ័យ**: [0-10]

   🎯 **សញ្ញាប៉ាន់ស្មាន (Estimated Signal): [PAIR FROM CHART] [BUY / SELL]**
   📍 **Entry**: [តម្លៃចូលប៉ាន់ស្មានផ្អែកលើ Chart]
   🛑 **Stop Loss (SL)**: [កម្រិតកាត់ខាត]
   🎯 **Take Profit (TP)**: [កម្រិតយកប្រាក់ចំណេញ]
   ⚠️ **ចំណាំ**: សូមគ្រប់គ្រងហានិភ័យដោយខ្លួនឯង (Take your own risk)!

4. GENERAL TRADING QUESTIONS:
   - Answer in 2-4 concise bullet points or 1 brief paragraph. No fluff.

5. SCOPE ENFORCEMENT:
   - Strictly trading and financial markets only. If completely off-topic, politely refuse in 1 short sentence:
     "In this chat, we strictly talk about trading and market analysis! Feel free to ask about ICT concepts or upload a chart for an estimated signal."
     (If in Khmer: "នៅក្នុងការជជែកនេះ យើងនិយាយតែអំពីការជួញដូរប៉ុណ្ណោះ! សូមសួរអំពីបច្ចេកទេសជួញដូរ ឬផ្ញើរូបភាព Chart មកពិនិត្យ!")

6. TIME & PRICE REFERENCE:
   - Session times in Cambodia Local Time (GMT+7 Phnom Penh):
     • Asian Range: 07:00 - 13:00 GMT+7
     • London Killzone: 14:00 - 17:00 GMT+7
     • New York AM Killzone: 19:00 - 22:00 GMT+7
     • London Close: 22:00 - 00:00 GMT+7
`;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

/**
 * Gets the active Gemini API key from environment variable or localStorage.
 */
export function getPipApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();
  try {
    return localStorage.getItem('genz_gemini_api_key') || '';
  } catch {
    return '';
  }
}

/**
 * Saves Gemini API key to localStorage for persistent testing.
 */
export function savePipApiKey(key) {
  try {
    if (key) {
      localStorage.setItem('genz_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('genz_gemini_api_key');
    }
  } catch (err) {
    console.error('Failed to save API key', err);
  }
}

/**
 * Sends conversation and optional base64 image to Google Gemini API.
 * @param {Array<{sender: 'user'|'bot', text: string, image?: string}>} history
 * @param {string} prompt
 * @param {string|null} base64Image - optional image base64 data URL
 * @returns {Promise<string>}
 */
export async function askPipCoach(history, prompt, base64Image = null) {
  // 1. Try our secure Railway backend first (works seamlessly on ALL devices & live sites)
  const backendUrl = import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app';
  if (backendUrl) {
    try {
      const endpoint = `${backendUrl.replace(/\/+$/, '')}/api/pip/chat`;
      const idToken = base64Image ? await auth.currentUser?.getIdToken() : null;
      if (base64Image && !idToken) throw new Error('Sign in again before requesting chart analysis.');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          history,
          prompt,
          image: base64Image,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          return { reply: data.reply, quota: data.quota || null };
        }
        if (base64Image) throw new Error('Pip returned no chart analysis. Please try again.');
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Backend Pip API returned status:', res.status, errJson);
        if (base64Image) {
          const error = new Error(errJson.error || 'Pip could not analyze this chart. Please try again.');
          error.quota = errJson.quota || null;
          throw error;
        }
      }
    } catch (backendErr) {
      if (base64Image) throw backendErr;
      console.warn('Could not reach backend Pip API, falling back to client mode:', backendErr);
    }
  }

  // 2. Direct client fallback (if user provided a local API key in .env or localStorage)
  const apiKey = getPipApiKey();
  if (apiKey) {
    try {
      const contents = [];

      const recent = history.slice(-6);
      for (const msg of recent) {
        if (msg.sender === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: msg.text }],
          });
        } else if (msg.sender === 'bot') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.text }],
          });
        }
      }

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

      currentParts.push({ text: prompt });
      contents.push({ role: 'user', parts: currentParts });

      const requestBody = {
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 800,
        },
      };

      const modelsToTry = [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash',
      ];
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson?.error?.message || `HTTP ${response.status}`;
            lastError = new Error(errMsg);
            if (response.status === 503 || response.status === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('high demand') || response.status === 429) {
              continue;
            }
            throw lastError;
          }

          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            return candidate;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (lastError) throw lastError;
    } catch (clientErr) {
      console.warn('Direct Gemini call failed:', clientErr);
    }
  }

  // 3. Heuristic offline rule engine fallback
  return localIctFallback(prompt);
}

/**
 * Local ICT Expert Rule Engine fallback when no API key is set or offline.
 */
function localIctFallback(query) {
  const q = query.toLowerCase().trim();

  // Friendly greeting that is brief and directly to the point
  if (/^(hi|hello|hey|yo|greetings|good morning|good afternoon|good evening|who are you)[\s!.]*$/i.test(q)) {
    return (
      "Hey Trader! 👋 I'm Pip, your AI Trading Coach.\n\n" +
      "Upload or paste a chart screenshot, or tell me the asset you're watching, and I'll give you an estimated signal with Entry, TP, and SL. What setup are we analyzing?"
    );
  }

  const TRADING_TERMS = [
    'trade', 'trading', 'chart', 'price', 'market', 'gold', 'xau', 'usd', 'eur', 'gbp', 'jpy',
    'forex', 'crypto', 'btc', 'eth', 'ict', 'smc', 'fvg', 'order block', 'ob', 'liquidity',
    'killzone', 'session', 'london', 'new york', 'asian', 'sweep', 'lot', 'pips', 'risk',
    'stop loss', 'take profit', 'tp', 'sl', 'breakeven', 'be', 'bos', 'choch', 'mss', 'ote',
    'fibonacci', 'fib', 'candlestick', 'candle', 'bullish', 'bearish', 'trend', 'support',
    'resistance', 'demand', 'supply', 'breaker', 'imbalance', 'spread', 'broker', 'metatrader',
    'mt4', 'mt5', 'prop firm', 'funded', 'leverage', 'volume', 'indicator', 'bias', 'entry', 'exit',
    'analysis', 'dollar', 'account', 'capital', 'balance', 'drawdown', 'rr', 'r:r', 'mentor', 'veng',
    'sophea', 'buy', 'sell', 'long', 'short', 'swing', 'scalp', 'high', 'low', 'range', 'displacement',
    'profit', 'profitable', 'profits', 'money', 'win', 'winning', 'winrate', 'loss', 'losses', 'losing',
    'earn', 'earning', 'rich', 'income', 'roi', 'invest', 'investing', 'investment', 'strategy', 'system',
    'rules', 'rule', 'ruleset', 'model', 'setup', 'setups', 'target', 'targets', 'psychology', 'discipline',
    'emotion', 'emotions', 'fear', 'greed', 'fomo', 'overtrade', 'overtrading', 'patience', 'plan', 'trading plan',
    'career', 'business', 'fund', 'payout', 'withdraw', 'deposit'
  ];

  const isTradingRelated = TRADING_TERMS.some((term) => q.includes(term));

  if (!isTradingRelated) {
    return (
      "In this chat, we strictly talk about trading and financial markets! Please ask about ICT concepts or upload a chart for an estimated signal."
    );
  }

  // Signal / setup / chart estimate request
  if (q.includes('signal') || q.includes('chart') || q.includes('entry') || q.includes('setup') || q.includes('gold') || q.includes('xau')) {
    return (
      "📊 **No Live Market Data:**\n" +
      "I do not have real-time live price feeds for Gold (XAUUSD). To get an estimated signal, please upload or paste a screenshot of your chart!\n\n" +
      "Once you upload your chart, I will run Pip's 5-Point ICT Audit (Liquidity Sweep, MSS, FVG/OB, Premium/Discount, Session) and calculate an estimated Entry, SL, and TP directly from your chart levels.\n\n" +
      "⚠️ **Note**: Take your own risk. Always apply proper risk management."
    );
  }

  if (q.includes('profit') || q.includes('money') || q.includes('earn') || q.includes('win')) {
    return (
      "💰 **Pip's Guide to Consistent Trading Profitability:**\n\n" +
      "Trading is not gambling or a get-rich-quick scheme—it is a business of probabilities, edge, and capital preservation:\n\n" +
      "1. **Protect Capital First**: Most traders lose because they risk 5%–20% per trade and blow up. Pro traders risk only **1%–2% per setup**.\n" +
      "2. **Asymmetric Risk-to-Reward (R:R)**: With a 1:2 or 1:3 R:R, even a 40% win rate makes you consistently profitable.\n" +
      "3. **Stick to One High-Probability Model**: Wait patiently for Asian liquidity sweeps + London/NY Killzone displacements into Fair Value Gaps (FVG).\n" +
      "4. **Emotional Discipline**: Eliminate FOMO, never revenge trade after a loss, and follow your trading plan strictly every day!"
    );
  }

  if (q.includes('lot size') || q.includes('risk') || q.includes('calculate') || q.includes('1000')) {
    return (
      "📊 **Pip's Position Sizing Formula:**\n\n" +
      "1. **Account Risk**: 1% on a $1,000 account = **$10 max risk**.\n" +
      "2. **Stop Loss Measurement**: Measure the distance between your Entry and Invalidated Swing Point/OB.\n" +
      "3. **Gold (XAU/USD) Calculation**:\n" +
      "   • $1.00 move in Gold = 10 pips.\n" +
      "   • With a $5.00 SL ($50 pips), risking $10 means **0.02 lots**.\n" +
      "4. **Execution Rule**: Never increase lot size to recover past losses. Compound steadily!"
    );
  }

  if (q.includes('strategy') || q.includes('model') || q.includes('setup') || q.includes('how to trade')) {
    return (
      "🎯 **The Core ICT High-Probability Setup:**\n\n" +
      "1. **Higher Timeframe Narrative (H4/H1)**: Determine if price is drawing toward Buy-side Liquidity (BSL) or Sell-side Liquidity (SSL).\n" +
      "2. **Session Timing**: Only execute during active Killzones (London 14:00-17:00 or NY 19:00-22:00 GMT+7).\n" +
      "3. **The Sweep**: Wait for price to raid previous session highs/lows or key swing points.\n" +
      "4. **Displacement & MSS**: Look for energetic, long-bodied candle closures breaking market structure.\n" +
      "5. **Entry**: Limit order at the newly created Fair Value Gap (FVG) or 50% Mean Threshold of the Order Block."
    );
  }

  if (q.includes('psychology') || q.includes('emotion') || q.includes('fear') || q.includes('fomo') || q.includes('discipline')) {
    return (
      "🧠 **Pip's Trading Psychology Principles:**\n\n" +
      "• **Accept Losses as Business Expenses**: No strategy has a 100% win rate. When you lose 1%, you simply execute the rules.\n" +
      "• **Defeat FOMO**: The market will be here tomorrow. Chasing green candles into Premium pricing is how retail gets trapped.\n" +
      "• **The 2-Loss Rule**: If you lose 2 trades in a single session, close your charts and step away for the day."
    );
  }

  if (q.includes('killzone') || q.includes('session') || q.includes('time') || q.includes('london')) {
    return (
      "⏰ **ICT Session Killzones (Cambodia Time GMT+7):**\n\n" +
      "• **Asian Session (07:00 - 13:00)**: Range building. Mark the Asian High & Low as prime liquidity targets.\n" +
      "• **London Killzone (14:00 - 17:00)**: Look for the *Judas Swing* (false breakout that sweeps Asian liquidity) followed by genuine displacement.\n" +
      "• **New York Killzone (19:00 - 22:00)**: Maximum Gold (XAUUSD) volume and clean continuation or reversal setups.\n" +
      "• **London Close (22:00 - 00:00)**: Profit-taking and consolidation."
    );
  }

  if (q.includes('fvg') || q.includes('fair value') || q.includes('imbalance')) {
    return (
      "🕯️ **ICT Fair Value Gap (FVG) Breakdown:**\n\n" +
      "A 3-candle sequence where Candle 1 and Candle 3 do not overlap their wicks, leaving an open imbalance in Candle 2.\n\n" +
      "• **Bullish FVG**: High of Candle 1 < Low of Candle 3. Acts as an institutional discount demand magnet.\n" +
      "• **Bearish FVG**: Low of Candle 1 > High of Candle 3. Acts as institutional premium supply resistance.\n" +
      "• **Inverse FVG (IFVG)**: When price breaches through an FVG, it flips roles (failed support becomes resistance)."
    );
  }

  if (q.includes('order block') || q.includes('ob')) {
    return (
      "🏦 **ICT Order Block (OB) Rules:**\n\n" +
      "An Order Block is NOT just any green or red candle. It is valid **ONLY IF**:\n\n" +
      "1. It **sweeps liquidity** (e.g. previous high/low or session liquidity).\n" +
      "2. It creates an energetic **Displacement** that breaks market structure (MSS/BOS).\n" +
      "3. It leaves an **unfilled FVG** adjacent to it.\n\n" +
      "Enter on the 50% (Mean Threshold) of the Order Block body for maximum R:R."
    );
  }

  return (
    `🎯 **Pip's Institutional Analysis:**\n\n` +
    `Regarding your question: "${query}"\n\n` +
    `• **Market Delivery Rule**: The algorithm always seeks two things — **Internal Liquidity (FVGs)** and **External Liquidity (Old Highs/Lows)**.\n` +
    `• **Execution Checklist**:\n` +
    `  1. Identify Higher Timeframe (H4/H1) Narrative & Bias.\n` +
    `  2. Confirm active Killzone (London 14:00-17:00 or NY 19:00-22:00 GMT+7).\n` +
    `  3. Wait for liquidity sweep + 5m MSS with Displacement.\n` +
    `  4. Enter inside OTE (62%-79%) with strict minimum 2R target!`
  );
}
