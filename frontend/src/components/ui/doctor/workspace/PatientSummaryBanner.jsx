"use client";

import Link from "next/link";
import { User, Calendar, MessageSquare, ShieldAlert, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PatientSummaryBanner({
  viewingPatient,
  activePatientToken,
  completedPatientHistory,
  onViewPreviousPatient,
  onCallNextPatient,
  onSimulateEmergency,
  onReturnToActivePatient,
  onGoBack,
  onCompleteConsultation
}) {
  if (!viewingPatient) return null;

  const isHistorical = viewingPatient.token !== activePatientToken;

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Header Controls Bar */}
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoBack}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              Clinical sheet: {viewingPatient.name}
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                Token {viewingPatient.token}
              </span>
            </h2>
            <p className="text-[10px] text-gray-550 font-semibold mt-0.5">
              Phone: {viewingPatient.phone || "No contact info"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {completedPatientHistory && completedPatientHistory.length > 0 && (
            <button
              onClick={onViewPreviousPatient}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>📂</span> Previous Patient
            </button>
          )}
          {!isHistorical && (
            <button
              onClick={onCompleteConsultation}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer border-none"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete Consultation
            </button>
          )}
          <button
            onClick={onCallNextPatient}
            className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-primary/10 cursor-pointer border-none"
          >
            Call Next Patient <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Historical Review Mode Banner */}
      {isHistorical && (
        <div className="bg-amber-50 border-b border-amber-250 px-6 py-2.5 flex justify-between items-center">
          <p className="text-xs text-amber-800 font-bold flex items-center gap-2">
            <span>⚠️</span> Historical Review Mode: You are viewing a completed patient record. Click return to go back to active chair patient.
          </p>
          <button
            onClick={onReturnToActivePatient}
            className="text-xs font-black text-amber-900 underline hover:no-underline cursor-pointer"
          >
            Return to Active Patient
          </button>
        </div>
      )}

      {/* Persistent Safety Alerts Banner */}
      {viewingPatient.medicalAlerts && viewingPatient.medicalAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black text-danger uppercase tracking-wider block">Critical Safety Alerts</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {viewingPatient.medicalAlerts.map((alert, idx) => (
                <span key={idx} className="bg-red-100 text-danger text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-danger/10">
                  {alert}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Patient Info Dashboard Grid */}
      <div className="p-6 bg-gray-50/20 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Patient Card */}
          <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-2xs flex gap-3.5 items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider block">Patient Details</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">{viewingPatient.name}</p>
              <p className="text-[10px] text-gray-550 font-semibold mt-0.5">{viewingPatient.gender}, {viewingPatient.age} yrs</p>
            </div>
          </div>

          {/* Condition at Booking Card */}
          <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-2xs flex gap-3.5 items-center md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider block">Condition at Booking</span>
              <p className="text-xs font-extrabold text-gray-800 mt-1 truncate" title={viewingPatient.chiefComplaint}>
                {viewingPatient.chiefComplaint || "Routine consultation checkup"}
              </p>
              <p className="text-[9px] text-primary font-bold mt-0.5">Procedure: {viewingPatient.procedure}</p>
            </div>
          </div>

          {/* Last Visited Date Card */}
          <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-2xs flex gap-3.5 items-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider block">Last Visited Date</span>
              <p className="text-sm font-black text-purple-700 mt-1">
                {viewingPatient.lastVisitedDate || "Nill"}
              </p>
              <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                {viewingPatient.lastVisitedDate ? "Previous encounter date" : "First clinical visit"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
