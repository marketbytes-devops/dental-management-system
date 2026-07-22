"use client";

import { useState, useEffect } from "react";
import { FileSignature, X, CheckCircle2, User, Stethoscope, Clock, ShieldAlert, FileText } from "lucide-react";

export default function CustomConsentModal({
  isOpen,
  onClose,
  onConfirm,
  patientName = "",
  patientToken = "",
  doctorName = "",
  procedureName = "",
}) {
  const [procName, setProcName] = useState(procedureName);
  const [consentTitle, setConsentTitle] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [risksNotes, setRisksNotes] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    setProcName(procedureName);
    setConsentTitle(procedureName ? `Informed Consent for ${procedureName}` : "Custom Procedure Consent Form");
    setCustomDetails(`Detailed procedure summary for ${procedureName || "planned dental procedure"}.\n- Pre-op clinical evaluation completed.\n- Local anesthesia & isolation protocol will be administered.`);
    setRisksNotes("Post-procedure sensitivity, mild discomfort, or transient swelling may occur. Follow post-op instructions diligently.");
    
    const now = new Date();
    setCurrentDateTime(now.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }));
  }, [procedureName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!procName.trim()) {
      alert("Please enter a valid procedure name.");
      return;
    }

    const fullDetailsCombined = `${customDetails.trim()}\n\nRELEVANT RISKS & PRECAUTIONS:\n${risksNotes.trim()}`;

    onConfirm({
      procedure_name: procName.trim(),
      title: consentTitle.trim() || `Informed Consent for ${procName.trim()}`,
      custom_details: fullDetailsCombined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Custom Procedure Consent Form</h3>
              <p className="text-xs text-slate-400">Specify custom disclosure details for patient & front desk review.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-left">
          {/* Read-Only Context Details Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Patient Name
              </span>
              <span className="font-bold text-slate-800 truncate block mt-0.5" title={patientName}>{patientName || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" /> Patient Token ID
              </span>
              <span className="font-mono font-bold text-slate-800 block mt-0.5">{patientToken || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-slate-400" /> Doctor Name
              </span>
              <span className="font-bold text-slate-800 truncate block mt-0.5" title={doctorName}>{doctorName || "Dr. On Duty"}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Issued Date/Time
              </span>
              <span className="font-semibold text-slate-700 block mt-0.5 text-[11px]">{currentDateTime}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Procedure Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={procName}
                  onChange={(e) => setProcName(e.target.value)}
                  placeholder="e.g. Surgical Extraction of #38"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-primary focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Consent Document Title
                </label>
                <input
                  type="text"
                  value={consentTitle}
                  onChange={(e) => setConsentTitle(e.target.value)}
                  placeholder="e.g. Informed Consent for Surgical Extraction"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-primary focus:outline-none text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Major Clinical & Procedure Details
              </label>
              <textarea
                rows={4}
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Explain key steps of procedure, anesthetic method, required preparation..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Key Risks, Precautions & Post-Op Guidelines
              </label>
              <textarea
                rows={3}
                value={risksNotes}
                onChange={(e) => setRisksNotes(e.target.value)}
                placeholder="Detail potential risks, anesthetic reactions, bleeding expectations..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary focus:outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Notice & Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400 font-medium italic">
              Form will be dispatched to patient portal & receptionist front desk upon adding step.
            </p>
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Save & Attach Consent
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
