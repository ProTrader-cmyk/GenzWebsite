import { auth } from '../firebase.js';

const API_URL = import.meta.env.VITE_NEWS_API_URL || '';

async function paymentRequest(path, body) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in before starting a payment.');
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(12000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('The payment service took too long to respond. Please try again.');
    }
    throw new Error('Could not connect to the payment service. Please try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Payment service is unavailable.');
  return result;
}

export async function createPayment(packageId, billing) {
  return paymentRequest('/api/payments', { packageId, billing });
}

export async function verifyPayment(paymentId) {
  return paymentRequest(`/api/payments/${encodeURIComponent(paymentId)}/verify`, {});
}

export async function getPackages() {
  return paymentRequest('/api/packages');
}
