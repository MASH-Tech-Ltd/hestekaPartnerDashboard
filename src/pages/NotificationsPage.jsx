import React, { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckSquare, Trash2, Calendar } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { socket } from "../context/SocketContect";
import api from "../utils/api";
import Pagination from "../components/common/Pagination";
import { toast } from "react-toastify";

export default function NotificationsPage() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications/get-my-notifications?page=${p}&limit=10`);
      if (res.data.status === "ok") {
        setNotifications(res.data.data || []);
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      toast.error(t.toastLoadNotifFailed || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  useEffect(() => {
    const handleNewNotif = () => {
      fetchNotifications(page);
    };
    socket.on("notification:new", handleNewNotif);
    window.addEventListener("refetch-notifications", handleNewNotif);
    return () => {
      socket.off("notification:new", handleNewNotif);
      window.removeEventListener("refetch-notifications", handleNewNotif);
    };
  }, [page, fetchNotifications]);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await api.patch(`/notifications/mark-as-read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      // Update unread count in other components
      window.dispatchEvent(new Event("refetch-stats"));
    } catch (err) {
      console.error("Failed to mark as read", err);
      toast.error(t.toastUpdateNotifFailed || "Failed to update notification status.");
    }
  };

  const handleMarkAllAsRead = async () => {
    const hasUnread = notifications.some((n) => !n.isRead);
    if (!hasUnread) return;
    try {
      await api.patch("/notifications/mark-as-read/all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event("refetch-stats"));
      toast.success(t.toastAllMarkedRead || "All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      toast.error(t.toastMarkAllFailed || "Failed to update notifications.");
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/delete-notification/${id}`);
      toast.success(t.toastNotifDeleted || "Notification deleted.");
      fetchNotifications(page);
      window.dispatchEvent(new Event("refetch-stats"));
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error(t.toastDeleteNotifFailed || "Failed to delete notification.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e8ddd0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#3a2a1a]">{t.notificationCenter || "Notification Center"}</h2>
            <p className="text-[10px] text-[#9a8a7a]">{t.notificationSubtitle || "Keep up with community activity and registrations"}</p>
          </div>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          disabled={loading || !notifications.some((n) => !n.isRead)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" />
          {t.markAllAsRead || "Mark all as read"}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-[#e8ddd0] shadow-sm overflow-hidden flex flex-col min-h-[450px]">
        <div className="flex-1 divide-y divide-[#f0e8d8]">
          {loading && notifications.length === 0 ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="p-5 flex gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleMarkAsRead(notif._id, notif.isRead)}
                className={`p-5 flex gap-4 transition-all ${
                  notif.isRead ? "bg-white opacity-70" : "bg-orange-50/30 hover:bg-orange-50/50 cursor-pointer"
                }`}
              >
                {/* Icon Column */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  notif.isRead ? "bg-gray-100 text-gray-400" : "bg-orange-100 text-orange-600"
                }`}>
                  <Bell className="w-4 h-4" />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`text-xs ${notif.isRead ? "font-bold text-[#5a4a3a]" : "font-black text-[#3a2a1a]"}`}>
                      {notif.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Date */}
                      <span className="text-[9px] text-[#9a8a7a] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notif._id);
                        }}
                        className="text-[#9a8a7a] hover:text-red-600 transition-colors p-1"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-[#5a4a3a] leading-relaxed mt-1">{notif.description}</p>
                  
                  {!notif.isRead && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-2 uppercase tracking-wider">
                      <Check className="w-3 h-3" />
                      {t.newAlert || "New Alert"}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 flex flex-col items-center justify-center opacity-30 gap-3">
              <Bell className="w-12 h-12" />
              <p className="text-sm font-bold uppercase tracking-widest">{t.noNotifications || "No notifications found"}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <Pagination
            meta={meta}
            onPageChange={(p) => {
              setPage(p);
              fetchNotifications(p);
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
