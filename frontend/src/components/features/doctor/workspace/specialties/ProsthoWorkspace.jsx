"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function ProsthoWorkspace({ onSubmit }) {
  const [shade, setShade] = useState("A2");
  const [restoration, setRestoration] = useState("crown");
  const [material, setMaterial] = useState("zirconia");
  const [margin, setMargin] = useState("chamfer");
  const [labNotes, setLabNotes] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSubmit({
        selectedVitaShade: shade,
        restorationType: restoration === "crown" ? "Single Full-coverage Crown" : restoration === "bridge" ? "Fixed Partial Bridge" : "Laminate Veneer",
        crownMaterial: material === "zirconia" ? "Zirconia Monolithic" : material === "emax" ? "IPS e.max (Lithium Disilicate)" : "PFM (Porcelain Fused to Metal)",
        marginDesign: margin === "chamfer" ? "Chamfer Margin Prep" : "Shoulder Margin Prep",
        cadLabInstructions: labNotes.trim() || "Mill crown, optimize occlusal contact, return for cementation."
      }, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [shade, restoration, material, margin, labNotes]);

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">VITA Classic Shade selection</label>
          <select 
            value={shade}
            onChange={(e) => setShade(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="A1">A1 (Very Light)</option>
            <option value="A2">A2 (Standard/Natural)</option>
            <option value="A3">A3 (Slightly warm/reddish)</option>
            <option value="B1">B1 (Very white/bleach style)</option>
            <option value="C2">C2 (Grayish shade)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Restoration Framework</label>
          <select 
            value={restoration}
            onChange={(e) => setRestoration(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="crown">Single Crown (Full coverage)</option>
            <option value="bridge">Fixed Bridge (Multi-unit)</option>
            <option value="veneer">Laminate Veneer (Esthetic prep)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Material Composition</label>
          <select 
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="zirconia">Monolithic CAD/CAM Zirconia (High strength)</option>
            <option value="emax">IPS e.max Lithium Disilicate (High esthetics)</option>
            <option value="pfm">PFM (Porcelain Fused to Metal)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Prep Margin Design</label>
          <select 
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="chamfer">Chamfer Margin Prep (Standard)</option>
            <option value="shoulder">Shoulder Margin Prep (Aesthetic ceramic)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 block mb-1">Elite Lab Mill Instructions</label>
        <textarea 
          placeholder="e.g. Please optimize occlusal contact, shade mapping A2, return milled crown for clinical cementation trial." 
          value={labNotes}
          onChange={(e) => setLabNotes(e.target.value)}
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
