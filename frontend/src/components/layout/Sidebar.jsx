"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { name: "User Management", href: "/admin/users", icon: "👥" },
  { name: "Role Permissions", href: "/admin/roles", icon: "🔑" },
  { name: "Doctor", href: "/admin/doctor", icon: "🔑" },
  {
    name: "Patients",
    icon: "🩺",
    subItems: [
      { name: "Overview", href: "/admin/patients/overview", icon: "📊" },
      { name: "Appointments", href: "/admin/patients/appointments", icon: "📅" },
      { name: "Registration", href: "/admin/patients/registration", icon: "📝" },
      { name: "Check-In & Queue", href: "/admin/patients/check-in-queue", icon: "⏳" },
      { name: "Consent & Documents", href: "/admin/patients/consent-documents", icon: "📄" },
      { name: "Prescriptions", href: "/admin/patients/prescriptions", icon: "💊" },
      { name: "Billing & Payments", href: "/admin/patients/billing-payments", icon: "💳" },
      { name: "Notifications", href: "/admin/patients/notifications", icon: "🔔" },
    ],
  },
  {
    name: "Receptionist",
    icon: "🛎️",
    subItems: [
      { name: "Dashboard", href: "/admin/receptionist/dashboard", icon: "📊" },

      { name: "Appointment Booking", href: "/admin/receptionist/appointments", icon: "📅" },
      { name: "Patient Registration", href: "/admin/receptionist/patients", icon: "👤" },
      { name: "Check-In / Check-Out", href: "/admin/receptionist/checkin", icon: "✅" },

      { name: "Doctor Schedules", href: "/admin/receptionist/doctors", icon: "👨‍⚕️" },
      { name: "Treatment Coordination", href: "/admin/receptionist/treatments", icon: "🦷" },

      { name: "Waiting Queue", href: "/admin/receptionist/queue", icon: "⏳" },
      { name: "Patient Communication", href: "/admin/receptionist/communication", icon: "📞" },

      { name: "Appointment Reminders", href: "/admin/receptionist/reminders", icon: "🔔" },
      { name: "Patient Records", href: "/admin/receptionist/records", icon: "📂" },

      { name: "Support Requests", href: "/admin/receptionist/support", icon: "🎧" },
      { name: "Settings", href: "/admin/receptionist/settings", icon: "⚙️" },
    ],
  },
  {
    name: "Accountant",
    icon: "💰",
    subItems: [
      { name: "Dashboard", href: "/admin/accountant/dashboard", icon: "📊" },

      { name: "Invoice Management", href: "/admin/accountant/invoices", icon: "🧾" },
      { name: "Payment Processing", href: "/admin/accountant/payments", icon: "💳" },

      { name: "Insurance Claims", href: "/admin/accountant/claims", icon: "🛡️" },
      { name: "Claim Verification", href: "/admin/accountant/claim-verification", icon: "✔️" },

      { name: "Revenue Tracking", href: "/admin/accountant/revenue", icon: "📈" },
      { name: "Expense Management", href: "/admin/accountant/expenses", icon: "📉" },

      { name: "Refund Requests", href: "/admin/accountant/refunds", icon: "↩️" },
      { name: "Outstanding Dues", href: "/admin/accountant/dues", icon: "⚠️" },

      { name: "Payroll", href: "/admin/accountant/payroll", icon: "💵" },
      { name: "Financial Reports", href: "/admin/accountant/reports", icon: "📋" },

      { name: "Audit Logs", href: "/admin/accountant/audit", icon: "🔍" },
      { name: "Settings", href: "/admin/accountant/settings", icon: "⚙️" },
    ],
  },
  { name: "System Logs", href: "/admin/logs", icon: "📝" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({});

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

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="text-2xl">🦷</span> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Admin
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Administration</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasSubItems = !!item.subItems;
              const isOpen = !!openDropdowns[item.name];
              const isActive =
                pathname === item.href ||
                (hasSubItems && item.subItems.some((sub) => pathname === sub.href));

              if (hasSubItems) {
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
                        <span className="mr-3 text-lg opacity-70 group-hover:opacity-100">{item.icon}</span>
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
                                <span className="mr-2.5 text-sm opacity-70 group-hover:opacity-100">{subItem.icon}</span>
                                {subItem.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                      }`}
                  >
                    <span className="mr-3 text-lg opacity-70 group-hover:opacity-100">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Admin User</span>
            <span className="text-xs text-gray-500">Superadmin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
