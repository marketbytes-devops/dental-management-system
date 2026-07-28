"use client";

import { useState, useEffect } from "react";
import { getLabNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/services/api";

const INITIAL_NOTIFICATIONS = [
  { id: "NOT-001", type: "Orders", title: "New Lab Order Received", desc: "Case CASE-2026-001 has been registered by Dr. Anoop Nair.", date: "10 mins ago", read: false },
  { id: "NOT-002", type: "QC", title: "Rework Required on Case #2026-005", desc: "Margin failed dimension checks. Please refer to notes from Sneha Nair.", date: "1 hour ago", read: false },
  { id: "NOT-003", type: "Dispatch", title: "SmileCare Express Courier Assigned", desc: "Case CASE-2026-008 has been picked up by delivery executive.", date: "3 hours ago", read: true },
  { id: "NOT-054", type: "Billing", title: "Payment Received: Dr. Sarah Smith", desc: "Invoice INV-2026-043 (₹6,500) has been paid successfully.", date: "1 day ago", read: true },
  { id: "NOT-005", type: "Orders", title: "Urgent Priority Tag Added", desc: "Dr. Sarah Smith marked Case CASE-2026-002 as Urgent.", date: "1 day ago", read: true },
  { id: "NOT-006", type: "QC", title: "QC Passed: CASE-2026-009", desc: "Case passed all A2 shade match validations.", date: "2 days ago", read: true }
];

export default function LabNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("All"); // All, Orders, QC, Dispatch, Billing

  const fetchNotifications = async () => {
    try {
      const data = await getLabNotifications("lab tech");
      const mapped = data.map(n => ({
        id: n.id,
        type: n.type || "Orders",
        title: n.title,
        desc: n.desc,
        read: n.read,
        date: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to fetch lab technician notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === "All") return true;
    return n.type === activeTab;
  });

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleClearNotification = async (id) => {
    try {
      await deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to clear notification:", err);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "Orders": return "bg-primary/10 text-primary border-primary/20";
      case "QC": return "bg-danger/10 text-danger border-danger/20";
      case "Dispatch": return "bg-warning/10 text-warning border-warning/20";
      case "Billing": return "bg-success/10 text-success border-success/20";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Notifications Center</h1>
          <p className="text-sm text-gray-500 mt-1">Receive immediate system checkoffs, order alerts, and quality inspect flags.</p>
        </div>

        {notifications.some(n => !n.read) && (
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold rounded-xl cursor-pointer border border-primary/20 shadow-sm"
          >
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 max-w-lg">
        {["All", "Orders", "QC", "Dispatch", "Billing"].map((tab) => {
          const count = notifications.filter(n => (tab === "All" ? true : n.type === tab) && !n.read).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === tab ? "bg-white text-gray-900 shadow-sm font-extrabold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>{tab}</span>
              {count > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-4xl">📭</span>
            <p className="text-xs mt-3">No notifications found in this category.</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-4 border rounded-xl flex items-start justify-between gap-4 transition-all duration-300 relative group cursor-pointer ${
                notif.read ? "bg-white border-gray-150" : "bg-primary/5 border-primary/30"
              }`}
            >
              <div className="flex gap-3 items-start">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getTypeBadge(notif.type)} mt-0.5`}>
                  {notif.type}
                </span>

                <div>
                  <h4 className={`text-xs ${notif.read ? "font-bold text-gray-800" : "font-extrabold text-gray-900"}`}>
                    {notif.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{notif.desc}</p>
                  <span className="text-[9px] text-gray-400 font-semibold mt-1.5 block">{notif.date}</span>
                </div>
              </div>

              {/* Clear button */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleClearNotification(notif.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg text-gray-450 hover:text-gray-800 cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
