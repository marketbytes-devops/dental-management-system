"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function OrthoWorkspace({ onSubmit }) {
  const [skeletalClass, setSkeletalClass] = useState("class1");
  const [overjet, setOverjet] = useState("");
  const [overbite, setOverbite] = useState("");
  const [appliance, setAppliance] = useState("metal");
  const [archwire, setArchwire] = useState("");
  const [adjustments, setAdjustments] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSubmit({
        skeletalClassification: skeletalClass === "class1" ? "Class I Malocclusion" : skeletalClass === "class2div1" ? "Class II Div 1" : skeletalClass === "class2div2" ? "Class II Div 2" : "Class III Malocclusion",
        biteRelationships: `Overjet: ${overjet || "0"}mm, Overbite: ${overbite || "0"}mm`,
        applianceType: appliance === "metal" ? "Metal Brackets (Roth)" : appliance === "ceramic" ? "Ceramic Aesthetic Brackets" : "Clear Aligners (Invisalign)",
        archwireSpec: archwire || "0.014 NiTi Starter",
        visitActionNotes: adjustments.trim() || "Routine archwire adjustment/ligature tie replacement"
      }, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [skeletalClass, overjet, overbite, appliance, archwire, adjustments]);

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Skeletal / Malocclusion Class</label>
          <select 
            value={skeletalClass}
            onChange={(e) => setSkeletalClass(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="class1">Skeletal Class I (Normal orthognathic)</option>
            <option value="class2div1">Skeletal Class II Division 1 (Proclined anteriors)</option>
            <option value="class2div2">Skeletal Class II Division 2 (Retroclined anteriors)</option>
            <option value="class3">Skeletal Class III (Prognathic mandible)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Appliance Selection</label>
          <select 
            value={appliance}
            onChange={(e) => setAppliance(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="metal">Metal Brackets (0.022 Slot)</option>
            <option value="ceramic">Ceramic Aesthetic Brackets</option>
            <option value="aligners">Clear Aligners (Sequential Trays)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Overjet (mm)</label>
          <input 
            type="number" 
            placeholder="e.g. 2" 
            value={overjet}
            onChange={(e) => setOverjet(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Overbite (mm)</label>
          <input 
            type="number" 
            placeholder="e.g. 3" 
            value={overbite}
            onChange={(e) => setOverbite(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Active Archwire size</label>
          <input 
            type="text" 
            placeholder="e.g. 0.016 NiTi Upper / Lower" 
            value={archwire}
            onChange={(e) => setArchwire(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 block mb-1">Adjustment Action Details</label>
        <textarea 
          placeholder="e.g. Activated power chain, placed elastic hooks, engaged rectangular stainless steel wire..." 
          value={adjustments}
          onChange={(e) => setAdjustments(e.target.value)}
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
