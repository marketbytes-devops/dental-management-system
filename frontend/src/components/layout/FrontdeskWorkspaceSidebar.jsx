"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calculator, Briefcase } from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";

export default function FrontdeskWorkspaceSidebar() {
  const pathname = usePathname();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const staffUser = localStorage.getItem("staff_user");
      if (staffUser) {
        try {
          const parsed = JSON.parse(staffUser);
          if (parsed.roles && Array.isArray(parsed.roles)) {
            setRoles(parsed.roles.map(r => r.toLowerCase()));
          }
        } catch (e) {
          console.error("Failed to parse staff_user", e);
        }
      }
    }
  }, []);

  const hasReceptionist = roles.includes("receptionist") || roles.includes("admin");
  const hasAccountant = roles.includes("accountant") || roles.includes("admin");

  // If the user doesn't have access to at least 2 distinct frontdesk roles, hide the sidebar to save space.
  if (!(hasReceptionist && hasAccountant)) {
    return null;
  }

  const workspaces = [];
  if (hasReceptionist) {
    workspaces.push({
      id: "receptionist",
      name: "Receptionist",
      icon: Users,
      href: "/frontdesk/receptionist/dashboard",
      colorClass: "text-blue-600 bg-blue-50 hover:bg-blue-100",
      activeClass: "bg-blue-600 text-white shadow-md shadow-blue-500/30"
    });
  }
  if (hasAccountant) {
    workspaces.push({
      id: "accountant",
      name: "Accountant",
      icon: Calculator,
      href: "/frontdesk/accountant/dashboard",
      colorClass: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
      activeClass: "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
    });
  }
  
  const isAccountantActive = pathname.startsWith("/frontdesk/accountant");
  const isReceptionistActive = pathname.startsWith("/frontdesk/receptionist");
  
  let roleLabel = "";
  if (isAccountantActive) roleLabel = "ACCOUNTANT";
  if (isReceptionistActive) roleLabel = "RECEPTIONIST";

  return (
    <div className="w-20 bg-[#0a0f1c] flex flex-col items-center h-full z-10 shrink-0">
      {/* Global Logo Header spanning both sidebars */}
      <div className="h-16 w-full shrink-0 bg-white border-b border-gray-100 flex items-center px-4 z-50 overflow-visible">
         <div className="flex items-center gap-2 w-64">
            <ToothIcon className="w-6 h-6 text-primary shrink-0" />
            <span className="font-bold text-lg text-primary">SmileCare</span>
            {roleLabel && (
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary uppercase ml-1">
                {roleLabel}
              </span>
            )}
         </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center gap-4 w-full px-3 mt-4">
        {workspaces.map((ws) => {
          const isActive = pathname.startsWith(`/frontdesk/${ws.id}`);
          
          return (
            <Link
              key={ws.id}
              href={ws.href}
              title={ws.name}
              className={`flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all duration-300 group cursor-pointer outline-none
                ${isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <ws.icon className={`w-6 h-6 mb-1 ${isActive ? "text-white" : ""}`} />
              <span className={`text-[9px] font-bold ${isActive ? "text-white" : ""}`}>
                {ws.id === "receptionist" ? "Front Desk" : "Finance"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
