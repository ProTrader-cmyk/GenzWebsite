import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// Admin-only JS for the New Product gold chart's custom indicator — see
// GoldChart.jsx. Stored in the `settings` collection, which firestore.rules
// restricts to admin-only read AND write (unlike `videos`, this is never
// rendered for regular users, so there's no public-read case for it).
const SETTINGS_DOC = doc(db, 'settings', 'customIndicator');

export async function fetchCustomIndicatorCode() {
  const snap = await getDoc(SETTINGS_DOC);
  return snap.exists() ? snap.data().code || '' : '';
}

export async function saveCustomIndicatorCode(code) {
  await setDoc(SETTINGS_DOC, { code, updatedAt: serverTimestamp() });
}
