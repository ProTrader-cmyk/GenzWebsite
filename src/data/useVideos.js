import { useEffect, useState } from 'react';
import { fetchAllVideos } from './videos.js';

// Module-level cache + in-flight promise so every component calling
// useVideos() across the whole app shares one Firestore read, not one each.
let cache = null;
let inFlight = null;

function loadVideos() {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = fetchAllVideos()
      .then((videos) => {
        cache = videos;
        return videos;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

// videos[key] -> { url, label, storagePath } | undefined (not uploaded yet).
export function useVideos() {
  const [videos, setVideos] = useState(cache || {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    loadVideos().then((v) => {
      if (!cancelled) {
        setVideos(v);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { videos, loading };
}

// Call after an admin uploads/deletes a video so the next useVideos() read
// (e.g. navigating back to a lesson) picks up the change without a full
// page reload. Doesn't push the update to already-mounted consumers.
export function invalidateVideoCache() {
  cache = null;
}
