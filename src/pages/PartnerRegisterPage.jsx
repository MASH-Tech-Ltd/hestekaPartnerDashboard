import React, { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Upload, Globe, MapPin, Sparkles, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";

export default function PartnerRegisterPage() {
  const navigate = useNavigate();
  const { t } = useLang();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    // Step 1: Rep details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Step 2: Company details
    company: "",
    website: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    latitude: "",
    longitude: "",
    description: "",

    // Step 3: Social handles
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "logo") {
          setLogoFile(file);
          setLogoPreview(reader.result);
        } else {
          setBannerFile(file);
          setBannerPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
        toast.error(t.fillAllFields || "Please fill in all fields.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      // Simple Zod password regex check in frontend to guide users:
      // min 6, 1 uppercase, 1 lowercase, 1 number, 1 special character
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/;
      if (!pwRegex.test(form.password)) {
        toast.error("Password must be 6-16 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.");
        return;
      }
    } else if (step === 2) {
      if (!form.company || !form.address || !form.city || !form.postalCode) {
        toast.error(t.fillAllFields || "Please fill in all fields.");
        return;
      }
      if (!/^\d{5}$/.test(form.postalCode)) {
        toast.error("Postal code must be a valid 5-digit number.");
        return;
      }
      if ((form.latitude !== "" && form.longitude === "") || (form.latitude === "" && form.longitude !== "")) {
        toast.error("Latitude and longitude must be provided together, or both empty.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    // Append standard user fields
    Object.keys(form).forEach((key) => {
      if (key !== "confirmPassword" && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    if (logoFile) {
      formData.append("logo", logoFile);
    }
    if (bannerFile) {
      formData.append("partnerImage", bannerFile);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register-partner`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.status === "ok") {
        toast.success("Registration successful! Your account is pending validation by our admin team.");
        navigate("/login");
      } else {
        toast.error(data.message || "Registration failed.");
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
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Side Panel */}
        <div className="relative h-40 md:h-auto md:min-h-[600px] md:w-1/3 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute inset-0 opacity-95">
            <img src="/images/cat_hero.jpg" alt="" className="w-full h-full object-cover object-center" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800"; }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-br from-[#2a1a0a]/70 to-[#2a1a0a]/90" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <img
              src="/images/Logo.png"
              alt="HESTEKA"
              className="h-16 md:h-24 object-contain drop-shadow-2xl hover:scale-105 duration-300 transition-all"
              onError={(e) => { e.target.src="https://raw.githubusercontent.com/Hesteka/assets/main/Logo.png"; }}
            />
            <span className="text-white text-xs font-black uppercase tracking-widest bg-orange-600 px-3 py-1 rounded-full shadow-lg">
              {t.partner || "PARTNER"}
            </span>

            <p className="text-white/80 text-[11px] max-w-xs hidden md:block mt-2">
              Join Hesteka network of partners to offer local collection points, create missions, and help protect animals.
            </p>
          </div>

          {/* Stepper indicators for desktop */}
          <div className="relative z-10 hidden md:flex flex-col gap-4 mt-8 w-full px-6">
            {[
              { num: 1, label: "Representative Info" },
              { num: 2, label: "Organization Info" },
              { num: 3, label: "Media & Socials" }
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                  step === s.num
                    ? "bg-orange-600 text-white border-orange-600 scale-110 shadow"
                    : step > s.num
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white/10 text-white/50 border-white/20"
                }`}>
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className={`text-xs font-medium ${step === s.num ? "text-white font-bold" : "text-white/60"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="p-6 md:p-10 md:w-2/3 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black text-orange-600 mb-2" style={{ fontFamily: "serif" }}>
              {t.registerTitle || "Partner Registration"}
            </h2>
            <p className="text-[#9a8a7a] text-[11px] mb-6">
              Step {step} of 3 — Enter details below
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
              {/* STEP 1: Representative / Credentials */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">First Name <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Jane"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">Last Name <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.emailLabel} <span className="text-orange-600">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane.doe@company.com"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">Phone Number <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.passwordLabel} <span className="text-orange-600">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a7a] hover:text-orange-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">Confirm Password <span className="text-orange-600">*</span></label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a7a] hover:text-orange-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Company Details */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">Company / Association Name <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Hesteka Rescue"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.websiteLabel || "Website URL"}</label>
                    <input
                      type="url"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://company.com"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.address} <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="12 rue de la Paix"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.cityLabel || "City"} <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Paris"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.postalCode} <span className="text-orange-600">*</span></label>
                    <input
                      type="text"
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      placeholder="75001"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">Latitude (Optional)</label>
                    <input
                      type="text"
                      step="any"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="48.8566"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                    />
                  </div>

                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">Longitude (Optional)</label>
                    <input
                      type="text"
                      step="any"
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="2.3522"
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#3a2a1a]">{t.bioIntro}</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Briefly describe your activities..."
                      className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Media & Socials */}
              {step === 3 && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Logo upload */}
                    <div className="col-span-1 flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#3a2a1a]">Company Logo</span>
                      <div className="relative group border border-dashed border-[#e8ddd0] hover:border-orange-600 rounded-2xl h-28 flex flex-col items-center justify-center bg-[#fcfaf7] cursor-pointer overflow-hidden transition-all">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center opacity-65 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-6 h-6 text-[#9a8a7a]" />
                            <span className="text-[9px] font-bold mt-1 text-[#9a8a7a]">Upload Logo</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "logo")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Banner upload */}
                    <div className="col-span-1 flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#3a2a1a]">Banner Photo</span>
                      <div className="relative group border border-dashed border-[#e8ddd0] hover:border-orange-600 rounded-2xl h-28 flex flex-col items-center justify-center bg-[#fcfaf7] cursor-pointer overflow-hidden transition-all">
                        {bannerPreview ? (
                          <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center opacity-65 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-6 h-6 text-[#9a8a7a]" />
                            <span className="text-[9px] font-bold mt-1 text-[#9a8a7a]">Upload Banner</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "banner")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Handles */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#9a8a7a]">Facebook Username / Link</span>
                      <input
                        type="text"
                        name="facebook"
                        value={form.facebook}
                        onChange={handleChange}
                        placeholder="e.g. company"
                        className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#9a8a7a]">Instagram Username / Link</span>
                      <input
                        type="text"
                        name="instagram"
                        value={form.instagram}
                        onChange={handleChange}
                        placeholder="e.g. company"
                        className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#9a8a7a]">Twitter Handle</span>
                      <input
                        type="text"
                        name="twitter"
                        value={form.twitter}
                        onChange={handleChange}
                        placeholder="e.g. company"
                        className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#9a8a7a]">LinkedIn Link</span>
                      <input
                        type="text"
                        name="linkedin"
                        value={form.linkedin}
                        onChange={handleChange}
                        placeholder="e.g. company"
                        className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#f0e8d8]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 text-xs font-bold text-[#9a8a7a] hover:text-[#3a2a1a] border border-[#e8ddd0] rounded-full hover:bg-[#fcfaf7] flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 text-xs font-bold text-[#9a8a7a] hover:text-[#3a2a1a] border border-[#e8ddd0] rounded-full hover:bg-[#fcfaf7] flex items-center gap-2 transition-all cursor-pointer"
              >
                Back to Login
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-full hover:bg-orange-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-green-600 text-white text-xs font-bold rounded-full hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
