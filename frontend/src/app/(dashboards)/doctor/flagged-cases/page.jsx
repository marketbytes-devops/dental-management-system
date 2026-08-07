"use client";

import { useState, useEffect } from "react";
import { useDoctor } from "@/context/DoctorContext";
import { updateLabOrder, uploadLabFile } from "@/services/api";
import { 
  AlertTriangle, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight, 
  X, 
  UploadCloud, 
  Send, 
  Edit3, 
  Eye, 
  ArrowLeft 
} from "lucide-react";

export default function FlaggedCasesPage() {
  const { 
    flaggedCases = [], 
    flaggedCasesCount = 0, 
    fetchLabOrders, 
    showNotification 
  } = useDoctor();

  // Modal states
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("read"); // "read" | "edit"

  // Edit form state
  const [editForm, setEditForm] = useState({
    tooth_number: "",
    fabrication_type: "Crown",
    material: "Zirconia",
    shade: "A2",
    impression_type: "Physical",
    priority: "Medium",
    notes: "",
    scan_file: ""
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenReviewModal = (labCase) => {
    setSelectedCase(labCase);
    setEditForm({
      tooth_number: labCase.tooth_number || labCase.toothQuadrant || labCase.toothNumber || "",
      fabrication_type: labCase.fabrication_type || labCase.prosthetic_type || labCase.prostheticType || "Crown",
      material: labCase.material || "Zirconia",
      shade: labCase.shade || "A2",
      impression_type: labCase.impression_type || labCase.impressionType || "Physical",
      priority: labCase.priority || "Medium",
      notes: labCase.notes || "",
      scan_file: labCase.scan_file || labCase.scanFile || ""
    });
    setModalMode("read");
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadLabFile(formData);
      setEditForm(prev => ({ ...prev, scan_file: res.name || file.name }));
      if (showNotification) showNotification(`Uploaded file "${file.name}" successfully.`);
    } catch (err) {
      console.error(err);
      alert("Failed to upload scan file.");
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      const payload = {
        tooth_number: editForm.tooth_number,
        tooth_quadrant: editForm.tooth_number,
        fabrication_type: editForm.fabrication_type,
        prosthetic_type: editForm.fabrication_type,
        material: editForm.material,
        shade: editForm.shade,
        impression_type: editForm.impression_type,
        priority: editForm.priority,
        notes: editForm.notes,
        scan_file: editForm.scan_file,
        status: "Resubmitted by Doctor"
      };

      await updateLabOrder(selectedCase.id, payload);

      if (showNotification) {
        showNotification(`Case #${selectedCase.id} updated & resubmitted to Lab Technician!`);
      }
      
      setIsModalOpen(false);
      if (fetchLabOrders) fetchLabOrders();
    } catch (err) {
      console.error("Failed to resubmit lab order:", err);
      alert("Failed to resubmit lab order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Flagged Lab Cases</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Lab orders flagged by technician requiring your clinical review and corrections.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {flaggedCasesCount} Flagged Case{flaggedCasesCount === 1 ? "" : "s"} Pending
          </span>
        </div>
      </div>

      {/* Main Grid / Empty State */}
      {flaggedCases.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Flagged Cases!</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
            All your prosthetic and lab orders are processing smoothly. No cases currently require clinical revision or parameter corrections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {flaggedCases.map((order) => {
            const flagReason = order.rejection_reason || order.tech_notes || order.notes || "Missing required clinical parameters or specs.";
            const tooth = order.tooth_number || order.toothQuadrant || order.toothNumber || "Unspecified";
            const proc = order.prosthetic_type || order.prostheticType || order.order_category || order.orderCategory || "Prosthetic Case";

            return (
              <div 
                key={order.id} 
                className="bg-white border border-rose-100 hover:border-rose-300 rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between group hover:shadow-md"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {order.status || "Flagged - Waiting for Doctor Review"}
                      </span>
                      <h3 className="text-sm font-black text-gray-900 mt-1.5 flex items-center gap-1.5">
                        <span>Case #{order.id}</span>
                      </h3>
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-150">
                      {order.priority || "Medium"}
                    </span>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" /> Patient:
                      </span>
                      <span className="font-extrabold text-gray-900">{order.patient_name || order.patientName || "Walk-in Patient"}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-700">
                      <span className="text-gray-400 font-medium">Procedure:</span>
                      <span className="font-bold text-gray-800">{proc}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-700">
                      <span className="text-gray-400 font-medium">Tooth #:</span>
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{tooth}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-700">
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" /> Flagged On:
                      </span>
                      <span className="font-semibold text-gray-600">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "Today"}
                      </span>
                    </div>
                  </div>

                  {/* Flag Reason Callout */}
                  <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3 mb-4 text-xs text-rose-900 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Tech Feedback / Flag Reason
                    </span>
                    <p className="font-semibold text-rose-800 text-[11px] leading-relaxed line-clamp-3">
                      {flagReason}
                    </p>
                  </div>
                </div>

                {/* Card Action */}
                <button
                  onClick={() => handleOpenReviewModal(order)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Review Case
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Case Modal */}
      {isModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white text-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 font-sans text-left my-6">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                  Flagged Case Terminal — {modalMode === "read" ? "Review Mode" : "Edit & Resubmit Mode"}
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-1 flex items-center gap-2">
                  Case #{selectedCase.id} — Patient: {selectedCase.patient_name || selectedCase.patientName}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Lab Technician Feedback Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Lab Technician Feedback / Reason Flagged</span>
                </div>
                <p className="font-semibold leading-relaxed text-xs text-rose-900 bg-white/70 p-3 rounded-xl border border-rose-200">
                  {selectedCase.rejection_reason || selectedCase.tech_notes || selectedCase.notes || "Missing or incomplete clinical parameters. Please review specs, shade, tooth number, or attachments."}
                </p>
              </div>

              {modalMode === "read" ? (
                /* READ-ONLY VIEW */
                <div className="space-y-5">
                  {/* Patient & Case Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 border border-gray-200/80 p-4 rounded-2xl text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Name</p>
                      <p className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedCase.patient_name || selectedCase.patientName}</p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Token: {selectedCase.patient_token || selectedCase.patientToken || "PT-NORMAL"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Procedure / Case Category</p>
                      <p className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedCase.prosthetic_type || selectedCase.prostheticType || selectedCase.order_category}</p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Priority: {selectedCase.priority}</p>
                    </div>
                  </div>

                  {/* Clinical Specifications Table */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-600 border-b pb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Clinical Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 font-medium block">Tooth Number(s):</span>
                        <span className="font-extrabold text-gray-900">{selectedCase.tooth_number || selectedCase.toothQuadrant || "Unspecified"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Material:</span>
                        <span className="font-bold text-gray-900">{selectedCase.material || "Unspecified"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Shade:</span>
                        <span className="font-bold text-gray-900">{selectedCase.shade || "Unspecified"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Impression Type:</span>
                        <span className="font-bold text-gray-900">{selectedCase.impression_type || selectedCase.impressionType || "Physical"}</span>
                      </div>
                    </div>

                    {selectedCase.notes && (
                      <div className="pt-2 border-t mt-2">
                        <span className="text-gray-400 font-medium block mb-1">Doctor&apos;s Notes / Prescription Instructions:</span>
                        <p className="bg-gray-50 p-3 rounded-xl text-xs font-semibold text-gray-800 border leading-relaxed">{selectedCase.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Attachments */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-600 border-b pb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-indigo-600" /> Uploaded Clinical Attachments
                    </h4>
                    {selectedCase.scan_file || selectedCase.scanFile ? (
                      <a 
                        href={`/api/lab/files/${selectedCase.scan_file || selectedCase.scanFile}`} 
                        download
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{selectedCase.scan_file || selectedCase.scanFile}</span>
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 font-semibold italic">No digital scan or attachments uploaded yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* EDIT FORM VIEW */
                <form 
                  id="resubmit-form" 
                  onSubmit={(e) => e.preventDefault()} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                      e.preventDefault();
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-900 font-medium">
                    ✏️ <strong>Edit Mode:</strong> Modify the lab order parameters below. Unrelated patient demographic & medical history remain locked.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Fabrication / Restoration Type Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Fabrication Type *</label>
                      <select 
                        value={editForm.fabrication_type}
                        onChange={(e) => setEditForm({ ...editForm, fabrication_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                      >
                        <option value="Crown">Crown</option>
                        <option value="Bridge">Bridge</option>
                        <option value="Denture">Denture</option>
                        <option value="Veneer">Veneer</option>
                        <option value="Night guard-Retainer">Night guard / Retainer</option>
                        <option value="Implant crown">Implant crown</option>
                        <option value="Inlay / Onlay">Inlay / Onlay</option>
                        <option value="Full Arch Restoration">Full Arch Restoration</option>
                      </select>
                    </div>

                    {/* Tooth Number / Quadrant Input */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Tooth Number(s) / Quadrant *</label>
                      <input 
                        type="text" 
                        value={editForm.tooth_number}
                        onChange={(e) => setEditForm({ ...editForm, tooth_number: e.target.value })}
                        placeholder="e.g. Tooth #16, 21, Full Arch"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>

                    {/* Material Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Material *</label>
                      <select 
                        value={editForm.material}
                        onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                      >
                        <option value="Zirconia">Zirconia</option>
                        <option value="Monolithic Zirconia">Monolithic Zirconia</option>
                        <option value="Layered Zirconia">Layered Zirconia</option>
                        <option value="PFM">PFM (Porcelain Fused to Metal)</option>
                        <option value="E-max">E-max (Lithium Disilicate)</option>
                        <option value="Acrylic">Acrylic</option>
                        <option value="Composite">Composite</option>
                        <option value="Metal">Metal (Gold / Co-Cr)</option>
                        <option value="PMMA Temporary">PMMA Temporary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Shade Match Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Shade Match *</label>
                      <select 
                        value={editForm.shade}
                        onChange={(e) => setEditForm({ ...editForm, shade: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="A3.5">A3.5</option>
                        <option value="A4">A4</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B3">B3</option>
                        <option value="B4">B4</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                        <option value="C3">C3</option>
                        <option value="C4">C4</option>
                        <option value="D2">D2</option>
                        <option value="D3">D3</option>
                        <option value="D4">D4</option>
                        <option value="Bleach BL1">Bleach BL1</option>
                        <option value="Bleach BL2">Bleach BL2</option>
                        <option value="Bleach BL3">Bleach BL3</option>
                        <option value="Bleach BL4">Bleach BL4</option>
                        <option value="Custom">Custom / Bleach Guide</option>
                      </select>
                    </div>

                    {/* Impression Type Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Impression Type *</label>
                      <select
                        value={editForm.impression_type}
                        onChange={(e) => setEditForm({ ...editForm, impression_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                      >
                        <option value="Physical">Physical Impression</option>
                        <option value="Digital 3D Scan">Digital 3D Scan (STL)</option>
                      </select>
                    </div>

                    {/* Priority Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Priority Level *</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Doctor&apos;s Notes / Corrected Instructions</label>
                    <textarea 
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add corrected lab instructions or respond to tech feedback..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  {/* File Upload Dropzone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Upload Digital Scan / Revised STL Attachment</label>
                    <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors">
                      <input 
                        type="file" 
                        id="scan-upload" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <label htmlFor="scan-upload" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                        <UploadCloud className="w-6 h-6 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-700">
                          {uploading ? "Uploading..." : editForm.scan_file ? `File: ${editForm.scan_file}` : "Click to Upload New STL Scan / File"}
                        </span>
                        <span className="text-[10px] text-gray-400">Supports .stl, .ply, .dcm, .jpg, .png, .pdf</span>
                      </label>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center gap-3">
              {modalMode === "read" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Back to List
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode("edit")}
                    className="px-6 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Case
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setModalMode("read")}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleResubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {submitting ? "Resubmitting..." : "Resubmit to Lab"}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
