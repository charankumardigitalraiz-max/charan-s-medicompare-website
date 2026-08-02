importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyArSKM9NCI-FjL0JL9K1VnIXuo0CL5OoOA",
  authDomain: "medicompare-76c17.firebaseapp.com",
  projectId: "medicompare-76c17",
  storageBucket: "medicompare-76c17.firebasestorage.app",
  messagingSenderId: "1048864032783",
  appId: "1:1048864032783:web:4f807ec85d77ec5bd2fb7a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png',
    tag: 'medicompare-background-notification',
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
