importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyARPVSqyyV_gqr3aASPs0xcozZEBEbFz7M",
  authDomain: "enna-698ff.firebaseapp.com",
  projectId: "enna-698ff",
  storageBucket: "enna-698ff.firebasestorage.app",
  messagingSenderId: "734272506471",
  appId: "1:734272506471:web:82a8c206fc700b059762c2"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // console.log(
  //   '[firebase-messaging-sw.js] Received background message ',
  //   payload
  // );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
