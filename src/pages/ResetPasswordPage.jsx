import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { t } = useLang();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Please fill in both fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    
    // Password validation based on schema: min 6, max 16, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be 6-16 characters long, contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        toast.success(data.message || "Password reset successful.");
        setSuccess(true);
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center p-4 md:p-8">
      {/* Responsive Card */}
      <div className="w-full max-w-sm md:max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

        {/* Hero / Logo Section */}
        <div className="relative h-52 md:h-auto md:min-h-[500px] md:w-1/2 overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-90">
            <img src="/images/cat_hero.jpg" alt="" className="w-full h-full object-cover object-center" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800"; }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-br from-[#2a1a0a]/60 to-[#2a1a0a]/80" />
          <img
            src="/images/Logo.png"
            alt="HESTEKA"
            className="relative z-10 h-24 md:h-32 object-contain drop-shadow-2xl transition-transform hover:scale-105 duration-300"
            onError={(e) => { e.target.src="https://raw.githubusercontent.com/Hesteka/assets/main/Logo.png"; }}
          />
        </div>

        {/* Form Section */}
        <div className="px-7 py-8 md:p-12 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-orange-600 text-center mb-6" style={{ fontFamily: "serif" }}>
            {success ? "Success" : "Reset Password"}
          </h2>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-[#3a2a1a] font-medium text-center">Your password has been successfully reset.</p>
              <p className="text-sm text-[#9a8a7a] text-center">Redirecting you to login...</p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="mt-6 w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all shadow-md active:scale-[0.98]"
              >
                Go to Login Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <p className="text-xs text-[#9a8a7a] text-center mb-2">
                Please enter your new password below.
              </p>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#3a2a1a]">
                  New Password <span className="text-orange-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-orange-600 text-white placeholder:text-white/70 rounded-full px-5 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-orange-800 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#3a2a1a]">
                  Confirm New Password <span className="text-orange-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-orange-600 text-white placeholder:text-white/70 rounded-full px-5 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-orange-800 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 absolute right-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-[10px] text-[#9a8a7a] mt-6">
            🔒 {t.partnerOnly || "Partner access only"} · HESTEKA © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
