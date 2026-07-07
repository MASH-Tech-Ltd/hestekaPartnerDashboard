import React, { createContext, useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")
  : "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const SocketContext = createContext(socket);

export function SocketProvider({ children }) {
  useEffect(() => {
    // Auto-connect if partnerAccessToken exists on page load
    const token = localStorage.getItem("partnerAccessToken");
    if (token) {
      socket.auth = { token };
      socket.connect();
    }

    const handleUpdate = () => {
      const updatedToken = localStorage.getItem("partnerAccessToken");
      if (updatedToken) {
        socket.auth = { token: updatedToken };
        if (!socket.connected) {
          socket.connect();
        }
      } else {
        socket.disconnect();
      }
    };

    window.addEventListener("partner-login", handleUpdate);
    window.addEventListener("partner-logout", handleUpdate);

    return () => {
      window.removeEventListener("partner-login", handleUpdate);
      window.removeEventListener("partner-logout", handleUpdate);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
