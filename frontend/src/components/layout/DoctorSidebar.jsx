"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const doctorNavItems = [
  { name: "Clinical Workspace", href: "/doctor", icon: "📊" },
  { name: "My Performance", href: "/doctor/performance", icon: "📈" }
];

export default function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="text-2xl">🦷</span> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Doctor
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Workspace</p>
          <ul className="space-y-1">
            {doctorNavItems.map((item) => {
              const isActive = pathname === item.href;
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
                    <span className="mr-3 text-lg opacity-70 group-hover:opacity-100">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Profile Section Footer */}
      <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-lg font-bold shrink-0">
            👨‍⚕️
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">Dr. Anoop Nair</span>
            <span className="text-[10px] text-gray-500 font-semibold truncate">MDS - Endodontist</span>
          </div>
        </div>
      </div>
    </div>
  );
}
