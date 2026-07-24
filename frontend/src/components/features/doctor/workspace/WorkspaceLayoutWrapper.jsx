"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import PatientSummaryBanner from "./PatientSummaryBanner";
import ToothChart from "./ToothChart";
import PrescriptionForm from "./PrescriptionForm";
import LabOrderForm from "./LabOrderForm";
import ClinicalNotes from "./ClinicalNotes";
import ReferralForm from "./ReferralForm";
import TreatmentPlanManager from "./TreatmentPlanManager";
import { updateLabOrderStatus } from "@/services/api";

import { 
  FileText, 
  ClipboardList, 
  Pill, 
  Microscope, 
  TrendingUp, 
  Share2,
  Search,
  Upload,
  Download,
  X,
  Paperclip,
  Image,
  FileArchive
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

function WorkspaceLayoutWrapperInner({ specialtyId, children }) {
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
    handleUpdateLabOrder,
    handleSubmitDiagNote,
    handleReferPatient,
    patients,
    handleCompleteConsultation,
    labOrders,
    referrals,
    fetchLabOrders
  } = useDoctor() || {};

  // Specialty mapping configuration to procedures/treatments
  const SPECIALTY_PROCEDURES = {
    general: ["general dentistry", "consultation", "routine check-up", "follow-up check-up", "teeth cleaning", "scaling & polishing", "dental filling", "composite filling", "amalgam filling", "scaling and polishing", "teeth cleaning / polishing", "fluoride treatment", "sealants (pit and fissure)", "teeth whitening", "night guard / occlusal splint"],
    endodontics: ["endodontics", "root canal", "rct", "pulpotomy", "apicoectomy", "root canal treatment (rct)", "root canal treatment (rct) - single sitting", "root canal treatment (rct) - multiple sitting", "root canal retreatment"],
    orthodontics: ["orthodontics", "orthodontic", "braces", "braces - metal", "braces - self-ligating", "braces - ceramic", "clear aligners", "palatal expander (rme)", "space maintainer", "habit-breaking appliance", "retainer-only treatment", "retainer fitting", "orthodontic consultation"],
    periodontics: ["periodontics", "deep cleaning", "gum surgery", "scaling and root planing", "periodontal maintenance"],
    surgery: ["oral surgery", "surgery", "simple extraction", "surgical extraction (impacted tooth, wisdom tooth)", "orthognathic surgery", "tooth extraction", "wisdom tooth removal", "dental implant surgery", "biopsy"],
    prosthodontics: ["prosthodontics", "crown – single tooth", "bridge (multi-tooth)", "complete denture (full set)", "partial denture (removable)", "implant-supported crown/bridge", "veneers", "crown fitting", "bridge installation", "denture adjustment"]
  };

  const isPatientForSpecialty = (patient, specId) => {
    if (!patient || !specId) return false;
    const proc = (patient.procedure || "").toLowerCase();
    const validProcs = SPECIALTY_PROCEDURES[specId] || [];
    return validProcs.some(val => proc.includes(val) || val.includes(proc));
  };

  const searchParams = useSearchParams();
  const urlPatientToken = searchParams.get("patientToken");

  // Sync url patientToken with context viewing patient
  useEffect(() => {
    setViewingPatientToken(urlPatientToken || "");
  }, [urlPatientToken, setViewingPatientToken]);

  const effectiveViewingPatient = (urlPatientToken && patients[urlPatientToken] && isPatientForSpecialty(patients[urlPatientToken], specialtyId)) 
    ? patients[urlPatientToken] 
    : null;
  const effectiveActivePatientToken = isPatientForSpecialty(patients[activePatientToken], specialtyId) ? activePatientToken : "";

  const [searchTerm, setSearchTerm] = useState("");

  // Redirect to correct workspace specialty page if loaded patient doesn't match current specialtyId
  useEffect(() => {
    if (urlPatientToken && patients[urlPatientToken]) {
      const pt = patients[urlPatientToken];
      const proc = (pt.procedure || "").toLowerCase();
      let targetSpecialty = "general";
      for (const [specId, procs] of Object.entries(SPECIALTY_PROCEDURES)) {
        if (procs.some(val => proc.includes(val) || val.includes(proc))) {
          targetSpecialty = specId;
          break;
        }
      }
      if (targetSpecialty !== specialtyId) {
        router.replace(`/doctor/workspace/${targetSpecialty}?patientToken=${urlPatientToken}`);
      }
    }
  }, [urlPatientToken, specialtyId, router, patients]);

  // Selected active tab section
  const [activeKpiSection, setActiveKpiSection] = useState("diagnosis");

  // Toggle compose states
  const [showNewDiagForm, setShowNewDiagForm] = useState(false);
  const [showNewRefForm, setShowNewRefForm] = useState(false);
  const [showNewLabForm, setShowNewLabForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showNewPrescriptionForm, setShowNewPrescriptionForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  // Reset active tab and compose states when patient changes
  useEffect(() => {
    if (effectiveViewingPatient?.token) {
      setActiveKpiSection("diagnosis");
      setShowNewDiagForm(false);
      setShowNewRefForm(false);
      setShowNewLabForm(false);
      setEditingOrder(null);
      setShowNewPrescriptionForm(false);
      setExpandedNotes({});
    }
  }, [effectiveViewingPatient?.token]);

  // ── Reports Library state — must be declared before any early return ──
  const storageKey = effectiveViewingPatient?.token ? `patient_reports_${effectiveViewingPatient.token}` : null;
  const [patientReports, setPatientReports] = useState([]);
  const [pendingDesc, setPendingDesc] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setPatientReports(Array.isArray(saved) ? saved : []);
    } catch { setPatientReports([]); }
  }, [storageKey]);

  const handleFilesAdded = useCallback((files) => {
    const desc = pendingDesc.trim();
    const newEntries = Array.from(files).map(file => ({
      id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      description: desc,
      date: new Date().toISOString(),
      dataUrl: null,
    }));
    let loaded = 0;
    newEntries.forEach((entry, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newEntries[i].dataUrl = e.target.result;
        loaded += 1;
        if (loaded === newEntries.length) {
          setPatientReports(prev => {
            const next = [...(Array.isArray(prev) ? prev : []), ...newEntries];
            if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
            return next;
          });
        }
      };
      reader.readAsDataURL(files[i]);
    });
    setPendingDesc("");
  }, [pendingDesc, storageKey]);

  const handleDeleteReport = useCallback((id) => {
    setPatientReports(prev => {
      const next = (Array.isArray(prev) ? prev : []).filter(r => r.id !== id);
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const handleDownload = useCallback((report) => {
    const a = document.createElement("a");
    a.href = report.dataUrl;
    a.download = report.name;
    a.click();
  }, []);

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
    if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return <FileArchive className="w-4 h-4 text-amber-500" />;
    return <Paperclip className="w-4 h-4 text-gray-500" />;
  };

  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  // ── End Reports Library hooks ──

  if (!effectiveViewingPatient) {
    const patientList = Object.values(patients || {})
      .filter(pt => isPatientForSpecialty(pt, specialtyId))
      .filter(pt => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          (pt.name || "").toLowerCase().includes(term) ||
          (pt.token || "").toLowerCase().includes(term) ||
          (pt.procedure || "").toLowerCase().includes(term)
        );
      });
    return (
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-12 text-center max-w-2xl mx-auto space-y-6 animate-fadeIn my-8 text-left">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mx-auto">
          🏥
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-gray-900">No Patient in Chair</h3>
          <p className="text-sm text-gray-555 max-w-md mx-auto">
            Select a patient from the directory below to view their historical clinical sheet or manage their records.
          </p>
        </div>

        {/* Patient Directory Search Bar */}
        <div className="relative w-full max-w-md mx-auto">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search patient name, token ID, or procedure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 transition-all placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {patientList.length > 0 ? (
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Patient Directory</label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {patientList.map((pt) => (
                <button
                  key={pt.token}
                  onClick={() => {
                    router.push(`/doctor/workspace/${specialtyId}?patientToken=${pt.token}`);
                  }}
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
          <p className="text-xs text-gray-505 italic text-center">
            {searchTerm ? "No matching patients found in the directory." : "No patients registered in the directory."}
          </p>
        )}
      </div>
    );
  }

  const handleReturnToActivePatient = () => {
    if (effectiveActivePatientToken) {
      router.push(`/doctor/workspace/${specialtyId}?patientToken=${effectiveActivePatientToken}`);
    }
  };

  const handleGoBack = () => {
    router.push(`/doctor/workspace/${specialtyId}`);
  };

  // 1. Calculate Patient Statistics for Tabs
  const patientOrders = labOrders?.filter(o => o.patient_token === effectiveViewingPatient.token) || [];
  
  const diagnosisNotes = effectiveViewingPatient.timeline?.filter(event => 
    event.type === "Clinical Note" || event.type === "Consultation" || event.type === "Diagnosis" || event.type === "Treatment"
  ) || [];

  const patientRefs = referrals?.filter(r => r.patientToken === effectiveViewingPatient.token || r.patient_token === effectiveViewingPatient.token) || [];

  const prescriptionEvents = effectiveViewingPatient.timeline?.filter(event => 
    event.type === "Prescription"
  ) || [];

  const totalReports = patientReports.length;
  const totalDiagnosisNotes = diagnosisNotes.length;
  const totalPrescriptions = prescriptionEvents.length;
  const totalLabOrders = patientOrders.length;
  const planStepsProgress = effectiveViewingPatient.planStepsProgress || "Nill";
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
        viewingPatient={effectiveViewingPatient}
        activePatientToken={effectiveActivePatientToken}
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
          <div className="space-y-4 animate-scale-up">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 border border-gray-150 rounded-2xl shadow-xs">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" /> Reports Library
                </h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">X-rays, scans, blood tests, and any clinical files for this patient.</p>
              </div>
              {!showAddReport && (
                <button
                  type="button"
                  onClick={() => setShowAddReport(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer outline-none border-none"
                >
                  + Add Report
                </button>
              )}
            </div>

            {/* Add form — only visible when showAddReport */}
            {showAddReport && (
              <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 animate-scale-up">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Add New Report</span>
                  <button
                    type="button"
                    onClick={() => { setShowAddReport(false); setPendingDesc(""); }}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                  <input
                    type="text"
                    value={pendingDesc}
                    onChange={(e) => setPendingDesc(e.target.value)}
                    placeholder="e.g. Panoramic X-ray, Pre-op CBCT, Blood CBC…"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary transition-colors font-medium text-gray-700 placeholder:text-gray-300"
                  />
                </div>

                {/* File chooser */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">File</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setIsDragging(false);
                      if (e.dataTransfer.files?.length) { handleFilesAdded(e.dataTransfer.files); setShowAddReport(false); }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isDragging ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <Upload className={`w-6 h-6 ${isDragging ? "text-primary" : "text-gray-300"}`} />
                    <p className="text-xs font-bold text-gray-400">
                      {isDragging ? "Drop to upload" : "Click to browse or drag & drop"}
                    </p>
                    <p className="text-[10px] text-gray-350 font-medium">jpg, png, dcm, pdf, stl, zip and more</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="*/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleFilesAdded(e.target.files);
                        e.target.value = "";
                        setShowAddReport(false);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Uploaded files list */}
            {patientReports.length > 0 ? (
              <div className="space-y-2">
                {patientReports.map((report) => (
                  <div key={report.id} className="flex items-start gap-3 p-3.5 bg-white border border-gray-150 rounded-xl hover:bg-gray-50/50 transition-colors">
                    <div className="mt-0.5 shrink-0">{getFileIcon(report.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{report.name}</p>
                      {report.description && (
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">{report.description}</p>
                      )}
                      <p className="text-[9px] text-gray-350 font-semibold mt-1">
                        {new Date(report.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}{formatBytes(report.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(report)}
                        title="Download"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-500 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showAddReport && (
                <div className="text-center py-8 text-xs text-gray-400 font-medium italic">
                  No files uploaded yet for this patient.
                </div>
              )
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

                            {/* Prescribed Medications */}
                            {note.medications && note.medications.length > 0 && (
                              <div className="space-y-2 md:col-span-2 text-left pt-4 border-t border-gray-150 animate-fadeIn">
                                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">Prescribed Medications</span>
                                <div className="divide-y divide-gray-100 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden mt-1">
                                  {note.medications.map((med, mIdx) => (
                                    <div key={med.id || mIdx} className="flex justify-between items-center p-3 text-xs font-semibold text-gray-700 hover:bg-gray-100/50">
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        <span>
                                          <strong className="text-gray-900 font-bold">{med.medicine}</strong> ({med.schedule} • {med.timing} • {med.duration})
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                        <>
                          <p className="text-xs font-bold text-gray-850 mt-2 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                          {note.medications && note.medications.length > 0 && (
                            <div className="space-y-2 text-left pt-4 border-t border-gray-150 animate-fadeIn">
                              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">Prescribed Medications</span>
                              <div className="divide-y divide-gray-100 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden mt-1">
                                {note.medications.map((med, mIdx) => (
                                  <div key={med.id || mIdx} className="flex justify-between items-center p-3 text-xs font-semibold text-gray-700 hover:bg-gray-100/50">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                      <span>
                                        <strong className="text-gray-900 font-bold">{med.medicine}</strong> ({med.schedule} • {med.timing} • {med.duration})
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
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
          <div className="space-y-4 animate-scale-up">
            {/* Labs header */}
            <div className="flex justify-between items-center bg-white p-4 border border-gray-150 rounded-2xl shadow-xs">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-primary shrink-0" /> Outbound Lab Routing
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">Verify restorative and diagnostic routing cases.</p>
              </div>
              {!showNewLabForm && !editingOrder && (
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

            {editingOrder && (
              <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 animate-scale-up">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Edit Lab Case ({editingOrder.id})</span>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <LabOrderForm
                  initialOrder={editingOrder}
                  onSubmitLabOrder={async (payload) => {
                    try {
                      await handleUpdateLabOrder(editingOrder.id, payload);
                      setEditingOrder(null);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  onCancel={() => setEditingOrder(null)}
                />
              </div>
            )}

            {patientOrders.length > 0 ? (
              <div className="space-y-3 pt-2">
                {patientOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-150 rounded-xl bg-gray-50/20 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
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

                    <p className="font-bold text-sm text-gray-900 mb-2">
                      {order.prosthetic_type || order.fabrication_type || order.test_type || "Lab Case Request"}
                    </p>

                    {(order.order_category || order.orderCategory) !== "Diagnostic" ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
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
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                        {order.sample_type && <div><span className="font-semibold text-gray-400">Sample:</span> {order.sample_type}</div>}
                        {order.reason_for_test && <div className="col-span-2"><span className="font-semibold text-gray-400">Reason:</span> {order.reason_for_test}</div>}
                      </div>
                    )}

                    {order.notes && (
                      <p className="text-[10px] text-gray-500 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2">
                        <span className="font-bold text-gray-400 uppercase tracking-wider block mb-0.5 text-[8px] not-italic">Doctor's Notes:</span>
                        "{order.notes}"
                      </p>
                    )}
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
          <div className="space-y-4 animate-scale-up">
            {/* Treatment Plan Header with Add Button */}
            <div className="flex justify-between items-center bg-white p-4 border border-gray-150 rounded-2xl shadow-xs">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" /> Treatment Plan
                </h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Manage and track multi-step treatment plans for this patient.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/doctor/treatment-plan/${encodeURIComponent(viewingPatient.token)}`)}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer outline-none border-none"
              >
                + New Treatment Plan
              </button>
            </div>
            {/* Treatment Plan steps manager summary */}
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

export default function WorkspaceLayoutWrapper({ specialtyId, children }) {
  return (
    <Suspense fallback={
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-12 text-center text-gray-400 font-semibold animate-pulse">
        Loading workspace...
      </div>
    }>
      <WorkspaceLayoutWrapperInner specialtyId={specialtyId}>
        {children}
      </WorkspaceLayoutWrapperInner>
    </Suspense>
  );
}
