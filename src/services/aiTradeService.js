/**
 * Client for the backend AI-trading routes (/api/trading/*).
 * All market data, AI analysis and order calls live on the server; this file only forwards the
 * signed-in user's Firebase ID token and normalises errors.
 */
import { auth } from '../firebase.js';
import { API_BASE_URL } from './marketPriceService.js';

export class TradeApiError extends Error {
  constructor(message, { status = 0, retryAfter = null, network = false } = {}) {
    super(message);
    this.name = 'TradeApiError';
    this.status = status;
    this.retryAfter = retryAfter;
    this.network = network;
  }
}

async function call(method, path, body, { timeoutMs = 20000 } = {}) {
  const user = auth.currentUser;
  if (!user) throw new TradeApiError('Sign in to use AI trading.', { status: 401 });
  const token = await user.getIdToken();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}/api/trading${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      throw new TradeApiError(json?.error || `Request failed (${res.status}).`, { status: res.status, retryAfter: json?.retryAfter || null });
    }
    return json;
  } catch (err) {
    if (err instanceof TradeApiError) throw err;
    throw new TradeApiError(
      err?.name === 'AbortError' ? 'The server took too long to respond.' : 'Could not reach the trading server.',
      { network: true }
    );
  } finally {
    clearTimeout(timer);
  }
}

export const fetchTradeMarket = (pair) => call('GET', `/market?pair=${encodeURIComponent(pair)}`);
export const fetchTradeStatus = () => call('GET', '/status');
export const analyzePair = (pair) => call('POST', '/analyze', { pair }, { timeoutMs: 45000 });
// The signal id is the idempotency key: the server executes each signal at most once, so a
// repeated click or a retry after a dropped connection returns the original result.
export const executeSignal = (signalId) => call('POST', '/execute', { signalId }, { timeoutMs: 30000 });
export const fetchPositions = () => call('GET', '/positions');
export const fetchTradeHistory = () => call('GET', '/history');
export const fetchScannerSignal = (pair) => call('GET', `/latest?pair=${encodeURIComponent(pair)}`);
