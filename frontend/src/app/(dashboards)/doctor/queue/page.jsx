"use client";

import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import LiveQueueTable from "@/components/features/doctor/queue/LiveQueueTable";

export default function DoctorQueuePage() {
  const {
    queue,
    patients,
    handleCallPatient,
    handleSkipPatient,
    handleRequeuePatient,
    handleRemovePatient
  } = useDoctor();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Queue Room</h1>
          <p className="text-sm text-gray-500 mt-1">Manage current patient appointments and active waiting list.</p>
        </div>
      </div>

      <LiveQueueTable
        queue={queue}
        patients={patients}
        onCallPatient={handleCallPatient}
        onSkipPatient={handleSkipPatient}
        onRequeuePatient={handleRequeuePatient}
        onRemovePatient={handleRemovePatient}
      />
    </div>
  );
}
