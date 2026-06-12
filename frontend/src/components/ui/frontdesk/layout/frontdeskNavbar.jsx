"use client";

import Link from "next/link";

export default function FrontdeskNavbar() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {greeting}, Desk Executive 👋
        </p>
        <p className="text-xs text-gray-500">Lobby desk portal</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Help */}
        <button
          className="p-2 text-gray-400 hover:text-primary transition-colors"
          aria-label="Help"
        >
          <span className="text-xl">❓</span>
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Logout */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            FD
          </div>
          <Link href="/" className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
