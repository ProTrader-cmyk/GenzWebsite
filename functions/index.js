// Cloud Functions for GenZ Trader: MT5 signal ingestion.
const { onRequest } = require('firebase-functions/v2/https');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

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

// LiveKit credentials stay in Secret Manager. Never place the API secret in
// the browser bundle or Firestore.
const LIVEKIT_URL = defineSecret('LIVEKIT_URL');
const LIVEKIT_API_KEY = defineSecret('LIVEKIT_API_KEY');
const LIVEKIT_API_SECRET = defineSecret('LIVEKIT_API_SECRET');

async function getLiveKitUser(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to access the Live Room.');
  const userSnap = await db.collection('users').doc(request.auth.uid).get();
  if (!userSnap.exists) throw new HttpsError('permission-denied', 'Member profile not found.');
  const user = userSnap.data();
  const isAdmin = ['admin', 'dev'].includes(user.role);
  if (!isAdmin && user.status !== 'approved') {
    throw new HttpsError('permission-denied', 'An approved member account is required.');
  }
  return { uid: request.auth.uid, user, isAdmin };
}

function getLiveKitRoomService() {
  const host = LIVEKIT_URL.value().replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
  return new RoomServiceClient(host, LIVEKIT_API_KEY.value(), LIVEKIT_API_SECRET.value());
}

exports.startLiveStream = onCall({ secrets: [LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET] }, async (request) => {
  const { uid, user, isAdmin } = await getLiveKitUser(request);
  if (!isAdmin) throw new HttpsError('permission-denied', 'Only admins can start a live stream.');
  const title = String(request.data?.title || '').trim().slice(0, 100);
  if (!title) throw new HttpsError('invalid-argument', 'Enter a stream title.');

  const streamRef = db.collection('liveStreams').doc();
  const roomName = `member-live-${streamRef.id}`;
  const roomService = getLiveKitRoomService();
  try {
    await roomService.createRoom({ name: roomName, emptyTimeout: 120, maxParticipants: 200 });
    await streamRef.set({
      title,
      roomName,
      status: 'live',
      hostUid: uid,
      hostName: user.name || user.email || 'Host',
      startedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return { streamId: streamRef.id, roomName };
  } catch (error) {
    console.error('startLiveStream failed', error);
    throw new HttpsError('internal', 'Could not start the LiveKit room. Check the LiveKit project settings.');
  }
});

exports.getLiveStreamToken = onCall({ secrets: [LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET] }, async (request) => {
  const { uid, user, isAdmin } = await getLiveKitUser(request);
  const streamId = String(request.data?.streamId || '').trim();
  if (!streamId) throw new HttpsError('invalid-argument', 'A stream ID is required.');
  const streamSnap = await db.collection('liveStreams').doc(streamId).get();
  if (!streamSnap.exists || streamSnap.data().status !== 'live') {
    throw new HttpsError('not-found', 'This stream is no longer live.');
  }
  const stream = streamSnap.data();
  const canPublish = isAdmin && stream.hostUid === uid;
  const token = new AccessToken(LIVEKIT_API_KEY.value(), LIVEKIT_API_SECRET.value(), {
    identity: uid,
    name: user.name || user.email || 'Member',
    ttl: '2h',
  });
  token.addGrant({ roomJoin: true, room: stream.roomName, canPublish, canSubscribe: true, canPublishData: canPublish });
  return { serverUrl: LIVEKIT_URL.value(), participantToken: await token.toJwt(), canPublish };
});

exports.endLiveStream = onCall({ secrets: [LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET] }, async (request) => {
  const { isAdmin } = await getLiveKitUser(request);
  if (!isAdmin) throw new HttpsError('permission-denied', 'Only admins can end a live stream.');
  const streamId = String(request.data?.streamId || '').trim();
  if (!streamId) throw new HttpsError('invalid-argument', 'A stream ID is required.');
  const ref = db.collection('liveStreams').doc(streamId);
  const streamSnap = await ref.get();
  if (!streamSnap.exists || streamSnap.data().status !== 'live') return { ok: true };
  try {
    await getLiveKitRoomService().deleteRoom(streamSnap.data().roomName);
  } catch (error) {
    console.warn('LiveKit room cleanup notice:', error.message);
  }
  await ref.update({ status: 'ended', endedAt: FieldValue.serverTimestamp() });
  return { ok: true };
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
