"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ConciergeBell,
  Coins,
  BarChart3,
  Calendar,
  UserPlus,
  CheckSquare,
  Stethoscope,
  Hourglass,
  Phone,
  Bell,
  FolderOpen,
  Headphones,
  Settings,
  Receipt,
  CreditCard,
  Shield,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Undo2,
  AlertCircle,
  Banknote,
  FileText,
  Search
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

const navItems = [
  {
    name: "Receptionist Services",
    icon: ConciergeBell,
    subItems: [
      { name: "Dashboard", href: "/frontdesk/receptionist/dashboard", icon: BarChart3 },
      { name: "Appointment Booking", href: "/frontdesk/receptionist/appointments", icon: Calendar },
      { name: "Patient Registration", href: "/frontdesk/receptionist/patients", icon: UserPlus },
      { name: "Check-In / Check-Out", href: "/frontdesk/receptionist/checkin", icon: CheckSquare },
      { name: "Doctor Schedules", href: "/frontdesk/receptionist/doctors", icon: Stethoscope },
      { name: "Treatment Coordination", href: "/frontdesk/receptionist/treatments", icon: ToothIcon },
      { name: "Waiting Queue", href: "/frontdesk/receptionist/queue", icon: Hourglass },
      { name: "Patient Communication", href: "/frontdesk/receptionist/communication", icon: Phone },
      { name: "Appointment Reminders", href: "/frontdesk/receptionist/reminders", icon: Bell },
      { name: "Patient Records", href: "/frontdesk/receptionist/records", icon: FolderOpen },
      { name: "Support Requests", href: "/frontdesk/receptionist/support", icon: Headphones },
      { name: "Leave Management", href: "/frontdesk/receptionist/leave", icon: Calendar },
      { name: "Settings", href: "/frontdesk/receptionist/settings", icon: Settings },
    ],
  },
  {
    name: "Accountant Services",
    icon: Coins,
    subItems: [
      { name: "Dashboard", href: "/frontdesk/accountant/dashboard", icon: BarChart3 },
      { name: "Invoice Management", href: "/frontdesk/accountant/invoices", icon: Receipt },
      { name: "Payment Processing", href: "/frontdesk/accountant/payments", icon: CreditCard },
      { name: "Insurance Claims", href: "/frontdesk/accountant/claims", icon: Shield },
      { name: "Claim Verification", href: "/frontdesk/accountant/claim-verification", icon: ShieldCheck },
      { name: "Revenue Tracking", href: "/frontdesk/accountant/revenue", icon: TrendingUp },
      { name: "Expense Management", href: "/frontdesk/accountant/expenses", icon: TrendingDown },
      { name: "Refund Requests", href: "/frontdesk/accountant/refunds", icon: Undo2 },
      { name: "Outstanding Dues", href: "/frontdesk/accountant/dues", icon: AlertCircle },
      { name: "Payroll", href: "/frontdesk/accountant/payroll", icon: Banknote },
      { name: "Financial Reports", href: "/frontdesk/accountant/reports", icon: FileText },
      { name: "Audit Logs", href: "/frontdesk/accountant/audit", icon: Search },
      { name: "Leave Management", href: "/frontdesk/accountant/leave", icon: Calendar },
      { name: "Settings", href: "/frontdesk/accountant/settings", icon: Settings },
    ],
  },
];

export default function FrontdeskSidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [activeRoles, setActiveRoles] = useState(["Receptionist", "Accountant"]);

  // Load active roles on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoles = localStorage.getItem("smilecare_active_user_roles");
      if (savedRoles) {
        try {
          setActiveRoles(JSON.parse(savedRoles));
        } catch (e) {
          console.error("Failed to parse active user roles", e);
        }
      } else {
        localStorage.setItem("smilecare_active_user_roles", JSON.stringify(["Receptionist", "Accountant"]));
      }
    }
  }, []);

  useEffect(() => {
    if (pathname) {
      navItems.forEach((item) => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some((sub) => pathname === sub.href);
          if (hasActiveSub) {
            setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
          }
        }
      });
    }
  }, [pathname]);

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSimulateRole = (roles) => {
    setActiveRoles(roles);
    if (typeof window !== "undefined") {
      localStorage.setItem("smilecare_active_user_roles", JSON.stringify(roles));
    }
  };

  // Filter navigation items dynamically based on the active user roles
  const filteredNavItems = navItems.filter((item) => {
    if (item.name === "Receptionist Services") {
      return activeRoles.includes("Receptionist");
    }
    if (item.name === "Accountant Services") {
      return activeRoles.includes("Accountant");
    }
    return true;
  const filteredNavItems = navItems.filter((item) => {
    if (pathname?.startsWith("/frontdesk/receptionist") && item.name === "Receptionist Services") return true;
    if (pathname?.startsWith("/frontdesk/accountant") && item.name === "Accountant Services") return true;
    return false;
  });

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary" strokeWidth={2.5} /> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Desk
        </span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Front Desk</p>
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const hasSubItems = !!item.subItems;
              const isOpen = !!openDropdowns[item.name];
              const isActive = (hasSubItems && item.subItems.some((sub) => pathname === sub.href));

              return (
                <li key={item.name} className="flex flex-col">
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors group cursor-pointer outline-none ${isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 opacity-70 group-hover:opacity-100 text-gray-500 group-hover:text-primary transition-colors flex items-center">
                        <item.icon className="w-5 h-5" />
                      </span>
                      {item.name}
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                      }`}
                  >
                    <ul className="pl-4 space-y-1 border-l-2 border-gray-100 ml-5">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors group ${isSubActive
                                ? "bg-primary/5 text-primary font-semibold"
                                : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                                }`}
                            >
                              <span className="mr-2.5 opacity-70 group-hover:opacity-100 text-gray-500 group-hover:text-primary transition-colors flex items-center">
                                <subItem.icon className="w-4 h-4" />
                              </span>
                              {subItem.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
            {filteredNavItems.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-6">No authorized services assigned.</p>
            )}
          </ul>
        </div>
      </nav>

      {/* Role Simulator and Roster Footer Panel */}
      <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-3">
        {/* Active user status badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            FD
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-gray-900 leading-tight">Front Desk Staff</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wide leading-none">
              {activeRoles.join(" & ")}
            </span>
          </div>
        </div>

        {/* Real-time switcher buttons */}
        <div className="space-y-1">
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider block text-left">Simulate Roster Roles</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleSimulateRole(["Receptionist"])}
              className={`flex-1 text-center py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer outline-none ${
                activeRoles.includes("Receptionist") && !activeRoles.includes("Accountant")
                  ? "bg-secondary text-white border-secondary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
              title="Simulate Receptionist-only module access view"
            >
              Receptionist Only
            </button>
            <button
              onClick={() => handleSimulateRole(["Receptionist", "Accountant"])}
              className={`flex-1 text-center py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer outline-none ${
                activeRoles.includes("Receptionist") && activeRoles.includes("Accountant")
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
              title="Simulate dual Receptionist & Accountant access views"
            >
              Both Roles
            </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {pathname?.startsWith("/frontdesk/receptionist") ? "Receptionist" : "Accountant"}
            </span>
            <span className="text-xs text-gray-500">
              {pathname?.startsWith("/frontdesk/receptionist") ? "Front Desk" : "Finance"}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
