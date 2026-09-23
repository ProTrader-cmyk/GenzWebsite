import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

export async function submitFeedback({ uid, name, email, lessonId, lessonTitle, rating, comment }) {
  await addDoc(collection(db, 'feedback'), {
    uid,
    name: name || '',
    email: email || '',
    lessonId: lessonId || null,
    lessonTitle: lessonTitle || null,
    rating,
    comment: comment || '',
    createdAt: serverTimestamp(),
  });
}

export async function fetchAllFeedback() {
  const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
