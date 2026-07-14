"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function GeneralWorkspace({ onSubmit }) {
  const [caries, setCaries] = useState("none");
  const [hygiene, setHygiene] = useState("good");
  const [scalingRequired, setScalingRequired] = useState(false);
  const [fluorideApplied, setFluorideApplied] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSubmit({
        cariesStatus: caries === "none" ? "No Caries Detected" : `Active Caries: ${caries}`,
        oralHygiene: hygiene.toUpperCase(),
        scalingAdvised: scalingRequired ? "Yes" : "No",
        fluorideTreatment: fluorideApplied ? "Completed" : "Not Indicated",
        generalRemarks: remarks.trim() || "No specific remarks"
      }, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [caries, hygiene, scalingRequired, fluorideApplied, remarks]);

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Caries Status</label>
          <select 
            value={caries}
            onChange={(e) => setCaries(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="none">No Cavities Detected</option>
            <option value="mild">Mild Caries (Enamel level)</option>
            <option value="moderate">Moderate Caries (Dentin level)</option>
            <option value="severe">Deep Caries (Pulp involvement)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Oral Hygiene Rating</label>
          <select 
            value={hygiene}
            onChange={(e) => setHygiene(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor (Heavy calculus/plaque)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={scalingRequired} 
            onChange={(e) => setScalingRequired(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-200"
          />
          <span className="text-xs font-semibold text-gray-700">Scaling & Prophylaxis Advised</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={fluorideApplied} 
            onChange={(e) => setFluorideApplied(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-200"
          />
          <span className="text-xs font-semibold text-gray-700">Fluoride Varnish Applied</span>
        </label>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 block mb-1">Clinical Remarks</label>
        <textarea 
          placeholder="Enter custom diagnostic findings or follow-up notes..." 
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
