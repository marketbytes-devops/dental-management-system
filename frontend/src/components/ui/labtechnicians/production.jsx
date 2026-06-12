"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

const INITIAL_CASES = [
  { id: "CASE-2026-001", patient: "Aditya Verma", dentist: "Dr. Anoop Nair", type: "Crown", material: "Zirconia", stage: "New Cases", priority: "High", dueDate: "2026-06-10", tech: "AJ" },
  { id: "CASE-2026-002", patient: "Meera Nair", dentist: "Dr. Sarah Smith", type: "Bridge", material: "E-Max", stage: "Milling", priority: "Urgent", dueDate: "2026-06-11", tech: "SN" },
  { id: "CASE-2026-003", patient: "Rajesh Kannan", dentist: "Dr. Anoop Nair", type: "Implant", material: "Zirconia", stage: "Design Complete", priority: "Medium", dueDate: "2026-06-15", tech: "RS" },
  { id: "CASE-2026-004", patient: "Shruti Hegde", dentist: "Dr. Sarah Smith", type: "Veneers", material: "E-Max", stage: "New Cases", priority: "High", dueDate: "2026-06-14", tech: "AJ" },
  { id: "CASE-2026-005", patient: "Vikram Malhotra", dentist: "Dr. Anoop Nair", type: "Denture", material: "Acrylic", stage: "Finishing", priority: "Low", dueDate: "2026-06-25", tech: "ER" },
  { id: "CASE-2026-007", patient: "Arjun Sen", dentist: "Dr. Elizabeth Rose", type: "Crown", material: "PFM", stage: "Milling", priority: "Medium", dueDate: "2026-07-02", tech: "SN" },
  { id: "CASE-2026-008", patient: "Priyanka Rao", dentist: "Dr. Sarah Smith", type: "Night Guard", material: "Composite", stage: "Printing", priority: "High", dueDate: "2026-06-12", tech: "AJ" },
  { id: "CASE-2026-009", patient: "George Mathew", dentist: "Dr. Anoop Nair", type: "Bridge", material: "PFM", stage: "QC", priority: "Medium", dueDate: "2026-06-13", tech: "RS" }
];

const COLUMNS = ["New Cases", "Design Complete", "Milling", "Printing", "Finishing", "QC"];

export default function LabProduction() {
  const [cases, setCases] = useState(INITIAL_CASES);

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
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, stage: targetStage } : c));
    }
  };

  // Move card manually (helpful for mobile or quick actions)
  const moveCard = (caseId, direction) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const currIndex = COLUMNS.indexOf(c.stage);
        let nextIndex = currIndex + direction;
        if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
          return { ...c, stage: COLUMNS[nextIndex] };
        }
      }
      return c;
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-danger/10 text-danger border-danger/20";
      case "High": return "bg-warning/10 text-warning border-warning/20";
      case "Medium": return "bg-primary/10 text-primary border-primary/20";
      case "Low":
      default: return "bg-gray-100 text-gray-550 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 pb-10 flex flex-col h-[82vh]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Production Board</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop cases across fabrication stages or use direct controls to shift states.</p>
      </div>

      {/* Kanban Container */}
      <div className="flex-1 overflow-x-auto flex gap-4 pb-4 select-none items-stretch">
        {COLUMNS.map((col) => {
          const colCases = cases.filter(c => c.stage === col);
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
                      className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing hover:border-primary/30 group relative"
                    >
                      {/* Top Row: Case & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-450">{c.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPriorityColor(c.priority)}`}>
                          {c.priority}
                        </span>
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
                        
                        <div className="flex items-center gap-1.5">
                          {/* Technician Avatar */}
                          <div className="w-5.5 h-5.5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[9px]">
                            {c.tech}
                          </div>
                        </div>
                      </div>

                      {/* Hover action triggers for easier shifting */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow border border-gray-100">
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
    </div>
  );
}
