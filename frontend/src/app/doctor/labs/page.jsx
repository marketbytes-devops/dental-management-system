"use client";

import { useDoctor } from "@/app/doctor/layout";
import LabOrdersTable from "@/components/ui/doctor/labs/LabOrdersTable";

export default function DoctorLabsPage() {
  const {
    labOrders,
    patients,
    handleMarkLabDelivered,
    handleSubmitLabOrder,
    viewingPatientToken
  } = useDoctor();

  const activeLabCount = labOrders.filter(l => l.status !== "Delivered").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restorative Lab Workings</h1>
        <p className="text-sm text-gray-500 mt-1">Track shade fittings, zirconia millings, and denture fabrications.</p>
      </div>

      <LabOrdersTable
        labOrders={labOrders}
        patients={patients}
        activeLabCount={activeLabCount}
        onMarkLabDelivered={handleMarkLabDelivered}
        onSubmitLabOrder={handleSubmitLabOrder}
        viewingPatientToken={viewingPatientToken}
      />
    </div>
  );
}
