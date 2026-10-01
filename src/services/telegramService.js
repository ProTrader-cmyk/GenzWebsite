// Telegram VIP Channel Signal Sync Service
// Broadcasts published signals directly to a Telegram VIP channel/group via the Telegram Bot API.

const TELEGRAM_CONFIG_KEY = 'genz_telegram_config';

/**
 * Retrieves the current Telegram configuration from localStorage or environment variables.
 */
export function getTelegramConfig() {
  try {
    const raw = localStorage.getItem(TELEGRAM_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse telegram config from localStorage:', err);
  }

  return {
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
    chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
    enabled: true,
  };
}

/**
 * Saves Telegram configuration to localStorage.
 */
export function saveTelegramConfig(config) {
  try {
    localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save telegram config:', err);
  }
}

/**
 * Formats a signal into a clean, institutional Telegram VIP message with HTML formatting.
 */
export function formatTelegramMessage(signal) {
  const pair = (signal.pair || 'XAUUSD').toUpperCase();
  const type = (signal.type || 'BUY').toUpperCase();
  const entry = signal.entry || 'Market';
  const sl = signal.sl || 'N/A';
  const tp = signal.tp || 'N/A';
  const rr = signal.rr || '1:2';
  const timeframe = signal.timeframe || '15m';
  const session = signal.session || 'London / NY Killzone';
  const reasoning = signal.reasoning || signal.setup || 'Institutional SMC Order Block & Liquidity Sweep';

  const typeEmoji = type === 'BUY' ? '🟢' : '🔴';
  const title = `🚨 <b>NEW VIP SIGNAL ALERT</b> 🚨`;

  return [
    title,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Pair:</b> #${pair}`,
    `<b>Direction:</b> ${typeEmoji} <b>${type}</b>`,
    `<b>Timeframe:</b> ${timeframe} | <b>Session:</b> ${session}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📍 <b>Entry:</b> <code>${entry}</code>`,
    `🛑 <b>Stop Loss (SL):</b> <code>${sl}</code>`,
    `🎯 <b>Take Profit (TP):</b> <code>${tp}</code>`,
    `⚖️ <b>Risk to Reward:</b> <code>${rr}</code>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💡 <b>Setup Logic (ICT/SMC):</b>`,
    `<i>${reasoning}</i>`,
    ``,
    `⚠️ <b>Risk Notice:</b> Take your own risk. Risk only 1% - 2% per trade.`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>Powered by GenZ Trader AI</i>`,
  ].join('\n');
}

/**
 * Sends a signal directly to the configured Telegram VIP channel or chat.
 */
export async function sendTelegramSignal(signal) {
  const config = getTelegramConfig();
  if (!config.enabled) {
    return { ok: false, skipped: true, reason: 'Telegram sync disabled in settings.' };
  }

  if (!config.botToken || !config.chatId) {
    return { ok: false, skipped: true, reason: 'Missing botToken or chatId.' };
  }

  const messageText = formatTelegramMessage(signal);
  const url = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId.trim(),
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn('Telegram API error response:', data);
      const desc = data.description || 'Failed to send message to Telegram.';
      let friendly = desc;
      if (desc.includes('need administrator rights')) {
        friendly = 'Bot is not an Administrator yet! In Telegram, open your Channel Settings → Administrators → Add Administrator → search your bot username and enable "Post Messages" permission.';
      } else if (desc.includes('chat not found')) {
        friendly = 'Channel or Chat not found! Make sure the Channel ID (e.g. @your_channel or -100...) is correct and that the bot has been added to it.';
      } else if (desc.includes('Unauthorized') || desc.includes('token')) {
        friendly = 'Invalid Bot Token! Please copy the exact API token sent by @BotFather.';
      }
      return { ok: false, error: friendly, rawError: desc };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    console.error('Failed to dispatch telegram signal:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Sends a test broadcast to verify Telegram bot credentials.
 */
export async function testTelegramNotification() {
  const config = getTelegramConfig();
  if (!config.botToken || !config.chatId) {
    return { ok: false, error: 'Please enter both Bot Token and Channel/Chat ID.' };
  }

  const testSignal = {
    pair: 'XAUUSD',
    type: 'BUY',
    entry: '2680.50 - 2682.00',
    sl: '2675.00',
    tp: '2695.00',
    rr: '1:2.5',
    timeframe: '15m',
    session: 'London Killzone',
    reasoning: 'Test Broadcast: Liquidity Sweep of Asian Low + 15m Bullish FVG displacement confirmation.',
  };

  return sendTelegramSignal(testSignal);
}

