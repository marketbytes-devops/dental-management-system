"use client";

import { useState } from "react";

export default function PrescriptionForm({
  rxDraft = [],
  onAddMedicine,
  onRemoveDraftMed,
  onSavePrescription,
  showNotification
}) {
  // Local form state
  const [rxMedicine, setRxMedicine] = useState("Amoxicillin 500mg");
  const [rxMorning, setRxMorning] = useState(true);
  const [rxNoon, setRxNoon] = useState(false);
  const [rxNight, setRxNight] = useState(true);
  const [rxTiming, setRxTiming] = useState("After Food");
  const [rxDurationVal, setRxDurationVal] = useState("5");
  const [rxDurationUnit, setRxDurationUnit] = useState("Days");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rxMedicine) return;

    const timings = [];
    if (rxMorning) timings.push("Morning 🌅");
    if (rxNoon) timings.push("Noon ☀️");
    if (rxNight) timings.push("Night 🌙");

    if (timings.length === 0) {
      if (showNotification) {
        showNotification("Please select at least one dosing time (Morning/Noon/Night).");
      }
      return;
    }

    const newItem = {
      id: Math.random(),
      medicine: rxMedicine,
      schedule: timings.join(" + "),
      timing: rxTiming,
      duration: `${rxDurationVal} ${rxDurationUnit}`
    };

    onAddMedicine(newItem);
  };

  return (
    <div className="border border-gray-150 rounded-xl p-5 bg-white">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <span>💊</span> Prescribe Medicines
      </h4>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl mb-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medicine Name</label>
          <select
            value={rxMedicine}
            onChange={(e) => setRxMedicine(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="Amoxicillin 500mg">Amoxicillin 500mg</option>
            <option value="Paracetamol 650mg">Paracetamol 650mg</option>
            <option value="Ibuprofen 400mg">Ibuprofen 400mg</option>
            <option value="Clindamycin 300mg">Clindamycin 300mg</option>
            <option value="Ketorolac DT 10mg">Ketorolac DT 10mg</option>
            <option value="Moxikind-CV 625">Moxikind-CV 625</option>
            <option value="Chlorhexidine Mouthwash">Chlorhexidine Mouthwash</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Timings</label>
          <div className="flex items-center gap-2 h-9 pt-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 select-none cursor-pointer">
              <input type="checkbox" checked={rxMorning} onChange={(e) => setRxMorning(e.target.checked)} className="accent-primary" />
              Morn
            </label>
            <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 select-none cursor-pointer">
              <input type="checkbox" checked={rxNoon} onChange={(e) => setRxNoon(e.target.checked)} className="accent-primary" />
              Noon
            </label>
            <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 select-none cursor-pointer">
              <input type="checkbox" checked={rxNight} onChange={(e) => setRxNight(e.target.checked)} className="accent-primary" />
              Night
            </label>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Duration</label>
          <div className="flex gap-1">
            <input
              type="number"
              min="1"
              value={rxDurationVal}
              onChange={(e) => setRxDurationVal(e.target.value)}
              className="w-16 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none text-center font-bold"
            />
            <select
              value={rxDurationUnit}
              onChange={(e) => setRxDurationUnit(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="Days">Days</option>
              <option value="Weeks">Weeks</option>
            </select>
          </div>
        </div>
        <div className="space-y-1 flex flex-col justify-between">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Instructions</label>
          <div className="flex gap-2">
            <select
              value={rxTiming}
              onChange={(e) => setRxTiming(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="After Food">After Food</option>
              <option value="Before Food">Before Food</option>
              <option value="Empty Stomach">Empty Stomach</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-colors cursor-pointer"
            >
              + Add
            </button>
          </div>
        </div>
      </form>

      {/* Medicines Draft table */}
      <div className="bg-white border border-gray-155 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-bold text-gray-550 uppercase tracking-wider">
              <th className="px-4 py-2">Medicine</th>
              <th className="px-4 py-2">Timings</th>
              <th className="px-4 py-2">Instructions</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rxDraft.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-5 text-center text-xs text-gray-400 font-semibold">
                  No medicines added to prescription.
                </td>
              </tr>
            ) : (
              rxDraft.map((m) => (
                <tr key={m.id} className="text-xs">
                  <td className="px-4 py-2 font-bold text-gray-900">{m.medicine}</td>
                  <td className="px-4 py-2 text-gray-700 font-semibold">{m.schedule}</td>
                  <td className="px-4 py-2 text-gray-650 font-semibold">{m.timing}</td>
                  <td className="px-4 py-2 font-bold text-gray-955">{m.duration}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onRemoveDraftMed(m.id)}
                      className="text-xs text-danger hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onSavePrescription}
          disabled={rxDraft.length === 0}
          className="px-4 py-2 bg-success text-white font-bold rounded-xl text-xs hover:bg-success/95 transition-all shadow-sm shadow-success/15 disabled:opacity-50 cursor-pointer"
        >
          🖨️ Save & Print Prescription
        </button>
      </div>
    </div>
  );
}
