import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

/**
 * ProtectedRoute — wraps partner dashboard routes.
 * - If no token/user → redirect to /login
 * - If user role is not "partners" → redirect to /login
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem("partnerAccessToken");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("partnerUser"));
    } catch {
      return null;
    }
  })();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "partners") {
    // Clear stale non-partner session
    localStorage.removeItem("partnerAccessToken");
    localStorage.removeItem("partnerRefreshToken");
    localStorage.removeItem("partnerUser");
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
