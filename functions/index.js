// Cloud Functions for GenZ Trader: MT5 signal ingestion.
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');

initializeApp();
const db = getFirestore();

// Set once via: firebase functions:secrets:set SIGNAL_API_KEY
// Put the SAME value in your EA's InpWebsiteApiKey input. Never commit
// this value to source control.
const SIGNAL_API_KEY = defineSecret('SIGNAL_API_KEY');

// Simplified R:R -- reward/risk based on the raw entry/sl/tp distance,
// same convention as the mock data (src/data/mockSignals.js).
function computeRR(entry, sl, tp) {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (!risk) return null;
  return Math.round((reward / risk) * 100) / 100;
}

exports.createSignal = onRequest({ secrets: [SIGNAL_API_KEY], cors: false }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = req.get('X-API-Key');
  if (!apiKey || apiKey !== SIGNAL_API_KEY.value()) {
    res.status(401).json({ ok: false, error: 'Invalid or missing X-API-Key header' });
    return;
  }

  const body = req.body || {};
  const { pair, direction, entry, sl, tp, ticket, reason } = body;

  const isFiniteNumber = (n) => typeof n === 'number' && Number.isFinite(n);

  if (
    typeof pair !== 'string' ||
    !pair.trim() ||
    (direction !== 'buy' && direction !== 'sell') ||
    !isFiniteNumber(entry) ||
    !isFiniteNumber(sl) ||
    !isFiniteNumber(tp)
  ) {
    res.status(400).json({
      ok: false,
      error: 'Required: pair (string), direction ("buy"|"sell"), entry, sl, tp (numbers).',
    });
    return;
  }

  try {
    const doc = {
      pair: pair.trim().toUpperCase(),
      direction,
      entry,
      sl,
      tp,
      rr: computeRR(entry, sl, tp),
      status: 'active',
      reason: typeof reason === 'string' ? reason.trim() : '',
      ticket: ticket != null ? String(ticket) : null,
      source: 'mt5-ea',
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('signals').add(doc);
    res.status(201).json({ ok: true, id: ref.id });
  } catch (err) {
    console.error('createSignal failed', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Expired subscriptions are revoked in the trusted backend, including the
// legacy user profile fields still consumed by older parts of the UI.
exports.expireSubscriptions = onSchedule('every 15 minutes', async () => {
  const now = new Date();
  const stalePayments = await db.collection('payments')
    .where('paymentStatus', '==', 'pending')
    .where('expiresAt', '<=', now)
    .limit(400)
    .get();
  for (let offset = 0; offset < stalePayments.docs.length; offset += 400) {
    const paymentBatch = db.batch();
    stalePayments.docs.slice(offset, offset + 400).forEach((payment) => {
      paymentBatch.update(payment.ref, { paymentStatus: 'expired', updatedAt: FieldValue.serverTimestamp() });
    });
    await paymentBatch.commit();
  }
  const expired = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .where('expiryDate', '<=', now)
    .limit(200)
    .get();
  const batch = db.batch();
  for (const subscription of expired.docs) {
    const data = subscription.data();
    batch.update(subscription.ref, { status: 'expired', features: [], updatedAt: FieldValue.serverTimestamp() });
    const userRef = db.collection('users').doc(data.userId);
    batch.set(userRef, { plan: 'free', tier: FieldValue.delete(), subscriptionExpiresAt: FieldValue.delete(), activeSubscriptionId: FieldValue.delete() }, { merge: true });
  }
  if (!expired.empty) await batch.commit();
});
