"use client";

import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/doctor/layout";
import PatientSummaryBanner from "@/components/ui/doctor/workspace/PatientSummaryBanner";
import ToothChart from "@/components/ui/doctor/workspace/ToothChart";
import PrescriptionForm from "@/components/ui/doctor/workspace/PrescriptionForm";
import LabOrderForm from "@/components/ui/doctor/workspace/LabOrderForm";
import ClinicalNotes from "@/components/ui/doctor/workspace/ClinicalNotes";
import ReferralForm from "@/components/ui/doctor/workspace/ReferralForm";
import TimelineHistory from "@/components/ui/doctor/workspace/TimelineHistory";

export default function DoctorWorkspacePage() {
  const router = useRouter();
  const {
    viewingPatient,
    activePatientToken,
    completedPatientHistory,
    rxDraft,
    showNotification,
    handleViewPreviousPatient,
    handleCallNextPatient,
    simulateEmergencyCheckin,
    setViewingPatientToken,
    patients,
    handleToggleToothState,
    handleAddDraftMedicine,
    handleRemoveDraftMed,
    handleSavePrescription,
    handleSubmitLabOrder,
    handleSubmitDiagNote,
    handleReferPatient
  } = useDoctor();

  if (!viewingPatient) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-12 text-center text-gray-400 font-semibold">
        No active patient session found. Load a patient from the queue.
      </div>
    );
  }

  const handleReturnToActivePatient = () => {
    setViewingPatientToken(activePatientToken);
  };

  const handleGoBack = () => {
    router.push("/doctor/dashboard");
  };

  return (
    <div className="bg-white border border-gray-155 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      {/* Patient Summary & Safety Banner */}
      <PatientSummaryBanner
        viewingPatient={viewingPatient}
        activePatientToken={activePatientToken}
        completedPatientHistory={completedPatientHistory}
        onViewPreviousPatient={handleViewPreviousPatient}
        onCallNextPatient={handleCallNextPatient}
        onSimulateEmergency={simulateEmergencyCheckin}
        onReturnToActivePatient={handleReturnToActivePatient}
        onGoBack={handleGoBack}
      />

      {/* Main clinical sheet columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-150">
        {/* Left Column (2/3 width) - Charts & prescriptions & lab request */}
        <div className="lg:col-span-2 p-6 space-y-6">
          {/* Tooth Chart Mapping */}
          <ToothChart
            teethChart={viewingPatient.teethChart}
            onToggleToothState={handleToggleToothState}
          />

          {/* Medicines Prescription Form */}
          <PrescriptionForm
            rxDraft={rxDraft}
            onAddMedicine={handleAddDraftMedicine}
            onRemoveDraftMed={handleRemoveDraftMed}
            onSavePrescription={handleSavePrescription}
            showNotification={showNotification}
          />

          {/* Restorative Lab Order Request */}
          <LabOrderForm
            onSubmitLabOrder={handleSubmitLabOrder}
          />
        </div>

        {/* Right Column (1/3 width) - Daily Notes Form & Clinical History Timeline */}
        <div className="p-6 space-y-6">
          {/* Add Diagnosis Clinical Notes Form */}
          <ClinicalNotes
            onSubmitDiagNote={handleSubmitDiagNote}
          />

          {/* Outgoing Specialist Referral Form */}
          <ReferralForm
            patientToken={viewingPatient.token}
            onReferPatient={handleReferPatient}
          />

          {/* Patient Clinical History Timeline */}
          <TimelineHistory
            timeline={viewingPatient.timeline}
          />
        </div>
      </div>
    </div>
  );
}
