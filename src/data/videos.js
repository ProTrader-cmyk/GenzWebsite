import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase.js';

// One Firestore doc per video, keyed by a stable `key` (e.g. 'hero',
// 'l7-walkthrough') that lesson/category components look up by. The doc ID
// IS the key, so it's unique by construction and directly fetchable.
const VIDEOS_COLLECTION = 'videos';

// Every known key, so the admin upload UI can offer a picklist instead of
// free-typing (a typo'd key just silently fails to match in a lesson).
// Add a new entry here whenever a new spot in the site needs a video.
export const VIDEO_KEYS = [
  { key: 'hero', label: 'Home hero video' },
  { key: 'auth-bg', label: 'Login/Signup background video' },
  { key: 'l1-bullish', label: 'Lesson 1 — Bullish structure demo' },
  { key: 'l1-bearish', label: 'Lesson 1 — Bearish structure demo' },
  { key: 'l2-bos', label: 'Lesson 2 — BOS demo' },
  { key: 'l2-choch', label: 'Lesson 2 — CHoCH demo' },
  { key: 'l5-bsl', label: 'Lesson 5 — BSL demo' },
  { key: 'l5-ssl', label: 'Lesson 5 — SSL demo' },
  { key: 'l5-lq-run', label: 'Lesson 5 — Liquidity run demo' },
  { key: 'l5-lq-sweep', label: 'Lesson 5 — Liquidity sweep demo' },
  { key: 'l6-setup', label: 'Lesson 6 — EMA/SMA setup demo' },
  { key: 'l6-trend', label: 'Lesson 6 — EMA trend demo' },
  { key: 'l6-crossing', label: 'Lesson 6 — EMA crossing demo' },
  { key: 'l7-walkthrough', label: 'Lesson 7 — Full walkthrough' },
];

// { key: { url, storagePath, label, updatedAt } }, all videos in one read.
export async function fetchAllVideos() {
  const snap = await getDocs(collection(db, VIDEOS_COLLECTION));
  const videos = {};
  snap.forEach((d) => {
    videos[d.id] = d.data();
  });
  return videos;
}

// Uploads the file to Storage at videos/<key>-<original filename>, then
// writes {url, storagePath, label} to videos/<key> in Firestore. Overwrites
// whatever was previously at that key (both the Firestore doc and, since
// the storagePath is content-addressed by key, effectively the video too —
// the old Storage object is left behind rather than deleted here, since a
// failed/retried upload shouldn't risk deleting a still-referenced file).
export async function uploadVideo(key, file, label, onProgress) {
  const storagePath = `videos/${key}-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file);

  await new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      reject,
      resolve
    );
  });

  const url = await getDownloadURL(storageRef);
  await setDoc(doc(db, VIDEOS_COLLECTION, key), {
    url,
    storagePath,
    label: label || key,
    updatedAt: serverTimestamp(),
  });
  return url;
}

export async function deleteVideo(key, storagePath) {
  await deleteDoc(doc(db, VIDEOS_COLLECTION, key));
  if (storagePath) {
    await deleteObject(ref(storage, storagePath)).catch(() => {
      // Storage object already gone / never existed — the Firestore doc
      // deletion above is what actually matters for "this video is gone".
    });
  }
}
