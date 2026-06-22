"use client";

import Link from "next/link";

import { Bell, HelpCircle, Sparkles } from "lucide-react";

export default function LabNavbar() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      {/* Greeting */}
      <div>
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          {greeting}, Alen <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        </p>
        <p className="text-xs text-gray-500">Tech ID: LT-1002</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <Link
          href="/labtechnicians/notifications"
          className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
        </Link>

        {/* Help */}
        <button
          className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Avatar + logout */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            AJ
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("staff_jwt_token");
              localStorage.removeItem("staff_user");
              window.location.href = "/login";
            }}
            className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
