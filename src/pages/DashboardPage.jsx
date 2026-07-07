import React, { useState, useEffect, useCallback } from "react";
import { useLang } from "../context/LanguageContext";
import { socket } from "../context/SocketContect";
import api from "../utils/api";
import StatCard from "../components/dashboard/StatCard";
import MapCard from "../components/dashboard/MapCard";
import { MapPin, Target, Map as MapIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getPartnerName } from "../utils/cloudinary";

// Defined outside component so it's never re-created on re-render
const getCachedProfile = () => {
  try {
    return JSON.parse(localStorage.getItem("partnerUser")) || null;
  } catch {
    return null;
  }
};

export default function DashboardPage() {
  const { t } = useLang();

  const [profile, setProfile] = useState(getCachedProfile);
  const [ads, setAds] = useState([]);
  const [missions, setMissions] = useState([]);
  const [totalParticipantsCount, setTotalParticipantsCount] = useState(0);
  // Use a stable initial value — never re-triggers skeleton on re-navigation
  const [loading, setLoading] = useState(() => !getCachedProfile());

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch profile, ads, and missions all in parallel — no sequential awaits
      const [profileRes, adsRes, missionsRes] = await Promise.all([
        api.get("/user/get-my-profile"),
        api.get("/partner-ads/get-my-partner-ads"),
        api.get("/local-missions/get-my-local-missions"),
      ]);

      if (profileRes.data.status === "ok") {
        const freshProfile = profileRes.data.data;
        setProfile(freshProfile);
        localStorage.setItem("partnerUser", JSON.stringify(freshProfile));
      }

      if (adsRes.data.status === "ok") {
        setAds(adsRes.data.data || []);
      }

      if (missionsRes.data.status === "ok") {
        const missionsList = missionsRes.data.data || [];
        setMissions(missionsList);

        // Derive participant count directly from mission fields to avoid N+1 API calls
        const total = missionsList.reduce((sum, m) => {
          if (typeof m.participantsCount === "number")
            return sum + m.participantsCount;
          if (Array.isArray(m.participants)) return sum + m.participants.length;
          return sum;
        }, 0);
        setTotalParticipantsCount(total);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // console.log("Dashboard Profile Data:", profile);

    socket.on("notification:new", fetchDashboardData);
    window.addEventListener("refetch-stats", fetchDashboardData);

    return () => {
      socket.off("notification:new", fetchDashboardData);
      window.removeEventListener("refetch-stats", fetchDashboardData);
    };
  }, [fetchDashboardData]);

  const activePoints = ads.filter((a) => a.status === "active").length;

  // Full skeleton — only shown when there is zero cached data (very first visit)
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-200 rounded-2xl" />
          <div className="h-28 bg-gray-200 rounded-2xl" />
          <div className="h-28 bg-gray-200 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[420px] bg-gray-200 rounded-2xl" />
          <div className="h-[420px] bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden h-[240px] md:h-[280px] border border-[#e8ddd0] shadow-md flex items-end p-4 md:p-6 transition-all hover:shadow-lg group">
        <div className="absolute inset-0 z-0 bg-[#3a2a1a]">
          <img
            src={
              profile?.partnerImage?.secure_url ||
              "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200"
            }
            alt="Banner"
            className="w-full h-full object-cover opacity-95 group-hover:scale-105 duration-700 transition-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between w-full gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-white/80 shadow-xl shrink-0 overflow-hidden flex items-center justify-center transition-all hover:scale-105 duration-300">
              {profile?.profileImage?.secure_url || profile?.logo?.secure_url ? (
                <img
                  src={profile.profileImage?.secure_url || profile.logo?.secure_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-orange-600">
                  {getPartnerName(profile)?.charAt(0) || "P"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                {getPartnerName(profile) || t.myOrganization || "My Organization"}
              </h2>
              <p className="text-sm md:text-base text-white/90 flex items-center gap-1.5 mt-1 drop-shadow-md font-medium">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="line-clamp-1">
                  {profile?.address
                    ? `${profile.address}, ${profile.city}`
                    : t.addressNotConfigured || "Address not configured"}
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 self-start md:self-auto shadow-lg hover:shadow-orange-600/30 hover:-translate-y-0.5 duration-200"
          >
            {t.editProfile || "Edit Profile"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label={t.collectionPointsTitle || "Collection Points"}
          value={{ text: ads.length }}
          sub={`${activePoints} ${t.activePointsLabel || "active collection points"}`}
          subType={activePoints > 0 ? "up" : "down"}
        />
        <StatCard
          label={t.missionsTitle || "Local Missions"}
          value={{ text: missions.length }}
          sub={`${missions.filter((m) => new Date(m.endDate) > new Date()).length} ${t.inProgress || "in progress"}`}
          subType="wait"
        />
        <StatCard
          label={t.totalParticipants || "Total Participants"}
          value={{ text: totalParticipantsCount }}
          sub={t.registeredForMissions || "registered for your missions"}
          subType="up"
        />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Card */}
        <div className="lg:col-span-2">
          <MapCard data={ads} />
        </div>

        {/* Recent Missions Widget */}
        <div className="bg-white rounded-2xl border border-[#e8ddd0] p-5 shadow-sm flex flex-col justify-between h-[420px]">
          <div>
            <div className="flex items-center justify-between border-b border-[#f0e8d8] pb-3 mb-4">
              <h3 className="font-bold text-[#3a2a1a] text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                {t.myMissions || "My Missions"}
              </h3>
              <Link
                to="/missions"
                className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-0.5"
              >
                {t.viewAll || "View All"}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[280px] pr-1">
              {missions.length > 0 ? (
                missions.slice(0, 4).map((m) => (
                  <div
                    key={m._id}
                    className="flex gap-3 p-2 hover:bg-[#fcfaf7] rounded-xl transition-all border border-transparent hover:border-[#f0e8d8]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#f5f0e8] overflow-hidden shrink-0">
                      {m.image?.secure_url ? (
                        <img
                          src={m.image.secure_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-600">
                          <MapIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#3a2a1a] truncate">
                        {m.title}
                      </h4>
                      <p className="text-[10px] text-[#9a8a7a] truncate mt-0.5">
                        {m.pointsRequired || 0} {t.ptsRequired || "pts required"} ·{" "}
                        {m.category || t.mission || "Mission"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#9a8a7a]">
                  {t.noMissionsYet || "No missions created yet."}
                </div>
              )}
            </div>
          </div>

          <Link
            to="/missions"
            state={{ openCreate: true }}
            className="w-full py-2.5 bg-[#f5f0e8] hover:bg-[#e8ddd0] text-[#3a2a1a] font-bold text-xs rounded-xl text-center transition-all mt-4"
          >
            {t.createNewMission || "Create New Mission"}
          </Link>
        </div>
      </div>
    </div>
  );
}
