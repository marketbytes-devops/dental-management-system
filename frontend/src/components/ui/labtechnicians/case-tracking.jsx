"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

const TRACKING_CASES = [
  {
    id: "CASE-2026-002",
    patientName: "Meera Nair",
    age: 34,
    gender: "Female",
    dentistName: "Dr. Sarah Smith",
    dentistContact: "+91 94477 12345",
    clinicName: "SmileCare Central",
    prostheticType: "Bridge (3-Unit)",
    material: "E-Max Lithium Disilicate",
    shade: "A1",
    notes: "Pontic on #24. Gingival characterization required.",
    dueDate: "2026-06-11",
    activeStep: 2, // Fabrication
    timeline: [
      { name: "Order Received", date: "2026-06-08 09:30 AM", status: "Completed", note: "Impression scanned and verified." },
      { name: "Design Started", date: "2026-06-09 11:00 AM", status: "Completed", note: "3D CAD model approved by dentist." },
      { name: "Fabrication", date: "2026-06-10 08:30 AM", status: "In Progress", note: "Milling zirconia coping." },
      { name: "QC Check", date: "Pending", status: "Upcoming", note: "Dimensional & shade verification." },
      { name: "Dispatch", date: "Pending", status: "Upcoming", note: "Courier scheduling." }
    ],
    xrayUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400&auto=format&fit=crop", // Dental X-ray mock image
    stlUrl: "",
    pdfUrl: "presc_meera_nair_bridge.pdf",
    photos: [
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?q=80&w=200&auto=format&fit=crop"
    ]
  },
  {
    id: "CASE-2026-003",
    patientName: "Rajesh Kannan",
    age: 45,
    gender: "Male",
    dentistName: "Dr. Anoop Nair",
    dentistContact: "+91 98765 43210",
    clinicName: "SmileCare Orthodontics",
    prostheticType: "Implant Crown",
    material: "Screw-Retained Zirconia",
    shade: "A3",
    notes: "Ti-base included. Torque to 35 Ncm during try-in.",
    dueDate: "2026-06-15",
    activeStep: 1, // Design Started
    timeline: [
      { name: "Order Received", date: "2026-06-09 02:15 PM", status: "Completed", note: "STL file imported." },
      { name: "Design Started", date: "2026-06-10 10:00 AM", status: "In Progress", note: "Generating CAD crown design." },
      { name: "Fabrication", date: "Pending", status: "Upcoming", note: "3D metal printing." },
      { name: "QC Check", date: "Pending", status: "Upcoming", note: "Occlusal alignment test." },
      { name: "Dispatch", date: "Pending", status: "Upcoming", note: "Delivery preparation." }
    ],
    xrayUrl: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=400&auto=format&fit=crop",
    stlUrl: "",
    pdfUrl: "presc_rajesh_kannan_implant.pdf",
    photos: []
  }
];

