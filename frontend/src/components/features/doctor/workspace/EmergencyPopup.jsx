"use client";

export default function EmergencyPopup({ emergencyAlert, onAcknowledge, onConsultFirst }) {
  if (!emergencyAlert) return null;

  return (
    <div className="fixed inset-0 bg-red-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-4 border-danger/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-danger text-white px-6 py-4 flex items-center gap-3">
          <span className="text-3xl animate-pulse">🚨</span>
          <div>
            <h3 className="font-extrabold text-lg uppercase tracking-wider">CRITICAL MEDICAL EMERGENCY</h3>
            <p className="text-[10px] text-red-155 font-bold">New patient checked in with URGENT priority</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Emergency Patient</span>
            <span className="text-sm font-extrabold text-gray-900 block">{emergencyAlert.name}</span>
            <span className="text-xs text-gray-500 font-semibold">{emergencyAlert.gender}, {emergencyAlert.age} yrs • Token {emergencyAlert.token}</span>
          </div>
          <div className="space-y-1.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-semibold">
            <span className="font-black block text-[10px] uppercase text-danger mb-1">Emergency Condition / Alerts</span>
            <p className="font-bold text-gray-800">Procedure: {emergencyAlert.procedure}</p>
            {emergencyAlert.medicalAlerts && emergencyAlert.medicalAlerts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {emergencyAlert.medicalAlerts.map((a, i) => (
                  <span key={i} className="bg-danger/10 px-2 py-0.5 rounded text-[9px] font-black uppercase">{a}</span>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-550 leading-relaxed font-medium">An emergency check-in occurred at the front desk. Do you want to pause your current clinical workspace and call this patient to the chair immediately?</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onAcknowledge}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-755 border border-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer outline-none"
          >
            Acknowledge & Continue
          </button>
          <button
            onClick={onConsultFirst}
            className="px-4 py-2 bg-danger text-white text-xs font-extrabold rounded-xl hover:bg-danger/95 transition-all shadow-md shadow-danger/20 cursor-pointer outline-none"
          >
            Consult Him First
          </button>
        </div>
      </div>
    </div>
  );
}
