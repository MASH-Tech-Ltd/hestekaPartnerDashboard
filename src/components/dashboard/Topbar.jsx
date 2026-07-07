import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useApiCache } from "../../context/ApiCacheContext";
import { socket } from "../../context/SocketContect";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { Bell, Menu } from "lucide-react";

import { getOptimizedCloudinaryUrl, getPartnerName } from "../../utils/cloudinary";

const Topbar = React.memo(({ onToggleSidebar }) => {
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const { fetchWithCache } = useApiCache();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  // Per-route stats or count
  const [myMissionsCount, setMyMissionsCount] = useState(0);
  const [myPointsCount, setMyPointsCount] = useState(0);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("partnerUser"));
    } catch {
      return null;
    }
  });

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get("/notifications/get-my-notifications?limit=10");
      if (res.data.status === "ok") {
        setNotifications(res.data.data);
        setUnreadCount(res.data.meta.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch personal notifications", err);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      // Get count of local missions
      const missionsRes = await api.get("/local-missions/get-my-local-missions");
      if (missionsRes.data.status === "ok") {
        setMyMissionsCount(missionsRes.data.data?.length || 0);
      }
      
      // Get count of partner ads
      const pointsRes = await api.get("/partner-ads/get-my-partner-ads");
      if (pointsRes.data.status === "ok") {
        setMyPointsCount(pointsRes.data.data?.length || 0);
      }
    } catch (e) {
      console.error("Failed to fetch counts for Topbar", e);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    fetchCounts();
  }, [fetchNotifs, fetchCounts, location.pathname]);

  useEffect(() => {
    const handleNewNotif = () => {
      fetchNotifs();
    };

    socket.on("notification:new", handleNewNotif);
    window.addEventListener("refetch-notifications", handleNewNotif);
    
    return () => {
      socket.off("notification:new", handleNewNotif);
      window.removeEventListener("refetch-notifications", handleNewNotif);
    };
  }, [fetchNotifs]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedUser = JSON.parse(localStorage.getItem("partnerUser"));
        if (updatedUser) setUser(updatedUser);
      } catch (err) { }
    };
    window.addEventListener("user-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("user-profile-updated", handleProfileUpdate);
  }, []);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await api.patch(`/notifications/mark-as-read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.patch("/notifications/mark-as-read/all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const PAGE_TITLES = {
    "/": { title: t.overview, sub: `${myMissionsCount} ${t.myMissions || "missions"} · ${myPointsCount} ${t.myCollectionPoints || "collection points"}` },
    "/missions": { title: t.localMissions, sub: `${myMissionsCount} ${t.activeMissionsSub || "active local missions"}` },
    "/collection-points": { title: t.collectionPoints, sub: `${myPointsCount} ${t.pointsManagedSub || "collection points managed"}` },
    "/notifications": { title: t.notifications, sub: t.communityUpdatesSub || "Community updates & messages" },
    "/analytics": { title: t.analytics || "Analytics", sub: t.analyticsSub || "Track your ecosystem growth" },
    "/support-messages": { title: t.supportMessages || "Support Messages", sub: t.supportMessagesSub || "Contact our support team" },
    "/faq": { title: t.faq || "FAQ", sub: t.faqSub || "Frequently asked questions" },
    "/settings": { title: t.settings, sub: t.configureProfileSub || "Configure company logo, banner, and profile details" },
  };

  const page = PAGE_TITLES[location.pathname] || { title: t.overview || "Overview", sub: "HESTEKA Partner" };
  const initials = getPartnerName(user)?.charAt(0)?.toUpperCase() || "P";

  return (
    <header className="sticky top-0 z-[9997] bg-white border-b border-[#e8ddd0] px-4 md:px-6 h-[73px] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-[#3a2a1a] p-1.5 -ml-1 hover:bg-[#f5f0e8] rounded-lg transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#3a2a1a] truncate max-w-[180px] sm:max-w-none">{page.title}</h1>
          <p className="text-[10px] md:text-[11px] text-[#9a8a7a] mt-0.5 hidden sm:block">{page.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <div className="flex gap-1 bg-[#f5f0e8] rounded-lg p-1">
          {["fr", "en"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${lang === l
                ? "bg-[#8B6914] text-white"
                : "text-[#9a8a7a] hover:text-[#3a2a1a]"
                }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative text-[#3a2a1a] text-lg hover:opacity-80 transition-opacity p-1"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm border border-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Popup */}
          {showNotifs && (
            <div className="absolute top-10 right-0 w-80 bg-white border border-[#e8ddd0] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="bg-[#f5f0e8] px-4 py-3 border-b border-[#e8ddd0] flex justify-between items-center">
                <h3 className="font-bold text-[#3a2a1a] text-sm">{t.notifications}</h3>
                <div className="flex gap-3 items-center">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-bold text-[#8B6914] hover:underline cursor-pointer"
                    >
                      {t.markAllRead || "Mark all read"}
                    </button>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="text-[10px] font-bold text-[#8B6914] hover:underline"
                  >
                    {t.viewAll || "View all"}
                  </Link>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto flex flex-col">
                {notifications.filter(n => !n.isRead).length > 0 ? (
                  notifications.filter(n => !n.isRead).map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkAsRead(notif._id, notif.isRead)}
                      className={`p-4 border-b border-[#f5f0e8] hover:bg-[#fcfaf7] cursor-pointer transition-colors bg-orange-50/50`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-bold text-[#3a2a1a]">
                          {notif.title}
                        </h4>
                        <span className="w-2 h-2 bg-[#8B6914] rounded-full shrink-0 mt-1"></span>
                      </div>
                      <p className="text-[10px] text-[#9a8a7a] line-clamp-2 leading-relaxed">
                        {notif.description}
                      </p>
                      <span className="text-[9px] text-[#c8b898] mt-2 block">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-[#9a8a7a] text-xs">
                    {t.noNotifs || "No notifications"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <Link
          to="/settings"
          className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none hover:ring-2 hover:ring-orange-600 transition-all overflow-hidden"
          title={user ? `${getPartnerName(user)}` : "Partner"}
        >
          {user?.profileImage?.secure_url || user?.logo?.secure_url ? (
            <img src={getOptimizedCloudinaryUrl(user.profileImage?.secure_url || user.logo?.secure_url, 100, 100)} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
});

export default Topbar;
