
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import FrontdeskWorkspaceSidebar from "./FrontdeskWorkspaceSidebar";

export default function DashboardLayout({ children }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();
  const isFrontdesk = pathname && pathname.startsWith("/frontdesk");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isFrontdesk && <FrontdeskWorkspaceSidebar />}
      
      <Sidebar
        isMinimized={isMinimized}
        onToggleMinimize={() =>
          setIsMinimized((prev) => !prev)
        }
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}