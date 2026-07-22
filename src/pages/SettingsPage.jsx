import React, { useState, useEffect } from "react";
import { useLang } from "../context/LanguageContext";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  User,
  Shield,
  Key,
  AlertTriangle,
  Building,
  Globe,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { getOptimizedCloudinaryUrl, getPartnerName } from "../utils/cloudinary";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const libraries = ["places"];

// Helper to generate a custom map pin with a partner image inside
const generatePinIcon = (imgUrl) => {
  return new Promise((resolve) => {
    if (!window.google) return resolve(null);
    const canvas = document.createElement("canvas");
    canvas.width = 60;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");

    // Draw pin shape
    ctx.fillStyle = "#dc2626"; // red-600
    ctx.beginPath();
    ctx.arc(30, 30, 30, Math.PI, 0, false);
    ctx.lineTo(60, 30);
    ctx.bezierCurveTo(60, 45, 30, 80, 30, 80);
    ctx.bezierCurveTo(30, 80, 0, 45, 0, 30);
    ctx.fill();

    // Draw white circle inside
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(30, 30, 24, 0, Math.PI * 2);
    ctx.fill();

    if (!imgUrl) {
      return resolve({
        url: canvas.toDataURL(),
        scaledSize: new window.google.maps.Size(40, 53),
        anchor: new window.google.maps.Point(20, 53),
      });
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(30, 30, 22, 0, Math.PI * 2);
      ctx.clip();

      const scale = Math.max(44 / img.width, 44 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = 30 - w / 2;
      const y = 30 - h / 2;

      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      resolve({
        url: canvas.toDataURL(),
        scaledSize: new window.google.maps.Size(40, 53),
        anchor: new window.google.maps.Point(20, 53),
      });
    };
    img.onerror = () => {
      resolve({
        url: canvas.toDataURL(),
        scaledSize: new window.google.maps.Size(40, 53),
        anchor: new window.google.maps.Point(20, 53),
      });
    };
    img.src = imgUrl;
  });
};

export default function SettingsPage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  // Profile fields state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    website: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    selfIntroduction: "",
    latitude: "",
    longitude: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    partnerType: "",
    region: "",
    department: "",
  });

  const [locations, setLocations] = useState({ departments: [], regions: [] });

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile & Cover image files and previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [partnerImageFile, setPartnerImageFile] = useState(null);
  const [partnerImagePreview, setPartnerImagePreview] = useState("");
  const [mapType, setMapType] = useState("roadmap");
  const [markerIcon, setMarkerIcon] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/get-my-profile");
        if (res.data.status === "ok" && res.data.data) {
          const d = res.data.data;
          setProfile({
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            phone: d.phone || "",
            company: d.company || "",
            website: d.website || "",
            address: d.address || "",
            city: d.city || "",
            postalCode: d.postalCode || "",
            country: d.country || "France",
            selfIntroduction: d.selfIntroduction || "",
            latitude:
              d.location?.coordinates?.[1] !== undefined
                ? String(d.location.coordinates[1])
                : "",
            longitude:
              d.location?.coordinates?.[0] !== undefined
                ? String(d.location.coordinates[0])
                : "",
            facebook: d.facebook || "",
            instagram: d.instagram || "",
            twitter: d.twitter || "",
            linkedin: d.linkedin || "",
            partnerType: d.partnerType || "",
            region: d.region || "",
            department: d.department || "",
          });
          if (d.profileImage?.secure_url || d.logo?.secure_url)
            setLogoPreview(d.profileImage?.secure_url || d.logo?.secure_url);
          if (d.partnerImage?.secure_url)
            setPartnerImagePreview(d.partnerImage.secure_url);
        }
      } catch (err) {
        console.error("Failed to load settings profile", err);
      }
    };
    fetchProfile();

    api
      .get("/contacts/locations")
      .then((res) => {
        if (res.data?.data) {
          setLocations(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to load locations", err));
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handlePartnerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPartnerImageFile(file);
      setPartnerImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("phone", profile.phone || "");
      formData.append("company", profile.company);
      formData.append("website", profile.website || "");
      formData.append("address", profile.address);
      formData.append("city", profile.city);
      formData.append("postalCode", profile.postalCode);
      formData.append("country", profile.country);
      formData.append(
        "selfIntroduction",
        profile.selfIntroduction.slice(0, 100),
      );
      formData.append("facebook", profile.facebook || "");
      formData.append("instagram", profile.instagram || "");
      formData.append("twitter", profile.twitter || "");
      formData.append("linkedin", profile.linkedin || "");
      formData.append("region", profile.region || "");
      formData.append("department", profile.department || "");

      if (profile.latitude !== "" && profile.longitude !== "") {
        formData.append("latitude", Number(profile.latitude));
        formData.append("longitude", Number(profile.longitude));
        formData.append("locationAddress", profile.address);
      }

      if (logoFile) {
        formData.append("logo", logoFile);
      }
      if (partnerImageFile) {
        formData.append("partnerImage", partnerImageFile);
      }

      const res = await api.patch("/user/update-user", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200 || res.data?.status === "ok") {
        let freshData = res.data.data;
        try {
          const profileRes = await api.get("/user/get-my-profile");
          if (profileRes.data?.status === "ok" && profileRes.data?.data) {
            freshData = profileRes.data.data;
          }
        } catch (fetchErr) {
          console.error("Failed to fetch fresh profile after update", fetchErr);
        }

        toast.success(
          t.profileUpdated || "Profile details updated successfully.",
        );
        // Sync header/sidebar profile
        const storedUser =
          JSON.parse(localStorage.getItem("partnerUser")) || {};
        const mergedUser = { ...storedUser, ...freshData };
        localStorage.setItem("partnerUser", JSON.stringify(mergedUser));
        window.dispatchEvent(new Event("user-profile-updated"));

        if (freshData?.profileImage?.secure_url || freshData?.logo?.secure_url)
          setLogoPreview(
            freshData.profileImage?.secure_url || freshData.logo?.secure_url,
          );
        if (freshData?.partnerImage?.secure_url)
          setPartnerImagePreview(freshData.partnerImage.secure_url);
      } else {
        toast.error(
          res.data?.message ||
            t.profileUpdateFailed ||
            "Failed to update profile.",
        );
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.data && Array.isArray(errorData.data)) {
        errorData.data.forEach((errorItem) => {
          toast.error(errorItem.message);
        });
      } else {
        toast.error(
          errorData?.message ||
            t.profileUpdateError ||
            "Error updating profile details.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t.passwordsNotMatch || "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch("/user/update-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (res.data.status === "ok") {
        toast.success(
          t.passwordChangedSuccess ||
            "Password changed successfully. Please log in again.",
        );
        setTimeout(() => {
          localStorage.removeItem("partnerUser");
          localStorage.removeItem("partnerAccessToken");
          localStorage.removeItem("partnerRefreshToken");
          window.location.href = "/login";
        }, 1500);
      } else {
        toast.error(
          res.data.message ||
            t.passwordChangeFailed ||
            "Failed to change password.",
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t.passwordChangeError ||
          "Error updating password.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Map settings and helper parameters
  const hasCoordinates =
    profile.latitude !== "" &&
    profile.longitude !== "" &&
    !isNaN(profile.latitude) &&
    !isNaN(profile.longitude);

  const mapCenter = hasCoordinates
    ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
    : { lat: 46.2276, lng: 2.2137 }; // Default: France center

  const markerPosition = hasCoordinates
    ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
    : null;

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const addressComponents = results[0].address_components;
        let streetAddress = results[0].formatted_address;
        let city = "";
        let postalCode = "";

        for (const component of addressComponents) {
          const types = component.types;
          if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("postal_code")) {
            postalCode = component.long_name;
          }
        }

        setProfile((prev) => ({
          ...prev,
          address: streetAddress || prev.address,
          city: city || prev.city,
          postalCode: postalCode || prev.postalCode,
        }));
      }
    });
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setProfile((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    reverseGeocode(lat, lng);
  };

  const handleMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setProfile((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (!isLoaded) return;
    const imgUrl =
      logoPreview ||
      profile?.profileImage?.secure_url ||
      profile?.logo?.secure_url;
    generatePinIcon(imgUrl).then((icon) => {
      if (icon) setMarkerIcon(icon);
    });
  }, [
    isLoaded,
    logoPreview,
    profile?.profileImage?.secure_url,
    profile?.logo?.secure_url,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Settings Navigation Tabs */}
      <div className="flex bg-[#f5f0e8] p-1.5 rounded-2xl border border-[#e8ddd0] w-fit self-start gap-1">
        {[
          {
            key: "profile",
            label: t.profileDetailsTab || "Profile details",
            icon: User,
          },
          {
            key: "security",
            label: t.changePasswordTab || "Change Password",
            icon: Key,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-orange-600 text-white shadow-sm"
                : "text-[#9a8a7a] hover:text-[#3a2a1a]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-[#e8ddd0] p-6 shadow-sm max-w-4xl">
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
            <h3 className="text-sm font-bold text-[#3a2a1a] flex items-center gap-2 border-b border-[#f0e8d8] pb-3">
              <User className="w-5 h-5 text-orange-600" />
              {t.generalProfile || "General Organization Profile"}
            </h3>

            {/* Profile & Cover Images */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-[#e8ddd0] bg-[#fcfaf7]">
              {/* Cover Image (partnerImage) */}
              <div className="absolute inset-0 w-full h-full bg-[#f0e8d8] overflow-hidden group">
                {partnerImagePreview ? (
                  <img
                    src={getOptimizedCloudinaryUrl(
                      partnerImagePreview,
                      800,
                      300,
                    )}
                    alt="Cover Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#9a8a7a] text-xs font-semibold">
                    {t.noCoverImage || "No Cover Image Configured"}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-all duration-300 cursor-pointer">
                  <Upload className="w-4 h-4" />{" "}
                  {t.changeCover || "Change Cover Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePartnerImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Profile Image (logo) */}
              <div className="absolute bottom-4 left-6 w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center group z-10">
                {logoPreview ? (
                  <img
                    src={getOptimizedCloudinaryUrl(logoPreview, 300, 300)}
                    alt="Profile Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-orange-600">
                    {getPartnerName(profile)?.charAt(0) || "P"}
                  </span>
                )}
                <label className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold text-center p-1 transition-all duration-300 cursor-pointer">
                  <Upload className="w-3 h-3 mb-1 block mx-auto" />{" "}
                  {t.changeLogo || "Change Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Representative details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.firstName || "Representative First Name"}
                </span>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.lastName || "Representative Last Name"}
                </span>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.phone || "Phone Number"}
                </span>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Company Details */}
            <h3 className="text-sm font-bold text-[#3a2a1a] flex items-center gap-2 border-b border-[#f0e8d8] pb-2 mt-2">
              <Building className="w-5 h-5 text-orange-600" />
              {t.companyDetails || "Company Details"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.company || "Company / Organization Name"}
                </span>
                <input
                  type="text"
                  name="company"
                  value={profile.company}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.websiteLabel || "Website URL"}
                </span>
                <input
                  type="url"
                  name="website"
                  value={profile.website}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  placeholder="https://company.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  Facebook URL
                </span>
                <input
                  type="url"
                  name="facebook"
                  value={profile.facebook}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  Instagram URL
                </span>
                <input
                  type="url"
                  name="instagram"
                  value={profile.instagram}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  Twitter URL
                </span>
                <input
                  type="url"
                  name="twitter"
                  value={profile.twitter}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  LinkedIn URL
                </span>
                <input
                  type="url"
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.regionLabel || "Region"}
                </span>
                <select
                  name="region"
                  value={profile.region}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                >
                  <option value="">{t.selectRegion || "Select Region"}</option>
                  {locations.regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.departmentLabel || "Department"}
                </span>
                <select
                  name="department"
                  value={profile.department}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                >
                  <option value="">
                    {t.selectDepartment || "Select Department"}
                  </option>
                  {locations.departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.address || "Address"}
                </span>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.cityLabel || "City"}
                </span>
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.postalCode || "Postal Code"}
                </span>
                <input
                  type="text"
                  name="postalCode"
                  value={profile.postalCode}
                  maxLength={5}
                  minLength={5}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 5);
                    handleProfileChange({
                      target: { name: "postalCode", value: val },
                    });
                  }}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.latitude || "Latitude"}
                </span>
                <input
                  type="text"
                  step="any"
                  name="latitude"
                  value={profile.latitude}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.longitude || "Longitude"}
                </span>
                <input
                  type="text"
                  step="any"
                  name="longitude"
                  value={profile.longitude}
                  onChange={handleProfileChange}
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                />
              </div>

              {/* Map Coordinates Picker */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-[11px] font-bold text-[#3a2a1a] flex items-center justify-between">
                  <span>{t.locationMapPicker || "Location Map Picker"}</span>
                  <span className="text-[10px] text-[#9a8a7a] font-normal">
                    {t.mapInstruction ||
                      "Click on the map or drag the marker to select coordinates"}
                  </span>
                </span>

                <div className="rounded-xl overflow-hidden border border-[#e8ddd0] h-[300px] relative z-0">
                  {loadError ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#fcfaf7] text-red-500 text-xs font-semibold">
                      Error loading Google Maps.
                    </div>
                  ) : !isLoaded ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#fcfaf7] text-[#9a8a7a] text-xs font-semibold animate-pulse">
                      Loading map...
                    </div>
                  ) : (
                    <>
                      {/* Custom Map Type Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setMapType((prev) =>
                            prev === "roadmap" ? "hybrid" : "roadmap",
                          );
                        }}
                        className="absolute bottom-6 left-2 z-[10] w-9 h-9 bg-white rounded-lg shadow-md border border-[#e8ddd0] flex flex-col items-center justify-center overflow-hidden hover:border-[#8B6914] transition-all group"
                        title={
                          mapType === "roadmap"
                            ? "Switch to Satellite"
                            : "Switch to Map"
                        }
                      >
                        {mapType === "roadmap" ? (
                          <div className="w-full h-full bg-[#3a2a1a] flex flex-col items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white mb-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            <span className="text-[7px] font-bold text-white leading-none">
                              SAT
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-[#f5f0e8] flex flex-col items-center justify-center">
                            <svg
                              className="w-4 h-4 text-[#8B6914] mb-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                              ></path>
                            </svg>
                            <span className="text-[7px] font-bold text-[#8B6914] leading-none">
                              MAP
                            </span>
                          </div>
                        )}
                      </button>

                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={hasCoordinates ? 14 : 5}
                        mapTypeId={mapType}
                        onClick={handleMapClick}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                          zoomControlOptions: {
                            position:
                              window.google?.maps?.ControlPosition
                                ?.RIGHT_BOTTOM,
                          },
                          mapTypeControl: false,
                          streetViewControl: false,
                          fullscreenControl: false,
                          scrollwheel: true,
                          gestureHandling: "greedy",
                        }}
                      >
                        {markerPosition && (
                          <MarkerF
                            position={markerPosition}
                            draggable={true}
                            onDragEnd={handleMarkerDragEnd}
                            icon={markerIcon}
                          />
                        )}
                      </GoogleMap>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.aboutOrg || "About Organization (Description)"}
                </span>
                <textarea
                  name="selfIntroduction"
                  value={profile.selfIntroduction}
                  onChange={handleProfileChange}
                  rows="3"
                  className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium resize-none"
                  placeholder={
                    t.aboutOrgPlaceholder ||
                    "Describe your company (max 100 characters)"
                  }
                  maxLength="100"
                />
                <span className="text-[9px] text-[#9a8a7a] self-end">
                  {profile.selfIntroduction.length}/100
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl self-end transition-all flex items-center justify-center shadow"
            >
              {loading
                ? t.saving || "Saving..."
                : t.saveChanges || "Save Changes"}
            </button>
          </form>
        )}

        {activeTab === "security" && (
          <form
            onSubmit={handlePasswordSubmit}
            className="flex flex-col gap-6 max-w-md"
          >
            <h3 className="text-sm font-bold text-[#3a2a1a] flex items-center gap-2 border-b border-[#f0e8d8] pb-3">
              <Key className="w-5 h-5 text-orange-600" />
              {t.changePassword || "Change Password"}
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.currentPassword || "Current Password"}
                </span>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a7a] hover:text-orange-600 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.newPassword || "New Password"}
                </span>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a7a] hover:text-orange-600 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#3a2a1a]">
                  {t.confirmNewPassword || "Confirm New Password"}
                </span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#3a2a1a] outline-none focus:border-orange-600 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a7a] hover:text-orange-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl self-end transition-all flex items-center justify-center shadow"
            >
              {loading
                ? t.sendingLabel || "Updating..."
                : t.updatePassword || "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
