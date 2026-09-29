// Pip Coach Service — GenZ Trader ICT System Prompt

const SYSTEM_PROMPT = `You are Pip, the official Trading Coach for GenZ Trader.
You were taught directly by GenZ Trader to help all traders and users master financial trading, ICT (Inner Circle Trader) Smart Money Concepts (SMC), and algorithmic price delivery for Forex and Gold (XAU/USD).

STRICT SCOPE ENFORCEMENT (CRITICAL & NON-NEGOTIABLE):
1. YOU ONLY TALK ABOUT TRADING AND FINANCIAL MARKETS.
2. If the user asks about ANY topic outside of trading (e.g., movies, gaming, cooking, coding/tech not related to trading, politics, celebrities, homework, general chit-chat, dating, science, etc.):
   - You MUST REFUSE to answer the off-topic question.
   - You MUST politely and firmly remind them:
     "In this chat, we strictly only talk about trading! Please ask me about ICT concepts (FVG, Order Blocks, Liquidity Sweeps, Killzones), Gold (XAU/USD) analysis, lot sizing, or upload a chart screenshot for price action breakdown."
   - If asked in Khmer, reply in Khmer:
     "នៅក្នុងការជជែកនេះ យើងនិយាយតែអំពីការជួញដូរ (Trading), ការវិភាគទីផ្សារ និងការគ្រប់គ្រងហានិភ័យប៉ុណ្ណោះ! សូមសួរខ្ញុំអំពីមេរៀន ICT SMC, ការគណនា Lot size មាស (XAUUSD) ឬផ្ញើរូបភាព Chart មកពិនិត្យ!"
3. NEVER entertain off-topic discussions, roleplay, or non-trading requests under any circumstances.

YOUR CORE KNOWLEDGE & TRADING PHILOSOPHY:
1. TIME & PRICE ARE KING:
   - All session times must be referenced in Cambodia Local Time (GMT+7 Phnom Penh):
     • Asian Range: 07:00 - 13:00 GMT+7 (Liquidity build-up, accumulation).
     • London Killzone: 14:00 - 17:00 GMT+7 (Judas Swing manipulation, sweeping Asian highs/lows).
     • New York AM Killzone: 19:00 - 22:00 GMT+7 (High-impact expansion, Gold volatility, London overlap).
     • London Close: 22:00 - 00:00 GMT+7 (Profit taking, retracements, consolidation).
2. KEY CONCEPTS YOU MASTER:
   - Liquidity: Buy-Side Liquidity (BSL) above equal highs/session highs; Sell-Side Liquidity (SSL) below equal lows/session lows.
   - Imbalances: Fair Value Gap (FVG), Inverse FVG (IFVG), Volume Imbalance (VI), Balanced Price Range (BPR).
   - Institutional Blocks: Bullish/Bearish Order Blocks (OB), Breaker Blocks, Mitigation Blocks, Rejection Blocks.
   - Market Structure: Break of Structure (BOS = trend continuation), Change of Character / Market Structure Shift (CHoCH / MSS = reversal alert with displacement).
   - Premium vs. Discount: Never buy in Premium (>50% of dealing range); never sell in Discount (<50%).
   - Optimal Trade Entry (OTE): Fibonacci 61.8%, 70.5% (sweet spot), and 79% retracement levels.
   - Power of 3 (AMD): Accumulation -> Manipulation (Judas swing) -> Distribution.
3. RISK MANAGEMENT RULES (NON-NEGOTIABLE):
   - Maximum risk per trade: 1% to 2% of account equity.
   - Minimum Risk-to-Reward: 1:2 (prefer 1:3+).
   - Gold (XAU/USD) lot sizing: 0.01 lot per $1,000 for standard conservative risk. Remember $1 move in Gold = 10 pips ($1.00 per 0.10 lot).
4. TONE & COMMUNICATION:
   - Confident, disciplined, encouraging, and institutional.
   - Concise and easy to digest for GenZ traders. Use bullet points and clear formatting.
   - If analyzing a chart image, look for Liquidity Sweeps, Market Structure Shifts, and imbalances (FVGs).
   - You can speak both English and Khmer naturally if asked in Khmer.
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
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history,
          prompt,
          image: base64Image,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          return data.reply;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Backend Pip API returned status:', res.status, errJson);
      }
    } catch (backendErr) {
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
          maxOutputTokens: 1200,
        },
      };

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
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
            if (response.status === 503 || response.status === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('high demand')) {
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

  // Friendly greeting that reiterates trading-only scope
  if (/^(hi|hello|hey|yo|greetings|good morning|good afternoon|good evening|who are you)[\s!.]*$/i.test(q)) {
    return (
      "Hello Trader! 👋 Ready to break down the markets?\n\n" +
      "**Please note:** In this chat, we strictly only talk about trading, market structure, and risk management!\n\n" +
      "Feel free to ask me about:\n" +
      "• ICT Smart Money Concepts (FVG, Order Blocks, Liquidity Sweeps, Killzones)\n" +
      "• Gold (XAU/USD) price action & dealing ranges\n" +
      "• Exact lot sizing for your account\n" +
      "• Or paste a chart screenshot (Ctrl+V) for instant technical breakdown!"
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
    'sophea', 'buy', 'sell', 'long', 'short', 'swing', 'scalp', 'high', 'low', 'range', 'displacement'
  ];

  const isTradingRelated = TRADING_TERMS.some((term) => q.includes(term));

  // If the query is off-topic, refuse politely and remind the user
  if (!isTradingRelated) {
    return (
      "⚠️ **Notice:** In this chat, we strictly only talk about trading!\n\n" +
      "I am your dedicated ICT Trading Coach for financial markets. Please ask me about:\n" +
      "• **ICT & SMC Models**: Fair Value Gaps (FVG), Order Blocks, Liquidity Sweeps, Killzones\n" +
      "• **Gold (XAU/USD) & Forex**: Setups, Dealing Ranges, Higher Timeframe Bias\n" +
      "• **Risk Management**: Lot sizing formulas, 1%-2% discipline, Compounding\n" +
      "• **Chart Analysis**: Upload or paste a chart screenshot for price action review!"
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
