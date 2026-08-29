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

const SESSION_KEY = 'gzt_session';
const OTP_TTL_MS = 10 * 60 * 1000; // 6-digit code is valid for 10 minutes

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function authErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ។';
    case 'auth/invalid-email':
      return 'អ៊ីមែលមិនត្រឹមត្រូវទេ។';
    case 'auth/weak-password':
      return 'ពាក្យសម្ងាត់ខ្សោយពេក។';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។';
    case 'auth/too-many-requests':
      return 'ព្យាយាមច្រើនដងពេក។ សូមរង់ចាំមួយភ្លែត។';
    default:
      return 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។';
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
export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name,
      email: normalizedEmail,
      status: 'pending', // admin flips this to 'approved' in Firestore once the user is confirmed
      role: 'user', // admin flips this to 'admin' to grant dashboard access
      emailVerified: false,
      createdAt: serverTimestamp(),
    });

    await issueOtp({ uid, email: normalizedEmail, name });

    return { ok: true, uid, email: normalizedEmail, name };
  } catch (err) {
    return { ok: false, error: authErrorMessage(err.code) };
  }
}

// Re-sends a new OTP code for an already-created, not-yet-verified account.
export async function resendOtp({ uid, email, name }) {
  try {
    await issueOtp({ uid, email, name });
    return { ok: true };
  } catch {
    return { ok: false, error: 'មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្តងទៀត។' };
  }
}

export async function verifyOtp({ uid, code }) {
  const ref = doc(db, 'otps', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { ok: false, error: 'លេខកូដមិនត្រឹមត្រូវ ឬ ផុតកំណត់ហើយ។ សូមផ្ញើម្តងទៀត។' };
  }
  const otp = snap.data();
  if (Date.now() > otp.expiresAt) {
    return { ok: false, error: 'លេខកូដផុតកំណត់ហើយ។ សូមផ្ញើម្តងទៀត។' };
  }
  if (otp.attempts >= 5) {
    return { ok: false, error: 'ព្យាយាមច្រើនដងពេក។ សូមផ្ញើលេខកូដថ្មី។' };
  }
  if (otp.code !== code.trim()) {
    await updateDoc(ref, { attempts: otp.attempts + 1 });
    return { ok: false, error: 'លេខកូដមិនត្រឹមត្រូវទេ។' };
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

export async function loginUser({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const profile = await fetchUserProfile(cred.user.uid);
    if (!profile) {
      return { ok: false, error: 'រកមិនឃើញគណនីនេះទេ។' };
    }
    return { ok: true, user: profile };
  } catch (err) {
    return { ok: false, error: authErrorMessage(err.code) };
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

export async function setUserStatus(uid, status) {
  await updateDoc(doc(db, 'users', uid), { status });
}

export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}
