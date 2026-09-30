// Cloud Functions for GenZ Trader: MT5 signal ingestion and paid-member
// Firebase Cloud Messaging delivery for newly published signal documents.
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

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

function isPaidNotificationRecipient(profile = {}) {
  if (profile.role === 'admin' || profile.role === 'dev') return true;
  const plans = [profile.plan, profile.tier, profile.subscription, profile.membership]
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim().toLowerCase());
  return plans.some((plan) =>
    plan.includes('starter') || plan.includes('pro') || plan.includes('elite') || plan === 'vip'
  );
}

// Send server-side Web Push so paid members receive signal alerts when the
// site is backgrounded or closed. Plan status is checked from Firestore here,
// not trusted from the device that registered the token.
exports.sendPaidMemberSignalPush = onDocumentCreated('signals/{signalId}', async (event) => {
  const signal = event.data?.data();
  if (!signal || (signal.status && signal.status !== 'active')) return;

  const tokenSnapshot = await db.collectionGroup('notificationTokens').get();
  const profiles = new Map();
  const recipients = [];

  await Promise.all(tokenSnapshot.docs.map(async (tokenDoc) => {
    const uid = tokenDoc.ref.parent.parent?.id;
    const token = tokenDoc.data().token;
    if (!uid || !token) return;

    let profile = profiles.get(uid);
    if (profile === undefined) {
      const profileSnap = await db.collection('users').doc(uid).get();
      profile = profileSnap.exists ? profileSnap.data() : null;
      profiles.set(uid, profile);
    }
    if (profile && isPaidNotificationRecipient(profile)) {
      recipients.push({ token, ref: tokenDoc.ref });
    }
  }));

  const title = '⚡ New Signal';
  const body = 'A new signal structure is in the market. Check it out.';
  for (let start = 0; start < recipients.length; start += 500) {
    const batch = recipients.slice(start, start + 500);
    const result = await getMessaging().sendEachForMulticast({
      tokens: batch.map((recipient) => recipient.token),
      notification: { title, body },
      data: { url: 'https://genztradermentorship.org/' },
      webpush: {
        notification: {
          icon: 'https://genztradermentorship.org/favicon.png',
          badge: 'https://genztradermentorship.org/favicon.png',
          tag: `signal-${event.params.signalId}`,
          renotify: true,
          requireInteraction: true,
        },
        fcmOptions: { link: 'https://genztradermentorship.org/' },
      },
    });

    const removals = [];
    result.responses.forEach((response, index) => {
      const code = response.error?.code;
      if (!response.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) {
        removals.push(batch[index].ref.delete());
      }
    });
    await Promise.all(removals);
  }
});
