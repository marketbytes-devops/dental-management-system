"use client";

import { useState, useEffect } from "react";
import { X, Stethoscope, User, FileText, Check, Plus, Trash2, ShieldCheck, Share2 } from "lucide-react";

export default function SpecialtySheetModal({
  isOpen,
  onClose,
  referral,
  patient,
  currentDoctorName,
  onCompleteConsultation
}) {
  const [consultNotes, setConsultNotes] = useState("");
  const [medsList, setMedsList] = useState([]);
  const [currentMed, setCurrentMed] = useState({ name: "", dosage: "", duration: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (referral) {
      setConsultNotes(referral.myConsultationNotes || referral.doctor_b_notes || "");
      setMedsList(referral.myMedications || []);
    }
  }, [referral]);

  if (!isOpen || !referral) return null;

  const handleAddMed = () => {
    if (!currentMed.name.trim() || !currentMed.dosage.trim()) return;
    setMedsList(prev => [...prev, { ...currentMed, id: Date.now() }]);
    setCurrentMed({ name: "", dosage: "", duration: "" });
  };

  const handleRemoveMed = (medId) => {
    setMedsList(prev => prev.filter(m => m.id !== medId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consultNotes.trim()) return;
    setIsSubmitting(true);
    try {
      if (onCompleteConsultation) {
        const formattedMeds = medsList.map(m => ({
          medicine: m.name || m.medicine,
          schedule: m.dosage || m.schedule,
          timing: "As Directed",
          duration: m.duration || "5 Days"
        }));
        await onCompleteConsultation(referral.id, consultNotes.trim(), formattedMeds);
      }
      onClose();
    } catch (err) {
      console.error("Failed to complete consultation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-150 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Stethoscope className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Specialty Clinical Sheet</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-100 border border-indigo-300/30 uppercase">
                  {referral.speciality || "Specialist"}
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 font-medium mt-0.5">
                Read-only patient context from Main Doctor & Specialist Findings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
          
          {/* Read-Only Banner: Main Doctor Context */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-indigo-50/90 border border-indigo-200/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>READ-ONLY CONTEXT FROM MAIN DOCTOR</span>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                referral.status === "Completed"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
              }`}>
                Status: {referral.status || "Pending"}
              </span>
            </div>

            {/* Patient Header Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/90 border border-indigo-100 rounded-xl p-3 text-xs">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Patient Name</span>
                <span className="font-bold text-gray-900">{patient?.name || "Patient"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Age / Gender</span>
                <span className="font-semibold text-gray-800">{patient?.age || "N/A"} yrs • {patient?.gender || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
                <span className="font-semibold text-gray-800">{patient?.phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Patient Token</span>
                <span className="font-mono font-bold text-indigo-600">{referral.patientToken || referral.patient_token}</span>
              </div>
            </div>

            {/* Main Doctor Notes */}
            <div className="bg-white/90 border border-indigo-100 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-indigo-900">
                  Main Doctor: <span className="font-extrabold text-indigo-700">{referral.referredBy || "Doctor A"}</span>
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                  {referral.referred_by_specialty || "Referring Doctor"}
                </span>
              </div>
              
              <div className="pt-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Reason for Referral</span>
                <p className="font-semibold text-gray-900 mt-0.5 italic bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                  "{referral.reason}"
                </p>
              </div>

              {(referral.referred_from_notes || referral.clinicalNotes) && (
                <div className="pt-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Main Doctor's Diagnosis & Notes</span>
                  <p className="font-medium text-gray-800 mt-0.5 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {referral.referred_from_notes || referral.clinicalNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Specialist Consultation Section (Doctor B) */}
          {referral.status === "Pending" ? (
            <form onSubmit={handleSubmit} className="border border-gray-200 rounded-2xl p-4.5 bg-white space-y-4 shadow-xs">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" /> Specialist Findings & Consultation Response
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Specialist Diagnosis & Evaluation Notes
                </label>
                <textarea
                  rows={3}
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  placeholder="Enter your specialty diagnosis and treatment recommendations..."
                  className="w-full px-3.5 py-2.5 border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Prescriptions & Medications */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Specialty Prescriptions / Medications
                </label>

                {medsList.length > 0 && (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                    {medsList.map((med, idx) => (
                      <div key={med.id || idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800">
                          💊 {med.name || med.medicine} — {med.dosage || med.schedule} ({med.duration || "5 Days"})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(med.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Medicine (e.g. Amoxicillin)"
                    value={currentMed.name}
                    onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                    className="sm:col-span-5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none text-gray-800 focus:bg-white focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 1-0-1)"
                    value={currentMed.dosage}
                    onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                    className="sm:col-span-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none text-gray-800 focus:bg-white focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 5 Days)"
                    value={currentMed.duration}
                    onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                    className="sm:col-span-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none text-gray-800 focus:bg-white focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="sm:col-span-1 bg-indigo-600 text-white rounded-lg p-1.5 flex items-center justify-center hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : "Submit Specialty Consultation"}
                </button>
              </div>
            </form>
          ) : (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-wider">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>COMPLETED SPECIALTY CONSULTATION FINDINGS</span>
              </div>
              <div className="bg-white border border-emerald-100 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Specialist Notes</span>
                <p className="font-semibold text-gray-900">{referral.myConsultationNotes || referral.doctor_b_notes || "Consultation completed."}</p>
                
                {referral.myMedications && referral.myMedications.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Prescriptions</span>
                    <div className="space-y-1 mt-1">
                      {referral.myMedications.map((m, idx) => (
                        <div key={idx} className="text-xs font-medium text-gray-700">
                          💊 {m.medicine} — {m.schedule} for {m.duration}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
