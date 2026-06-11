"use client";

import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/doctor/layout";
import AlertsTracker from "@/components/ui/doctor/alerts/AlertsTracker";

export default function DoctorAlertsPage() {
  const router = useRouter();
  const {
    patients,
    activePatient,
    activePatientToken,
    handleAddAlert,
    setViewingPatientToken
  } = useDoctor();

  const handleFocusProfile = (token) => {
    setViewingPatientToken(token);
    router.push("/doctor/workspace");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Safety Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor high-risk patient conditions and manage safety contraindications.</p>
      </div>

      <AlertsTracker
        patients={patients}
        activePatient={activePatient}
        activePatientToken={activePatientToken}
        onAddAlert={handleAddAlert}
        onFocusProfile={handleFocusProfile}
      />
    </div>
  );
}
