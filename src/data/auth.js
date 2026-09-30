import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { auth, db } from '../firebase.js';
import { getStrings } from '../i18n/strings.js';

const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL;
const SESSION_KEY = 'gzt_session';
const OTP_TTL_MS = 10 * 60 * 1000; // 6-digit code is valid for 10 minutes
const LOGIN_ATTEMPTS_COLLECTION = 'loginAttempts';
const MAX_LOGIN_ATTEMPTS = 4;
const LOGIN_LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes

// Server-side (Firestore, keyed by the normalized email — not the device),
// so the lockout follows the account across browsers instead of resetting
// the moment someone opens a different browser, an incognito window, or
// clears localStorage — a UX layer that shows a friendly "try again
// shortly" message after repeated wrong passwords. Firebase's own
// server-side throttling (auth/too-many-requests, handled below) remains
// the real brute-force protection underneath this.
async function checkLoginLockout(email) {
  const ref = doc(db, LOGIN_ATTEMPTS_COLLECTION, email);
  const snap = await getDoc(ref);
  if (!snap.exists() || !snap.data().lockedUntil) return { locked: false };
  const remainingMs = snap.data().lockedUntil - Date.now();
  if (remainingMs <= 0) {
    await deleteDoc(ref);
    return { locked: false };
  }
  return { locked: true, remainingMs };
}

async function recordFailedLogin(email) {
  const ref = doc(db, LOGIN_ATTEMPTS_COLLECTION, email);
  const snap = await getDoc(ref);
  const count = (snap.exists() ? snap.data().count : 0) + 1;
  const justLocked = count >= MAX_LOGIN_ATTEMPTS;
  await setDoc(ref, {
    count: justLocked ? 0 : count,
    lockedUntil: justLocked ? Date.now() + LOGIN_LOCKOUT_MS : null,
    updatedAt: serverTimestamp(),
  });
  return justLocked ? { locked: true, remainingMs: LOGIN_LOCKOUT_MS } : { locked: false };
}

async function clearLoginAttempts(email) {
  await deleteDoc(doc(db, LOGIN_ATTEMPTS_COLLECTION, email));
}

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_x5a3ylf';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_48lnomi';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'skTsXl_YXN2PxAgcQ';

function authErrorMessage(code, lang) {
  const t = getStrings(lang).auth;
  switch (code) {
    case 'auth/email-already-in-use':
      return t.errEmailInUse;
    case 'auth/invalid-email':
      return t.errInvalidEmail;
    case 'auth/weak-password':
      return t.errWeakPassword;
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return t.errBadCredential;
    case 'auth/too-many-requests':
      return t.errTooManyRequests;
    default:
      return t.errGeneric;
  }
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail({ email, code, expiresAt, name }) {
  const formattedTime = new Date(expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const recipientName = name || email.split('@')[0];
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      email,
      to_email: email,
      user_email: email,
      recipient: email,
      reply_to: email,
      passcode: code,
      code,
      otp: code,
      verification_code: code,
      name: recipientName,
      to_name: recipientName,
      user_name: recipientName,
      time: formattedTime,
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}

// Creates a fresh 6-digit code for uid, stores it in Firestore, and emails it.
async function issueOtp({ uid, email, name }, throwOnEmailError = false) {
  const code = generateOtpCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  await setDoc(doc(db, 'otps', uid), {
    code,
    email,
    expiresAt,
    attempts: 0,
  });
  try {
    await sendOtpEmail({ email, code, expiresAt, name });
    return { ok: true };
  } catch (emailErr) {
    console.error('Failed to send OTP email via EmailJS:', emailErr);
    if (throwOnEmailError) throw emailErr;
    return { ok: false, error: emailErr };
  }
}

// name, email, password -> creates the Firebase Auth account, the Firestore
// user profile (status: 'pending'), and emails the first OTP code.
export async function registerUser({ name, email, password }, lang) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name,
      email: normalizedEmail,
      status: 'pending', // admin flips this to 'approved' in Firestore once the user is confirmed
      role: 'user', // admin flips this to 'admin' to grant dashboard access
      tier: 'member', // admin flips this to 'vip' to unlock VIP-only tracks
      emailVerified: false,
      createdAt: serverTimestamp(),
    });

    await issueOtp({ uid, email: normalizedEmail, name });

    return { ok: true, uid, email: normalizedEmail, name };
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      try {
        // If account exists but was never verified, resume verification gracefully
        const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const profile = await fetchUserProfile(cred.user.uid);
        if (profile && !profile.emailVerified) {
          await issueOtp({ uid: cred.user.uid, email: normalizedEmail, name: profile.name || name });
          return { ok: true, uid: cred.user.uid, email: normalizedEmail, name: profile.name || name };
        }
      } catch (resumeErr) {
        console.warn('Could not resume unverified account:', resumeErr);
      }
    }
    console.error('Registration error:', err);
    return { ok: false, error: authErrorMessage(err.code, lang) };
  }
}

