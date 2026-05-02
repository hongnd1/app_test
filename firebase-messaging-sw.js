/* global importScripts, firebase, clients */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB6Tqgj1PqF8wcC4jAZU4A048mLgv4CGTk",
  authDomain: "blx-app-348b4.firebaseapp.com",
  projectId: "blx-app-348b4",
  storageBucket: "blx-app-348b4.firebasestorage.app",
  messagingSenderId: "880549597054",
  appId: "1:880549597054:web:c1c999f151b16913ddad2f",
  measurementId: "G-9571QHKDCN",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload?.notification?.title || payload?.data?.title || "BLX Student Manager";
  const notificationOptions = {
    body:
      payload?.notification?.body ||
      payload?.data?.body ||
      "Bạn có thông báo mới từ hệ thống.",
    icon: payload?.notification?.icon || payload?.data?.icon || undefined,
    badge: payload?.notification?.badge || payload?.data?.badge || undefined,
    data: payload?.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL("./", self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
