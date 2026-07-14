"use client";

import { useState } from "react";

const INITIAL_VERSIONS = [
  { version: "v1.2", date: "2026-06-10 11:30 AM", author: "Alen Joseph (CAD)", status: "Approved", notes: "Marginal fit tightened by 10 microns as requested.", color: "bg-success/10 text-success" },
  { version: "v1.1", date: "2026-06-09 03:45 PM", author: "Alen Joseph (CAD)", status: "Rejected", notes: "Dentist requested thinner margins on lingual collar.", color: "bg-danger/10 text-danger" },
  { version: "v1.0", date: "2026-06-08 10:15 AM", author: "Scanner Import", status: "Approved", notes: "Initial STL mesh imported successfully.", color: "bg-success/10 text-success" }
];

export default function CadDesign() {
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [noteText, setNoteText] = useState("");
  const [designerNotes, setDesignerNotes] = useState([
    "Contact point on mesial aspect of #26 adjusted to 0.5mm.",
    "Thickness parameters checked; minimum zirconia thickness of 0.8mm maintained throughout."
  ]);

  // STL model states
  const [modelColor, setModelColor] = useState("#0EA5E9"); // primary cyan
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isRotating, setIsRotating] = useState(true);

  // File Upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const mockFiles = files.map(f => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      date: new Date().toLocaleDateString()
    }));
    setUploadedFiles(prev => [...mockFiles, ...prev]);

    // Add a version history record
    const newVersion = {
      version: `v1.${versions.length + 1}`,
      date: new Date().toLocaleString(),
      author: "Alen Joseph (CAD)",
      status: "Review",
      notes: `Uploaded file ${files[0]?.name || "scanner_mesh.stl"}`,
      color: "bg-warning/10 text-warning"
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (noteText.trim() === "") return;
    setDesignerNotes(prev => [...prev, noteText]);
    setNoteText("");
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">CAD Design Workspace</h1>
        <p className="text-sm text-gray-500 mt-1">Review 3D STL scans, edit prosthesis models, manage file versions, and verify dentist approvals.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Design Progress</p>
            <h3 className="text-2xl font-black text-gray-800">85% Complete</h3>
            <p className="text-xs text-success font-semibold mt-1">v1.2 Approved by Dentist</p>
          </div>
          <span className="text-3xl bg-primary/10 p-3 rounded-xl">💻</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Estimated Completion</p>
            <h3 className="text-2xl font-black text-gray-800">Today, 4:00 PM</h3>
            <p className="text-xs text-gray-400 mt-1">Next: Printing Setup</p>
          </div>
          <span className="text-3xl bg-secondary/10 p-3 rounded-xl">⏱️</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Assigned Designer</p>
            <h3 className="text-2xl font-black text-gray-800">Alen Joseph</h3>
            <p className="text-xs text-primary font-semibold mt-1">Senior CAD Specialist</p>
          </div>
          <span className="text-3xl bg-purple-50 p-3 rounded-xl text-purple-600">👤</span>
        </div>
      </div>

      {/* Main Grid: Viewport & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: 3D Viewport (8 cols) */}
        <div className="lg:col-span-8 bg-gray-950 border border-gray-900 rounded-3xl p-5 flex flex-col justify-between h-[550px] relative overflow-hidden shadow-xl">
          
          {/* Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
              backgroundImage: "radial-gradient(var(--color-primary) 0.5px, transparent 0.5px), radial-gradient(var(--color-primary) 0.5px, #030712 0.5px)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px"
            }}></div>
          )}

          {/* Viewport Header */}
          <div className="flex justify-between items-center z-10">
            <div>
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                STL Viewport v1.2
              </span>
              <h4 className="text-sm font-extrabold text-white mt-1">Maxillary Arch Scan - CASE-2026-002</h4>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowGrid(prev => !prev)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                  showGrid ? "bg-primary text-white border-primary" : "bg-transparent text-gray-400 border-gray-805 hover:text-white"
                }`}
              >
                Grid: {showGrid ? "ON" : "OFF"}
              </button>
              <button 
                onClick={() => setIsRotating(prev => !prev)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                  isRotating ? "bg-primary text-white border-primary" : "bg-transparent text-gray-400 border-gray-805 hover:text-white"
                }`}
              >
                Auto-Rotate: {isRotating ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Viewport Core Simulation */}
          <div className="flex-1 flex items-center justify-center relative select-none">
            
            {/* Compass / Orientation indicator */}
            <div className="absolute bottom-4 left-4 border border-white/10 rounded-full w-12 h-12 flex items-center justify-center text-[9px] font-mono text-gray-400">
              <div className="absolute top-1 font-bold text-primary">N</div>
              <div className="absolute right-1">E</div>
              <div className="absolute bottom-1">S</div>
              <div className="absolute left-1">W</div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            </div>

            {/* Futuristic rotating shape representing 3D STL mesh */}
            <div 
              style={{
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.2s"
              }}
              className="relative w-48 h-48 flex items-center justify-center"
            >
              {/* Outer rings */}
              <div className="absolute inset-0 border border-dashed border-white/5 rounded-full animate-spin duration-30000"></div>
              <div className="absolute inset-4 border border-primary/20 rounded-full animate-spin duration-10000"></div>

              {/* Wireframe Mesh */}
              <svg 
                className={`w-36 h-36 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)] ${isRotating ? "animate-spin duration-[12000ms]" : ""}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke={modelColor} 
                strokeWidth="0.8"
              >
                {/* Simulated complex dental crown mesh */}
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                <path d="M12 2v20M2 7v10M22 7v10" strokeDasharray="1 1" />
                <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
                <polygon points="12,4 4,12 12,20 20,12" strokeWidth="0.5" />
              </svg>
            </div>
          </div>

          {/* Viewport Controls Footer */}
          <div className="flex justify-between items-center z-10 border-t border-white/10 pt-4">
            {/* Color selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Mesh Color:</span>
              <div className="flex gap-1.5">
                {["#0EA5E9", "#14B8A6", "#EAB308", "#A855F7"].map(c => (
                  <button 
                    key={c}
                    onClick={() => setModelColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform ${
                      modelColor === c ? "scale-125 border-white" : "border-transparent"
                    }`}
                  ></button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Zoom:</span>
              <input 
                type="range" 
                min="0.5" 
                max="2.0"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-24 accent-primary"
              />
              <span className="text-[10px] font-mono text-gray-400 w-8">x{zoomLevel.toFixed(1)}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Versioning & Notes (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Version History Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 flex-1">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Design Versions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Track STL uploads and dentist checkoffs</p>
            </div>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {versions.map((v) => (
                <div key={v.version} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-800">{v.version}</span>
                      <span className="text-[9px] text-gray-400 font-medium">({v.author})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${v.color}`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-450 mt-0.5">{v.date}</p>
                  <p className="text-xs text-gray-650 mt-1.5 leading-relaxed">{v.notes}</p>
                </div>
              ))}
            </div>

            {/* Dropzone Uploader */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload({ target: { files: e.dataTransfer.files } }); }}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 ${
                isDragging ? "border-primary bg-primary/5 scale-[0.98]" : "border-gray-200 hover:border-primary/50"
              }`}
            >
              <input 
                type="file" 
                id="stl-uploader"
                accept=".stl,.obj"
                className="hidden" 
                onChange={handleFileUpload}
              />
              <label htmlFor="stl-uploader" className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                <span className="text-2xl">📤</span>
                <p className="text-xs font-bold text-gray-700">Drag & Drop new STL scan</p>
                <p className="text-[10px] text-gray-400">or click to browse files (.stl, .obj)</p>
              </label>
            </div>
          </div>

          {/* Notes Sidebar Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Designer Log</h3>
              <p className="text-xs text-gray-400 mt-0.5">Internal comments and parameters check</p>
            </div>

            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {designerNotes.map((note, index) => (
                <div key={index} className="flex gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                  <span className="text-primary">•</span>
                  <p className="leading-relaxed">{note}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
              <input 
                type="text" 
                placeholder="Add designer note..." 
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
              <button 
                type="submit"
                className="px-3 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
