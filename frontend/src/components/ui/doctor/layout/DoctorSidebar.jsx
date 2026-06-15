"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, ClipboardList, Users, AlertTriangle, Microscope, TrendingUp, Stethoscope, Share2,
  Pill, Award, ShieldAlert, Scissors, Sparkles, ChevronLeft, ChevronRight
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";
import { useDoctor } from "@/app/doctor/layout";

const doctorNavItems = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
  { 
    name: "Clinical Workspace", 
    href: "/doctor/workspace", 
    icon: ClipboardList,
    subItems: [
      { name: "General Dentistry", href: "/doctor/workspace/general", icon: Stethoscope },
      { name: "Endodontics", href: "/doctor/workspace/endodontics", icon: Pill },
      { name: "Orthodontics", href: "/doctor/workspace/orthodontics", icon: Award },
      { name: "Periodontics", href: "/doctor/workspace/periodontics", icon: ShieldAlert },
      { name: "Oral Surgery", href: "/doctor/workspace/surgery", icon: Scissors },
      { name: "Prosthodontics", href: "/doctor/workspace/prosthodontics", icon: Sparkles }
    ]
  },
  { name: "Live Queue", href: "/doctor/queue", icon: Users },
  { name: "Medical Alerts", href: "/doctor/alerts", icon: AlertTriangle },
  { name: "Pending Labs", href: "/doctor/labs", icon: Microscope },
  { name: "Referrals", href: "/doctor/referrals", icon: Share2 },
  { name: "My Performance", href: "/doctor/performance", icon: TrendingUp }
];

export default function DoctorSidebar({ isMinimized = false, onToggleMinimize }) {
  const pathname = usePathname();
  const { notifications = [] } = useDoctor();
  const [openWorkspace, setOpenWorkspace] = useState(false);

  const getUnreadCount = (href) => {
    return notifications
      ? notifications.filter(n => n.status === "unread" && n.link === href).length
      : 0;
  };

  // Auto-expand dropdown if pathname is on a clinical workspace sub-route
  useEffect(() => {
    if (pathname && pathname.startsWith("/doctor/workspace")) {
      setOpenWorkspace(true);
    }
  }, [pathname]);

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full shadow-sm transition-all duration-300 relative ${isMinimized ? "w-16" : "w-64"}`}>
      {/* Floating Toggle Button */}
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

      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 ${isMinimized ? "justify-center px-2" : "justify-start px-6 gap-2"}`}>
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary shrink-0" strokeWidth={2.5} />
          {!isMinimized && <span>SmileCare</span>}
        </span>
        {!isMinimized && (
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
            Doctor
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-4">
          {!isMinimized && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Workspace</p>
          )}
          <ul className="space-y-1">
            {doctorNavItems.map((item) => {
              const hasSubItems = !!item.subItems;
              const isParentActive = hasSubItems && pathname.startsWith(item.href);
              const isActive = !hasSubItems && pathname === item.href;

              if (hasSubItems) {
                return (
                  <li key={item.name} className="flex flex-col">
                    {isMinimized ? (
                      <div className="flex justify-center">
                        <Link
                          href="/doctor/workspace/general"
                          title={item.name}
                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all group cursor-pointer outline-none ${
                            isParentActive
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
                          onClick={() => setOpenWorkspace(!openWorkspace)}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg transition-colors group cursor-pointer outline-none ${
                            isParentActive
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
                            className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
                              openWorkspace ? "transform rotate-180" : ""
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
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            openWorkspace ? "max-h-[350px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                          }`}
                        >
                          <ul className="pl-4 space-y-1 border-l-2 border-gray-100 ml-5">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors group cursor-pointer outline-none ${
                                      isSubActive
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

              return (
                <li key={item.name} className="flex justify-center">
                  {isMinimized ? (
                    <Link
                      href={item.href}
                      title={item.name}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all group cursor-pointer outline-none relative ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {getUnreadCount(item.href) > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                          {getUnreadCount(item.href)}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-colors group cursor-pointer outline-none w-full ${
                        isActive
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
                      {getUnreadCount(item.href) > 0 && (
                        <span className="bg-danger text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                          {getUnreadCount(item.href)}
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0" title="Dr. Anoop Nair">
            <Stethoscope className="w-5 h-5" />
          </div>
          {!isMinimized && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">Dr. Anoop Nair</span>
              <span className="text-[10px] text-gray-500 font-semibold truncate">MDS - Endodontist</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
