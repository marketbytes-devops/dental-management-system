"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/doctor/layout";
import PatientSummaryBanner from "./PatientSummaryBanner";
import ToothChart from "./ToothChart";
import PrescriptionForm from "./PrescriptionForm";
import LabOrderForm from "./LabOrderForm";
import ClinicalNotes from "./ClinicalNotes";
import ReferralForm from "./ReferralForm";
import TreatmentPlanManager from "./TreatmentPlanManager";

import { 
  FileText, 
  ClipboardList, 
  Pill, 
  Microscope, 
  TrendingUp, 
  Share2
} from "lucide-react";

const parseCustomDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  // Clean custom timeline suffixes
  const cleanStr = dateStr.replace(" (Today)", "").trim();
  
  if (cleanStr.includes("T") || (cleanStr.includes("-") && cleanStr.split("-")[0].length === 4)) {
    return new Date(cleanStr);
  }
  
  const spaceParts = cleanStr.split(" ");
  const dateParts = spaceParts[0].split("-");
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
    const year = parseInt(dateParts[2], 10);
    
    let hours = 0;
    let minutes = 0;
    
    if (spaceParts.length >= 2) {
      const timeParts = spaceParts[1].split(":");
      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        if (spaceParts.length >= 3 && spaceParts[2].toLowerCase() === "pm" && hours < 12) {
          hours += 12;
        } else if (spaceParts.length >= 3 && spaceParts[2].toLowerCase() === "am" && hours === 12) {
          hours = 0;
        }
      }
    }
    return new Date(year, month, day, hours, minutes);
  }
  return new Date(cleanStr);
};

