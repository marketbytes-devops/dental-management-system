"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Stethoscope } from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { ROLE_NAV_ITEMS } from "./navigationConfig";
import { useDoctor } from "@/app/doctor/layout";

export default function Sidebar({ isMinimized = false, onToggleMinimize }) {
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Safely try-catch calling useDoctor so it doesn't crash when rendered outside DoctorProvider
  let doctorContext = null;
  try {
    doctorContext = useDoctor();
  } catch (e) {
    // not in doctor layout provider context
  }
  const notifications = doctorContext?.notifications || [];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const staffUser = localStorage.getItem("staff_user");
      const patientUser = localStorage.getItem("patient_user");
      const patientName = localStorage.getItem("patient_name");
      const patientToken = localStorage.getItem("patient_token");

      setTimeout(() => {
        if (staffUser) {
          try {
            const parsed = JSON.parse(staffUser);
            setCurrentUser(parsed);

            const roles = parsed.roles || [];
            let rawRole = parsed.role || "";

            if (!rawRole && roles.length > 0) {
              if (pathname.startsWith("/frontdesk/accountant")) {
                rawRole = "accountant";
              }
              else if (pathname.startsWith("/frontdesk/receptionist")) {
                rawRole = "receptionist";
              }
              else {
                rawRole = roles[0];
              }
            }


            const normalizeRole = (r) => {
              if (!r) return "";
              const val = r.toLowerCase().trim();
              if (val === "admin") return "admin";
              if (val === "doctor") return "doctor";
              if (val === "lab tech" || val === "lab" || val === "lab technician") return "lab tech";
              if (val === "receptionist" || val === "reception") return "receptionist";
              if (val === "accountant" || val === "accountent") return "accountant";
              if (val === "patient") return "patient";
              return val;
            };

            setRole(normalizeRole(rawRole));
          } catch (e) {
            console.error("Failed to parse staff_user", e);
          }
        } else if (patientUser || patientName) {
          try {
            const name = patientName || (patientUser ? JSON.parse(patientUser).name : "Patient");
            const token = patientToken || "PT-XXXXX";
            setCurrentUser({ name, token });
            setRole("patient");
          } catch (e) {
            console.error("Failed to set patient user info", e);
          }
        }
      }, 0);
    }
  }, []);


  const navItems = ROLE_NAV_ITEMS[role] || [];

  // Specialty filtering for Doctor role
  const filteredNavItems = navItems.map(item => {
    if (role === "doctor" && item.name === "Clinical Workspace" && item.subItems) {
      const userSpecs = currentUser?.specialties || [];
      const filteredSubs = item.subItems.filter(sub => {
        return userSpecs.some(spec => {
          const sLower = spec.toLowerCase();
          const subLower = sub.name.toLowerCase();
          return (
            sLower.includes(subLower) || 
            subLower.includes(sLower) ||
            (subLower === "general dentistry" && (sLower.includes("general") || sLower.includes("dentist"))) ||
            (subLower === "oral surgery" && (sLower.includes("surgery") || sLower.includes("surgeon")))
          );
        });
      });
      return { ...item, subItems: filteredSubs };
    }
    return item;
  });

  // Auto-expand active sub-menus
  useEffect(() => {
    if (pathname) {
      let activeDropdown = null;
      filteredNavItems.forEach((item) => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some((sub) => pathname === sub.href);
          if (hasActiveSub) {
            activeDropdown = item.name;
          }
        }
      });
      if (activeDropdown) {
        setOpenDropdowns({ [activeDropdown]: true });
      }
    }
  }, [pathname, role]);

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({ [name]: !prev[name] }));
  };

  const getUnreadCount = (href) => {
    if (role !== "doctor") return 0;
    if (href === "/doctor/notifications") {
      return notifications ? notifications.filter(n => n.status === "unread").length : 0;
    }
    return notifications
      ? notifications.filter(n => n.status === "unread" && n.link === href).length
      : 0;
  };

  const roleLabel =
    role === "admin" ? "Admin" :
      role === "doctor" ? "Doctor" :
        role === "receptionist" ? "Reception" :
          role === "accountant" ? "Finance" :
            role === "lab tech" ? "Lab Tech" :
              role === "patient" ? "Patient" : "";

  const avatarChar = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U";

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full shadow-sm transition-all duration-300 relative ${isMinimized ? "w-16" : "w-64"}`}>

      {/* Floating Toggle Button */}
      {onToggleMinimize && (
        <button
          onClick={onToggleMinimize}
          className="absolute top-5 -right-3 w-6 h-6 bg-white hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-primary transition-all cursor-pointer z-50 focus:outline-none"
          title={isMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isMinimized ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </button>
      )}

      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 ${isMinimized ? "justify-center px-2" : "justify-start px-6 gap-2"}`}>
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary shrink-0" strokeWidth={2.5} />
          {!isMinimized && <span>SmileCare</span>}
        </span>
        {!isMinimized && roleLabel && (
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
            {roleLabel}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={isMinimized ? "px-1" : "px-4"}>
          {!isMinimized && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              {role === "patient" ? "My Account" : role === "lab tech" ? "Workspaces" : "Navigation"}
            </p>
          )}
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const hasSubItems = !!item.subItems;
              const isParentActive = hasSubItems && pathname.startsWith(item.href);
              const isActive = !hasSubItems && pathname === item.href;
              const isOpen = !!openDropdowns[item.name];

              if (hasSubItems) {
                return (
                  <li key={item.name} className="flex flex-col">
                    {isMinimized ? (
                      <div className="flex justify-center">
                        <Link
                          href={item.subItems[0].href}
                          title={item.name}
                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all group cursor-pointer outline-none ${isParentActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                            }`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                        </Link>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleDropdown(item.name)}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg transition-colors group cursor-pointer outline-none ${isParentActive
                            ? "bg-primary/10 text-primary"
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

                        {/* Sub-menu Dropdown List */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[350px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                            }`}
                        >
                          <ul className="pl-4 space-y-1 border-l-2 border-gray-100 ml-5">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors group cursor-pointer outline-none ${isSubActive
                                      ? "bg-primary/5 text-primary"
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
                      </>
                    )}
                  </li>
                );
              }

              // Leaf nav item (no sub-items)
              const unreadCount = getUnreadCount(item.href);

              return (
                <li key={item.name} className="flex justify-center">
                  {isMinimized ? (
                    <Link
                      href={item.href}
                      title={item.name}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all group cursor-pointer outline-none relative ${isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                        }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-colors group cursor-pointer outline-none w-full ${isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                        }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 opacity-70 group-hover:opacity-100 text-gray-500 group-hover:text-primary transition-colors flex items-center">
                          <item.icon className="w-5 h-5" />
                        </span>
                        {item.name}
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-danger text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Profile Section Footer */}
      <div className={`p-4 border-t border-gray-100 shrink-0 bg-gray-50/50 flex ${isMinimized ? "justify-center" : "items-center"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0"
            title={currentUser?.name || "User"}
          >
            {role === "doctor" ? <Stethoscope className="w-5 h-5 text-primary" /> : avatarChar}
          </div>
          {!isMinimized && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">
                {currentUser?.name || "SmileCare User"}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold truncate">
                {role === "doctor" && currentUser?.specialties?.length > 0
                  ? `MDS - ${currentUser.specialties.join(", ")}`
                  : role === "doctor"
                    ? "Specialist Dentist"
                    : role === "patient"
                      ? (currentUser?.token || "Patient Account")
                      : `${roleLabel} Account`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}