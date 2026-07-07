import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";
import { requestForToken } from "../firebase";

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error(t.fillAllFields || "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            rememberMe: form.rememberMe,
          }),
          credentials: "include",
        },
      );
      const data = await res.json();

      if (data.status === "ok") {
        const userData = data.data;
        if (userData.role !== "partners") {
          toast.error(t.partnerOnly || "Access denied. Partner accounts only.");
          setLoading(false);
          return;
        }

        localStorage.setItem("partnerUser", JSON.stringify(userData));
        localStorage.setItem("partnerAccessToken", userData.accessToken);
        localStorage.setItem("partnerRefreshToken", userData.refreshToken);

        try {
          const fcmToken = await requestForToken();
          if (fcmToken) {
            console.log("[FCM] Saving token to backend...");
            await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/user/update-fcm-token`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userData.accessToken}`,
                },
                body: JSON.stringify({ fcmToken }),
              },
            );
          }
        } catch (fcmErr) {
          console.error("[FCM] Failed to update FCM token:", fcmErr);
        }

        toast.success(
          `${t.welcomeBack || "Welcome back"}, ${userData.company || userData.firstName}!`,
        );
        navigate("/", { replace: true });
      } else {
        toast.error(
          data.message ||
            t.loginFailed ||
            "Login failed. Check your credentials.",
        );
      }
    } catch (err) {
      toast.error(t.networkError || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center p-4 md:p-8">
      {/* Card */}
      <div className="w-full max-w-sm md:max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left Visual Section */}
        <div className="relative h-52 md:h-auto md:min-h-[500px] md:w-1/2 overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-90">
            <img
              src="/images/cat_hero.jpg"
              alt=""
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800";
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-br from-[#2a1a0a]/60 to-[#2a1a0a]/80" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <img
              src="/hestekalogo.png"
              alt="HESTEKA"
              className="h-20 md:h-28 object-contain drop-shadow-2xl hover:scale-105 duration-300 transition-all"
              onError={(e) => {
                e.target.src = "/images/Logo.png";
              }}
            />
            <span className="text-white text-xs tracking-widest font-black uppercase bg-orange-600 px-3 py-1 rounded-full shadow-lg">
              {t.partner || "Partner"}
            </span>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-7 py-8 md:p-12 md:w-1/2 flex flex-col justify-center">
          <h2
            className="text-2xl md:text-3xl font-black text-orange-600 text-center mb-6"
            style={{ fontFamily: "serif" }}
          >
            {t.loginTitle || "Partner Login"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#3a2a1a]">
                {t.emailLabel || "Email"}{" "}
                <span className="text-orange-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="partner-email"
                value={form.email}
                onChange={handleChange}
                placeholder={t.enterEmail || "Enter email"}
                className="w-full bg-orange-600 text-white placeholder:text-white/70 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-800 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#3a2a1a]">
                {t.passwordLabel || "Password"}{" "}
                <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="partner-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t.enterPassword || "Enter password"}
                  className="w-full bg-orange-600 text-white placeholder:text-white/70 rounded-full px-5 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-orange-800 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-between items-center -mt-1 px-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-[11px] text-orange-600 hover:underline font-bold"
              >
                {t.forgotPassword || "Forgot Password?"}
              </button>

              <Link
                to="/register"
                className="text-[11px] text-[#3a2a1a] hover:text-orange-600 hover:underline font-bold"
              >
                {t.signUpBtn || "Create Partner Account"}
              </Link>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 accent-orange-600 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="text-[11px] text-[#9a8a7a] cursor-pointer select-none"
              >
                {t.rememberMe}
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="partner-login-btn"
              disabled={loading}
              className="mt-2 w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.signingIn}
                </div>
              ) : (
                <>
                  <span>{t.signInBtn || "Sign In"}</span>
                  <ArrowRight className="w-4 h-4 absolute right-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[10px] text-[#9a8a7a] mt-6">
            🔒 {t.partnerOnly || "Partner access only"} · HESTEKA ©{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
