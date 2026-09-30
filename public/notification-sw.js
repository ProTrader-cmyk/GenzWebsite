/**
 * Notification Service Worker — GenZ Trader
 *
 * Handles notification click events when the user taps a notification
 * while the app tab is in the background or closed.
 */

/* eslint-env serviceworker */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click — focus/open the member terminal
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus that tab
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Firebase Cloud Messaging handles background delivery through this worker.
// Keep the config aligned with src/firebase.js (the site uses these defaults).
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAU6johl9ow1M5MPu-nJzE5yPak9EOwbuc',
  authDomain: 'genzdatabase-7f05b.firebaseapp.com',
  projectId: 'genzdatabase-7f05b',
  storageBucket: 'genzdatabase-7f05b.firebasestorage.app',
  messagingSenderId: '905323072379',
  appId: '1:905323072379:web:4ad1ef3306f6508b010bde',
});

// Notification payloads are displayed automatically by Firebase in the
// background. Initialize messaging here so this custom worker can receive them.
firebase.messaging();
