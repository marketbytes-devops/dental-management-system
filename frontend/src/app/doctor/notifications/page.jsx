"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/doctor/layout";
import {
  CheckCircle,
  AlertTriangle,
  Microscope,
  Share2,
  Bell,
  ExternalLink,
  Inbox
} from "lucide-react";

export default function DoctorNotificationsPage() {
  const router = useRouter();
  const {
    notifications = [],
    markAsRead,
    markAsUnread,
    markAllAsRead,
    setViewingPatientToken
  } = useDoctor();

  // Format Date & Time for display: DD-MM-YYYY hh:mm AM/PM
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

    return `${day}-${month}-${year} ${strTime}`;
  };

  // Stats
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const referralCount = notifications.filter((n) => n.type === "referral").length;
  const labCount = notifications.filter((n) => n.type === "labs").length;

  const handlePatientFocus = (patientId) => {
    if (!patientId) return;
    setViewingPatientToken(patientId);
    router.push("/doctor/workspace");
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notifications Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and review patient referrals, lab order updates, and safety alerts.
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer outline-none border-none"
            >
              <CheckCircle className="w-4 h-4" /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Alerts</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Unread Alerts</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{unreadCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Referrals</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{referralCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lab Cases</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{labCount}</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">
            Notifications List ({notifications.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {notifications.map((notif) => {
            const isUnread = notif.status === "unread";

            const getIconInfo = () => {
              switch (notif.type) {
                case "referral":
                  return {
                    icon: <Share2 className="w-4 h-4 text-blue-600" />,
                    bg: "bg-blue-50 text-blue-600",
                    label: "Referral"
                  };
                case "labs":
                  return {
                    icon: <Microscope className="w-4 h-4 text-purple-600" />,
                    bg: "bg-purple-50 text-purple-600",
                    label: "Lab Case"
                  };
                case "alerts":
                  return {
                    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
                    bg: "bg-red-50 text-red-600",
                    label: "Safety Alert"
                  };
                default:
                  return {
                    icon: <Bell className="w-4 h-4 text-gray-600" />,
                    bg: "bg-gray-100 text-gray-600",
                    label: "Notification"
                  };
              }
            };

            const info = getIconInfo();

            return (
              <div
                key={notif.id}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-gray-50/50 ${
                  isUnread ? "bg-primary/[0.01] border-l-4 border-primary" : "border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${info.bg}`}>
                    {info.icon}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${info.bg}`}>
                        {info.label}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
                      )}
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Received: {formatDateTime(notif.receivedAt)}
                      </span>
                    </div>

                    <p className={`text-xs text-gray-800 leading-normal ${isUnread ? "font-semibold text-gray-900" : ""}`}>
                      {notif.message}
                    </p>

                    {/* Patient tag */}
                    {notif.patientId && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">Patient:</span>
                        <button
                          onClick={() => handlePatientFocus(notif.patientId)}
                          className="bg-gray-100 hover:bg-primary/10 hover:text-primary transition-colors text-[10px] font-bold text-gray-700 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer outline-none border-none"
                          title="Click to view workspace profile"
                        >
                          {notif.patientName} ({notif.patientId})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions cell */}
                <div className="flex items-center gap-2 md:self-center">
                  <button
                    onClick={() => (isUnread ? markAsRead(notif.id) : markAsUnread(notif.id))}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer outline-none border border-solid ${
                      isUnread
                        ? "bg-primary text-white border-primary hover:bg-primary/90"
                        : "bg-white text-gray-600 border-gray-250 hover:bg-gray-50"
                    }`}
                  >
                    {isUnread ? "Mark Read" : "Mark Unread"}
                  </button>

                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Go to referral/lab details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <Inbox className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">No Notifications Found</h4>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                You have no active notifications at this time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
