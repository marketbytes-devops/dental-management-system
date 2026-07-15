"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function EndoWorkspace({ onSubmit }) {
  const [mb1, setMb1] = useState("");
  const [mb2, setMb2] = useState("");
  const [db, setDb] = useState("");
  const [palatal, setPalatal] = useState("");
  const [fileSystem, setFileSystem] = useState("rotary");
  const [irrigant, setIrrigant] = useState("naocl");
  const [masterCone, setMasterCone] = useState("");
  const [sealer, setSealer] = useState("bioceramic");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSubmit({
        canalWorkingLengths: `MB1: ${mb1 || "N/A"}mm, MB2: ${mb2 || "N/A"}mm, DB: ${db || "N/A"}mm, Palatal: ${palatal || "N/A"}mm`,
        instrumentation: fileSystem === "rotary" ? "Rotary Files (NiTi)" : fileSystem === "reciprocal" ? "Reciprocating Files" : "Manual Stainless Steel K-Files",
        irrigationProtocol: irrigant === "naocl" ? "NaOCl (5.25%) + EDTA activation" : "Chlorhexidine (2%) + Saline wash",
        masterConeSize: masterCone ? `#${masterCone}` : "Not obturated yet",
        obturationSealer: sealer === "bioceramic" ? "Bioceramic Sealer" : sealer === "ahplus" ? "AH Plus Resin Sealer" : "Zinc Oxide Eugenol Sealer"
      }, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [mb1, mb2, db, palatal, fileSystem, irrigant, masterCone, sealer]);

  return (
    <div className="space-y-4 text-left">
      <div>
        <label className="text-xs font-bold text-gray-500 block mb-2">Canal Working Lengths (Apex Locator measurements in mm)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-400 block mb-1">MB1 Canal</label>
            <input 
              type="text" 
              placeholder="e.g. 21.5" 
              value={mb1}
              onChange={(e) => setMb1(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 block mb-1">MB2 Canal</label>
            <input 
              type="text" 
              placeholder="e.g. 20.0" 
              value={mb2}
              onChange={(e) => setMb2(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 block mb-1">DB Canal</label>
            <input 
              type="text" 
              placeholder="e.g. 21.0" 
              value={db}
              onChange={(e) => setDb(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 block mb-1">Palatal/Lingual</label>
            <input 
              type="text" 
              placeholder="e.g. 22.5" 
              value={palatal}
              onChange={(e) => setPalatal(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Instrumentation File System</label>
          <select 
            value={fileSystem}
            onChange={(e) => setFileSystem(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="rotary">Rotary NiTi Files (e.g. Protaper)</option>
            <option value="reciprocal">Reciprocating Files (e.g. WaveOne)</option>
            <option value="manual">Manual Stainless Steel K-Files</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Irrigation Protocol</label>
          <select 
            value={irrigant}
            onChange={(e) => setIrrigant(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="naocl">Sodium Hypochlorite (5.25%) + EDTA</option>
            <option value="chx">Chlorhexidine (2.0%) + Saline rinse</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Master Cone (GP size & taper)</label>
          <input 
            type="text" 
            placeholder="e.g. #30 / 0.04 taper" 
            value={masterCone}
            onChange={(e) => setMasterCone(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">Obturation Sealer</label>
          <select 
            value={sealer}
            onChange={(e) => setSealer(e.target.value)}
            className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="bioceramic">Bioceramic Sealer (BioRoot RCS)</option>
            <option value="ahplus">AH Plus Resin Epoxy Sealer</option>
            <option value="zoe">Zinc Oxide Eugenol Sealer</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/5 border border-success/10 px-2 py-0.5 rounded-md">
          <span>✓</span> Auto-saved to patient timeline
        </span>
      </div>
    </div>
  );
}
