import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context Providers
import { LanguageProvider } from "./context/LanguageContext";
import { ApiCacheProvider } from "./context/ApiCacheContext";
import { SocketProvider } from "./context/SocketContect";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Common
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import PartnerLoginPage from "./pages/PartnerLoginPage";
import PartnerRegisterPage from "./pages/PartnerRegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import DashboardPage from "./pages/DashboardPage";
import CollectionPointsPage from "./pages/CollectionPointsPage";
import MissionsPage from "./pages/MissionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SupportProofsPage from "./pages/SupportProofsPage";
import SupportMessagesPage from "./pages/SupportMessagesPage";
import FAQPage from "./pages/FAQPage";
export default function App() {
  return (
    <LanguageProvider>
      <ApiCacheProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PartnerLoginPage />} />
              <Route path="/register" element={<PartnerRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected Partner Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["partners"]} redirectPath="/login" />
                }
              >
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/collection-points" element={<CollectionPointsPage />} />
                  <Route path="/support-proofs" element={<SupportProofsPage />} />
                  <Route path="/missions" element={<MissionsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/support-messages" element={<SupportMessagesPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </SocketProvider>
      </ApiCacheProvider>
    </LanguageProvider>
  );
}
