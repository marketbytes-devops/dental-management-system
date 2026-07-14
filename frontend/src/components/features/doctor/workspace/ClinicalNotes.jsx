"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Pill, Heart, FileText } from "lucide-react";
import { getLabInventory } from "@/services/api";

export default function ClinicalNotes({ onSubmitDiagNote, onCancel }) {
  // Clinical Parameters state
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [dentalHistory, setDentalHistory] = useState("");
  const [medicalConditions, setMedicalConditions] = useState(["Diabetes"]);
  const [newConditionInput, setNewConditionInput] = useState("");
  const [vitalsBP, setVitalsBP] = useState("");
  const [allergies, setAllergies] = useState("");
  const [consultationNote, setConsultationNote] = useState("");

  // Prescriptions state
  const [prescribedMeds, setPrescribedMeds] = useState([]);
  const [medName, setMedName] = useState("");
  const [customMedName, setCustomMedName] = useState("");
  const [showCustomMedInput, setShowCustomMedInput] = useState(false);
  const [medSchedule, setMedSchedule] = useState("1-0-1");
  const [medTiming, setMedTiming] = useState("After Food");
  const [medDuration, setMedDuration] = useState("5 days");

  // Pharmacy Inventory state
  const [pharmacyMeds, setPharmacyMeds] = useState([]);

  useEffect(() => {
    const fetchPharmacyMeds = async () => {
      try {
        const inventory = await getLabInventory();
        if (Array.isArray(inventory)) {
          const filtered = inventory.filter(
            (item) => item.category?.toLowerCase() === "clinical pharmacy"
          );
          setPharmacyMeds(filtered);
        }
      } catch (err) {
        console.warn("Failed to fetch pharmacy inventory:", err);
      }
    };
    fetchPharmacyMeds();
  }, []);

  const handleAddCondition = (e) => {
    e.preventDefault();
    if (newConditionInput.trim() && !medicalConditions.includes(newConditionInput.trim())) {
      setMedicalConditions([...medicalConditions, newConditionInput.trim()]);
      setNewConditionInput("");
    }
  };

  const handleRemoveCondition = (condToRemove) => {
    setMedicalConditions(medicalConditions.filter((c) => c !== condToRemove));
  };

  const handleAddMedication = (e) => {
    e.preventDefault();
    const finalMedName = showCustomMedInput ? customMedName.trim() : medName.trim();
    if (!finalMedName || finalMedName === "custom_manual_entry") return;

    const newMed = {
      id: `diag-med-${Date.now()}`,
      medicine: finalMedName,
      schedule: medSchedule,
      timing: medTiming,
      duration: medDuration
    };

    setPrescribedMeds([...prescribedMeds, newMed]);
    setMedName("");
    setCustomMedName("");
    setShowCustomMedInput(false);
    setMedSchedule("1-0-1");
    setMedTiming("After Food");
    setMedDuration("5 days");
  };

  const handleRemoveMedication = (medId) => {
    setPrescribedMeds(prescribedMeds.filter((m) => m.id !== medId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format structured note for backward-compatible storage
    const noteContent = [
      `[Chief Complaint]: ${chiefComplaint.trim() || "N/A"}`,
      `[Medical History]: ${medicalConditions.join(", ") || "None"}`,
      `[Dental History]: ${dentalHistory.trim() || "N/A"}`,
      `[Vitals BP]: ${vitalsBP.trim() || "N/A"}`,
      `[Allergies]: ${allergies.trim() || "N/A"}`,
      `[Consultation Note]: ${consultationNote.trim() || "N/A"}`
    ].join("\n");

    onSubmitDiagNote(noteContent, prescribedMeds);

    // Reset state
    setChiefComplaint("");
    setDentalHistory("");
    setMedicalConditions(["Diabetes"]);
    setNewConditionInput("");
    setVitalsBP("");
    setAllergies("");
    setConsultationNote("");
    setPrescribedMeds([]);
  };

  return (
    <div className="bg-white text-gray-800 space-y-6 pt-2">
      <div className="border-b border-gray-100 pb-3 flex justify-between items-center text-left">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">New Clinical consultation</h4>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Capture diagnostic parameters and prescribe medications.</p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer border-none bg-transparent"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Chief Complaint */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chief Complaint</label>
            <textarea
              rows={3}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Pain in lower left molar for 3 days"
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:border-primary/30 focus:bg-white placeholder:text-gray-300 resize-none font-medium leading-relaxed transition-colors"
              required
            />
          </div>

          {/* Medical History */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Medical History</label>
            
            {/* Condition Tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center mb-1">
              {medicalConditions.map((cond) => (
                <span 
                  key={cond} 
                  className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1.5 uppercase tracking-wider"
                >
                  {cond}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveCondition(cond)} 
                    className="hover:text-red-900 cursor-pointer text-[10px] font-black border-none bg-transparent"
                  >
                    ×
                  </button>
                </span>
              ))}
              {medicalConditions.length === 0 && (
                <span className="text-[10px] text-gray-400 italic">No medical conditions specified</span>
              )}
            </div>

            {/* Input condition */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newConditionInput}
                onChange={(e) => setNewConditionInput(e.target.value)}
                placeholder="e.g. Asthma, Hypertension"
                className="flex-1 px-3.5 py-2 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:bg-white placeholder:text-gray-300 font-medium"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 border-none text-[10px] font-black text-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Dental History */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dental History</label>
            <textarea
              rows={3}
              value={dentalHistory}
              onChange={(e) => setDentalHistory(e.target.value)}
              placeholder="e.g. RCT done on 46 in 2023"
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:border-primary/30 focus:bg-white placeholder:text-gray-300 resize-none font-medium leading-relaxed transition-colors"
            />
          </div>

          {/* Vitals / Allergies */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Vitals / Allergies</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Blood Pressure (BP)</span>
                <input
                  type="text"
                  value={vitalsBP}
                  onChange={(e) => setVitalsBP(e.target.value)}
                  placeholder="e.g. 120/80"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:bg-white placeholder:text-gray-300 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Known Allergies</span>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:bg-white placeholder:text-gray-300 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Doctor's Consultation Note (Full Width Row inside Grid - Col Span 2) */}
          <div className="space-y-1.5 text-left md:col-span-2">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              Doctor's Consultation notes
            </label>
            <textarea
              rows={3}
              value={consultationNote}
              onChange={(e) => setConsultationNote(e.target.value)}
              placeholder="Write direct clinical consultation insights, recommendations or observations here..."
              className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:border-primary/30 focus:bg-white placeholder:text-gray-300 resize-none font-medium leading-relaxed transition-colors"
            />
          </div>
        </div>

        {/* Quick Prescription Area (Optional Section) - Flattened with top border divider */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-left">
            <Pill className="w-4 h-4 text-primary" />
            <div>
              <h5 className="text-[10px] font-black text-gray-800 uppercase tracking-wider">Quick Prescription (Optional)</h5>
              <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Directly prescribe medicine for simple cases that do not need long-term clinical phases.</p>
            </div>
          </div>

          {/* Med inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Medicine Name</label>
              <select
                value={medName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom_manual_entry") {
                    setShowCustomMedInput(true);
                    setMedName("custom_manual_entry");
                  } else {
                    setShowCustomMedInput(false);
                    setMedName(val);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-850 rounded-xl text-xs focus:outline-none focus:bg-white font-semibold cursor-pointer"
              >
                <option value="">Select Medicine...</option>
                {pharmacyMeds.map((med) => (
                  <option key={med.id} value={med.name}>
                    {med.name}
                  </option>
                ))}
                <option value="custom_manual_entry">-- Enter Custom Medicine --</option>
              </select>

              {showCustomMedInput && (
                <input
                  type="text"
                  value={customMedName}
                  onChange={(e) => setCustomMedName(e.target.value)}
                  placeholder="Type custom medicine name..."
                  className="w-full mt-2 px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-850 rounded-xl text-xs focus:outline-none focus:bg-white placeholder:text-gray-300 font-medium animate-fadeIn"
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Dosage Schedule</label>
              <select
                value={medSchedule}
                onChange={(e) => setMedSchedule(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:bg-white font-semibold cursor-pointer"
              >
                <option value="1-0-1">1-0-1 (Morning & Night)</option>
                <option value="1-1-1">1-1-1 (Thrice daily)</option>
                <option value="1-0-0">1-0-0 (Morning only)</option>
                <option value="0-0-1">0-0-1 (Night only)</option>
                <option value="SOS">SOS (As needed)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Timing</label>
              <select
                value={medTiming}
                onChange={(e) => setMedTiming(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:bg-white font-semibold cursor-pointer"
              >
                <option value="After Food">After Food</option>
                <option value="Before Food">Before Food</option>
                <option value="With Food">With Food</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Duration</label>
              <input
                type="text"
                value={medDuration}
                onChange={(e) => setMedDuration(e.target.value)}
                placeholder="e.g. 5 days"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 text-gray-800 rounded-xl text-xs focus:outline-none focus:bg-white placeholder:text-gray-300 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddMedication}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-lg transition-all border-none cursor-pointer"
            >
              + Prescribe Medicine
            </button>
          </div>

          {/* List of currently prescribed meds in this case */}
          {prescribedMeds.length > 0 && (
            <div className="border-t border-gray-100 pt-3 space-y-2 text-left">
              <label className="text-[9px] font-bold text-gray-400 uppercase block">Prescribed Medicines List</label>
              <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl overflow-hidden">
                {prescribedMeds.map((med) => (
                  <div key={med.id} className="flex justify-between items-center p-3 text-xs font-semibold text-gray-700 hover:bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>
                        <strong className="text-gray-900 font-bold">{med.medicine}</strong> ({med.schedule} • {med.timing} • {med.duration})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(med.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full cursor-pointer transition-colors border-none bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-primary/95 border-none text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Save Diagnostic Record & Prescribe
          </button>
        </div>
      </form>
    </div>
  );
}
