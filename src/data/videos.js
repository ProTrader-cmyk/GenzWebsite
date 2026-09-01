import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// One Firestore doc per video, keyed by a stable `key` (e.g. 'hero',
// 'l7-walkthrough') that lesson/category components look up by. The doc ID
// IS the key, so it's unique by construction and directly fetchable.
//
// The video FILES themselves live outside Firebase entirely — as GitHub
// Release assets (upload via github.com, paste the resulting direct-
// download link here). This collection only ever stores that URL, never
// the file, so there's no storage-tier billing concern at all.
const VIDEOS_COLLECTION = 'videos';

// Every known key, so the admin panel can offer a fixed list instead of
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

// { key: { url, label, updatedAt } }, all videos in one read.
export async function fetchAllVideos() {
  const snap = await getDocs(collection(db, VIDEOS_COLLECTION));
  const videos = {};
  snap.forEach((d) => {
    videos[d.id] = d.data();
  });
  return videos;
}

// Just records the URL — the actual upload happens on github.com (Releases
// tab of any repo -> attach the file to a release -> copy the asset's
// direct-download link) before calling this.
export async function saveVideoUrl(key, url, label) {
  await setDoc(doc(db, VIDEOS_COLLECTION, key), {
    url,
    label: label || key,
    updatedAt: serverTimestamp(),
  });
}

// Removes the Firestore entry only — the file itself stays on GitHub
// (delete/replace it there separately if you want it gone for good).
export async function deleteVideo(key) {
  await deleteDoc(doc(db, VIDEOS_COLLECTION, key));
}
