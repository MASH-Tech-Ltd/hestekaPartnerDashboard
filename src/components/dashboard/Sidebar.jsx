import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import api from "../../utils/api";
import { socket } from "../../context/SocketContect";
import {
  LayoutDashboard,
  Map,
  MapPin,
  Bell,
  Settings,
  LogOut,
  X,
  BarChart,
  MessageSquare,
  HelpCircle,
  Package
} from "lucide-react";

import { getOptimizedCloudinaryUrl, getPartnerName } from "../../utils/cloudinary";

const Sidebar = React.memo(({ isOpen, setIsOpen }) => {
  const { t } = useLang();
  const location = useLocation();
  const [stats, setStats] = React.useState(null);
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("partnerUser")) || { company: "Partner", firstName: "", lastName: "" };
    } catch {
      return { company: "Partner", firstName: "", lastName: "" };
    }
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/get-my-profile");
        if (res.data.status === "ok" && res.data.data) {
          setUser(res.data.data);
          localStorage.setItem("partnerUser", JSON.stringify(res.data.data));
          window.dispatchEvent(new Event("user-profile-updated"));
        }
      } catch (err) {
        console.error("Failed to fetch partner profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("partnerUser");
    localStorage.removeItem("partnerAccessToken");
    localStorage.removeItem("partnerRefreshToken");
    window.location.href = "/login";
  };

  const fetchStats = React.useCallback(async () => {
    try {
      // Let's fetch partner stats from appropriate endpoints in future if any,
      // for now, we can fetch their notifications unread count or query local list
      const res = await api.get("/notifications/get-my-notifications?limit=1");
      if (res.data.status === "ok") {
        setStats({ unreadNotifs: res.data.meta?.unreadCount || 0 });
      }
    } catch (err) {
      console.error("Sidebar stats fetch failed", err);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();

    const handleRefetch = () => fetchStats();
    socket.on("notification:new", handleRefetch);
    window.addEventListener("refetch-stats", handleRefetch);

    const interval = setInterval(fetchStats, 60000);
    
    return () => {
      clearInterval(interval);
      socket.off("notification:new", handleRefetch);
      window.removeEventListener("refetch-stats", handleRefetch);
    };
  }, [fetchStats]);

  const navSections = (t, stats) => [
    {
      label: t.principal,
      items: [
        { icon: LayoutDashboard, key: "overview", path: "/", badge: null },
      ],
    },
    {
      label: t.myMissions || "My Missions",
      items: [
        { icon: Map, key: "localMissions", path: "/missions", badge: null },
        { icon: MapPin, key: "collectionPoints", path: "/collection-points", badge: null },
        { icon: Package, key: "supportProofs", path: "/support-proofs", badge: null, labelOverride: t.supportProofs || "Support Proofs" },
      ],
    },
    {
      label: t.settings || "Settings",
      items: [
        { icon: BarChart, key: "analytics", path: "/analytics", badge: null },
        { icon: Bell, key: "notifications", path: "/notifications", badge: stats?.unreadNotifs > 0 ? stats.unreadNotifs : null, badgeColor: "bg-red-600" },
        { icon: MessageSquare, key: "supportMessages", path: "/support-messages", badge: null },
        { icon: HelpCircle, key: "faq", path: "/faq", badge: null },
        { icon: Settings, key: "settings", path: "/settings", badge: null },
      ],
    },
  ];

  const sections = navSections(t, stats);

  return (
    <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#3a2a1a] flex flex-col overflow-y-auto overflow-x-hidden z-[9999] transform transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Logo */}
      <div className="bg-[#2a1a0a] px-3 h-[73px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src="/hestekalogo.png" alt="HESTEKA Logo" className="h-12 w-auto object-contain" onError={(e) => { e.target.style.display='none'; }} />
          <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            {t.partner || "PARTNER"}
          </span>
        </div>

        {/* Close Button for Mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-[#c8b898] hover:text-white p-1 transition-colors"
          aria-label="Close Sidebar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-b border-[#5a4a3a]">
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm mb-1.5 uppercase overflow-hidden">
          {user?.profileImage?.secure_url || user?.logo?.secure_url ? (
            <img src={getOptimizedCloudinaryUrl(user.profileImage?.secure_url || user.logo?.secure_url, 100, 100)} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            getPartnerName(user)?.charAt(0) || "P"
          )}
        </div>
        <p className="text-white text-[12px] font-semibold truncate">
          {getPartnerName(user)}
        </p>
        <p className="text-[#a09080] text-[10px] capitalize">
          {user.partnerType ? (t[user.partnerType.replace(/_([a-z])/g, g => g[1].toUpperCase()) + "Label"] || user.partnerType.replace('_', ' ')) : (user.role?.replace('_', ' ') || "Partner")}
        </p>
      </div>

      {/* Nav */}
      {sections.map((section) => (
        <div key={section.label} className="py-2">
          <p className="text-[#a09080] text-[9px] font-bold tracking-widest px-3 py-1">
            {section.label}
          </p>
          {section.items.map((item) => (
            <Link
              to={item.path}
              key={item.key}
              onClick={() => setIsOpen && setIsOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#c8b898] hover:bg-[#5a4a3a] hover:text-white transition-colors ${
                (item.path === "/" ? location.pathname === "/" : location.pathname === item.path)
                  ? "bg-orange-600 text-white"
                  : ""
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{item.labelOverride || t[item.key] || item.key}</span>
              {item.badge && (
                <span
                  className={`${item.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      ))}
      
      {/* Logout */}
      <div className="mt-auto p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] text-[#c8b898] border border-[#5a4a3a] rounded hover:bg-[#5a4a3a] hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
