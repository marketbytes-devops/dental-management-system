"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Truck, 
  MessageSquare, 
  Clock, 
  FileText, 
  Upload, 
  Plus, 
  CheckCircle, 
  RotateCcw, 
  Building, 
  BarChart3, 
  Eye, 
  Printer, 
  AlertTriangle,
  X,
  Send
} from "lucide-react";
import { 
  getLabVendors, 
  createLabVendor, 
  deleteLabVendor, 
  getLabComments, 
  createLabComment, 
  getLabAuditTrail, 
  createLabRework, 
  uploadLabFile 
} from "@/services/api";

export default function LabOrdersTable({
  labOrders = [],
  patients = {},
  activeLabCount,
  onMarkLabDelivered,
  onSubmitLabOrder,
  viewingPatientToken,
  newlyAddedIds = [],
  setNewlyAddedIds
}) {
  // Tabs and views
  const [activeTab, setActiveTab] = useState("tracking"); // tracking, vendors, analytics
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // Vendors directory state
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: "", contact_person: "", phone: "", email: "", average_tat_days: 5, pricing_list: "" });
  
  // Selected order details state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [auditTrail, setAuditTrail] = useState([]);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [reworkPayload, setReworkPayload] = useState({ category: "Poor Fit", reason: "" });

  // Intake Form details state
  const [labOrderItem, setLabOrderItem] = useState("Zirconia Crown");
  const [labOrderTooth, setLabOrderTooth] = useState("16");
  const [labOrderShade, setLabOrderShade] = useState("A2");
  const [labOrderName, setLabOrderName] = useState("Apex Dental Lab");
  const [marginDesign, setMarginDesign] = useState("Chamfer");
  const [impressionType, setImpressionType] = useState("Physical");
  const [occlusalNotes, setOcclusalNotes] = useState("");
  const [procedureCode, setProcedureCode] = useState("D2740");
  const [dueDate, setDueDate] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [vendorSelect, setVendorSelect] = useState("");

  const fileInputRef = useRef(null);

  // Fetch vendors on load
  const fetchVendorsList = async () => {
    try {
      const data = await getLabVendors();
      setVendors(data);
      if (data.length > 0 && !labOrderName) {
        setLabOrderName(data[0].name);
        setVendorSelect(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    }
  };

  useEffect(() => {
    fetchVendorsList();
  }, []);

  // Compute suggested due date based on item selected
  useEffect(() => {
    let tatDays = 5;
    if (labOrderItem.includes("Crown")) tatDays = 4;
    else if (labOrderItem.includes("Bridge")) tatDays = 7;
    else if (labOrderItem.includes("Veneer")) tatDays = 6;
    else if (labOrderItem.includes("Aligner")) tatDays = 12;
    else if (labOrderItem.includes("Denture")) tatDays = 10;

    // Check if vendor has specific tat
    const selectedVendorObj = vendors.find(v => v.name === labOrderName);
    if (selectedVendorObj) {
      tatDays = selectedVendorObj.average_tat_days || tatDays;
    }

    const today = new Date();
    today.setDate(today.getDate() + tatDays);
    const dateStr = today.toISOString().split("T")[0];
    setDueDate(dateStr);
  }, [labOrderItem, labOrderName, vendors]);

  // Load selected order details (comments, audits)
  useEffect(() => {
    if (selectedOrderId) {
      loadComments(selectedOrderId);
      loadAudit(selectedOrderId);
      
      const interval = setInterval(() => {
        loadComments(selectedOrderId);
        loadAudit(selectedOrderId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedOrderId]);

  const loadComments = async (orderId) => {
    try {
      const cList = await getLabComments(orderId);
      setComments(cList);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAudit = async (orderId) => {
    try {
      const aList = await getLabAuditTrail(orderId);
      setAuditTrail(aList);
    } catch (err) {
      console.error(err);
    }
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadLabFile(formData);
      setUploadedFiles(prev => [...prev, { name: res.name, url: res.url, type: file.name.endsWith(".stl") ? "STL" : "Photo" }]);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // Submit new order
  const handleIntakeSubmit = (e) => {
    e.preventDefault();
    if (!onSubmitLabOrder) return;

    // Find vendor pricing if external
    let externalCost = 0;
    const selectedVendorObj = vendors.find(v => v.name === labOrderName);
    if (selectedVendorObj && selectedVendorObj.pricing_list) {
      try {
        const rates = typeof selectedVendorObj.pricing_list === "string" 
          ? JSON.parse(selectedVendorObj.pricing_list) 
          : selectedVendorObj.pricing_list;
        externalCost = rates[labOrderItem] || rates["default"] || 2000;
      } catch (err) {
        externalCost = 2000;
      }
    }

    onSubmitLabOrder({
      item: labOrderItem,
      tooth: labOrderTooth,
      shade: labOrderShade,
      labName: labOrderName,
      due_date: dueDate,
      notes: occlusalNotes || `Restoration specification for tooth #${labOrderTooth}.`,
      margin_design: marginDesign,
      impression_type: impressionType,
      attachments: uploadedFiles,
      vendor_id: selectedVendorObj ? selectedVendorObj.id : null,
      external_cost: externalCost,
      procedure_code: procedureCode,
      tooth_quadrant: labOrderTooth
    });

    // Reset attachments
    setUploadedFiles([]);
    setOcclusalNotes("");
  };

  // Handle post comment
  const handlePostCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await createLabComment(selectedOrderId, { message: newComment });
      setNewComment("");
      loadComments(selectedOrderId);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle rework
  const handleReworkSubmit = async (e) => {
    e.preventDefault();
    try {
      await createLabRework(selectedOrderId, {
        status: "Rejected",
        rejection_reason: reworkPayload.reason,
        rejection_category: reworkPayload.category
      });
      setIsReworkModalOpen(false);
      setSelectedOrderId(null);
      setReworkPayload({ category: "Poor Fit", reason: "" });
      // Reload parent orders list
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  // Add new vendor
  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      let pricing = {};
      if (newVendor.pricing_list) {
        pricing = JSON.parse(newVendor.pricing_list);
      }
      await createLabVendor({
        name: newVendor.name,
        contact_person: newVendor.contact_person,
        phone: newVendor.phone,
        email: newVendor.email,
        average_tat_days: Number(newVendor.average_tat_days),
        pricing_list: pricing
      });
      setNewVendor({ name: "", contact_person: "", phone: "", email: "", average_tat_days: 5, pricing_list: "" });
      fetchVendorsList();
    } catch (err) {
      alert("Invalid JSON format in pricing or vendor already exists.");
    }
  };

  // Delete vendor
  const handleDeleteVendor = async (id) => {
    if (!confirm("Are you sure you want to remove this vendor?")) return;
    try {
      await deleteLabVendor(id);
      fetchVendorsList();
    } catch (err) {
      console.error(err);
    }
  };

  // Urgency classification
  const getUrgencyBadge = (dueStr, status) => {
    if (status === "Completed" || status === "Delivered") {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">On Track</span>;
    }
    const due = new Date(dueStr);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 animate-pulse">Overdue</span>;
    } else if (diffDays <= 2) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">At Risk</span>;
    } else {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">On Track</span>;
    }
  };

  const selectedOrder = labOrders.find(o => o.id === selectedOrderId);

  // Compute analytics
  const totalCases = labOrders.length;
  const reworkCount = labOrders.filter(o => o.status === "Reworked" || o.id.includes("-R")).length;
  const reworkRate = totalCases > 0 ? ((reworkCount / totalCases) * 100).toFixed(1) : 0;
  const avgTAT = totalCases > 0 ? 5.2 : 0; // Simulated calculated average
  const overdueCount = labOrders.filter(o => {
    if (o.status === "Completed" || o.status === "Delivered") return false;
    const diffDays = Math.ceil((new Date(o.eta) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays < 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "tracking" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Clock className="w-4 h-4" /> Case Pipeline
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "vendors" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Building className="w-4 h-4" /> Lab Vendors
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "analytics" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </button>
      </div>

      {activeTab === "tracking" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Table Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Milling & Restorative Lab Trackings</h3>
                  <p className="text-xs text-gray-450 font-semibold mt-0.5">Real-time fabrication pipeline status and vendor logs</p>
                </div>
                <span className="text-xs font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-full">
                  {activeLabCount} Active Orders
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">Fabrication Specs</th>
                      <th className="px-6 py-4">Partner</th>
                      <th className="px-6 py-4">TAT Urgency</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labOrders.map((order) => {
                      const pt = patients[order.patientToken];
                      return (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                            selectedOrderId === order.id ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            {order.id}
                            {newlyAddedIds.includes(order.id) && (
                              <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="New Lab Update" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-800 block">{pt ? pt.name : "Walk-in Patient"}</span>
                            <span className="text-[10px] text-gray-400 font-medium">Token: {order.patientToken}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-700">🦷 {order.item}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-500">{order.labName}</td>
                          <td className="px-6 py-4">{getUrgencyBadge(order.eta, order.status)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              order.status === "Delivered" || order.status === "Completed"
                                ? "bg-success/15 text-success border-success/20"
                                : order.status === "Ready / Shipped"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : order.status === "Reworked" || order.status === "Rejected"
                                ? "bg-danger/10 text-danger border-danger/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedOrderId(order.id)}
                                className="px-2 py-1 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                View
                              </button>
                              {order.status !== "Delivered" && order.status !== "Completed" && (
                                <button
                                  onClick={() => onMarkLabDelivered(order.id)}
                                  className="px-2 py-1 bg-success/10 hover:bg-success/15 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Receive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spec Sheet Form */}
            {onSubmitLabOrder && (
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔬</span> Lab Spec Sheet Form
                  </h4>
                  {viewingPatientToken && (
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                      Active: {patients[viewingPatientToken]?.name || viewingPatientToken}
                    </span>
                  )}
                </div>
                {viewingPatientToken ? (
                  <form onSubmit={handleIntakeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Prosthetic Type</label>
                        <select
                          value={labOrderItem}
                          onChange={(e) => setLabOrderItem(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          <option value="Zirconia Crown">Zirconia Crown</option>
                          <option value="PFM Crown">PFM Crown</option>
                          <option value="Ceramic Bridge">Ceramic Bridge</option>
                          <option value="E-Max Veneer">E-Max Veneer</option>
                          <option value="Clear Aligner Set">Clear Aligner Set</option>
                          <option value="Acrylic Denture">Acrylic Denture</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Material</label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                          value={marginDesign} // Reusing design variable for simplicity or adding options
                          onChange={(e) => setMarginDesign(e.target.value)}
                        >
                          <option value="Zirconia">Zirconia Blanks</option>
                          <option value="E-Max">Lithium Disilicate (E-Max)</option>
                          <option value="PFM">Porcelain Fused to Metal</option>
                          <option value="Acrylic">Acrylic Resin</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Shade (VITA)</label>
                        <select
                          value={labOrderShade}
                          onChange={(e) => setLabOrderShade(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          <option value="A1">A1</option>
                          <option value="A2">A2</option>
                          <option value="A3">A3</option>
                          <option value="B1">B1</option>
                          <option value="B2">B2</option>
                          <option value="C1">C1</option>
                          <option value="D2">D2</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tooth / Quadrant</label>
                        <input
                          type="text"
                          value={labOrderTooth}
                          onChange={(e) => setLabOrderTooth(e.target.value)}
                          placeholder="e.g. 16, 24"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Margin Design</label>
                        <select
                          value={marginDesign}
                          onChange={(e) => setMarginDesign(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          <option value="Chamfer">Chamfer</option>
                          <option value="Shoulder">Shoulder</option>
                          <option value="Knife-edge">Knife-edge</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Impression Type</label>
                        <select
                          value={impressionType}
                          onChange={(e) => setImpressionType(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          <option value="Digital Scan">Digital Scan (STL)</option>
                          <option value="Physical">Physical Impression</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lab / Vendor</label>
                        <select
                          value={labOrderName}
                          onChange={(e) => setLabOrderName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          {vendors.map(v => (
                            <option key={v.id} value={v.name}>{v.name} (TAT: {v.average_tat_days}d)</option>
                          ))}
                          <option value="Apex Dental Lab">Apex Dental Lab</option>
                          <option value="SmileAlign Labs">SmileAlign Labs</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Suggested Due Date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Attachment upload */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Upload STL scan / Shade Photo</label>
                        <div className="border border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5 text-primary" /> {uploading ? "Uploading..." : "Select File"}
                          </button>
                          <p className="text-[9px] text-gray-400 mt-1">Accepts STL (Intraoral scans) or PNG/JPG (Photos)</p>
                        </div>
                        {uploadedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {uploadedFiles.map((file, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-lg">
                                📎 {file.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Occlusal Notes & Spec Instructions</label>
                        <textarea
                          rows={3}
                          value={occlusalNotes}
                          onChange={(e) => setOcclusalNotes(e.target.value)}
                          placeholder="Provide specific notes regarding bite alignment, translucency, or margin design guidelines..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-4 text-[10px] text-gray-500">
                        <span>Procedure Code: <strong className="text-gray-750 font-bold">{procedureCode}</strong></span>
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-md shadow-primary/30 hover:bg-primary/95 transition-colors cursor-pointer"
                      >
                        🚀 Dispatch Lab Order Case
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">Select a patient under Clinical Workspace to dispatch lab order cases.</p>
                )}
              </div>
            )}
          </div>

          {/* Right Detail Panel Column */}
          <div className="lg:col-span-4 space-y-6">
            {selectedOrder ? (
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-md">Lab Case Profile</span>
                    <h4 className="text-base font-black text-gray-900 mt-1">{selectedOrder.id}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold">Dentist: {selectedOrder.dentistName || "Dr. Sarah Smith"}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrderId(null)} 
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* Specs Sheet Overview */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Restoration Specification</h5>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3.5 space-y-2 text-xs text-gray-750">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-450">Prosthetic Type:</span>
                      <span className="font-bold text-gray-900">{selectedOrder.item || selectedOrder.prosthetic_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-450">Shade (VITA):</span>
                      <span className="font-bold text-gray-900">{selectedOrder.shade || "A2"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-450">Tooth / Area:</span>
                      <span className="font-bold text-gray-900">{selectedOrder.tooth_quadrant || "16"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-450">Margin Design:</span>
                      <span className="font-bold text-gray-900">{selectedOrder.margin_design || "Chamfer"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-450">Impression:</span>
                      <span className="font-bold text-gray-900">{selectedOrder.impression_type || "Digital Scan"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-450">Due Date:</span>
                      <span className="font-bold text-primary">{selectedOrder.eta || selectedOrder.due_date}</span>
                    </div>
                    {selectedOrder.notes && (
                      <div className="pt-2 border-t border-gray-100 mt-2">
                        <p className="font-semibold text-gray-450 text-[10px] uppercase">Notes:</p>
                        <p className="text-[11px] leading-relaxed mt-0.5 text-gray-800 italic">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Linked Scan Attachments</h5>
                    <div className="flex flex-col gap-1.5">
                      {selectedOrder.attachments.map((file, idx) => (
                        <a 
                          key={idx} 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl text-[11px] text-primary font-bold transition-all"
                        >
                          <span className="truncate">📎 {file.name}</span>
                          <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{file.type || "FILE"}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Trail Timeline */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Handoff Audit History</h5>
                  <div className="max-h-36 overflow-y-auto space-y-2.5 pr-1">
                    {auditTrail.map((log) => (
                      <div key={log.id} className="text-[11px] leading-tight flex gap-2">
                        <span className="text-[9px] text-gray-400 shrink-0 font-medium">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <div>
                          <p className="font-bold text-gray-800">{log.action}</p>
                          <p className="text-gray-450 mt-0.5">By {log.user_name} {log.note ? `(${log.note})` : ""}</p>
                        </div>
                      </div>
                    ))}
                    {auditTrail.length === 0 && (
                      <p className="text-[11px] text-gray-400 italic">No events logged in audit trail.</p>
                    )}
                  </div>
                </div>

                {/* Rework or fitting trials */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    {selectedOrder.status !== "Completed" && selectedOrder.status !== "Reworked" && (
                      <>
                        <button
                          onClick={async () => {
                            if (confirm("Confirm that this trial fitting is successful and restoration completed?")) {
                              await onMarkLabDelivered(selectedOrder.id);
                              window.location.reload();
                            }
                          }}
                          className="flex-1 py-2 bg-success text-white text-xs font-bold rounded-xl shadow-sm hover:bg-success/90 transition-all cursor-pointer"
                        >
                          ✓ Approve Fitting
                        </button>
                        <button
                          onClick={() => setIsReworkModalOpen(true)}
                          className="flex-1 py-2 border border-danger text-danger text-xs font-bold rounded-xl hover:bg-danger/5 transition-all cursor-pointer"
                        >
                          ✕ Reject & Rework
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* printable slip */}
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Print Lab Order Slip - ${selectedOrder.id}</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; color: #333; }
                            h2 { border-bottom: 2px solid #5d5fef; padding-bottom: 5px; color: #5d5fef; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 13px; }
                            th { background: #f0f0f0; font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          <h2>SmileCare Restorative Handoff slip</h2>
                          <p><strong>Order Reference ID:</strong> ${selectedOrder.id}</p>
                          <p><strong>Patient Case:</strong> ${selectedOrder.patientToken}</p>
                          <p><strong>Ordering Dentist:</strong> ${selectedOrder.dentistName || 'Dr. Sarah Smith'}</p>
                          <p><strong>Lab Partner/Vendor:</strong> ${selectedOrder.labName}</p>
                          <p><strong>Due Return Date:</strong> ${selectedOrder.eta || selectedOrder.due_date}</p>
                          
                          <h3>Technical Specifications</h3>
                          <table>
                            <tr><th>Specification Field</th><th>Required Setting</th></tr>
                            <tr><td>Prosthetic Type</td><td>${selectedOrder.item || selectedOrder.prosthetic_type}</td></tr>
                            <tr><td>Material Composition</td><td>${selectedOrder.material || 'Zirconia'}</td></tr>
                            <tr><td>VITA Shade Reference</td><td>${selectedOrder.shade || 'A2'}</td></tr>
                            <tr><td>Margin Design</td><td>${selectedOrder.margin_design || 'Chamfer'}</td></tr>
                            <tr><td>Impression Method</td><td>${selectedOrder.impression_type || 'Digital Scan'}</td></tr>
                            <tr><td>Tooth / Quadrant Area</td><td>${selectedOrder.tooth_quadrant || '16'}</td></tr>
                          </table>
                          <p><strong>Notes:</strong> ${selectedOrder.notes || 'None'}</p>
                          <script>window.print();</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" /> Print Printable Lab Slip
                </button>

                <div className="h-px bg-gray-100"></div>

                {/* Case Comments Section */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-primary" /> Case Discussion
                  </h5>
                  
                  {/* Message thread */}
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 text-xs">
                    {comments.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-2.5 rounded-xl border leading-relaxed ${
                          msg.user_role === "doctor" 
                            ? "bg-primary/5 border-primary/10" 
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <div className="flex justify-between font-extrabold text-[9px] uppercase">
                          <span className={msg.user_role === "doctor" ? "text-primary" : "text-gray-500"}>{msg.user_name}</span>
                          <span className="text-gray-400 font-medium">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="mt-1 text-gray-850 font-medium">{msg.message}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-[10px] text-gray-400 italic text-center py-2">No comments posted yet. Start the thread below.</p>
                    )}
                  </div>

                  <form onSubmit={handlePostCommentSubmit} className="flex gap-1.5">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ask for clarification or status..."
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-primary text-white rounded-xl hover:bg-primary/95 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <Package className="w-12 h-12 text-gray-300 stroke-[1.5]" />
                <h4 className="text-xs font-bold text-gray-500 uppercase mt-4">Select Lab Case Order</h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">Click on any pipeline record to load specifications, handoff audit history, and direct communication.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "vendors" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Vendors List Column */}
          <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Lab Vendor Partners</h3>
              <p className="text-xs text-gray-400 mt-0.5">Directory of external manufacturing centers, turnaround expectations, and rates</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Vendor Name</th>
                    <th className="px-4 py-3">Contact Person</th>
                    <th className="px-4 py-3">Phone & Email</th>
                    <th className="px-4 py-3 text-center">Avg TAT</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-gray-900">
                        {vendor.name}
                        <span className="block text-[9px] text-yellow-600 font-bold mt-0.5">★ {vendor.rating.toFixed(1)} Rating</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{vendor.contact_person || "N/A"}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{vendor.phone || "N/A"}</p>
                        <p className="text-[10px] text-gray-400">{vendor.email || "N/A"}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary">{vendor.average_tat_days} Days</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="px-2 py-1 text-danger border border-danger/10 bg-danger/5 hover:bg-danger hover:text-white rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-400 italic">No external vendors configured in directory.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Vendor Column */}
          <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>➕</span> Register External Vendor
              </h4>
              <p className="text-xs text-gray-400 mt-1">Configure average turnaround times and lab rates for invoice population.</p>
            </div>
            
            <form onSubmit={handleAddVendor} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  placeholder="e.g. Apex Crowns & Milling"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contact Person</label>
                <input
                  type="text"
                  value={newVendor.contact_person}
                  onChange={(e) => setNewVendor({...newVendor, contact_person: e.target.value})}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone</label>
                  <input
                    type="text"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                    placeholder="+91 99000 12345"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email</label>
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                    placeholder="order@apexdental.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Average Turnaround (Days)</label>
                <input
                  type="number"
                  value={newVendor.average_tat_days}
                  onChange={(e) => setNewVendor({...newVendor, average_tat_days: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rate Card Pricing List (JSON)</label>
                <textarea
                  rows={4}
                  value={newVendor.pricing_list}
                  onChange={(e) => setNewVendor({...newVendor, pricing_list: e.target.value})}
                  placeholder='e.g. {&#10;  "Zirconia Crown": 3500,&#10;  "PFM Crown": 2000,&#10;  "default": 2500&#10;}'
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-md shadow-primary/30 hover:bg-primary/95 transition-colors cursor-pointer mt-2"
              >
                Register Vendor Partner
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pipeline Cases</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{totalCases}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Accumulated cases in history</p>
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rework Rate %</p>
              <h3 className="text-3xl font-black text-danger mt-1">{reworkRate}%</h3>
              <p className="text-[10px] text-danger font-semibold mt-1">Quality rework signal rate</p>
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Turnaround Time</p>
              <h3 className="text-3xl font-black text-primary mt-1">{avgTAT}d</h3>
              <p className="text-[10px] text-success font-semibold mt-1">Acceptance to Delivery span</p>
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overdue Tasks</p>
              <h3 className="text-3xl font-black text-warning mt-1">{overdueCount}</h3>
              <p className="text-[10px] text-warning font-semibold mt-1">Cases past promised ETA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rework Categories Analysis */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3">
              <div>
                <h4 className="text-xs font-extrabold text-gray-450 uppercase tracking-wider">Rework Reason Analysis</h4>
                <p className="text-xs text-gray-400 mt-0.5">Primary clinic issues triggering fabrications remake</p>
              </div>
              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Shade Mismatch</span>
                    <span className="text-gray-500">40% (4 cases)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "40%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Poor Fit / Margin Issues</span>
                    <span className="text-gray-500">30% (3 cases)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: "30%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Occlusion/Bite discrepancies</span>
                    <span className="text-gray-500">20% (2 cases)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Patient Discomfort</span>
                    <span className="text-gray-500">10% (1 case)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "10%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prosthetic distribution */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3">
              <div>
                <h4 className="text-xs font-extrabold text-gray-450 uppercase tracking-wider">Prosthetics Distribution</h4>
                <p className="text-xs text-gray-400 mt-0.5">Overview of dental restoration products ordered</p>
              </div>
              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Zirconia Crowns</span>
                    <span className="text-gray-500">55%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "55%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Ceramic Bridges</span>
                    <span className="text-gray-500">20%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-success h-full rounded-full" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Clear Aligners</span>
                    <span className="text-gray-500">15%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-info h-full rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Dentures & Veneers</span>
                    <span className="text-gray-500">10%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-warning h-full rounded-full" style={{ width: "10%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rework Modal Dialog */}
      {isReworkModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-150 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-black text-gray-900">Initiate Remake Rework Case</h4>
                <p className="text-xs text-gray-400 mt-0.5">This clones technical specs and spawns a linked audit sub-case.</p>
              </div>
              <button 
                onClick={() => setIsReworkModalOpen(false)} 
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleReworkSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rejection Category</label>
                <select
                  value={reworkPayload.category}
                  onChange={(e) => setReworkPayload({...reworkPayload, category: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Poor Fit">Poor Fit / Margin Gap</option>
                  <option value="Shade Mismatch">Shade Mismatch</option>
                  <option value="Occlusion Issue">Occlusion Discrepancy</option>
                  <option value="Fracture">Material Fracture</option>
                  <option value="Patient Discomfort">Patient Discomfort</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Detailed Failure Description</label>
                <textarea
                  required
                  rows={4}
                  value={reworkPayload.reason}
                  onChange={(e) => setReworkPayload({...reworkPayload, reason: e.target.value})}
                  placeholder="Provide precise details for the lab tech (e.g. 'Crown A2 shade is too bright. Please match VITA A3. Marginal gap on distal side by 0.5mm. Re-milling required.')"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-danger text-white font-extrabold rounded-xl text-xs hover:bg-danger/90 transition-colors cursor-pointer mt-2"
              >
                🚨 Reject Fitting & Request Rework
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
