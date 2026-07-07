import { useEffect } from "react";
import api from "../../utils/api";
import { requestForToken, onMessageListener } from "../../firebase";

const FCMListener = () => {
  useEffect(() => {
    let isMounted = true;

    const fetchToken = async () => {
      try {
        const token = await requestForToken();
        if (token && isMounted) {
          await api.patch("/user/update-fcm-token", { fcmToken: token });
          // console.log("[FCM] Token saved to server successfully.");
        }
      } catch (error) {
        console.error("[FCM] Error saving token to server:", error);
      }
    };

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const setupListener = async () => {
      try {
        await onMessageListener();
        window.dispatchEvent(new Event("refetch-notifications"));
        window.dispatchEvent(new Event("refetch-stats"));
        setupListener();
      } catch (_) {
        // silent
      }
    };

    setupListener();
  }, []);

  return null;
};

export default FCMListener;
