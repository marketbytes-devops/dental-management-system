"use client";

import { useState } from "react";

export default function LabOrderForm({ onSubmitLabOrder }) {
  const [labOrderItem, setLabOrderItem] = useState("Zirconia Crown");
  const [labOrderTooth, setLabOrderTooth] = useState("16");
  const [labOrderShade, setLabOrderShade] = useState("A2");
  const [labOrderName, setLabOrderName] = useState("Apex Dental Lab");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmitLabOrder) return;
    onSubmitLabOrder({
      item: labOrderItem,
      tooth: labOrderTooth,
      shade: labOrderShade,
      labName: labOrderName
    });
  };

  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm shadow-gray-100/40">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <span>🔬</span> Restorative Lab Work Request
      </h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lab Item</label>
          <select
            value={labOrderItem}
            onChange={(e) => setLabOrderItem(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="Zirconia Crown">Zirconia Crown</option>
            <option value="Ceramic Bridge">Ceramic Bridge</option>
            <option value="E-Max Veneer">E-Max Veneer</option>
            <option value="Clear Aligner Set">Clear Aligner Set</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tooth #</label>
          <input
            type="number"
            value={labOrderTooth}
            onChange={(e) => setLabOrderTooth(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-center font-bold focus:outline-none"
            min="11"
            max="48"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Shade</label>
          <select
            value={labOrderShade}
            onChange={(e) => setLabOrderShade(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="A3">A3</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Milling Lab</label>
          <select
            value={labOrderName}
            onChange={(e) => setLabOrderName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="Apex Dental Lab">Apex Dental Lab</option>
            <option value="Elite Milling Center">Elite Milling Center</option>
            <option value="SmileAlign Labs">SmileAlign Labs</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex justify-end pt-1">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-colors cursor-pointer shadow-sm shadow-primary/10"
          >
            Order Lab
          </button>
        </div>
      </form>
    </div>
  );
}
