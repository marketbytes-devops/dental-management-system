"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function PerioWorkspace({ onSubmit }) {
  const [pocketRange, setPocketRange] = useState("mild");
  const [bop, setBop] = useState("no");
  const [mobility, setMobility] = useState("none");
  const [treatment, setTreatment] = useState("srp");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSubmit({
        probingPocketsRange: pocketRange === "mild" ? "1-3mm (within physiological limits)" : pocketRange === "moderate" ? "4-5mm pockets noted (localized)" : "6+mm deep pockets noted (generalized periodontal bone loss)",
        bleedingOnProbing: bop === "no" ? "Absent" : bop === "localized" ? "Localized (under 30% of sites)" : "Generalized (over 30% of sites)",
        toothMobilityGrade: mobility === "none" ? "No mobility detected" : mobility === "grade1" ? "Grade I mobility" : mobility === "grade2" ? "Grade II mobility" : "Grade III mobility (requires extraction consideration)",
        plannedTreatment: treatment === "srp" ? "Scaling and Root Planing (SRP) under local anesthesia" : treatment === "surgery" ? "Periodontal Flap Surgery with bone graft" : "Periodontal Maintenance recall",
        treatmentDetails: remarks.trim() || "Prophylaxis completed. Coached on brushing technique."
      }, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pocketRange, bop, mobility, treatment, remarks]);

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Average Pocket Depths</label>
          <select 
            value={pocketRange}
            onChange={(e) => setPocketRange(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="mild">1 - 3 mm (Healthy/Gingivitis)</option>
            <option value="moderate">4 - 5 mm (Mild to Moderate Periodontitis)</option>
            <option value="severe">6 mm or greater (Severe Periodontitis)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Bleeding on Probing (BOP %)</label>
          <select 
            value={bop}
            onChange={(e) => setBop(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="no">BOP Absent</option>
            <option value="localized">BOP Localized (&lt; 30% of probing sites)</option>
            <option value="generalized">BOP Generalized (&gt; 30% of probing sites)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Tooth Mobility Classification</label>
          <select 
            value={mobility}
            onChange={(e) => setMobility(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="none">No Mobility (Normal physiological limits)</option>
            <option value="grade1">Grade I (Horizontal movement up to 1mm)</option>
            <option value="grade2">Grade II (Horizontal movement exceeding 1mm)</option>
            <option value="grade3">Grade III (Vertical + horizontal movement)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Recommended Therapy</label>
          <select 
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="srp">Deep Scaling & Root Planing (SRP)</option>
            <option value="surgery">Periodontal Pocket Flap Surgery</option>
            <option value="maintenance">Periodontal Maintenance Cleaning</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 block mb-1">Clinical Assessment / Dental Hygiene Notes</label>
        <textarea 
          placeholder="e.g. Performed ultrasonic scaling. Hand instrumentation using Gracey curettes. Plaque control instructions given." 
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows="2"
          className="w-full text-xs font-medium border border-gray-200 rounded-lg p-2.5 focus:border-primary focus:outline-none resize-none placeholder:text-gray-400"
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/5 border border-success/10 px-2 py-0.5 rounded-md">
          <span>✓</span> Auto-saved to patient timeline
        </span>
      </div>
    </div>
  );
}
