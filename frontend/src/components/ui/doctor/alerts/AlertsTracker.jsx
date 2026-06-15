"use client";

import { useState } from "react";

export default function AlertsTracker({
  patients = {},
  activePatient,
  activePatientToken,
  onAddAlert,
  onFocusProfile,
  newlyAddedIds = [],
  setNewlyAddedIds
}) {
  const [newAlertText, setNewAlertText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAlertText.trim()) return;
    onAddAlert(newAlertText.trim());
    setNewAlertText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">Today's Medical Alert Flag Tracker</h3>
          <p className="text-xs text-gray-505 font-semibold mt-0.5">Critical warnings regarding systemic illnesses or drug allergies</p>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.values(patients).map((p) => {
            const hasAlerts = p.medicalAlerts && p.medicalAlerts.length > 0;
            return (
              <div 
                key={p.token} 
                className={`p-5 flex justify-between items-start gap-4 transition-colors cursor-pointer hover:bg-gray-50/50 ${hasAlerts ? "bg-red-50/[0.01]" : ""}`}
                onClick={() => {
                  if (setNewlyAddedIds) {
                    setNewlyAddedIds(prev => prev.filter(id => id !== p.token));
                  }
                }}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                    hasAlerts ? "bg-danger/10 text-danger" : "bg-gray-100 text-gray-450"
                  }`}>
                    {hasAlerts ? "⚠️" : "🏥"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-955 flex items-center gap-2">
                      {p.name}
                      {newlyAddedIds.includes(p.token) && (
                        <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="New Alert Update" />
                      )}
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">{p.token}</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">{p.gender}, {p.age} yrs • {p.procedure}</p>
                    {hasAlerts ? (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {p.medicalAlerts.map((alert, idx) => (
                          <span key={idx} className="bg-red-50 text-danger border border-danger/10 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                            {alert}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded mt-2.5 inline-block">No Contraindications Found</span>
                    )}
                  </div>
                </div>
                {onFocusProfile && (
                  <button
                    onClick={() => onFocusProfile(p.token)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Focus Profile
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-1.5">
          <span>⚠️</span> Add Alert to Patient
        </h3>
        {activePatient ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-danger/5 rounded-xl border border-danger/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Target Patient</p>
                <p className="text-xs font-bold text-gray-900">{activePatient.name}</p>
              </div>
              <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded uppercase">{activePatientToken}</span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medical Condition / Allergy</label>
              <input
                type="text"
                value={newAlertText}
                onChange={(e) => setNewAlertText(e.target.value)}
                placeholder="e.g. Asthma, Penicillin Allergy..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-danger text-white font-bold rounded-xl text-xs hover:bg-danger/95 transition-colors shadow-sm cursor-pointer"
            >
              Flag Alert Warning
            </button>
          </form>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-6">No patient is currently active in the dental chair.</p>
        )}
      </div>
    </div>
  );
}
