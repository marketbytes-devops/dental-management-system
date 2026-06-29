"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  X, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Info, 
  RefreshCw, 
  UploadCloud, 
  AlertCircle, 
  Sparkles, 
  Laptop, 
  ShieldCheck, 
  ChevronRight, 
  Package, 
  Truck,
  ArrowRight
} from "lucide-react";
import { getLabOrders, updateLabOrderStatus } from "@/services/api";

const COLUMNS = ["New Cases", "Design Complete", "Milling", "Printing", "Finishing", "QC"];

export default function LabProduction() {
  const [stageMap, setStageMap] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lab_production_stage_map");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [dbCases, setDbCases] = useState([]);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [activeTab, setActiveTab] = useState("specs");

  // STL mock viewer properties
  const [stlRotation, setStlRotation] = useState(45);
  const [stlZoom, setStlZoom] = useState(1);
  const [viewerType, setViewerType] = useState("STL"); // STL, XRAY, PDF

  // CAD design desk state
  const [cadVersions, setCadVersions] = useState([
    { version: "v1.2", date: "2026-06-10 11:30 AM", author: "Alen Joseph (CAD)", status: "Approved", notes: "Marginal fit tightened by 10 microns.", color: "bg-success/10 text-success border-success/20" },
    { version: "v1.1", date: "2026-06-09 03:45 PM", author: "Alen Joseph (CAD)", status: "Rejected", notes: "Dentist requested thinner margins.", color: "bg-danger/10 text-danger border-danger/20" },
    { version: "v1.0", date: "2026-06-08 10:15 AM", author: "Scanner Import", status: "Approved", notes: "Initial STL mesh imported.", color: "bg-success/10 text-success border-success/20" }
  ]);
  const [designerNote, setDesignerNote] = useState("");
  const [designerNotesList, setDesignerNotesList] = useState([
    "Contact point on mesial aspect of #26 adjusted to 0.5mm.",
    "Minimum zirconia thickness parameters checked (0.8mm)."
  ]);

  // QC Checklist state
  const [qcChecklist, setQcChecklist] = useState({
    dimensions: false,
    colorMatch: false,
    surfaceFinish: false,
    accuracy: false,
    materialQuality: false
  });
  const [qcComments, setQcComments] = useState("");

  // Courier/Dispatch state
  const [courierPartner, setCourierPartner] = useState("SmileCare Express");
  const [estDeliveryDate, setEstDeliveryDate] = useState("Tomorrow, 02:00 PM");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchDbCases = async () => {
    try {
      const data = await getLabOrders();
      const mapped = data.map(o => ({
        id: o.id,
        patient: o.patient_name || "Walk-in Patient",
        dentist: o.dentist_name || "Dr. Anoop Nair",
        dentistContact: o.dentist_contact || "+91 98765 43210",
        type: o.prosthetic_type,
        material: o.material || "Zirconia",
        stage: "New Cases",
        priority: o.priority || "Medium",
        dueDate: o.due_date || "2026-06-15",
        tech: "AJ",
        shade: o.shade || "A2",
        status: o.status,
        notes: o.notes || "",
        createdAt: o.created_at,
        rejectionReason: o.rejection_reason || ""
      }));
      setDbCases(mapped);
    } catch (err) {
      console.error("Failed to fetch production cases:", err);
    }
  };

  useEffect(() => {
    fetchDbCases();
    const interval = setInterval(fetchDbCases, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check URL query parameters for linking from dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const caseId = params.get("caseId");
      if (caseId) {
        setSelectedCaseId(caseId);
        setIsDrawerOpen(true);
        // Clear param to avoid re-opening on reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [dbCases]);

  const cases = dbCases.map(dbc => ({
    ...dbc,
    stage: stageMap[dbc.id] || dbc.stage
  }));

  const activeCases = cases.filter(c => c.status !== "Completed" && c.status !== "Rejected");
  const currentCase = cases.find(c => c.id === selectedCaseId);

  // Drag and Drop handlers
  const handleDragStart = (e, caseId) => {
    e.dataTransfer.setData("text/plain", caseId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const caseId = e.dataTransfer.getData("text/plain");
    if (caseId) {
      updateStage(caseId, targetStage);
    }
  };

  const updateStage = (caseId, targetStage) => {
    setStageMap(prev => {
      const nextMap = { ...prev, [caseId]: targetStage };
      localStorage.setItem("lab_production_stage_map", JSON.stringify(nextMap));
      return nextMap;
    });

    // If moving to QC stage, automatically prompt to QC status
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase && targetStage === "QC" && targetCase.status !== "QC Pending" && targetCase.status !== "Ready / Shipped") {
      updateDbStatus(caseId, "QC Pending");
    } else if (targetCase && targetStage !== "QC" && targetCase.status === "QC Pending") {
      updateDbStatus(caseId, "In Progress");
    }
  };

  // Move card manually (helpful for mobile or quick actions)
  const moveCard = (caseId, direction) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;
    const currIndex = COLUMNS.indexOf(targetCase.stage);
    let nextIndex = currIndex + direction;
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      updateStage(caseId, COLUMNS[nextIndex]);
    }
  };

  const updateDbStatus = async (caseId, statusValue, rejectionReason = null) => {
    try {
      const body = { status: statusValue };
      if (rejectionReason) {
        body.rejection_reason = rejectionReason;
      }
      await updateLabOrderStatus(caseId, body);
      fetchDbCases();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-danger/10 text-danger border-danger/25";
      case "High": return "bg-warning/10 text-warning border-warning/25";
      case "Medium": return "bg-primary/10 text-primary border-primary/25";
      default: return "bg-gray-100 text-gray-550 border-gray-200";
    }
  };

  const getPriorityBadge = (priority) => {
    const color = getPriorityColor(priority);
    return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${color}`}>{priority}</span>;
  };

  const handleCardClick = (caseId) => {
    setSelectedCaseId(caseId);
    setIsDrawerOpen(true);
    // Reset checklists for the drawer
    setQcChecklist({
      dimensions: false,
      colorMatch: false,
      surfaceFinish: false,
      accuracy: false,
      materialQuality: false
    });
    setQcComments("");
  };

  // Drawer Action: QC Pass
  const handleQCPass = async () => {
    const allChecked = Object.values(qcChecklist).every(v => v === true);
    if (!allChecked) {
      alert("Please verify all QC checklist parameters before passing.");
      return;
    }
    const ok = await updateDbStatus(selectedCaseId, "Ready / Shipped");
    if (ok) {
      triggerToast(`Case ${selectedCaseId} successfully passed Quality Control!`);
      // Advance stage to finishing/QC complete column manually
      updateStage(selectedCaseId, "QC");
    } else {
      triggerToast("Failed to pass Quality Control status.", "error");
    }
  };

  // Drawer Action: QC Rework Fail
  const handleQCFailRework = async () => {
    if (qcComments.trim() === "") {
      alert("Please specify rework comments.");
      return;
    }
    const ok = await updateDbStatus(selectedCaseId, "In Progress", qcComments);
    if (ok) {
      triggerToast(`Case ${selectedCaseId} returned to Production for rework.`, "error");
      // Move stage back to milling/finishing
      updateStage(selectedCaseId, "Finishing");
    } else {
      triggerToast("Failed to update status.", "error");
    }
  };

  // Drawer Action: QC Reject
  const handleQCReject = async () => {
    if (qcComments.trim() === "") {
      alert("Please specify reasons for rejection.");
      return;
    }
    const ok = await updateDbStatus(selectedCaseId, "Rejected", qcComments);
    if (ok) {
      triggerToast(`Case ${selectedCaseId} has been rejected.`, "error");
      setIsDrawerOpen(false);
    } else {
      triggerToast("Failed to reject order.", "error");
    }
  };

  // Drawer Action: Dispatch Order
  const handleDispatchOrder = async () => {
    const ok = await updateDbStatus(selectedCaseId, "Completed");
    if (ok) {
      triggerToast(`Case ${selectedCaseId} marked as completed and shipped!`);
      setIsDrawerOpen(false);
    } else {
      triggerToast("Failed to dispatch order.", "error");
    }
  };

  // CAD design desk version submit
  const handleCadVersionUpload = (e) => {
    e.preventDefault();
    const newVersionNum = (cadVersions.length + 1) * 0.1 + 1.0;
    const newVersion = {
      version: `v${newVersionNum.toFixed(1)}`,
      date: new Date().toLocaleString(),
      author: "Alen Joseph (CAD)",
      status: "Review",
      notes: "Uploaded new scan model parameters.",
      color: "bg-warning/10 text-warning border-warning/20"
    };
    setCadVersions([newVersion, ...cadVersions]);
    triggerToast("STL scan revision uploaded.");
  };

  // CAD design note submit
  const handleAddDesignerNote = (e) => {
    e.preventDefault();
    if (designerNote.trim() === "") return;
    setDesignerNotesList([...designerNotesList, designerNote.trim()]);
    setDesignerNote("");
  };

  return (
    <div className="space-y-6 pb-10 flex flex-col h-[82vh] relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Production Board</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop cases across fabrication stages or click a card to open its Workspace Drawer.</p>
      </div>

      {/* Kanban Container */}
      <div className="flex-1 overflow-x-auto flex gap-4 pb-4 select-none items-stretch">
        {COLUMNS.map((col) => {
          const colCases = activeCases.filter(c => c.stage === col);
          return (
            <div 
              key={col} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
              className="w-80 flex-shrink-0 bg-gray-50/70 border border-gray-150 rounded-2xl flex flex-col h-full overflow-hidden"
            >
              {/* Column Title */}
              <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/80"></span>
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">{col}</h3>
                </div>
                <span className="text-[10px] font-extrabold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {colCases.length}
                </span>
              </div>

              {/* Cards wrapper */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px]">
                {colCases.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400 mt-2">
                    Drag cases here
                  </div>
                ) : (
                  colCases.map((c) => (
                    <div 
                      key={c.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onClick={() => handleCardClick(c.id)}
                      className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/45 group relative"
                    >
                      {/* Top Row: Case & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-450">{c.id}</span>
                        {getPriorityBadge(c.priority)}
                      </div>

                      {/* Main Details */}
                      <div className="mt-2.5">
                        <h4 className="text-xs font-bold text-gray-800">{c.patient}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Dentist: {c.dentist}</p>
                      </div>

                      {/* Specs */}
                      <div className="mt-2 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-[10px] text-gray-650 flex justify-between">
                        <span className="font-semibold">{c.type}</span>
                        <span>{c.material}</span>
                      </div>

                      {/* Bottom Row: Due date & Tech avatar */}
                      <div className="mt-3.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> {c.dueDate}
                        </span>
                        
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Technician Avatar */}
                          <div className="w-5.5 h-5.5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[9px]">
                            {c.tech}
                          </div>
                        </div>
                      </div>

                      {/* Hover action triggers for manual shifting */}
                      <div 
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow border border-gray-100 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLUMNS.indexOf(c.stage) > 0 && (
                          <button 
                            onClick={() => moveCard(c.id, -1)}
                            className="w-4 h-4 text-[10px] bg-gray-100 hover:bg-primary hover:text-white rounded flex items-center justify-center font-bold cursor-pointer"
                            title="Move Stage Left"
                          >
                            ◀
                          </button>
                        )}
                        {COLUMNS.indexOf(c.stage) < COLUMNS.length - 1 && (
                          <button 
                            onClick={() => moveCard(c.id, 1)}
                            className="w-4 h-4 text-[10px] bg-gray-100 hover:bg-primary hover:text-white rounded flex items-center justify-center font-bold cursor-pointer"
                            title="Move Stage Right"
                          >
                            ▶
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Workspace Drawer */}
      {isDrawerOpen && currentCase && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Wrapper */}
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/60 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">{currentCase.id}</span>
                  {getPriorityBadge(currentCase.priority)}
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">{currentCase.patient}</h3>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-650 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/20 px-4 py-1.5 shrink-0 overflow-x-auto gap-1">
              {[
                { id: "specs", label: "Specs & Timeline" },
                { id: "viewer", label: "Scan Viewer" },
                { id: "cad", label: "CAD Desk" },
                { id: "qc", label: "Quality Control" },
                { id: "dispatch", label: "Dispatch" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? "bg-primary text-white shadow-sm" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tab: Specs & Timeline */}
              {activeTab === "specs" && (
                <div className="space-y-6">
                  {/* Specification Card */}
                  <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Case Specifications</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-medium">Prosthetic Type</span>
                        <p className="font-bold text-gray-800 mt-0.5">{currentCase.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Material</span>
                        <p className="font-bold text-gray-800 mt-0.5">{currentCase.material}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Restoration Shade</span>
                        <p className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-250/20 inline-block mt-0.5">{currentCase.shade}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Estimated Delivery</span>
                        <p className="font-bold text-danger flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-danger" /> {currentCase.dueDate}
                        </p>
                      </div>
                    </div>

                    {currentCase.notes && (
                      <div className="border-t border-gray-200 pt-3 text-xs text-gray-600 italic">
                        "{currentCase.notes}"
                      </div>
                    )}
                  </div>

                  {/* Dentist Contact Card */}
                  <div className="border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Dentist Info</span>
                      <h4 className="text-sm font-bold text-gray-900 mt-2">{currentCase.dentist}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{currentCase.dentistContact}</p>
                    </div>
                    <span className="text-2xl bg-gray-50 p-2.5 rounded-xl border border-gray-100">👤</span>
                  </div>

                  {/* Work Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Fabrication Timeline</h4>
                    <div className="relative pl-5 space-y-5 border-l-2 border-gray-100 ml-2 py-1">
                      {[
                        { name: "Order Received", done: true, desc: "Impression scanned and received by doctor." },
                        { name: "Design Approved", done: currentCase.status !== "Pending", desc: "CAD tooth model approved by technician." },
                        { name: "Milling / 3D Print", done: currentCase.status === "In Progress" || currentCase.status === "QC Pending" || currentCase.status === "Ready / Shipped" || currentCase.status === "Completed", desc: "Fabricating actual prosthesis shape." },
                        { name: "QC Passed", done: currentCase.status === "Ready / Shipped" || currentCase.status === "Completed", desc: "Dimensional tolerances verify ok." },
                        { name: "Dispatch & Shipped", done: currentCase.status === "Completed", desc: "Dispatched and shipped to clinic." }
                      ].map((step, idx) => (
                        <div key={idx} className="relative">
                          <span className={`absolute -left-[28.5px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${
                            step.done ? "bg-success border-success text-white" : "bg-white border-gray-200 text-transparent"
                          }`}>
                            ✓
                          </span>
                          <div>
                            <p className={`text-xs font-bold ${step.done ? "text-success" : "text-gray-400"}`}>{step.name}</p>
                            <p className="text-[10px] text-gray-450 leading-relaxed mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Scan Viewer */}
              {activeTab === "viewer" && (
                <div className="space-y-5 h-full flex flex-col">
                  <div className="flex border-b border-gray-100 gap-2 pb-2">
                    {["STL", "XRAY", "PDF"].map((vt) => (
                      <button
                        key={vt}
                        onClick={() => setViewerType(vt)}
                        className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md cursor-pointer transition-all ${
                          viewerType === vt ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                        }`}
                      >
                        {vt} File
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-950 rounded-2xl h-[320px] flex items-center justify-center overflow-hidden relative">
                    
                    {/* STL Viewer Mock */}
                    {viewerType === "STL" && (
                      <div className="w-full h-full p-4 flex flex-col justify-between select-none">
                        <div className="flex justify-between items-center text-white">
                          <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded border border-white/10 text-primary font-bold">STL 3D Wireframe Active</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => setStlZoom(prev => Math.min(2, prev + 0.1))} className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 text-xs font-bold">+</button>
                            <button onClick={() => setStlZoom(prev => Math.max(0.5, prev - 0.1))} className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 text-xs font-bold">-</button>
                          </div>
                        </div>

                        {/* Tooth wireframe spinner */}
                        <div 
                          style={{
                            transform: `rotateX(${stlRotation}deg) rotateY(${stlRotation * 1.2}deg) scale(${stlZoom})`,
                            transition: "transform 0.1s ease-out"
                          }}
                          className="w-24 h-24 border-2 border-primary/40 rounded-xl flex items-center justify-center self-center animate-spin duration-15000"
                        >
                          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>Rotate mesh model:</span>
                          <input 
                            type="range" 
                            min="0" 
                            max="360"
                            value={stlRotation}
                            onChange={(e) => setStlRotation(Number(e.target.value))}
                            className="w-24 accent-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* X-Ray Viewer */}
                    {viewerType === "XRAY" && (
                      <div className="w-full h-full relative p-4 flex items-center justify-center">
                        <img 
                          src="https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400&auto=format&fit=crop" 
                          alt="Dental Xray" 
                          className="max-h-full max-w-full object-contain rounded opacity-75 border border-white/10"
                        />
                        <div className="absolute bottom-4 left-4 text-[9px] bg-black/60 px-2 py-0.5 rounded text-white border border-white/10">
                          Panoramic retraction scanning
                        </div>
                      </div>
                    )}

                    {/* PDF prescription mock */}
                    {viewerType === "PDF" && (
                      <div className="flex flex-col items-center justify-center text-white space-y-3">
                        <span className="text-4xl">📄</span>
                        <div className="text-center">
                          <p className="text-xs font-bold">presc_{currentCase.id.toLowerCase()}.pdf</p>
                          <p className="text-[10px] text-gray-450 mt-0.5">SmileCare digital prescription sheet</p>
                        </div>
                        <button className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all">
                          Download Prescription
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab: CAD Desk */}
              {activeTab === "cad" && (
                <div className="space-y-6">
                  {/* Version List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revision History</h4>
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {cadVersions.map((v, idx) => (
                        <div key={idx} className="p-3 border border-gray-150 rounded-xl flex flex-col gap-1 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-gray-800">{v.version}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${v.color}`}>
                              {v.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-450">{v.date} by {v.author}</p>
                          <p className="text-xs text-gray-650 mt-0.5 font-medium">{v.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dropzone Upload */}
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-primary/50 transition-colors relative cursor-pointer">
                    <input 
                      type="file" 
                      id="drawer-stl-uploader" 
                      className="hidden" 
                      onChange={handleCadVersionUpload}
                    />
                    <label htmlFor="drawer-stl-uploader" className="cursor-pointer flex flex-col items-center gap-1 select-none">
                      <span className="text-xl">📤</span>
                      <p className="text-xs font-bold text-gray-700">Drag & Drop scanner model (.stl, .obj)</p>
                      <p className="text-[9px] text-gray-400">Click to browse local files</p>
                    </label>
                  </div>

                  {/* Designer notes log */}
                  <div className="space-y-3.5 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Technician Design Log</h4>
                    
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {designerNotesList.map((note, idx) => (
                        <div key={idx} className="flex gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100/50 p-2.5 rounded-xl">
                          <span className="text-primary font-black">•</span>
                          <p className="leading-relaxed">{note}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddDesignerNote} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Log designer parameters..." 
                        value={designerNote}
                        onChange={(e) => setDesignerNote(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                      />
                      <button 
                        type="submit" 
                        className="px-3.5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Tab: Quality Control */}
              {activeTab === "qc" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Quality Checklist</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">All items must be verified before passing case</p>
                  </div>

                  <div className="space-y-3 bg-gray-50 border border-gray-150 p-4 rounded-2xl">
                    {[
                      { key: "dimensions", name: "Margin & Dimensions", desc: "Checks sits snugly on die model without gaps." },
                      { key: "colorMatch", name: "Shade Verification", desc: "Matches guide tone under 5500K daylight." },
                      { key: "surfaceFinish", name: "Occlusion & Glaze", desc: "Luster fits and bites correctly on articulating arches." },
                      { key: "accuracy", name: "Anatomical Accuracy", desc: "Aligns correctly without excessive force." },
                      { key: "materialQuality", name: "Material Integrity", desc: "Inspect for sintering cracks or structural flaws." }
                    ].map(item => (
                      <label key={item.key} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100">
                        <input
                          type="checkbox"
                          checked={qcChecklist[item.key]}
                          onChange={() => setQcChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className="mt-0.5 w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary accent-primary"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">{item.name}</span>
                          <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">QC Comments / Failure Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Input rework instructions or inspection pass observations..."
                      value={qcComments}
                      onChange={(e) => setQcComments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder-gray-400 leading-relaxed"
                    />
                  </div>

                  {/* QC Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      onClick={handleQCReject}
                      className="px-3.5 py-2.5 text-xs font-bold text-danger bg-danger/5 border border-danger/10 hover:bg-danger hover:text-white rounded-xl transition-all cursor-pointer flex-1"
                    >
                      Reject/Discard
                    </button>
                    <button
                      onClick={handleQCFailRework}
                      className="px-3.5 py-2.5 text-xs font-bold text-warning bg-warning/5 border border-warning/10 hover:bg-warning hover:text-white rounded-xl transition-all cursor-pointer flex-1"
                    >
                      Rework Needed
                    </button>
                    <button
                      onClick={handleQCPass}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-success hover:bg-success/95 rounded-xl transition-all shadow-sm cursor-pointer flex-[2] flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Pass Quality Check
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Dispatch */}
              {activeTab === "dispatch" && (
                <div className="space-y-6">
                  {/* Courier partner details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Logistics</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Courier shipping provider information</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">Courier Service</label>
                        <select
                          value={courierPartner}
                          onChange={(e) => setCourierPartner(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                        >
                          <option value="SmileCare Express">SmileCare Express Logistics</option>
                          <option value="DHL Express">DHL Express Delivery</option>
                          <option value="FedEx Clinical">FedEx Clinical Shipping</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">Estimated Delivery</label>
                        <input
                          type="text"
                          value={estDeliveryDate}
                          onChange={(e) => setEstDeliveryDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">Tracking Code</label>
                        <input
                          type="text"
                          readOnly
                          value={`TRK-2026-${currentCase.id.split("-")[2] || "000"}`}
                          className="w-full px-3 py-2 border border-gray-150 bg-gray-50 rounded-xl text-xs text-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dispatch confirmation check */}
                  {currentCase.status === "Ready / Shipped" ? (
                    <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                      <div>
                        <h5 className="text-xs font-bold text-success">Passed Quality Control</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">This restoration is packed and fully cleared for courier pickup.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-warning">Awaiting QC Verification</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">You must pass the Quality Control checks first. However, you can still dispatch directly if required.</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleDispatchOrder}
                    className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" /> Dispatch & Ship Case
                  </button>
                </div>
              )}

            </div>

          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-55 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 ${
            toast.type === "error" 
              ? "bg-danger/5 border-danger/25 text-danger" 
              : "bg-success/5 border-success/25 text-success"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}
