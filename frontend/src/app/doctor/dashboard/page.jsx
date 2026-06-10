"use client";

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

  // Metrics
  const totalWaiting = queue.filter(q => q.status === "Waiting").length;
  const totalAlerts = Object.values(patients).filter(p => p.medicalAlerts.length > 0).length;
  const activeLabCount = labOrders.filter(l => l.status !== "Delivered").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <DashboardHeader />

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
