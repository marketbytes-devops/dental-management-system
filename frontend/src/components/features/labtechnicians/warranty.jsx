"use client";

import { useState } from "react";

const ACTIVE_WARRANTIES = [
  { id: "WR-2026-001", patient: "Rajesh Kannan", type: "Implant Crown", material: "Zirconia", duration: "5 Years", issued: "2026-06-08", expires: "2031-06-08", elapsedPercent: 1 },
  { id: "WR-2025-084", patient: "Sneha Nair", type: "Bridge (3-Unit)", material: "E-Max", duration: "2 Years", issued: "2025-03-12", expires: "2027-03-12", elapsedPercent: 62 },
  { id: "WR-2024-192", patient: "Jibin Jose", type: "Crown", material: "Zirconia", duration: "5 Years", issued: "2024-08-15", expires: "2029-08-15", elapsedPercent: 36 }
];

const WARRANTY_CLAIMS = [
  {
    id: "CLM-2026-004",
    caseId: "CASE-2026-005",
    patient: "Vikram Malhotra",
    dentist: "Dr. Anoop Nair",
    issue: "Slight marginal chipping on distal cusp of #14 after cementation.",
    dateCreated: "2026-06-09",
    status: "Inspection",
    timeline: [
      { name: "Claim Created", date: "2026-06-09 04:30 PM", desc: "Dentist submitted photos showing distal margin chipping.", active: true },
      { name: "Lab Inspection", date: "2026-06-10 10:00 AM", desc: "QC inspector verifying sintering logs and scan data.", active: true },
      { name: "Remake Approved", date: "Pending", desc: "Awaiting final approval from senior technician.", active: false },
      { name: "Replacement Dispatched", date: "Pending", desc: "Replacement fabrication schedule.", active: false }
    ]
  }
];

export default function LabWarranty() {
  const [activeTab, setActiveTab] = useState("ACTIVE"); // ACTIVE, CLAIMS
  const [warranties, setWarranties] = useState(ACTIVE_WARRANTIES);
  const [claims, setClaims] = useState(WARRANTY_CLAIMS);
  const [selectedClaimId, setSelectedClaimId] = useState("CLM-2026-004");
  const [toast, setToast] = useState({ show: false, message: "" });

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const currentClaim = claims.find(c => c.id === selectedClaimId) || claims[0];

  const handleApproveClaim = () => {
    setClaims(prev => prev.map(c => {
      if (c.id === selectedClaimId) {
        const updatedTimeline = [...c.timeline];
        updatedTimeline[2] = { ...updatedTimeline[2], date: "2026-06-10 03:00 PM", active: true };
        return { ...c, status: "Approved", timeline: updatedTimeline };
      }
      return c;
    }));
    triggerToast(`Warranty claim ${selectedClaimId} has been approved. Remake order added to production.`);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Warranty Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Issue digital prosthetic warranty certificates, track validity, and resolve dentist claims.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button 
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ACTIVE" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Active Warranties
          </button>
          <button 
            onClick={() => setActiveTab("CLAIMS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "CLAIMS" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Claims Queue ({claims.length})
          </button>
        </div>
      </div>

      {activeTab === "ACTIVE" ? (
        /* Active Warranties List */
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Active Certificates</h3>
            <p className="text-xs text-gray-400 mt-0.5">Tracking materials durability coverage</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warranties.map((w) => (
              <div key={w.id} className="border border-gray-150 rounded-2xl p-5 hover:border-primary/45 hover:shadow-md transition-all duration-300 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-2 -mt-2"></div>
                
                <div>
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    {w.material} Protection
                  </span>
                  <h4 className="text-sm font-black text-gray-805 mt-2">{w.patient}</h4>
                  <p className="text-xs text-gray-450 mt-0.5">Cert ID: {w.id}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                    <span>Warranty Period</span>
                    <span className="font-bold text-gray-750">{w.duration}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                    <span>Issued Date</span>
                    <span>{w.issued}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-550 font-semibold">
                    <span>Expiration</span>
                    <span className="text-danger font-bold">{w.expires}</span>
                  </div>
                </div>

                {/* Progress bar of elapsed time */}
                <div className="space-y-1 pt-1.5 border-t border-gray-100">
                  <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Coverage Remaining</span>
                    <span>{100 - w.elapsedPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200/50">
                    <div 
                      style={{ width: `${100 - w.elapsedPercent}%` }} 
                      className="bg-gradient-to-r from-success to-success/90 h-full rounded-full"
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Claims Queue & Details */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Claims List Table (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between overflow-x-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Warranty Claims Queue</h3>
                <p className="text-xs text-gray-400 mt-0.5">Remake and repair claims from clinical partners</p>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Claim ID</th>
                    <th className="px-4 py-3">Dentist & Patient</th>
                    <th className="px-4 py-3">Date Filed</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {claims.map((c) => (
                    <tr 
                      key={c.id}
                      onClick={() => setSelectedClaimId(c.id)}
                      className={`hover:bg-gray-55/60 transition-colors cursor-pointer ${
                        selectedClaimId === c.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">{c.id}</td>
                      <td className="px-4 py-3 text-gray-655">
                        <div>
                          <p className="font-semibold text-gray-800">{c.dentist}</p>
                          <p className="text-[10px] text-gray-400">Patient: {c.patient}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-semibold">{c.dateCreated}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          c.status === "Approved" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelectedClaimId(c.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Selected Claim Details & Resolution Timeline (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 font-sans">Claim Details</h3>
                <p className="text-xs text-gray-400 mt-0.5">Dentist notes and replacement steps</p>
              </div>

              {/* Claim Body Details */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs space-y-3">
                <div>
                  <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Reported Issue</p>
                  <p className="text-gray-700 font-medium mt-1 leading-relaxed italic bg-white p-2.5 rounded border border-gray-100">
                    "{currentClaim.issue}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="font-bold text-gray-450 uppercase text-[9px] tracking-wider">Patient ID</p>
                    <p className="text-gray-800 font-bold mt-0.5">{currentClaim.patient}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-450 uppercase text-[9px] tracking-wider">Dentist</p>
                    <p className="text-gray-800 font-bold mt-0.5">{currentClaim.dentist}</p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Claim Timeline */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Claims Resolution Path</h4>
                
                <div className="relative pl-5 space-y-4.5 border-l border-gray-200 ml-1.5 text-xs">
                  {currentClaim.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 ${
                        item.active ? "bg-success border-success text-white" : "bg-white border-gray-200"
                      }`}></span>
                      <p className={`font-bold ${item.active ? "text-gray-800" : "text-gray-400"}`}>{item.name}</p>
                      <p className="text-[9px] text-gray-450">{item.date}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Claim Approval actions */}
            {currentClaim.status === "Inspection" && (
              <div className="flex gap-3 pt-6 border-t border-gray-100 bg-white">
                <button 
                  onClick={handleApproveClaim}
                  className="flex-1 py-2.5 bg-success text-white font-extrabold rounded-xl text-xs shadow-sm shadow-success/35 hover:bg-success/90 transition-colors cursor-pointer"
                >
                  ✓ Approve Replacement remake
                </button>
                <button className="flex-1 py-2.5 bg-white border border-gray-200 text-danger font-extrabold rounded-xl text-xs hover:bg-danger/5 transition-colors cursor-pointer">
                  ✕ Reject Claim
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
