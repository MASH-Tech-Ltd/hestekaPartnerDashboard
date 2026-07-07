import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    // console.log("[FCM] Current notification permission:", Notification.permission);
    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
      // console.log("[FCM] Permission after prompt:", permission);
    }

    if (permission !== "granted") {
      console.warn("[FCM] Notification permission is:", permission, "— cannot get token.");
      return null;
    }

    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of existingRegistrations) {
      if (reg.active?.scriptURL?.includes("firebase-messaging-sw")) {
        // console.log("[FCM] Unregistering stale SW:", reg.active.scriptURL);
        await reg.unregister();
      }
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    // console.log("[FCM] Service Worker registered:", registration.scope);

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      // console.log("[FCM] Token acquired successfully:", currentToken);
      return currentToken;
    }

    console.warn("[FCM] getToken returned empty — check VAPID key in .env");
    return null;
  } catch (err) {
    console.error("[FCM] Error getting token:", err.message, err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
