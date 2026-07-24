"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

export default function FrontDeskLandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const staffUser = localStorage.getItem("staff_user");
      if (staffUser) {
        try {
          const parsed = JSON.parse(staffUser);
          const roles = (parsed.roles || []).map(r => r.toLowerCase());

          if (roles.includes("receptionist") || roles.includes("admin")) {
            router.replace("/frontdesk/receptionist/dashboard");
          } else if (roles.includes("accountant")) {
            router.replace("/frontdesk/accountant/dashboard");
          } else {
            // Fallback if they somehow reached here without proper frontdesk roles
            router.replace("/login");
          }
        } catch (e) {
          console.error("Failed to parse staff_user", e);
        }
      }
    }
  }, [router]);

  return (
    <AuthGuard allowedRoles={["receptionist", "accountant"]} type="staff">
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4 font-semibold text-sm">Loading your workspace...</p>
      </div>
    </AuthGuard>
  );
}
