import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t.enterEmail || "Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        toast.success(data.message || "OTP sent to your email.");
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        toast.success(data.message || "OTP verified.");
        const token = data.data.token;
        navigate(`/reset-password/${token}`, { replace: true });
      } else {
        toast.error(data.message || "Invalid OTP.");
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
            {step === 1 ? t.forgotPassword || "Forgot Password" : "Enter OTP"}
          </h2>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <p className="text-xs text-[#9a8a7a] text-center mb-2">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#3a2a1a]">
                  {t.emailLabel || "Email"} <span className="text-orange-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.enterEmail || "Enter your email"}
                  className="w-full bg-orange-600 text-white placeholder:text-white/70 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-800 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4 absolute right-5" />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 text-[11px] text-[#9a8a7a] hover:text-orange-600 underline text-center w-full"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <p className="text-xs text-[#9a8a7a] text-center mb-2">
                An OTP has been sent to <span className="font-bold text-orange-600">{email}</span>.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#3a2a1a]">
                  OTP <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-orange-600 text-white placeholder:text-white/70 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-800 transition-all text-center tracking-widest font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="mt-4 w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <ArrowRight className="w-4 h-4 absolute right-5" />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-2 text-[11px] text-[#9a8a7a] hover:text-orange-600 underline text-center w-full"
              >
                Change Email
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