export default function CaseTracking() {
  const [cases, setCases] = useState(TRACKING_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState("CASE-2026-002");
  const [viewerTab, setViewerTab] = useState("STL"); // STL, XRAY, PDF, PHOTOS

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // STL mock viewer properties
  const [stlRotation, setStlRotation] = useState(45);
  const [stlZoom, setStlZoom] = useState(1);

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Case Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Case Tracking & Details</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize full prescription specs, timeline milestones, and digital scanner data.</p>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Case:</label>
          <select 
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.id} - {c.patientName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Patient & Case Info (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">Patient Card</span>
              <h3 className="text-lg font-black text-gray-900 mt-2">{currentCase.patientName}</h3>
              <p className="text-xs text-gray-400 font-medium">SmileCare ID: PT-{currentCase.id.split("-")[2]}</p>
            </div>

            <div className="h-px bg-gray-100"></div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Demographics</label>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{currentCase.age} Yrs, {currentCase.gender}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Ordering Dentist</label>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{currentCase.dentistName}</p>
                <p className="text-xs text-gray-400">{currentCase.dentistContact}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Clinic Center</label>
                <p className="text-sm font-semibold text-gray-805 mt-0.5">{currentCase.clinicName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Delivery Due Date</label>
                <p className="text-sm font-bold text-danger mt-0.5 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-danger" /> {currentCase.dueDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Lab Prescription & Viewers (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Lab Prescription Specs Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Lab Prescription Specs</h3>
              <p className="text-xs text-gray-400 mt-0.5">Dental fabrication and restoration orders</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50/70 border border-gray-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Restoration</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{currentCase.prostheticType}</p>
              </div>
              <div className="bg-gray-50/70 border border-gray-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Material</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{currentCase.material}</p>
              </div>
              <div className="bg-gray-50/70 border border-gray-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Veneer/Crown Shade</span>
                <p className="text-sm font-extrabold text-amber-800 mt-0.5 bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200/40">{currentCase.shade}</p>
              </div>
            </div>

            {currentCase.notes && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 italic text-xs text-gray-600 leading-relaxed">
                "{currentCase.notes}"
              </div>
            )}
          </div>

          {/* Digital Viewers Card */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
            
            {/* Viewer Tab Header */}
            <div className="bg-gray-55/60 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Digital Scanner Files</span>
              <div className="flex gap-1.5">
                {["STL", "XRAY", "PDF", "PHOTOS"].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setViewerTab(tab)}
                    className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md transition-all cursor-pointer ${
                      viewerTab === tab ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-500 hover:text-primary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Viewer Display Window */}
            <div className="flex-1 bg-gray-900 relative flex items-center justify-center overflow-hidden">
              
              {/* STL 3D Mesh Viewer Mockup */}
              {viewerTab === "STL" && (
                <div className="w-full h-full flex flex-col justify-between p-4 z-10 select-none">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-2 py-1 rounded-md">
                      3D Model Viewer: Active (.stl)
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setStlZoom(prev => Math.min(2, prev + 0.1))}
                        className="w-7 h-7 bg-white/10 text-white rounded hover:bg-white/20 transition-all font-bold text-xs"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => setStlZoom(prev => Math.max(0.5, prev - 0.1))}
                        className="w-7 h-7 bg-white/10 text-white rounded hover:bg-white/20 transition-all font-bold text-xs"
                      >
                        -
                      </button>
                    </div>
                  </div>

                  {/* Wireframe/3D Mesh Simulation */}
                  <div 
                    style={{ 
                      transform: `rotateX(${stlRotation}deg) rotateY(${stlRotation * 1.5}deg) scale(${stlZoom})`,
                      transition: "transform 0.1s ease-out"
                    }}
                    className="w-32 h-32 border-2 border-primary/40 rounded-xl relative self-center flex items-center justify-center animate-spin duration-15000"
                  >
                    <div className="absolute w-24 h-24 border-2 border-primary/20 rounded-full animate-ping"></div>
                    {/* Fake tooth wireframe */}
                    <svg className="w-16 h-16 text-primary drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>Use mouse click or slider to rotate mesh</span>
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

              {/* XRAY Viewer */}
              {viewerTab === "XRAY" && (
                <div className="w-full h-full relative flex items-center justify-center p-6">
                  <img 
                    src={currentCase.xrayUrl} 
                    alt="Dental Xray" 
                    className="max-h-full max-w-full object-contain rounded border border-white/15 opacity-80"
                  />
                  <div className="absolute bottom-4 left-4 text-[10px] bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white border border-white/10">
                    Optragate retraction image / Panoramic View
                  </div>
                </div>
              )}

              {/* PDF Viewer */}
              {viewerTab === "PDF" && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
                  <span className="text-5xl">📄</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{currentCase.pdfUrl}</p>
                    <p className="text-xs text-gray-400 mt-1">SmileCare digital prescription sheet (Signed)</p>
                  </div>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all">
                    Download Document
                  </button>
                </div>
              )}

              {/* Photos Grid */}
              {viewerTab === "PHOTOS" && (
                <div className="w-full h-full p-4 overflow-y-auto grid grid-cols-2 gap-4">
                  {currentCase.photos.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center text-gray-400 space-y-2 h-full">
                      <span className="text-3xl">📷</span>
                      <p className="text-xs">No reference photos uploaded for this case</p>
                    </div>
                  ) : (
                    currentCase.photos.map((p, i) => (
                      <div key={i} className="aspect-square bg-black border border-white/10 rounded-xl overflow-hidden group relative">
                        <img src={p} alt="Reference teeth" className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute bottom-2 left-2 text-[9px] bg-black/50 px-1.5 py-0.5 rounded text-white font-bold">
                          Tooth reference #{i+1}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Right Column - Order Timeline (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Lab Workflow Status</h3>
              <p className="text-xs text-gray-400 mt-0.5">Timeline track and technician milestones</p>
            </div>

            {/* Timeline Nodes */}
            <div className="relative pl-6 space-y-6 border-l-2 border-gray-100 ml-3 py-1">
              {currentCase.timeline.map((step, index) => {
                const isCompleted = step.status === "Completed";
                const isInProgress = step.status === "In Progress";
                
                return (
                  <div key={step.name} className="relative group">
                    {/* Icon Node Indicator */}
                    <span className={`absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 ${
                      isCompleted ? "bg-success border-success text-white text-[9px] font-bold" :
                      isInProgress ? "bg-primary border-primary animate-pulse" :
                      "bg-white border-gray-200"
                    }`}>
                      {isCompleted ? "✓" : ""}
                    </span>

                    <div>
                      <h4 className={`text-xs font-bold ${
                        isCompleted ? "text-success" :
                        isInProgress ? "text-primary" :
                        "text-gray-400"
                      }`}>
                        {step.name}
                      </h4>
                      <p className="text-[10px] text-gray-450 mt-0.5">{step.date}</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{step.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
