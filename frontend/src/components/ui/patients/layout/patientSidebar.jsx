"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Home, Calendar, User, CheckSquare, FileText, Pill, CreditCard, Bell } from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

const navItems = [
  { name: "My Dashboard",    href: "/patient/dashboard",      icon: Home },
  { name: "My Appointments", href: "/patient/appointments",   icon: Calendar },
  { name: "My Profile",      href: "/patient/profile",        icon: User },
  { name: "Self Check-In",   href: "/patient/appointments?tab=checkin", icon: CheckSquare },
  { name: "My Documents",    href: "/patient/documents",      icon: FileText },
  { name: "My Records",      href: "/patient/records",        icon: Pill },
  { name: "My Bills",        href: "/patient/bills",          icon: CreditCard },
  { name: "Notifications",   href: "/patient/notifications",  icon: Bell },
];

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;

  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        let isActive = false;
        if (item.name === "Self Check-In") {
          isActive = pathname === "/patient/appointments" && currentTab === "checkin";
        } else if (item.name === "My Appointments") {
          isActive = pathname === "/patient/appointments" && currentTab !== "checkin";
        } else {
          isActive = pathname === item.href;
        }

        return (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors group cursor-pointer outline-none ${
                isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-gray-700 hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <span className="mr-3 opacity-70 group-hover:opacity-100 text-gray-500 group-hover:text-primary transition-colors flex items-center">
                <item.icon className="w-5 h-5" />
              </span>
              {item.name}
              {/* Notification dot for Notifications link */}
              {item.name === "Notifications" && (
                <span className="ml-auto w-2 h-2 rounded-full bg-danger" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function PatientSidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary" strokeWidth={2.5} /> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Patient
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            My Account
          </p>
          <Suspense fallback={<div className="px-3 py-2 text-sm text-gray-400 animate-pulse">Loading...</div>}>
            <NavLinks />
          </Suspense>
        </div>
      </nav>

      {/* Patient avatar footer */}
      <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            R
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">Rahul Kumar</span>
            <span className="text-[10px] text-gray-500 font-semibold truncate">PT-10042</span>
          </div>
        </div>
      </div>
    </div>
  );
}
