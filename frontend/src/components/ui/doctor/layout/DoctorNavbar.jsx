"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDoctor } from "@/app/doctor/layout";
import { Search, Bell, HelpCircle, Sparkles, Share2, Microscope, AlertTriangle } from "lucide-react";

export default function DoctorNavbar() {
  const { notifications = [], bellAnimating, markAsRead, patients } = useDoctor();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("staff_user");
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse staff_user", e);
        }
      }
    }
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const unreadNotifications = notifications.filter(n => n.status === "unread");
  const unreadCount = unreadNotifications.length;
  const bellDotColor = unreadCount > 0 ? unreadNotifications[0].dotColor : null;

  const doctorFirstName = currentUser?.name ? currentUser.name.replace("Dr. ", "").split(" ")[0] : "Anoop";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      {/* Greeting */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            {greeting}, Dr. {doctorFirstName} <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </p>
          <p className="text-xs text-gray-500">
            {currentUser?.specialties && currentUser.specialties.length > 0 
              ? currentUser.specialties.join(", ") 
              : "Specialist Dentist"}
          </p>
        </div>

        <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-80 transition-all">
          <Search className="text-gray-400 mr-2 w-4 h-4 shrink-0" />
          <input 
            type="text" 
            placeholder="Search patients, doctors, appointments..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center cursor-pointer outline-none"
        >
          <Bell className={`w-5 h-5 transition-transform ${bellAnimating ? "animate-bell-ring text-primary" : ""}`} />
          {unreadCount > 0 && (
            <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${
              bellDotColor === "green" ? "bg-success animate-dot-pulse-green" : "bg-danger animate-dot-pulse-red"
            }`} />
          )}
        </button>

        {/* Notifications Popover */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fade-in text-left">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Clinical Notifications</span>
              <span className="text-[9px] font-bold bg-danger/10 text-danger px-2 py-0.5 rounded">
                {unreadCount} New
              </span>
            </div>
            
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {notifications.map(notif => {
                const getNotifIcon = () => {
                  switch (notif.type) {
                    case "referral":
                      return <Share2 className="w-3.5 h-3.5 text-primary" />;
                    case "labs":
                      return <Microscope className="w-3.5 h-3.5 text-secondary" />;
                    case "alerts":
                      return <AlertTriangle className="w-3.5 h-3.5 text-danger" />;
                    default:
                      return <Bell className="w-3.5 h-3.5 text-gray-400" />;
                  }
                };

                return (
                  <Link 
                    key={notif.id}
                    href={notif.link}
                    onClick={() => {
                      markAsRead(notif.id);
                      setShowNotifications(false);
                    }}
                    className={`block p-2.5 rounded-xl border border-transparent transition-all text-xs relative ${
                      notif.status === "unread" 
                        ? "bg-gray-50/80 hover:bg-gray-50 border-gray-100 font-semibold" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-800 flex items-center gap-1.5 capitalize">
                        {getNotifIcon()}
                        {notif.type} notification
                      </p>
                      {notif.status === "unread" && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          notif.dotColor === "green" ? "bg-success animate-pulse" : "bg-danger animate-pulse"
                        }`} />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 leading-normal font-normal">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-gray-400 font-semibold block mt-1">{notif.timestamp}</span>
                  </Link>
                );
              })}
              {notifications.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6 font-medium">No new notifications.</p>
              )}
            </div>
            <div className="pt-2 border-t border-gray-100 text-center">
              <Link 
                href="/doctor/notifications"
                onClick={() => setShowNotifications(false)}
                className="text-xs font-bold text-primary hover:underline block cursor-pointer"
              >
                View All Notifications
              </Link>
            </div>
          </div>
        )}
        <button className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <button
          onClick={() => {
            localStorage.removeItem("staff_jwt_token");
            localStorage.removeItem("staff_user");
            window.location.href = "/login";
          }}
          className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-650 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
