"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDoctor } from "@/app/doctor/layout";
import DashboardHeader from "@/components/ui/doctor/dashboard/DashboardHeader";
import KpiCards from "@/components/ui/doctor/dashboard/KpiCards";

export default function DoctorDashboardPage() {
  const {
    patients,
    activePatientToken,
    queue,
    labOrders,
    activePatient,
    hasUrgentInQueue
  } = useDoctor();

  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Check if any required profile details are missing
          const isIncomplete = !user.dob || !user.phone || !user.address || !user.licence_id || !user.chair_setup || !user.board;
          setIsProfileIncomplete(isIncomplete);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Metrics
  const totalWaiting = queue.filter(q => q.status === "Waiting").length;
  const totalAlerts = Object.values(patients).filter(p => p.medicalAlerts.length > 0).length;
  const activeLabCount = labOrders.filter(l => l.status !== "Delivered").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <DashboardHeader />

      {/* Profile Incomplete Notification Banner */}
      {isProfileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <span>
              <strong>Profile Incomplete:</strong> Please update your profile details (Date of Birth, Phone, Address) and professional credentials (License ID, Chair Setup, Board) to complete your clinic account setup.
            </span>
          </div>
          <Link 
            href="/doctor/profile"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 text-center hover:scale-102"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards
        activePatientName={activePatient?.name}
        activePatientToken={activePatientToken}
        totalWaiting={totalWaiting}
        totalAlerts={totalAlerts}
        activeLabCount={activeLabCount}
        hasUrgentInQueue={hasUrgentInQueue}
      />
    </div>
  );
}
