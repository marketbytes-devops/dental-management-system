
"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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