// Telegram VIP Channel Signal Sync Service
// Broadcasts published signals directly to a Telegram VIP channel/group via the Telegram Bot API.

const TELEGRAM_CONFIG_KEY = 'genz_telegram_config';

/**
 * Escapes special HTML characters so Telegram HTML parse_mode never fails.
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Normalizes user-entered channel IDs (stripping URL prefixes, ensuring valid format).
 */
export function normalizeChatId(raw = '') {
  let cleaned = String(raw).trim();
  if (!cleaned) return '';
  cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, '').replace(/^t\.me\//i, '');
  // If it's alphanumeric without @ or -, and not purely digits, prepend @
  if (!cleaned.startsWith('@') && !cleaned.startsWith('-') && !/^-?\d+$/.test(cleaned)) {
    cleaned = '@' + cleaned;
  }
  return cleaned;
}

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
    const normalized = {
      ...config,
      chatId: normalizeChatId(config.chatId),
    };
    localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Failed to save telegram config:', err);
  }
}

/**
 * Auto-detects the channel ID and administrator permissions directly from the Bot's Telegram updates.
 */
export async function detectTelegramChannel(botToken) {
  if (!botToken || !botToken.trim()) {
    return { ok: false, error: 'Please enter your Bot API Token first.' };
  }

  const token = botToken.trim();
  try {
    const url = `https://api.telegram.org/bot${token}/getUpdates`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || 'Failed to fetch bot updates.' };
    }

    const updates = data.result || [];
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      if (u.my_chat_member?.chat) {
        const chat = u.my_chat_member.chat;
        const newMember = u.my_chat_member.new_chat_member;
        const isChannel = chat.type === 'channel' || chat.type === 'supergroup' || chat.type === 'group';
        if (isChannel && newMember?.status === 'administrator') {
          return {
            ok: true,
            chatId: String(chat.id),
            title: chat.title || 'VIP Channel',
            type: chat.type,
            canPost: Boolean(newMember.can_post_messages),
            botUsername: newMember.user?.username || '',
          };
        }
      }
    }

    return {
      ok: false,
      notFound: true,
      error: 'No channel detected yet. Make sure you add the bot as an Administrator in your Telegram channel first!',
    };
  } catch (err) {
    return { ok: false, error: err.message || 'Network error while checking Telegram.' };
  }
}

/**
 * Formats a signal into a clean, institutional Telegram VIP message with HTML formatting.
 */
export function formatTelegramMessage(signal) {
  const pair = escapeHtml((signal.pair || 'XAUUSD').toUpperCase());
  const type = escapeHtml((signal.type || 'BUY').toUpperCase());
  const entry = escapeHtml(signal.entry || 'Market');
  const sl = escapeHtml(signal.sl || 'N/A');
  const tp = escapeHtml(signal.tp || 'N/A');
  const rr = escapeHtml(signal.rr || '1:2');
  const timeframe = escapeHtml(signal.timeframe || '15m');
  const session = escapeHtml(signal.session || 'London / NY Killzone');
  const reasoning = escapeHtml(signal.reasoning || signal.setup || 'Institutional SMC Order Block & Liquidity Sweep');

  const actionEmoji = type.includes('BUY') ? '🟢' : '🔴';

  return [
    `🎯 <b>#${pair}</b> ┃ ${actionEmoji} <b>${type} ${entry}</b>`,
    ``,
    `🔹 <b>Take Profit (TP)</b> — <code>${tp}</code>`,
    `🔸 <b>Stop Loss (SL)</b> — <code>${sl}</code>`,
    `⚖️ <b>Risk to Reward</b> — <code>${rr}</code> (${timeframe} • ${session})`,
    ``,
    `💡 <b>Setup Rationale:</b>`,
    `<i>${reasoning}</i>`,
    ``,
    `🛡️ <b>Strict Risk Protocol:</b>`,
    `Risk only 1%–2% per trade. Apply proper risk management ‼️‼️`,
    ``,
    `⚡ <i>GenZ Trader VIP Signals</i>`,
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

  const token = (config.botToken || '').trim();
  const chatId = normalizeChatId(config.chatId);

  if (!token || !chatId) {
    return { ok: false, skipped: true, reason: 'Missing botToken or chatId.' };
  }

  const messageText = formatTelegramMessage(signal);
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
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
        friendly = '⚠️ Action Required: Bot is in your channel, but "Post Messages" permission is turned OFF! In Telegram: Manage Channel → Administrators → tap your Bot → Turn ON "Post Messages" → Save.';
      } else if (desc.includes('chat not found')) {
        friendly = `⚠️ Channel "${chatId}" not found! Make sure the bot is added as an administrator to that channel, or use the Channel ID (e.g. -1003949395464).`;
      } else if (desc.includes('Unauthorized') || desc.includes('token')) {
        friendly = '⚠️ Invalid Bot Token! Please copy the exact API token sent by @BotFather.';
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
    entry: '4180.905 - 4173.208',
    sl: '4173.208',
    tp: '4195.210',
    rr: '1:2.5',
    timeframe: '15m',
    session: 'London Killzone',
    reasoning: 'Institutional Liquidity Sweep & 15m Bullish Displacement',
  };

  return sendTelegramSignal(testSignal);
}
