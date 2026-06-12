"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

const clinicDoctors = [
  { id: "doc-1", name: "Dr. Sarah Jenkins", speciality: "Orthodontics" },
  { id: "doc-2", name: "Dr. James Kurt", speciality: "Oral Surgery" },
  { id: "doc-3", name: "Dr. Lisa Wong", speciality: "Pediatric Dentistry" },
  { id: "doc-4", name: "Dr. Marcus Vance", speciality: "Periodontics" },
  { id: "doc-5", name: "Dr. Jane Miller", speciality: "Prosthodontics" }
];

export default function ReferralForm({ patientToken, onReferPatient }) {
  const [selectedDoctor, setSelectedDoctor] = useState(
    `${clinicDoctors[0].name} - ${clinicDoctors[0].speciality}`
  );
  const [reasonInput, setReasonInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reasonInput.trim()) return;
    
    onReferPatient(patientToken, selectedDoctor, reasonInput.trim());
    setReasonInput("");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Share2 className="w-4 h-4 text-primary" /> Refer to Specialist Doctor
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Specialist Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {clinicDoctors.map((doc) => (
              <option key={doc.id} value={`${doc.name} - ${doc.speciality}`}>
                {doc.name} ({doc.speciality})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reason for Referral</label>
          <textarea
            rows={2}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="Write clinical justification or request for evaluation..."
            className="w-full px-4 py-2 bg-gray-55 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder:text-gray-400"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
          >
            Refer Patient
          </button>
        </div>
      </form>
    </div>
  );
}
