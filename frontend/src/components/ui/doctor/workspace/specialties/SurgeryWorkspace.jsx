"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function SurgeryWorkspace({ onSubmit }) {
  const [anesthesia, setAnesthesia] = useState("local");
  const [procType, setProcType] = useState("extraction");
  const [implantBrand, setImplantBrand] = useState("");
  const [torque, setTorque] = useState("");
  const [isq, setIsq] = useState("");
  const [sutures, setSutures] = useState("");
  const [vitalsChecked, setVitalsChecked] = useState(false);

  useEffect(() => {
    if (!vitalsChecked) return;

    const delayDebounceFn = setTimeout(() => {
      onSubmit({
        surgicalAnesthesia: anesthesia === "local" ? "Local Anesthesia (Lignocaine 2% + 1:80000 Adrenaline)" : anesthesia === "general" ? "General Anesthesia under ventilation" : "Conscious IV Sedation",
        surgicalProcedure: procType === "extraction" ? "Simple Tooth Extraction" : procType === "impacted" ? "Surgical Extraction (Osteotomy & Odontosection)" : "Dental Implant Stage 1 Placement",
        implantSpecs: procType === "implant" ? `Brand: ${implantBrand || "N/A"}, Insertion Torque: ${torque || "0"} N-cm, Stability ISQ: ${isq || "0"}` : "N/A (Non-Implant Case)",
        sutureDetails: sutures ? `Sutures Placed: ${sutures}` : "No sutures required",
        surgicalSafetyLog: "Pre-op vitals verified. Post-operative instructions given."
      }, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [anesthesia, procType, implantBrand, torque, isq, sutures, vitalsChecked]);

  return (
    <div className="space-y-4 text-left">
      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
        <input 
          type="checkbox" 
          checked={vitalsChecked}
          onChange={(e) => setVitalsChecked(e.target.checked)}
          className="w-4.5 h-4.5 rounded text-danger focus:ring-danger border-red-200 cursor-pointer"
        />
        <div>
          <span className="text-xs font-bold text-danger block">Pre-Operative Vitals Sign-off</span>
          <span className="text-[10px] text-gray-500 font-semibold">I verify the patient's Blood Pressure and blood sugar are within safe surgical parameters.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Anesthesia Administered</label>
          <select 
            value={anesthesia}
            onChange={(e) => setAnesthesia(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="local">Local Anesthesia (Lignocaine 2% w/ Adrenaline)</option>
            <option value="sedation">Conscious IV Sedation (Midazolam)</option>
            <option value="general">General Anesthesia (GA)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Procedure Category</label>
          <select 
            value={procType}
            onChange={(e) => setProcType(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="extraction">Simple Extraction (Forceps/Elevators)</option>
            <option value="impacted">Surgical Impaction Extraction (Sutures involved)</option>
            <option value="implant">Implant Placement (Stage 1 / Stage 2)</option>
          </select>
        </div>
      </div>

      {procType === "implant" && (
        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-gray-700 block">Dental Implant Placement Matrix</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 block mb-1">Implant Brand & Size</label>
              <input 
                type="text" 
                placeholder="e.g. Nobel Biocare Active 4.3x11.5" 
                value={implantBrand}
                onChange={(e) => setImplantBrand(e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 block mb-1">Torque (N-cm)</label>
              <input 
                type="number" 
                placeholder="e.g. 35" 
                value={torque}
                onChange={(e) => setTorque(e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 block mb-1">Stability Score (ISQ)</label>
              <input 
                type="number" 
                placeholder="e.g. 72" 
                value={isq}
                onChange={(e) => setIsq(e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-gray-500 block mb-1">Suturing Details (e.g., 3-0 Silk, 2 interrupted)</label>
        <input 
          type="text" 
          placeholder="e.g. 3-0 Black Braided Silk - 2 simple interrupted sutures" 
          value={sutures}
          onChange={(e) => setSutures(e.target.value)}
          className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        {vitalsChecked ? (
          <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/5 border border-success/10 px-2 py-0.5 rounded-md animate-pulse">
            <span>✓</span> Auto-saved to patient timeline
          </span>
        ) : (
          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            <span>⚠️</span> Pre-op vitals sign-off required to save log
          </span>
        )}
      </div>
    </div>
  );
}