// Re-sends a new OTP code for an already-created, not-yet-verified account.
export async function resendOtp({ uid, email, name }, lang) {
  try {
    await issueOtp({ uid, email, name }, true);
    return { ok: true };
  } catch (err) {
    console.error('Resend OTP error:', err);
    return { ok: false, error: getStrings(lang).otp.errResendFailed };
  }
}

export async function verifyOtp({ uid, code }, lang) {
  const t = getStrings(lang).otp;
  const ref = doc(db, 'otps', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { ok: false, error: t.errInvalidOrExpired };
  }
  const otp = snap.data();
  if (Date.now() > otp.expiresAt) {
    return { ok: false, error: t.errExpired };
  }
  if (otp.attempts >= 5) {
    return { ok: false, error: t.errTooManyAttempts };
  }
  if (otp.code !== code.trim()) {
    await updateDoc(ref, { attempts: otp.attempts + 1 });
    return { ok: false, error: t.errWrongCode };
  }

  await updateDoc(doc(db, 'users', uid), { emailVerified: true });
  await deleteDoc(ref);
  return { ok: true };
}

// Loads the Firestore profile (name/email/status/emailVerified) for a signed-in uid.
export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// Marks one lesson done on the user's own profile (progress.<lessonId> =
// true), so completed lessons — and therefore which lesson is unlocked next
// — persist across logout/login and across devices, not just this session.
export async function markLessonDone(uid, lessonId) {
  await updateDoc(doc(db, 'users', uid), { [`progress.${lessonId}`]: true });
}

export async function loginUser({ email, password }, lang) {
  const normalizedEmail = email.trim().toLowerCase();

  const lockout = await checkLoginLockout(normalizedEmail);
  if (lockout.locked) {
    return { ok: false, error: getStrings(lang).auth.errLoginLocked, lockedMs: lockout.remainingMs };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const profile = await fetchUserProfile(cred.user.uid);
    if (!profile) {
      return { ok: false, error: getStrings(lang).auth.errNoAccount };
    }
    clearLoginAttempts(normalizedEmail).catch(() => {});
    return { ok: true, user: profile };
  } catch (err) {
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(err.code)) {
      const result = await recordFailedLogin(normalizedEmail);
      if (result.locked) {
        return { ok: false, error: getStrings(lang).auth.errLoginLocked, lockedMs: result.remainingMs };
      }
    }
    return { ok: false, error: authErrorMessage(err.code, lang) };
  }
}

// In-app "forgot password" — an emailed link (own domain + own EmailJS
// template, not Firebase's hosted page), carrying a random token instead of
// a code to type. Both calls go through genztrader-news-api (see
// passwordReset.js there): changing another account's password can only
// ever happen via Firebase's Admin SDK (server-side), never directly from
// the browser, so this can't be done as a pure client-side Firestore call
// the way the signup OTP is.
export async function requestPasswordResetLink(email, lang) {
  const t = getStrings(lang).resetPassword;
  try {
    const res = await fetch(`${NEWS_API_URL}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!res.ok) throw new Error();
    return { ok: true };
  } catch {
    return { ok: false, error: t.errRequestFailed };
  }
}

function resetLinkErrorMessage(code, t) {
  switch (code) {
    case 'invalid_or_expired':
      return t.errInvalidOrExpired;
    case 'expired':
      return t.errExpired;
    case 'too_many_attempts':
      return t.errTooManyAttempts;
    case 'weak_password':
      return t.errWeakPassword;
    default:
      return t.errRequestFailed;
  }
}

export async function confirmPasswordReset({ email, token, newPassword }, lang) {
  const t = getStrings(lang).resetPassword;
  try {
    const res = await fetch(`${NEWS_API_URL}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), token: token.trim(), newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: resetLinkErrorMessage(data.code, t) };
    return { ok: true };
  } catch {
    return { ok: false, error: t.errRequestFailed };
  }
}

