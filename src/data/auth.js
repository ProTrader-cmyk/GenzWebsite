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
const LOGIN_ATTEMPTS_KEY = 'gzt_login_attempts';
const MAX_LOGIN_ATTEMPTS = 3;
const LOGIN_LOCKOUT_MS = 60 * 1000; // 1 minute

// Client-side only (keyed by email in localStorage) — a UX layer that shows
// a friendly "try again shortly" message after repeated wrong passwords.
// Firebase's own server-side throttling (auth/too-many-requests, handled
// below) is the real brute-force protection and isn't affected by
// clearing this.
function loadLoginAttempts() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLoginAttempts(all) {
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(all));
}

function checkLoginLockout(email) {
  const all = loadLoginAttempts();
  const entry = all[email];
  if (!entry?.lockedUntil) return { locked: false };
  const remainingMs = entry.lockedUntil - Date.now();
  if (remainingMs <= 0) {
    delete all[email];
    saveLoginAttempts(all);
    return { locked: false };
  }
  return { locked: true, remainingMs };
}

function recordFailedLogin(email) {
  const all = loadLoginAttempts();
  const entry = all[email] || { count: 0 };
  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    all[email] = { count: 0, lockedUntil: Date.now() + LOGIN_LOCKOUT_MS };
  } else {
    all[email] = entry;
  }
  saveLoginAttempts(all);
}

function clearLoginAttempts(email) {
  const all = loadLoginAttempts();
  delete all[email];
  saveLoginAttempts(all);
}

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

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

async function sendOtpEmail({ email, code, expiresAt }) {
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      email,
      passcode: code,
      time: new Date(expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}

// Creates a fresh 6-digit code for uid, stores it in Firestore, and emails it.
async function issueOtp({ uid, email }) {
  const code = generateOtpCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  await setDoc(doc(db, 'otps', uid), {
    code,
    email,
    expiresAt,
    attempts: 0,
  });
  await sendOtpEmail({ email, code, expiresAt });
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
    return { ok: false, error: authErrorMessage(err.code, lang) };
  }
}

// Re-sends a new OTP code for an already-created, not-yet-verified account.
export async function resendOtp({ uid, email, name }, lang) {
  try {
    await issueOtp({ uid, email, name });
    return { ok: true };
  } catch {
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

// Once a not-yet-approved account has clicked "Pay" on the Pricing page,
// they shouldn't be forced back onto that page on every refresh/login —
// persisted so it survives logout, not just local component state.
export async function markPaymentClicked(uid) {
  await updateDoc(doc(db, 'users', uid), { clickedPay: true });
}

export async function loginUser({ email, password }, lang) {
  const normalizedEmail = email.trim().toLowerCase();

  const lockout = checkLoginLockout(normalizedEmail);
  if (lockout.locked) {
    return { ok: false, error: getStrings(lang).auth.errLoginLocked };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const profile = await fetchUserProfile(cred.user.uid);
    if (!profile) {
      return { ok: false, error: getStrings(lang).auth.errNoAccount };
    }
    clearLoginAttempts(normalizedEmail);
    return { ok: true, user: profile };
  } catch (err) {
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(err.code)) {
      recordFailedLogin(normalizedEmail);
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

// Admin-only: creates a brand-new account with a chosen role/status/tier.
// Goes through the backend (Admin SDK) instead of createUserWithEmailAndPassword
// here in the browser, because that client-side call would sign this admin
// browser tab in AS the new user, ending the admin's own session.
export async function createUserAsAdmin({ name, email, password, role, status, tier }) {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${NEWS_API_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ name, email, password, role, status, tier }),
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

export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}

// tier: 'member' | 'vip' — separate from role, which only ever gates
// admin-dashboard access. VIP unlocks VIP-only tracks (e.g. Advanced).
export async function setUserTier(uid, tier) {
  await updateDoc(doc(db, 'users', uid), { tier });
}

// lessonIds: array of lesson ids (e.g. ['l1','l3','a2']) this user is
// allowed to open, across both tracks — or null to clear the override and
// fall back to the default approved/pending rule.
export async function setUserLessonAccess(uid, lessonIds) {
  await updateDoc(doc(db, 'users', uid), { allowedLessons: lessonIds });
}
