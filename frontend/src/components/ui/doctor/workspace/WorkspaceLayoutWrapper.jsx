"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/doctor/layout";
import PatientSummaryBanner from "./PatientSummaryBanner";
import ToothChart from "./ToothChart";
import PrescriptionForm from "./PrescriptionForm";
import LabOrderForm from "./LabOrderForm";
import ClinicalNotes from "./ClinicalNotes";
import ReferralForm from "./ReferralForm";
import TimelineHistory from "./TimelineHistory";
import TreatmentPlanManager from "./TreatmentPlanManager";

// Registry
import { SPECIALTY_REGISTRY } from "./specialties/specialtyRegistry";

export default function WorkspaceLayoutWrapper({ specialtyId, children }) {
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
    handleToggleToothState,
    handleAddDraftMedicine,
    handleRemoveDraftMed,
    handleSavePrescription,
    handleSubmitLabOrder,
    handleSubmitDiagNote,
    handleSubmitSpecialtyLog,
    handleReferPatient,
    patients,
    handleCompleteConsultation
  } = useDoctor();

  if (!viewingPatient) {
    const patientList = Object.values(patients || {});
    return (
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-12 text-center max-w-2xl mx-auto space-y-6 animate-fadeIn my-8 text-left">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mx-auto">
          🏥
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-gray-900">No Patient in Chair</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Select a patient from the directory below to view their historical clinical sheet or manage their records.
          </p>
        </div>

        {patientList.length > 0 ? (
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Patient Directory</label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {patientList.map((pt) => (
                <button
                  key={pt.token}
                  onClick={() => setViewingPatientToken(pt.token)}
                  className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-xl transition-all cursor-pointer text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {pt.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{pt.name}</span>
                      <span className="text-[10px] text-gray-500 font-semibold">{pt.gender}, {pt.age} yrs • {pt.token}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {pt.procedure}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic text-center">No patients registered in the directory.</p>
        )}
      </div>
    );
  }

  const handleReturnToActivePatient = () => {
    setViewingPatientToken(activePatientToken);
  };

  const handleGoBack = () => {
    router.push("/doctor/dashboard");
  };

  // Centralized Save and Audit Stamp Formatter
  const handleSaveSpecialtyLog = (payload, isAutoSave = false) => {
    const doctorName = "Dr. Anoop Nair";
    const doctorSpecialty = "Endodontics"; // Logged-in doctor specialty credential
    const activeSheetLabel = SPECIALTY_REGISTRY[specialtyId]?.label || "General";

    // Format Clinical Audit line
    const auditStamp = `[${activeSheetLabel} Log] — entered by ${doctorName} (${doctorSpecialty}) via ${activeSheetLabel} sheet`;

    // Map object properties to bullet points
    const detailList = Object.entries(payload)
      .map(([key, val]) => `• ${key.replace(/([A-Z])/g, ' $1').trim()}: ${val}`)
      .join("\n");

    const fullEntryText = `${auditStamp}\n${detailList}`;

    // Submit to history timeline context with auto-save flag
    handleSubmitSpecialtyLog(fullEntryText, activeSheetLabel, isAutoSave);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
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
        onCompleteConsultation={handleCompleteConsultation}
      />

      {/* Tooth Chart Mapping - Full Width (No horizontal scroll on desktop) */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/10">
        <ToothChart
          teethChart={viewingPatient.teethChart}
          onToggleToothState={handleToggleToothState}
        />
      </div>

      {/* Main clinical sheet columns - No black/gray divider lines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 text-left">
        {/* Left Column (2/3 width) - Specialty Consultation Form, Prescriptions & Labs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Specialty Form Card Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-805 uppercase tracking-wider text-primary flex items-center gap-2">
                Active Form: {SPECIALTY_REGISTRY[specialtyId]?.label}
              </h3>
            </div>
            {/* Inject onSubmit callback to specialty form children */}
            {React.cloneElement(children, { onSubmit: handleSaveSpecialtyLog })}
          </div>

          {/* Patient Treatment Plan Section */}
          <TreatmentPlanManager patientToken={viewingPatient.token} />

          {/* Prescription & Lab Order Forms - Stacked for full width and alignment */}
          <div className="space-y-6">
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
        </div>

        {/* Right Column (1/3 width) - Daily Notes Form & Clinical History Timeline */}
        <div className="space-y-6">
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
