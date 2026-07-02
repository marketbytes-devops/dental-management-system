"use client";

import { useState, useEffect } from "react";
import { getLabInventory } from "@/services/api";

export default function PrescriptionForm({
  rxDraft = [],
  onAddMedicine,
  onRemoveDraftMed,
  onSavePrescription,
  showNotification
}) {
  // Local form state
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [rxMedicine, setRxMedicine] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rxMorning, setRxMorning] = useState(true);
  const [rxNoon, setRxNoon] = useState(false);
  const [rxNight, setRxNight] = useState(true);
  const [rxTiming, setRxTiming] = useState("After Food");
  const [rxDurationVal, setRxDurationVal] = useState("5");
  const [rxDurationUnit, setRxDurationUnit] = useState("Days");

  // Fetch medicines from the Clinical Pharmacy inventory
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const inventory = await getLabInventory();
        const medicines = inventory.filter(item => item.category === "Clinical Pharmacy");
        setAvailableMedicines(medicines);
        if (medicines.length > 0) {
          setRxMedicine(medicines[0].name);
          setSearchQuery(medicines[0].name);
        }
      } catch (error) {
        console.error("Failed to load medicines from inventory:", error);
      }
    };
    fetchMedicines();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rxMedicine) {
      if (showNotification) showNotification("Please select a medicine.");
      return;
    }

    const timings = [];
    if (rxMorning) timings.push("Morning");
    if (rxNoon) timings.push("Noon");
    if (rxNight) timings.push("Night");

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
    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm shadow-gray-100/40">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        Prescribe Medicines
      </h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl mb-4">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medicine Name</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
                setRxMedicine(e.target.value); // Keep synced if custom input
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              placeholder="Search or type medicine name..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors"
            />
            {isDropdownOpen && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-150 rounded-xl shadow-lg max-h-48 overflow-y-auto text-xs py-1">
                {availableMedicines
                  .filter(med => med.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(med => (
                    <li
                      key={med.id}
                      onClick={() => {
                        setRxMedicine(med.name);
                        setSearchQuery(med.name);
                        setIsDropdownOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-50/80 cursor-pointer font-semibold text-gray-800 transition-colors"
                    >
                      {med.name}
                    </li>
                  ))}
                {availableMedicines.filter(med => med.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <li className="px-3 py-3 text-gray-400 font-semibold text-center italic">No matches found</li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Timings</label>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-755 select-none cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={rxMorning} onChange={(e) => setRxMorning(e.target.checked)} className="accent-primary w-3.5 h-3.5" />
              Morning
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-755 select-none cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={rxNoon} onChange={(e) => setRxNoon(e.target.checked)} className="accent-primary w-3.5 h-3.5" />
              Noon
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-755 select-none cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={rxNight} onChange={(e) => setRxNight(e.target.checked)} className="accent-primary w-3.5 h-3.5" />
              Night
            </label>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Duration</label>
          <div className="flex gap-1.5">
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
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Instructions</label>
          <select
            value={rxTiming}
            onChange={(e) => setRxTiming(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="After Food">After Food</option>
            <option value="Before Food">Before Food</option>
            <option value="Empty Stomach">Empty Stomach</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex justify-end pt-1">
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-colors cursor-pointer shadow-sm shadow-primary/10"
          >
            + Add Medicine
          </button>
        </div>
      </form>

      {/* Medicines Draft list - Responsive view */}
      <div className="mb-4">
        {rxDraft.length === 0 ? (
          <div className="p-5 text-center text-xs text-gray-400 font-semibold bg-gray-50/50 border border-gray-100 rounded-xl">
            No medicines added to prescription.
          </div>
        ) : (
          <>
            {/* Desktop Table view */}
            <div className="hidden sm:block border border-gray-100 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Timings</th>
                    <th className="px-4 py-3">Instructions</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {rxDraft.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900">{m.medicine}</td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                          {m.schedule}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-650 font-semibold">{m.timing}</td>
                      <td className="px-4 py-3">
                        <span className="bg-success/10 text-success text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {m.duration}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onRemoveDraftMed(m.id)}
                          className="text-xs font-bold text-danger hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card list */}
            <div className="block sm:hidden space-y-2">
              {rxDraft.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50/40 border border-gray-100 rounded-xl text-xs gap-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 truncate">{m.medicine}</span>
                      <span className="bg-primary/10 text-primary text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0">
                        {m.duration}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold">{m.schedule}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{m.timing}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveDraftMed(m.id)}
                    className="text-xs font-bold text-danger hover:underline cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onSavePrescription}
          disabled={rxDraft.length === 0}
          className="px-4 py-2 bg-success text-white font-bold rounded-xl text-xs hover:bg-success/95 transition-all shadow-sm shadow-success/15 disabled:opacity-50 cursor-pointer"
        >
          Save & Print Prescription
        </button>
      </div>
    </div>
  );
}
