"use client";

import { useState } from "react";
import { X, Filter, Stethoscope, Sparkles } from "lucide-react";

export default function LiveQueueTable({
  queue = [],
  patients = {},
  onCallPatient,
  onSkipPatient,
  onRequeuePatient,
  onRemovePatient
}) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");

  // Extract all unique specialties across patients in queue
  const availableSpecialties = Array.from(
    new Set(
      queue
        .map((item) => {
          const pt = patients[item.token];
          return pt?.procedure || "General Dentistry";
        })
        .filter(Boolean)
    )
  );

  // Filter queue by selected specialty
  const filteredQueue = queue.filter((item) => {
    if (selectedSpecialty === "ALL") return true;
    const pt = patients[item.token];
    const spec = pt?.procedure || "General Dentistry";
    return spec.toLowerCase() === selectedSpecialty.toLowerCase();
  });

  const getSpecialtyBadgeStyle = (specName) => {
    const s = (specName || "").toLowerCase();
    if (s.includes("ortho")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (s.includes("general") || s.includes("dentistry") || s.includes("consult")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (s.includes("endo") || s.includes("patho")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    } else if (s.includes("surg") || s.includes("prosthe")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    } else if (s.includes("pediatric") || s.includes("pedo")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-sky-50 text-sky-700 border-sky-200";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit animate-fade-in space-y-0">
      {/* Table Header & Specialty Filter Tabs */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Active Checked-In Patients
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Queue room sorted across all doctor specialties
          </p>
        </div>

        {/* Multi-Specialty Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedSpecialty("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedSpecialty === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Specialties ({queue.length})
          </button>
          {availableSpecialties.map((spec) => {
            const count = queue.filter((i) => {
              const p = patients[i.token];
              return (p?.procedure || "General Dentistry").toLowerCase() === spec.toLowerCase();
            }).length;
            const isSelected = selectedSpecialty.toLowerCase() === spec.toLowerCase();
            return (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {spec} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Token</th>
              <th className="px-6 py-4">Patient details</th>
              <th className="px-6 py-4">Specialty / Procedure</th>
              <th className="px-6 py-4">Check-In Time</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredQueue.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-xs text-gray-400 font-semibold">
                  No patients found for specialty "{selectedSpecialty}". Waiting room is clear.
                </td>
              </tr>
            ) : (
              filteredQueue.map((item, index) => {
                const pt = patients[item.token];
                if (!pt) return null;
                const isWaiting = item.status === "Waiting";
                const isUrgent = item.priority === "Urgent";
                const specName = pt.procedure || "General Dentistry";
                return (
                  <tr
                    key={item.id || `${item.token}-${index}`}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      isUrgent ? "bg-red-50/[0.03]" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                        {item.token}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {pt.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">{pt.name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {pt.gender}, {pt.age} yrs
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getSpecialtyBadgeStyle(
                          specName
                        )}`}
                      >
                        <Sparkles className="w-3 h-3 opacity-70" />
                        {specName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{item.time}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          isUrgent
                            ? "bg-danger/10 text-danger border-danger/20"
                            : "bg-gray-100 text-gray-550 border-gray-200"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          isWaiting
                            ? "bg-primary/5 text-primary border-primary/20"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1 justify-end">
                        {isWaiting ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onCallPatient(item.token)}
                              className="px-3 py-1.5 bg-success/15 hover:bg-success/20 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-none"
                            >
                              Call to Chair
                            </button>
                            <button
                              type="button"
                              onClick={() => onSkipPatient(item.token)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-650 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer border-none"
                            >
                              Skip
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRequeuePatient(item.token)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-none"
                          >
                            Recall
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemovePatient(item.token)}
                          className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg cursor-pointer border-none bg-transparent"
                          title="Remove patient from queue"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
