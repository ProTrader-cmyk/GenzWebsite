/**
 * Telegram VIP Channel Broadcast Service for GenZ Trader
 * Automatically syncs live signals published by Admin directly to the Telegram VIP Channel.
 */

const STORAGE_KEY_TOKEN = 'genz_telegram_bot_token';
const STORAGE_KEY_CHAT_ID = 'genz_telegram_chat_id';
const STORAGE_KEY_ENABLED = 'genz_telegram_enabled';

/**
 * Retrieves the active Telegram configuration.
 */
export function getTelegramConfig() {
  const envToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
  const envChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';

  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedChatId = localStorage.getItem(STORAGE_KEY_CHAT_ID);
    const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);

    return {
      botToken: savedToken !== null ? savedToken : envToken,
      chatId: savedChatId !== null ? savedChatId : envChatId,
      enabled: savedEnabled !== null ? savedEnabled === 'true' : Boolean(envToken && envChatId),
    };
  } catch {
    return {
      botToken: envToken,
      chatId: envChatId,
      enabled: Boolean(envToken && envChatId),
    };
  }
}

/**
 * Saves Telegram configuration to localStorage.
 */
export function saveTelegramConfig({ botToken, chatId, enabled }) {
  try {
    if (botToken !== undefined) localStorage.setItem(STORAGE_KEY_TOKEN, botToken.trim());
    if (chatId !== undefined) localStorage.setItem(STORAGE_KEY_CHAT_ID, chatId.trim());
    if (enabled !== undefined) localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
  } catch (err) {
    console.warn('Could not save Telegram config:', err);
  }
}

/**
 * Formats a signal into an institutional Telegram VIP message with HTML formatting.
 */
export function formatTelegramMessage(signal) {
  const isBuy = (signal.direction || 'buy').toLowerCase() === 'buy';
  const dirEmoji = isBuy ? '🟢' : '🔴';
  const dirText = isBuy ? 'BUY' : 'SELL';
  const pair = (signal.pair || 'XAUUSD').toUpperCase();
  const rrText = signal.rr ? (String(signal.rr).includes(':') ? signal.rr : `1:${signal.rr}`) : '1:2+';
  const session = signal.session || 'London Killzone (GMT+7)';
  const reason = signal.reason ? signal.reason.trim() : 'Institutional liquidity sweep & order flow confluence.';

  return `⚡ <b>NEW VIP TRADING SIGNAL</b> ⚡
━━━━━━━━━━━━━━━━━━
📊 <b>Pair:</b> <code>#${pair}</code>
🎯 <b>Order:</b> ${dirEmoji} <b>${dirText}</b>
📍 <b>Entry:</b> <code>${signal.entry}</code>
🛑 <b>Stop Loss:</b> <code>${signal.sl}</code>
🎯 <b>Take Profit:</b> <code>${signal.tp}</code>
⚖️ <b>Risk : Reward:</b> <code>${rrText}</code>
⏰ <b>Session:</b> ${session}

💡 <b>Institutional SMC Setup:</b>
<i>${reason}</i>

⚠️ <b>Risk Management:</b>
<i>Strict 1%-2% max risk per trade. Take your own risk!</i>
━━━━━━━━━━━━━━━━━━
👑 <b>GenZ Trader VIP Terminal</b>`;
}

/**
 * Sends a live signal to the configured Telegram VIP Channel.
 * @param {Object} signal
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendTelegramSignal(signal) {
  const config = getTelegramConfig();
  if (!config.enabled) {
    return { ok: false, error: 'Telegram VIP sync is disabled in settings.' };
  }

  const { botToken, chatId } = config;
  if (!botToken || !chatId) {
    return { ok: false, error: 'Telegram Bot Token or Chat ID is not configured.' };
  }

  const text = formatTelegramMessage(signal);

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      const errMsg = data?.description || `HTTP ${res.status}`;
      console.warn('[TelegramService] Telegram send failed:', errMsg);
      return { ok: false, error: errMsg };
    }

    console.log('[TelegramService] Live signal successfully synced to Telegram VIP channel!');
    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    console.error('[TelegramService] Network error syncing to Telegram:', err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}

/**
 * Sends an instant test ping to verify Telegram Bot configuration.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function testTelegramNotification() {
  const config = getTelegramConfig();
  const { botToken, chatId } = config;

  if (!botToken || !chatId) {
    return { ok: false, error: 'Please enter both Bot Token and Chat/Channel ID before testing.' };
  }

  const testText = `🤖 <b>GenZ Trader Telegram Bot Connected!</b>\n\n✅ Live signal synchronization is active.\nWhen you drop a signal on the website, it will automatically post here for all VIP members!`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testText,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data?.description || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}