const parseStructuredNote = (noteText) => {
  if (!noteText) return null;
  if (!noteText.includes("[Chief Complaint]:") && !noteText.includes("[Medical History]:")) {
    return null;
  }
  
  const getValue = (key) => {
    const regex = new RegExp(`\\[${key}\\]:\\s*([\\s\\S]*?)(?=\\n\\[|$)`);
    const match = noteText.match(regex);
    return match ? match[1].trim() : "N/A";
  };

  return {
    chiefComplaint: getValue("Chief Complaint"),
    medicalHistory: getValue("Medical History"),
    dentalHistory: getValue("Dental History"),
    vitalsBP: getValue("Vitals BP"),
    allergies: getValue("Allergies"),
    consultationNote: getValue("Consultation Note")
  };
};

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
    handleSaveDirectPrescription,
    handleSubmitLabOrder,
    handleSubmitDiagNote,
    handleReferPatient,
    patients,
    handleCompleteConsultation,
    labOrders,
    referrals
  } = useDoctor();

  // Selected active tab section
  const [activeKpiSection, setActiveKpiSection] = useState("diagnosis");

  // Toggle compose states
  const [showNewDiagForm, setShowNewDiagForm] = useState(false);
  const [showNewRefForm, setShowNewRefForm] = useState(false);
  const [showNewLabForm, setShowNewLabForm] = useState(false);
  const [showNewPrescriptionForm, setShowNewPrescriptionForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  // Reset active tab and compose states when patient changes
  useEffect(() => {
    if (viewingPatient?.token) {
      setActiveKpiSection("diagnosis");
      setShowNewDiagForm(false);
      setShowNewRefForm(false);
      setShowNewLabForm(false);
      setShowNewPrescriptionForm(false);
      setExpandedNotes({});
    }
  }, [viewingPatient?.token]);

  if (!viewingPatient) {
    const patientList = Object.values(patients || {});
    return (
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-12 text-center max-w-2xl mx-auto space-y-6 animate-fadeIn my-8 text-left">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mx-auto">
          🏥
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-gray-900">No Patient in Chair</h3>
          <p className="text-sm text-gray-550 max-w-md mx-auto">
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
                      <span className="text-[10px] text-gray-550 font-semibold">{pt.gender}, {pt.age} yrs • {pt.token}</span>
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
          <p className="text-xs text-gray-505 italic text-center">No patients registered in the directory.</p>
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

  // 1. Calculate Patient Statistics for Tabs
  const patientOrders = labOrders?.filter(o => o.patient_token === viewingPatient.token) || [];
  
  const diagnosisNotes = viewingPatient.timeline?.filter(event => 
    event.type === "Clinical Note" || event.type === "Consultation" || event.type === "Diagnosis" || event.type === "Treatment"
  ) || [];

  const patientRefs = referrals?.filter(r => r.patientToken === viewingPatient.token || r.patient_token === viewingPatient.token) || [];

  const prescriptionEvents = viewingPatient.timeline?.filter(event => 
    event.type === "Prescription"
  ) || [];

  const totalReports = patientOrders.length;
  const totalDiagnosisNotes = diagnosisNotes.length;
  const totalPrescriptions = prescriptionEvents.length;
  const totalLabOrders = patientOrders.length;
  const planStepsProgress = viewingPatient.planStepsProgress || "Nill";
  const totalReferrals = patientRefs.length;

  // Tab definitions
  const TABS = [
    { id: "diagnosis", label: "Diagnosis & Logs", icon: <ClipboardList className="w-4 h-4" />, stat: totalDiagnosisNotes },
    { id: "plan", label: "Treatment Plan", icon: <TrendingUp className="w-4 h-4" />, stat: planStepsProgress },
    { id: "labs", label: "Lab Orders", icon: <Microscope className="w-4 h-4" />, stat: totalLabOrders },
    { id: "reports", label: "Reports Library", icon: <FileText className="w-4 h-4" />, stat: totalReports },
    { id: "referral", label: "Referrals", icon: <Share2 className="w-4 h-4" />, stat: totalReferrals }
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in pb-10">
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
        labOrders={labOrders}
      />

      {/* Sleek Horizontal Navigation Tab Bar */}
      <div className="bg-gray-50/50 border-b border-gray-150 px-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeKpiSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveKpiSection(tab.id)}
              className={`py-4 px-4 text-xs font-black transition-all border-b-2 relative cursor-pointer outline-none shrink-0 flex items-center gap-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                isActive ? "bg-primary/10 text-primary" : "bg-gray-150 text-gray-500"
              }`}>
                {tab.stat}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main clinical sheet single-column body */}
      <div className="w-full p-6 space-y-6 text-left">
        {activeKpiSection === "reports" && (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Patient Reports Library
                </h3>
                <p className="text-[10px] text-gray-555 mt-0.5 font-medium">STL files, digital scans, and pathological blood test results.</p>
              </div>
            </div>
            {patientOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-150 rounded-xl space-y-2 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-extrabold">{order.id}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        order.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-warning/10 text-warning"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{order.prosthetic_type || order.test_type || "Lab Fabrication"}</p>
                    <p className="text-[10px] text-gray-550 font-semibold">Lab: {order.lab_name || "Apex Dental Lab"} • Due: {order.due_date || "N/A"}</p>
                    {order.notes && (
                      <p className="text-[10px] text-gray-400 italic bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                        Notes: {order.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-505 font-medium italic">
                No clinical reports or lab requests found for this patient.
              </div>
            )}
          </div>
        )}

        {activeKpiSection === "diagnosis" && (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> Diagnostic & Consultation History
                </h3>
                <p className="text-[10px] text-gray-550 font-semibold mt-0.5">Past records from all consulting doctors.</p>
              </div>
              
              {!showNewDiagForm && (
                <button
                  type="button"
                  onClick={() => setShowNewDiagForm(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer outline-none border-none"
                >
                  + New Diagnosis
                </button>
              )}
            </div>

            {showNewDiagForm && (
              <ClinicalNotes
                onCancel={() => setShowNewDiagForm(false)}
                onSubmitDiagNote={async (noteText, prescribedMeds) => {
                  await handleSubmitDiagNote(noteText, prescribedMeds);
                  setShowNewDiagForm(false);
                }}
              />
            )}

            {diagnosisNotes.length > 0 ? (
              <div className="space-y-4 pt-2">
                {diagnosisNotes.map((note, idx) => {
                  const parsed = parseStructuredNote(note.note);
                  const isExpanded = !!expandedNotes[idx];
                  const doctorName = note.doctor_name || "Dr. Nair";
                  const dateObj = parseCustomDate(note.date);
                  const formattedDate = dateObj && !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                    : note.date;
                  
                  if (parsed) {
                    const conditions = parsed.medicalHistory.split(",").map(c => c.trim()).filter(Boolean);
                    
                    return (
                      <div key={idx} className="bg-white border-b border-gray-100 text-gray-800 pb-5 pt-2 space-y-4 last:border-b-0 animate-scale-up text-left">
                        {/* Collapsed Header View */}
                        <div 
                          onClick={() => setExpandedNotes(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded font-black tracking-wider uppercase">{formattedDate}</span>
                            <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded tracking-wider">Consultation Log</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              <span className="text-gray-400 font-semibold mr-1">Chief Complaint:</span>
                              {parsed.chiefComplaint}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-gray-500 font-semibold">
                              Doctor: <strong className="text-gray-700 font-bold">{doctorName}</strong>
                            </span>
                            <button
                              type="button"
                              className="text-[10px] font-black text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-lg transition-colors cursor-pointer outline-none border-none"
                            >
                              {isExpanded ? "Collapse ▲" : "View Details ▼"}
                            </button>
                          </div>
                        </div>

                        {/* Detailed Expanded View */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 animate-fadeIn">
                            {/* Chief Complaint */}
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Chief complaint</span>
                              <p className="text-xs font-semibold text-gray-750 leading-relaxed">{parsed.chiefComplaint}</p>
                            </div>

                            {/* Medical History */}
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Medical history</span>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {conditions.map((cond, cIdx) => (
                                  <span key={cIdx} className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    {cond}
                                  </span>
                                ))}
                                {conditions.length === 0 && (
                                  <span className="text-[10px] text-gray-400 italic">None specified</span>
                                )}
                              </div>
                            </div>

                            {/* Dental History */}
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Dental history</span>
                              <p className="text-xs font-semibold text-gray-750 leading-relaxed">{parsed.dentalHistory}</p>
                            </div>

                            {/* Vitals / Allergies */}
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Vitals / allergies</span>
                              <div className="grid grid-cols-2 gap-3 pt-0.5">
                                <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-left">
                                  <span className="text-[8px] uppercase text-gray-450 block font-bold">BP Vitals</span>
                                  <span className="text-[10px] font-bold text-gray-750">{parsed.vitalsBP}</span>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-left">
                                  <span className="text-[8px] uppercase text-gray-450 block font-bold">Allergies</span>
                                  <span className="text-[10px] font-bold text-gray-750">{parsed.allergies}</span>
                                </div>
                              </div>
                            </div>

                            {/* Doctor's Consultation Notes */}
                            {parsed.consultationNote && parsed.consultationNote !== "N/A" && (
                              <div className="space-y-1 md:col-span-2">
                                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Doctor's / Consultation Note</span>
                                <p className="text-xs font-semibold text-gray-750 leading-relaxed whitespace-pre-wrap">{parsed.consultationNote}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Fallback for flat non-structured notes
                  return (
                    <div key={idx} className="pb-4 border-b border-gray-100 last:border-b-0 hover:opacity-95 transition-opacity">
                      <div 
                        onClick={() => setExpandedNotes(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="flex justify-between items-center cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-gray-100 text-gray-550 px-2.5 py-0.5 rounded font-black">{formattedDate}</span>
                          <span className="text-[9px] font-black uppercase text-primary tracking-wider">{note.type || "Clinical Note"}</span>
                        </div>
                        <span className="text-[10px] text-primary font-bold">{isExpanded ? "Collapse ▲" : "View Details ▼"}</span>
                      </div>
                      {isExpanded ? (
                        <p className="text-xs font-bold text-gray-805 mt-2 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                      ) : (
                        <p className="text-xs font-semibold text-gray-450 mt-1 truncate max-w-xl">{note.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500 font-medium italic">
                No previous diagnosis logs found for this patient.
              </div>
            )}
          </div>
        )}

        {activeKpiSection === "labs" && (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-indigo-650" /> Outgoing Lab Orders & Fabrications
                </h3>
                <p className="text-[10px] text-gray-555 mt-0.5 font-medium">Dental prosthetic orders and pathological test requisitions.</p>
              </div>
              
              {!showNewLabForm && (
                <button
                  type="button"
                  onClick={() => setShowNewLabForm(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer outline-none border-none"
                >
                  + New Lab Order
                </button>
              )}
            </div>

            {showNewLabForm && (
              <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 animate-scale-up">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Place New Lab Case</span>
                  <button
                    type="button"
                    onClick={() => setShowNewLabForm(false)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <LabOrderForm
                  onSubmitLabOrder={(payload) => {
                    handleSubmitLabOrder(payload);
                    setShowNewLabForm(false);
                  }}
                  onCancel={() => setShowNewLabForm(false)}
                />
              </div>
            )}

            {patientOrders.length > 0 ? (
              <div className="space-y-3 pt-2">
                {patientOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-150 rounded-xl bg-gray-50/20 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded font-black">{order.id}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          (order.order_category || order.orderCategory) === "Diagnostic" 
                            ? "bg-secondary/10 text-secondary" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {order.order_category || order.orderCategory || "Restoration"}
                        </span>
                        {order.priority && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            order.priority === "Urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {order.priority}
                          </span>
                        )}
                      </div>
                      
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        order.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-warning/10 text-warning"
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-gray-805">
                      <p className="font-bold text-sm text-gray-900">
                        {order.prosthetic_type || order.fabrication_type || order.test_type || "Lab Case Request"}
                      </p>
                      
                      {(order.order_category || order.orderCategory) !== "Diagnostic" ? (
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                          {order.tooth_number && <div><span className="font-semibold text-gray-400">Tooth #:</span> {order.tooth_number}</div>}
                          {order.material && <div><span className="font-semibold text-gray-400">Material:</span> {order.material}</div>}
                          {order.shade && <div><span className="font-semibold text-gray-400">Shade:</span> {order.shade}</div>}
                          {order.implant_system && <div><span className="font-semibold text-gray-400">Implant brand:</span> {order.implant_system}</div>}
                          {(order.scan_file || order.scanFile) ? (
                            <div className="col-span-2 text-emerald-600 font-medium">✓ Digital STL Scan uploaded</div>
                          ) : order.physical_mold_sent ? (
                            <div className="col-span-2 text-amber-600 font-medium">✏️ Physical restorative mold sent</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                          {order.sample_type && <div><span className="font-semibold text-gray-400">Sample:</span> {order.sample_type}</div>}
                          {order.reason_for_test && <div className="col-span-2"><span className="font-semibold text-gray-400">Reason:</span> {order.reason_for_test}</div>}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-550 font-medium pt-1">
                        Expected Return Date: <span className="font-black text-gray-700">{order.due_date || "3-5 Days"}</span>
                      </p>

                      {order.notes && (
                        <p className="text-[10px] text-gray-400 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          Special Instruction: {order.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-550 font-medium italic">
                No outbound lab orders found for this patient.
              </div>
            )}
          </div>
        )}

        {activeKpiSection === "plan" && (
          <div className="space-y-6 animate-scale-up">
            {/* Treatment Plan steps manager */}
            <TreatmentPlanManager patientToken={viewingPatient.token} />
          </div>
        )}

        {activeKpiSection === "referral" && (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-orange-655" /> Outgoing Specialist Referrals
                </h3>
                <p className="text-[10px] text-gray-550 mt-0.5 font-medium">Referred specialists, clinic facilities, and consultation status.</p>
              </div>
              
              {!showNewRefForm && (
                <button
                  type="button"
                  onClick={() => setShowNewRefForm(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer outline-none border-none"
                >
                  + New Referral
                </button>
              )}
            </div>

            {showNewRefForm && (
              <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 animate-scale-up">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Referral Form</span>
                  <button
                    type="button"
                    onClick={() => setShowNewRefForm(false)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <ReferralForm
                  patientToken={viewingPatient.token}
                  onReferPatient={(token, doctorStr, reason, type, facility) => {
                    handleReferPatient(token, doctorStr, reason, type, facility);
                    setShowNewRefForm(false);
                  }}
                />
              </div>
            )}

            {patientRefs.length > 0 ? (
              <div className="space-y-3 pt-2">
                {patientRefs.map((ref, idx) => (
                  <div key={idx} className="p-4 border border-gray-150 rounded-xl bg-gray-50/20 hover:bg-gray-55/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-gray-100 text-gray-550 px-2 py-0.5 rounded font-black">{ref.date || "Today"}</span>
                        <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded uppercase tracking-wider">
                          {ref.type || "Specialist"}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        ref.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {ref.status}
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-bold text-gray-900">
                        Target Specialist: <span className="text-primary font-black">{ref.targetDoctor || ref.target_doctor}</span>
                      </p>
                      {ref.facilityName && (
                        <p className="text-[10px] text-gray-550 font-semibold">Facility: {ref.facilityName}</p>
                      )}
                      <p className="text-xs font-semibold text-gray-700 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        Reason: {ref.reason}
                      </p>
                      
                      {ref.status === "Completed" && ref.myConsultationNotes && (
                        <div className="mt-3 p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Consultation Response Notes</p>
                          <p className="text-xs font-bold text-emerald-950 mt-1">{ref.myConsultationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500 font-medium italic">
                No outbound referrals found for this patient.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
