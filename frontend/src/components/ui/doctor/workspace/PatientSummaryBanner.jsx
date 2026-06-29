"use client";

import Link from "next/link";

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
      {/* Header Bar */}
      <div className="bg-primary/5 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              Clinical Sheet: {viewingPatient.name}
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded font-bold">
                Token {viewingPatient.token}
              </span>
            </h2>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
              Age: {viewingPatient.age} • Gender: {viewingPatient.gender} • Phone: {viewingPatient.phone}
            </p>
          </div>
        </div>

        {/* Workspace Controls */}
        <div className="flex items-center gap-2">
          {completedPatientHistory && completedPatientHistory.length > 0 && (
            <button
              onClick={onViewPreviousPatient}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
            >
              <span>📂</span> View Previous Patient
            </button>
          )}
          {!isHistorical && (
            <button
              onClick={onCompleteConsultation}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer outline-none border-none"
            >
              <span>✅</span> Complete Consultation
            </button>
          )}
          <button
            onClick={onCallNextPatient}
            className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-primary/10 cursor-pointer outline-none border-none"
          >
            <span>📢</span> Call Next Patient
          </button>
          <button
            onClick={onGoBack}
            className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer outline-none"
          >
            <span>←</span> Back
          </button>
        </div>
      </div>

      {/* Historical Review Mode Banner */}
      {isHistorical && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex justify-between items-center">
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
          <span className="text-lg mt-0.5">⚠️</span>
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

      {/* Chief Complaint overview */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chief Complaint</span>
            <p className="text-xs font-semibold text-gray-700 mt-1 leading-normal">{viewingPatient.chiefComplaint}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Planned Procedure</span>
            <p className="text-xs font-extrabold text-primary mt-1 flex items-center gap-1.5">🦷 {viewingPatient.procedure}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
