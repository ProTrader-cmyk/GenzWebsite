import { collection, doc, getDocs, setDoc, deleteDoc, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase.js';

// "YYYY-MM-DD", zero-padded so lexical order matches calendar order — lets
// fetchRangeEntries below use a plain documentId() range query instead of
// fetching the whole collection and filtering client-side.
export function dateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Returns { 'YYYY-MM-DD': { pnl, note, pair, updatedAt } } for every entry
// whose doc-id key falls within [startKey, endKey] (inclusive), no matter
// how many months that range spans.
export async function fetchRangeEntries(uid, startKey, endKey) {
  const q = query(
    collection(db, 'users', uid, 'journal'),
    where(documentId(), '>=', startKey),
    where(documentId(), '<=', endKey)
  );
  const snap = await getDocs(q);
  const entries = {};
  snap.docs.forEach((d) => {
    entries[d.id] = d.data();
  });
  return entries;
}

export async function fetchMonthEntries(uid, year, month) {
  return fetchRangeEntries(uid, dateKey(year, month, 1), dateKey(year, month, daysInMonth(year, month)));
}

export async function saveDayEntry(uid, dateId, pnl, note, pair) {
  await setDoc(doc(db, 'users', uid, 'journal', dateId), {
    pnl,
    note: note || '',
    pair: pair || '',
    updatedAt: Date.now(),
  });
}

export async function deleteDayEntry(uid, dateId) {
  await deleteDoc(doc(db, 'users', uid, 'journal', dateId));
}