export async function logoutUser() {
  await signOut(auth);
  clearSession();
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Admin dashboard (only reachable in the UI for role: 'admin' accounts;
// actually enforced server-side by firestore.rules regardless) ---

export async function fetchAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// Admin-only: creates a brand-new account with a chosen role/status/tier/plan.
// Goes through the backend (Admin SDK) instead of createUserWithEmailAndPassword
// here in the browser, because that client-side call would sign this admin
// browser tab in AS the new user, ending the admin's own session.
export async function createUserAsAdmin({ name, email, password, role, status, tier, plan }) {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${NEWS_API_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ name, email, password, role, status, tier, plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Failed to create user.' };
    return { ok: true, uid: data.uid };
  } catch {
    return { ok: false, error: 'Failed to create user.' };
  }
}

export async function setUserStatus(uid, status) {
  await updateDoc(doc(db, 'users', uid), { status });
}

// Deletes the account entirely (Auth + Firestore profile) — goes through
// the backend Admin SDK, same as createUserAsAdmin, since a client can never
// delete another user's doc directly (firestore.rules: allow delete: if false).
export async function deleteUserAsAdmin(uid) {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${NEWS_API_URL}/api/admin/delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ uid }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Failed to delete user.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to delete user.' };
  }
}

/**
 * Resolves a user's subscription plan ('free' | 'starter' | 'pro' | 'elite')
 * gracefully handles string casing ('Pro', 'PRO', 'Elite'), both 'plan' and 'tier' fields,
 * and legacy accounts where only 'tier: vip' was stored.
 */
export function getUserPlan(user) {
  if (!user) return 'free';
  const candidates = [user.plan, user.tier, user.subscription, user.membership]
    .filter((c) => typeof c === 'string' && c.trim())
    .map((c) => c.trim().toLowerCase());

  // 1. Highest tier takes precedence (Elite > Pro > Starter)
  if (candidates.some((s) => s.includes('elite'))) return 'elite';
  if (candidates.some((s) => s.includes('pro'))) return 'pro';
  if (candidates.some((s) => s.includes('starter'))) return 'starter';
  if (candidates.some((s) => s === 'vip')) return 'starter';

  return 'free';
}

// Updates user plan ('free' | 'starter' | 'pro' | 'elite') and keeps 'tier' synced.
export async function setUserPlan(uid, plan) {
  const normalizedPlan = (plan || 'free').toLowerCase();
  const tier = normalizedPlan === 'free' ? 'member' : normalizedPlan;
  try {
    await updateDoc(doc(db, 'users', uid), { plan: normalizedPlan, tier });
  } catch (err) {
    console.warn('Direct plan update failed, falling back to tier update:', err);
    try {
      await updateDoc(doc(db, 'users', uid), { tier });
    } catch (fallbackErr) {
      console.warn('Tier-only update failed, trying legacy tier:', fallbackErr);
      const legacyTier = normalizedPlan === 'free' ? 'member' : 'vip';
      await updateDoc(doc(db, 'users', uid), { tier: legacyTier });
    }
  }
}

// Updates user role ('user' | 'admin' | 'dev')
export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}

// role: 'user' | 'admin' | 'dev' — gates admin-dashboard access. tier:
// 'member' | 'vip' — separate axis, unlocks VIP-only tracks (e.g. Advanced).
export async function setUserAccess(uid, { role, tier, plan }) {
  const updates = {};
  if (role !== undefined) updates.role = role;
  if (plan !== undefined) {
    const normalizedPlan = (plan || 'free').toLowerCase();
    updates.plan = normalizedPlan;
    updates.tier = normalizedPlan === 'free' ? 'member' : normalizedPlan;
  } else if (tier !== undefined) {
    updates.tier = tier;
  }
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (err) {
    console.warn('setUserAccess failed, trying tier fallback:', err);
    if (updates.tier) {
      await updateDoc(doc(db, 'users', uid), { tier: updates.tier });
    }
  }
}

// lessonIds: array of lesson ids (e.g. ['l1','l3','a2']) this user is
// allowed to open, across both tracks — or null to clear the override and
// fall back to the default approved/pending rule.
export async function setUserLessonAccess(uid, lessonIds) {
  await updateDoc(doc(db, 'users', uid), { allowedLessons: lessonIds });
}
