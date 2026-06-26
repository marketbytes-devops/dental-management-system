"use client";

import { useState, useEffect } from "react";

export default function LabQualityControl() {
  const [qcCases, setQcCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    dimensions: false,
    colorMatch: false,
    surfaceFinish: false,
    accuracy: false,
    materialQuality: false
  });

  const [comments, setComments] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const fetchCases = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://localhost:8000/lab/orders", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data
          .filter(o => o.status === "QC Pending")
          .map(o => ({
            id: o.id,
            patient: o.patient_name || "Walk-in Patient",
            dentist: o.dentist_name || "Dr. Anoop Nair",
            type: o.prosthetic_type,
            shade: o.shade || "A2",
            material: o.material || "Zirconia",
            inspector: "Sneha Nair",
            photos: []
          }));
        setQcCases(filtered);
        if (filtered.length > 0) {
          setSelectedCaseId(prev => {
            if (filtered.some(c => c.id === prev)) return prev;
            return filtered[0].id;
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch QC cases:", err);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const currentCase = qcCases.find(c => c.id === selectedCaseId) || qcCases[0] || {
    id: "N/A",
    patient: "No Active Case",
    dentist: "N/A",
    type: "N/A",
    shade: "N/A",
    material: "N/A",
    inspector: "N/A",
    photos: []
  };

  // Checklist items configuration
  const checklistItems = [
    { key: "dimensions", name: "Margin & Dimensions", desc: "No micro-gaps; sits snugly on the die model." },
    { key: "colorMatch", name: "Shade Match", desc: "Matches requested shade guide under 5500K light." },
    { key: "surfaceFinish", name: "Surface & Glaze", desc: "Polished to high luster; no sharp occlusion edges." },
    { key: "accuracy", name: "Occlusion Accuracy", desc: "Verifies perfect bite alignment on the articulator." },
    { key: "materialQuality", name: "Material Integrity", desc: "Check for cracks, pores, or sintering flaws." }
  ];

  const handleCheckboxChange = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePass = async () => {
    if (currentCase.id === "N/A") return;
    const allChecked = Object.values(checklist).every(v => v === true);
    if (!allChecked) {
      alert("Please check and verify all checklist items before passing the case.");
      return;
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/lab/orders/${currentCase.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "Ready / Shipped" })
      });
      if (response.ok) {
        triggerToast(`Case ${currentCase.id} passed quality inspection successfully!`);
        setChecklist({ dimensions: false, colorMatch: false, surfaceFinish: false, accuracy: false, materialQuality: false });
        setComments("");
        fetchCases();
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to pass inspection.", "error");
    }
  };

  const handleFail = async (rework = false) => {
    if (currentCase.id === "N/A") return;
    if (comments.trim() === "") {
      alert("Please provide comments explaining the inspection failure / rework instructions.");
      return;
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const targetStatus = rework ? "In Progress" : "Rejected";
      const response = await fetch(`http://localhost:8000/lab/orders/${currentCase.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: targetStatus,
          rejection_reason: comments
        })
      });
      if (response.ok) {
        const msg = rework 
          ? `Case ${currentCase.id} rejected and sent back to production for rework.`
          : `Case ${currentCase.id} failed inspection.`;
        triggerToast(msg, "error");
        setChecklist({ dimensions: false, colorMatch: false, surfaceFinish: false, accuracy: false, materialQuality: false });
        setComments("");
        fetchCases();
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to fail inspection.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 bg-white border-gray-100">
          <span className={`w-3 h-3 rounded-full ${toast.type === "error" ? "bg-danger animate-pulse" : "bg-success animate-pulse"}`}></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Quality Control (QC)</h1>
        <p className="text-sm text-gray-500 mt-1">Conduct rigorous microscopic margin, shade matching, and mechanical bite inspections.</p>
      </div>

      {qcCases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center shadow-sm">
          <span className="text-5xl">🎉</span>
          <h3 className="text-lg font-black text-gray-850 mt-4">All QC Cases Clear!</h3>
          <p className="text-xs text-gray-400 mt-1">There are currently no cases awaiting quality control inspections.</p>
        </div>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Case Selector & Specs (4 cols) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 flex-1">
              <div>
                <span className="text-[10px] font-black text-warning bg-warning/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Awaiting Inspection
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-3">{currentCase.id}</h3>
                <p className="text-xs text-gray-400 font-medium">Patient: {currentCase.patient}</p>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* Case Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Queue Cases:</label>
                <div className="space-y-1.5">
                  {qcCases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setChecklist({ dimensions: false, colorMatch: false, surfaceFinish: false, accuracy: false, materialQuality: false });
                        setComments("");
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        selectedCaseId === c.id 
                          ? "bg-primary/5 border-primary text-primary" 
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="font-bold">{c.id}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{c.type}</p>
                      </div>
                      <span className="text-lg">🔍</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Case Specifications info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs space-y-2 text-gray-650">
                <p><strong>Restoration:</strong> {currentCase.type}</p>
                <p><strong>Material:</strong> {currentCase.material}</p>
                <p><strong>Shade Spec:</strong> <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-250/20">{currentCase.shade}</span></p>
                <p><strong>Dentist:</strong> {currentCase.dentist}</p>
              </div>
            </div>
          </div>

          {/* Center Column: Interactive Checklist & Verdict (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 font-sans">Verification Checklist</h3>
                <p className="text-xs text-gray-400 mt-0.5">Examine specifications and check off verified items.</p>
              </div>

              {/* Checklist items */}
              <div className="space-y-3.5 pt-2">
                {checklistItems.map((item) => (
                  <div 
                    key={item.key} 
                    onClick={() => handleCheckboxChange(item.key)}
                    className={`p-3 border rounded-xl flex items-start gap-3.5 cursor-pointer transition-all ${
                      checklist[item.key] 
                        ? "bg-success/5 border-success/30" 
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={checklist[item.key]}
                      onChange={() => {}} // Handled by div click
                      className="mt-0.5 rounded text-success accent-success w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{item.name}</h4>
                      <p className="text-[10px] text-gray-450 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments / Rework Instructions */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Inspector Logs / Rework Notes</label>
                <textarea 
                  rows="3"
                  placeholder="e.g. Dimensions verified under microscope. Glaze is flawless. Or specify rework instructions..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-850 resize-none placeholder:text-gray-450"
                ></textarea>
              </div>
            </div>

            {/* Verdict Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-100 bg-white">
              <button 
                onClick={handlePass}
                className="flex-1 py-2.5 bg-success hover:bg-success/90 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-success/35 transition-colors cursor-pointer"
              >
                ✓ Pass Case
              </button>
              <button 
                onClick={() => handleFail(true)}
                className="flex-1 py-2.5 bg-warning hover:bg-warning/90 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-warning/35 transition-colors cursor-pointer"
              >
                ↺ Send Rework
              </button>
              <button 
                onClick={() => handleFail(false)}
                className="px-4 py-2.5 bg-danger hover:bg-danger/90 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-danger/35 transition-colors cursor-pointer"
              >
                ✕ Fail
              </button>
            </div>
          </div>

          {/* Right Column: Microscope Photos Viewer (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Inspection Photos</h3>
                <p className="text-xs text-gray-400 mt-0.5">High definition microscopy captures</p>
              </div>

              {currentCase.photos.length === 0 ? (
                <div className="border border-dashed border-gray-250 rounded-xl p-8 text-center text-gray-400 flex flex-col items-center justify-center space-y-2 h-48 bg-gray-50/50">
                  <span className="text-2xl">📷</span>
                  <p className="text-[10px] leading-relaxed">No inspection photos uploaded for this case.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCase.photos.map((photo, i) => (
                    <div key={i} className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 relative group">
                      <img src={photo} alt="microscope check" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute bottom-2 left-2 text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-white font-bold tracking-wider">
                        Margin View #{i+1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Uploader */}
            <div className="border border-dashed border-gray-200 hover:border-primary/50 transition-colors rounded-xl p-3 text-center cursor-pointer bg-gray-50/30">
              <input type="file" id="qc-uploader" className="hidden" accept="image/*" />
              <label htmlFor="qc-uploader" className="cursor-pointer flex flex-col items-center justify-center space-y-0.5">
                <span className="text-lg">📸</span>
                <p className="text-[10px] font-bold text-gray-700">Add inspection photo</p>
                <p className="text-[8px] text-gray-400">Supports JPG, PNG (Max 5MB)</p>
              </label>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
