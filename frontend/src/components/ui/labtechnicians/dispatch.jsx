"use client";

import { useState } from "react";

const INITIAL_SHIPMENTS = [
  { id: "TRK-2026-981", caseId: "CASE-2026-005", patient: "Vikram Malhotra", dentist: "Dr. Anoop Nair", courier: "SmileCare Express", dispatchDate: "2026-06-10 10:15 AM", estDelivery: "Today, 03:30 PM", status: "In Transit" },
  { id: "TRK-2026-982", caseId: "CASE-2026-001", patient: "Aditya Verma", dentist: "Dr. Anoop Nair", courier: "BlueDart", dispatchDate: "Pending Dispatch", estDelivery: "Tomorrow, 02:00 PM", status: "Ready" },
  { id: "TRK-2026-979", caseId: "CASE-2026-006", patient: "Sneha Thomas", dentist: "Dr. Elizabeth Rose", courier: "SmileCare Express", dispatchDate: "2026-06-08 09:00 AM", estDelivery: "2026-06-08 01:15 PM", status: "Delivered" },
  { id: "TRK-2026-980", caseId: "CASE-2026-008", patient: "Priyanka Rao", dentist: "Dr. Sarah Smith", courier: "DHL Global", dispatchDate: "2026-06-09 11:30 AM", estDelivery: "2026-06-09 04:00 PM", status: "Delivered" }
];

export default function LabDispatch() {
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS);
  const [selectedTrackId, setSelectedTrackId] = useState("TRK-2026-981");

  const currentShipment = shipments.find(s => s.id === selectedTrackId) || shipments[0];

  // Logistics status counters
  const readyCount = shipments.filter(s => s.status === "Ready").length;
  const transitCount = shipments.filter(s => s.status === "In Transit").length;
  const deliveredCount = shipments.filter(s => s.status === "Delivered").length;

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "bg-success/10 text-success border-success/20";
      case "In Transit": return "bg-primary/10 text-primary border-primary/20";
      case "Ready":
      default: return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dispatch & Logistics</h1>
        <p className="text-sm text-gray-500 mt-1">Coordinate prosthetic pickups, generate shipping codes, and monitor live dentist deliveries.</p>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ready for Dispatch</p>
            <h3 className="text-2xl font-black text-gray-900">{readyCount}</h3>
            <p className="text-xs text-warning font-semibold mt-1">Awaiting courier pickup</p>
          </div>
          <span className="text-3xl bg-warning/10 p-3 rounded-xl">📦</span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Out for Delivery</p>
            <h3 className="text-2xl font-black text-gray-900">{transitCount}</h3>
            <p className="text-xs text-primary font-semibold mt-1">Active transit on road</p>
          </div>
          <span className="text-3xl bg-primary/10 p-3 rounded-xl">🚚</span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Delivered Cases</p>
            <h3 className="text-2xl font-black text-gray-900">{deliveredCount}</h3>
            <p className="text-xs text-success font-semibold mt-1">Delivery completed</p>
          </div>
          <span className="text-3xl bg-success/10 p-3 rounded-xl">🎉</span>
        </div>
      </div>

      {/* Main Grid: Shipments Table & Map Component */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Shipments list (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between overflow-x-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Active Shipments</h3>
              <p className="text-xs text-gray-400 mt-0.5">List of dispatched cases and couriers</p>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Tracking ID</th>
                  <th className="px-4 py-3">Patient & Dentist</th>
                  <th className="px-4 py-3">Courier Partner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {shipments.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedTrackId(s.id)}
                    className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                      selectedTrackId === s.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-900">{s.id}</td>
                    <td className="px-4 py-3 text-gray-650">
                      <div>
                        <p className="font-semibold text-gray-800">{s.patient}</p>
                        <p className="text-[10px] text-gray-400">{s.dentist}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">{s.courier}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setSelectedTrackId(s.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Tracking Timeline & Simulated Map Visual (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Live Delivery Route</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tracking Courier: {currentShipment.courier} ({currentShipment.id})</p>
            </div>

            {/* Map Visual Component mockup */}
            <div className="bg-gray-100 rounded-xl h-44 border border-gray-200 relative overflow-hidden flex items-center justify-center">
              {/* Map grid lines mockup */}
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}></div>

              {/* Map Route vector mockup */}
              <svg className="w-full h-full absolute inset-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 80 Q 40 20 80 40" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="20" cy="80" r="3" fill="#A855F7" /> {/* Source */}
                <circle cx="80" cy="40" r="3" fill="#22C55E" /> {/* Dentist Clinic */}
                <circle cx="50" cy="45" r="4" fill="var(--color-primary)" className="animate-ping" /> {/* Courier current pos */}
              </svg>

              <div className="absolute top-2 left-2 text-[8px] bg-black/60 text-white font-mono rounded px-1.5 py-0.5">
                SmileCare Lab (Source)
              </div>
              <div className="absolute bottom-2 right-2 text-[8px] bg-black/60 text-white font-mono rounded px-1.5 py-0.5">
                Dentist Clinic (Destination)
              </div>
            </div>

            {/* Delivery Tracking Timeline */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Logistics Milestones</h4>
              
              <div className="relative pl-5 space-y-4 border-l border-gray-200 ml-1.5 text-xs">
                <div className="relative">
                  <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full ${
                    currentShipment.status === "Delivered" ? "bg-success" : "bg-gray-200"
                  }`}></span>
                  <p className={`font-bold ${currentShipment.status === "Delivered" ? "text-success" : "text-gray-400"}`}>Delivered</p>
                  <p className="text-[9px] text-gray-400">{currentShipment.status === "Delivered" ? currentShipment.estDelivery : "Pending"}</p>
                </div>

                <div className="relative">
                  <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full ${
                    currentShipment.status === "In Transit" ? "bg-primary animate-pulse" :
                    currentShipment.status === "Delivered" ? "bg-success" : "bg-gray-200"
                  }`}></span>
                  <p className={`font-bold ${
                    currentShipment.status === "In Transit" ? "text-primary" :
                    currentShipment.status === "Delivered" ? "text-success" : "text-gray-400"
                  }`}>Out for Delivery</p>
                  <p className="text-[9px] text-gray-400">{currentShipment.dispatchDate}</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[23px] top-0.5 w-3 h-3 bg-success rounded-full"></span>
                  <p className="font-bold text-success">Package Picked Up / Dispatched</p>
                  <p className="text-[9px] text-gray-450">{currentShipment.dispatchDate === "Pending Dispatch" ? "Ready at Counter" : currentShipment.dispatchDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
