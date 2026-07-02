"use client";

import { useState } from "react";

export default function LabOrderForm({ onSubmitLabOrder }) {
  const [orderCategory, setOrderCategory] = useState("Prosthetic");

  // Prosthetic fields
  const [labOrderItem, setLabOrderItem] = useState("Zirconia Crown");
  const [labOrderTooth, setLabOrderTooth] = useState("16");
  const [labOrderShade, setLabOrderShade] = useState("A2");
  
  // Diagnostic fields
  const [diagnosticTest, setDiagnosticTest] = useState("Complete Blood Count (CBC)");
  const [diagnosticNotes, setDiagnosticNotes] = useState("");

  const [labOrderName, setLabOrderName] = useState("In-house Lab");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmitLabOrder) return;
    
    if (orderCategory === "Prosthetic") {
      onSubmitLabOrder({
        order_category: "Prosthetic",
        prosthetic_type: labOrderItem,
        tooth: labOrderTooth,
        shade: labOrderShade,
        material: labOrderItem.split(" ")[0],
        labName: labOrderName,
        notes: `Tooth: ${labOrderTooth}`
      });
    } else {
      onSubmitLabOrder({
        order_category: "Diagnostic",
        order_details: {
          test_type: diagnosticTest,
          instructions: diagnosticNotes
        },
        labName: labOrderName,
        notes: diagnosticNotes
      });
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm shadow-gray-100/40">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <span>🔬</span> Lab Work Request
        </h4>
        <select 
          value={orderCategory}
          onChange={(e) => setOrderCategory(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none"
        >
          <option value="Prosthetic">Restorative (Prosthetic)</option>
          <option value="Diagnostic">Blood Work & Diagnostics</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
        {orderCategory === "Prosthetic" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Diagnostic Test</label>
              <select
                value={diagnosticTest}
                onChange={(e) => setDiagnosticTest(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Coagulation Profile (PT/INR)">Coagulation Profile (PT/INR)</option>
                <option value="HbA1c (Blood Sugar)">HbA1c (Blood Sugar)</option>
                <option value="Bone Density Scan (DEXA)">Bone Density Scan (DEXA)</option>
                <option value="Viral Markers (HIV, Hep B/C)">Viral Markers (HIV, Hep B/C)</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Clinical Notes / Instructions</label>
              <input
                type="text"
                placeholder="Specific instructions for the lab tech..."
                value={diagnosticNotes}
                onChange={(e) => setDiagnosticNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fulfilling Lab</label>
          <select
            value={labOrderName}
            onChange={(e) => setLabOrderName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="In-house Lab">In-house Clinic Lab</option>
            <option value="Apex Dental Lab">Apex Dental Lab</option>
            <option value="Elite Diagnostics">Elite Diagnostics</option>
          </select>
        </div>
        <div className="flex items-end justify-end pt-1">
          <button
            type="submit"
            className="w-full px-6 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-colors cursor-pointer shadow-sm shadow-primary/10"
          >
            Place Lab Order
          </button>
        </div>
      </form>
    </div>
  );
}

