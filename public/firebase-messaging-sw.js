importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

// Firebase config for service worker
const firebaseConfig = {
  apiKey: "AIzaSyCyg0UnSvbI_j--F690swXWWgz0dUQuFis",
  authDomain: "monitoring-afb38.firebaseapp.com",
  projectId: "monitoring-afb38",
  storageBucket: "monitoring-afb38.firebasestorage.app",
  messagingSenderId: "477576003667",
  appId: "1:477576003667:web:f71e0b99ac0a8946e006a6",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('FCM background message received in service worker:', payload);

  const notificationTitle = payload.notification?.title || 'Notifikasi';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'FCM_BACKGROUND_NOTIFICATION',
        payload,
      });
    });
  });
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification?.data);
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
