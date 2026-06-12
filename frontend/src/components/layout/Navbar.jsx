import Link from "next/link";
import { Search, Bell, HelpCircle, Sparkles } from "lucide-react";

export default function Navbar() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      {/* Greeting */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            {greeting}, Admin <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </p>
          <p className="text-xs text-gray-500">System Administrator</p>
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

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <Link href="/" className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
          Logout
        </Link>
      </div>
    </header>
  );
}
