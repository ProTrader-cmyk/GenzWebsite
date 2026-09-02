import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

// Small enough that the resulting base64 string comfortably fits inside a
// Firestore document (1MB field limit) alongside everything else on the
// user doc — this is just an avatar thumbnail, not a full-res photo, so
// there's no real quality loss from keeping it tiny. Storing it directly on
// the user doc (instead of Firebase Storage) means no separate storage
// rules file to ever publish — the existing Firestore rule for self-writes
// already covers this field.
const MAX_DIMENSION = 200;
const JPEG_QUALITY = 0.7;

function resizeToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image.'));
    };
    img.src = objectUrl;
  });
}

export async function uploadProfilePhoto(uid, file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('errNotImage');
  }
  const dataUrl = await resizeToDataUrl(file);
  if (dataUrl.length > 700_000) {
    // Extremely unlikely at 200px/0.7 quality, but a Firestore doc has a
    // hard 1MB cap across every field combined — fail loudly instead of
    // silently corrupting the write.
    throw new Error('errTooLarge');
  }
  await updateDoc(doc(db, 'users', uid), { photoURL: dataUrl });
  return dataUrl;
}
