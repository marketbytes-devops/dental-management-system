"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  BarChart3,
  Calendar,
  UserPlus,
  CheckSquare,
  Stethoscope,
  Phone,
  Bell,
  FolderOpen,
  Headphones,
  Settings,
  Hourglass
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

const navItems = [
  { name: "Dashboard", href: "/frontdesk/receptionist/dashboard", icon: BarChart3 },
  { name: "Appointments", href: "/frontdesk/receptionist/appointments", icon: Calendar },
  { name: "Registrations", href: "/frontdesk/receptionist/patients", icon: UserPlus },
  { name: "Check-In / Check-Out", href: "/frontdesk/receptionist/checkin", icon: CheckSquare },
  { name: "Doctor Schedules", href: "/frontdesk/receptionist/doctors", icon: Stethoscope },
  { name: "Waiting Queue", href: "/frontdesk/receptionist/queue", icon: Hourglass },
  { name: "Communications", href: "/frontdesk/receptionist/communication", icon: Phone },
  { name: "Reminders", href: "/frontdesk/receptionist/reminders", icon: Bell },
  { name: "Patient Records", href: "/frontdesk/receptionist/records", icon: FolderOpen },
  { name: "Support Requests", href: "/frontdesk/receptionist/support", icon: Headphones },
  { name: "Settings", href: "/frontdesk/receptionist/settings", icon: Settings },
];

function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function ReceptionistSidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary" strokeWidth={2.5} /> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Reception
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Front Desk
          </p>
          <Suspense fallback={<div className="px-3 py-2 text-sm text-gray-400 animate-pulse">Loading...</div>}>
            <NavLinks />
          </Suspense>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            R
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">Receptionist</span>
            <span className="text-[10px] text-gray-500 font-semibold truncate">Front Desk Module</span>
          </div>
        </div>
      </div>
    </div>
  );
}
