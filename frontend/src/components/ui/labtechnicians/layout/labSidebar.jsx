"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Search, Laptop, Wrench, CheckSquare, Truck, Receipt, ShieldCheck, TrendingUp, Bell, Settings, Calendar } from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

const navItems = [
  { name: "Dashboard", href: "/labtechnicians/dashboard", icon: BarChart3 },
  { name: "Lab Orders", href: "/labtechnicians/orders", icon: ClipboardList },
  { name: "Case Tracking", href: "/labtechnicians/case-tracking", icon: Search },
  { name: "CAD Design", href: "/labtechnicians/cad-design", icon: Laptop },
  { name: "Production", href: "/labtechnicians/production", icon: Wrench },
  { name: "Quality Control", href: "/labtechnicians/quality-control", icon: CheckSquare },
  { name: "Dispatch", href: "/labtechnicians/dispatch", icon: Truck },
  { name: "Invoices", href: "/labtechnicians/invoices", icon: Receipt },
  { name: "Warranty", href: "/labtechnicians/warranty", icon: ShieldCheck },
  { name: "Reports", href: "/labtechnicians/reports", icon: TrendingUp },
  { name: "Notifications", href: "/labtechnicians/notifications", icon: Bell },
  { name: "Leave Management", href: "/labtechnicians/leave", icon: Calendar },
  { name: "Settings", href: "/labtechnicians/settings", icon: Settings },
];

export default function LabSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary" strokeWidth={2.5} /> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Lab Tech
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Workspaces
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
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
        </div>
      </nav>

      {/* Technician avatar footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            AJ
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Alen Joseph</span>
            <span className="text-xs text-gray-500">LT-1002</span>
          </div>
        </div>
      </div>
    </div>
  );
}
