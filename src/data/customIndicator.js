import { collection, doc, deleteDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// Named, independently saved/toggleable custom indicators for the New
// Product gold chart's admin-only editor — see GoldChart.jsx. One doc per
// indicator, keyed by an auto-generated id. Firestore rules restrict this
// collection to admin-only read AND write (unlike `videos`, this is never
// rendered for regular users, so there's no public-read case for it).
const COLLECTION = 'customIndicators';

// A fresh doc id without writing anything yet — used so a brand-new,
// not-yet-saved indicator still has a stable id to key its in-memory state
// on (Apply can preview it immediately; Save just writes to this id).
export function newCustomIndicatorId() {
  return doc(collection(db, COLLECTION)).id;
}

export async function fetchCustomIndicators() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveCustomIndicator(id, name, code) {
  await setDoc(doc(db, COLLECTION, id), { name, code, updatedAt: serverTimestamp() });
}

export async function deleteCustomIndicatorDoc(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
