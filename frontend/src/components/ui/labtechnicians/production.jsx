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
  ArrowRight,
  Microscope,
  Activity,
  Layers,
  Search,
  MessageSquare,
  AlertTriangle,
  Send,
  Eye,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { 
  getLabOrders, 
  updateLabOrderStatus, 
  updateLabOrder, 
  createLabRework, 
  getLabComments, 
  createLabComment, 
  getLabAuditTrail, 
  getLabVendors,
  getLabInventory,
  createRestockRequest
} from "@/services/api";

export default function LabProduction() {
  const [activeCategory, setActiveCategory] = useState("Prosthetic"); // Prosthetic vs Blood Work
  const [dbCases, setDbCases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  // Tab filters
  const [activeTabFilter, setActiveTabFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [drawerTab, setDrawerTab] = useState("specs");
  
  // STL mock viewer properties
  const [stlRotation, setStlRotation] = useState(45);
  const [stlZoom, setStlZoom] = useState(1);
  const [viewerType, setViewerType] = useState("STL"); // STL, XRAY, PDF
  
  // Comment states
  const [caseComments, setCaseComments] = useState([]);
  const [newCommentMessage, setNewCommentMessage] = useState("");
  
  // Audit logs state
  const [auditTrail, setAuditTrail] = useState([]);

  // QC Checklist state
  const [qcChecklist, setQcChecklist] = useState({
    dimensions: false,
    colorMatch: false,
    surfaceFinish: false,
    accuracy: false,
    materialQuality: false
  });
  const [qcComments, setQcComments] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("Poor Fit");

  // Logistics state
  const [courierPartner, setCourierPartner] = useState("SmileCare Express");
  const [estDeliveryDate, setEstDeliveryDate] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [externalCost, setExternalCost] = useState(0);

  // In-house restock modal states
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(5);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchDbCases = async () => {
    try {
      const data = await getLabOrders();
      setDbCases(data);
    } catch (err) {
      console.error("Failed to fetch production cases:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await getLabVendors();
      setVendors(data);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      const data = await getLabInventory();
      setInventory(data);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  useEffect(() => {
    fetchDbCases();
    fetchVendors();
    fetchInventory();
    const interval = setInterval(() => {
      fetchDbCases();
      fetchInventory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch comments and audit trail when case changes
  useEffect(() => {
    if (selectedCaseId) {
      fetchComments();
      fetchAuditLogs();
    }
  }, [selectedCaseId]);

  const fetchComments = async () => {
    try {
      const commentsData = await getLabComments(selectedCaseId);
      setCaseComments(commentsData);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await getLabAuditTrail(selectedCaseId);
      setAuditTrail(logs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  // Filter cases based on active category, search query, and sub tab filter
  const categoryCases = dbCases.filter(c => {
    const cat = c.order_category || "Prosthetic";
    return cat.toLowerCase() === activeCategory.toLowerCase();
  });

  const searchedCases = categoryCases.filter(c => {
    const query = searchQuery.toLowerCase();
    const patientName = (c.patient_name || "").toLowerCase();
    const dentistName = (c.dentist_name || "").toLowerCase();
    const caseId = (c.id || "").toLowerCase();
    return patientName.includes(query) || dentistName.includes(query) || caseId.includes(query);
  });

  const filteredCases = searchedCases.filter(c => {
    if (activeTabFilter === "All") return c.status !== "Completed" && c.status !== "Rejected" && c.status !== "Reworked";
    if (activeTabFilter === "Needs Scan") return c.status === "Pending" && (!c.attachments || c.attachments.length === 0);
    if (activeTabFilter === "Outsourced") return (c.status === "In Progress" || c.status === "Accepted") && c.lab_name && c.lab_name !== "In-House";
    if (activeTabFilter === "In-House") return (c.status === "In Progress" || c.status === "Accepted") && c.lab_name === "In-House";
    if (activeTabFilter === "QC Pending") return c.status === "QC Pending";
    if (activeTabFilter === "Reworks") return c.parent_order_id && c.status !== "Completed" && c.status !== "Rejected";
    if (activeTabFilter === "Completed") return c.status === "Completed";
    return true;
  });

  const currentCase = dbCases.find(c => c.id === selectedCaseId);

  // Cross reference upcoming appointment warnings (< 48 hours and missing prosthetic)
  const getUrgentCases = () => {
    return dbCases.filter(c => {
      if (c.order_category !== "Prosthetic") return false;
      if (c.status === "Completed" || c.status === "Ready / Shipped" || c.status === "Rejected") return false;
      // Simple date comparison check (mocked: if due_date is in next 2 days or past due)
      if (!c.due_date) return false;
      const dueDateObj = new Date(c.due_date);
      const now = new Date();
      const diffTime = dueDateObj - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= -5 && diffDays <= 2;
    });
  };
  const urgentCasesList = getUrgentCases();

  const handleCardClick = (caseId) => {
    setSelectedCaseId(caseId);
    setDrawerTab("specs");
    
    // Load existing settings into fields if editing
    const selected = dbCases.find(c => c.id === caseId);
    if (selected) {
      setCourierPartner(selected.courier_name || "SmileCare Express");
      setEstDeliveryDate(selected.expected_return_date || "");
      setTrackingNumber(selected.tracking_number || "");
      setExternalCost(selected.external_cost || 0);
      
      const matchedVendor = vendors.find(v => v.name === selected.lab_name);
      setSelectedVendorId(matchedVendor ? matchedVendor.id : "");
    }
    
    setQcChecklist({
      dimensions: false,
      colorMatch: false,
      surfaceFinish: false,
      accuracy: false,
      materialQuality: false
    });
    setQcComments("");
    setIsDrawerOpen(true);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentMessage.trim()) return;
    try {
      await createLabComment(selectedCaseId, { message: newCommentMessage.trim() });
      setNewCommentMessage("");
      fetchComments();
      fetchAuditLogs();
      triggerToast("Comment posted.");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to post comment.", "error");
    }
  };

  const handleSaveLogistics = async (e) => {
    e.preventDefault();
    const matchedVendor = vendors.find(v => v.id === parseInt(selectedVendorId));
    const vendorName = matchedVendor ? matchedVendor.name : "In-House";
    
    const payload = {
      lab_name: vendorName,
      courier_name: courierPartner,
      expected_return_date: estDeliveryDate,
      tracking_number: trackingNumber,
      external_cost: parseInt(externalCost) || 0
    };

    try {
      await updateLabOrder(selectedCaseId, payload);
      // Automatically advance status to In Progress if dispatched to external lab
      if (vendorName !== "In-House" && currentCase.status === "Pending") {
        await updateLabOrderStatus(selectedCaseId, { status: "In Progress" });
      }
      fetchDbCases();
      fetchAuditLogs();
      triggerToast("Logistics details saved successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save logistics details.", "error");
    }
  };

  const handleQCPass = async () => {
    const allChecked = Object.values(qcChecklist).every(v => v === true);
    if (!allChecked) {
      alert("Please verify all QC parameters before passing.");
      return;
    }
    try {
      await updateLabOrderStatus(selectedCaseId, { 
        status: "Ready / Shipped",
        result_document_url: currentCase.result_document_url
      });
      await updateLabOrder(selectedCaseId, { stage: "QC" });
      fetchDbCases();
      fetchAuditLogs();
      triggerToast(`Case ${selectedCaseId} passed QC check!`);
    } catch (err) {
      console.error(err);
      triggerToast("Error updating QC status", "error");
    }
  };

  const handleQCFailRework = async () => {
    if (!qcComments.trim()) {
      alert("Please specify failure comments for the rework request.");
      return;
    }
    try {
      await createLabRework(selectedCaseId, { 
        status: "Rejected", 
        rejection_reason: qcComments.trim(),
        rejection_category: rejectionCategory
      });
      fetchDbCases();
      setIsDrawerOpen(false);
      triggerToast(`Case ${selectedCaseId} failed QC. New rework order submitted!`, "error");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to initiate rework.", "error");
    }
  };

  const handleDirectComplete = async (caseId) => {
    try {
      await updateLabOrderStatus(caseId, { status: "Completed" });
      fetchDbCases();
      triggerToast("Case marked as Completed & Fitted.");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update status.", "error");
    }
  };

  const handleUploadReport = async (caseId) => {
    const url = prompt("Please enter the path or URL for the test report PDF:", "/reports/blood_report_" + caseId + ".pdf");
    if (!url) return;
    try {
      await updateLabOrderStatus(caseId, { 
        status: "Completed", 
        result_document_url: url 
      });
      fetchDbCases();
      triggerToast("Report report uploaded. Case completed!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save report.", "error");
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem) return;
    try {
      await createRestockRequest({
        item_id: restockItem.id,
        item_name: restockItem.name,
        requested_quantity: parseInt(restockQty),
        notes: `Auto restock request from Lab Case Tracker`
      });
      setIsRestockModalOpen(false);
      fetchInventory();
      triggerToast(`Restock request sent for ${restockItem.name}`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to request restock.", "error");
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-red-50 text-red-700 border-red-200/50";
      case "High": return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Medium": return "bg-blue-50 text-blue-700 border-blue-200/50";
      default: return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-50 text-green-700 border-green-200/50";
      case "Ready / Shipped": return "bg-green-50 text-green-700 border-green-200/50";
      case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "QC Pending": return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "Pending": return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Reworked": return "bg-orange-50 text-orange-700 border-orange-200/50";
      case "Rejected": return "bg-red-50 text-red-700 border-red-200/50";
      default: return "bg-gray-50 text-gray-655 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 pb-10 flex flex-col h-[85vh] relative select-none">
      
      {/* Header and Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Lab Case Tracker</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              SmileCare Hub
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Track clinic logistics, intraoral scans, blood pathology work, quality check clearances, and external lab partners.</p>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner shrink-0 border border-gray-200/50">
          <button
            onClick={() => { setActiveCategory("Prosthetic"); setActiveTabFilter("All"); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeCategory === "Prosthetic" 
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/20" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Dental Prosthetics
          </button>
          <button
            onClick={() => { setActiveCategory("Blood Work"); setActiveTabFilter("All"); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeCategory === "Blood Work" 
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/20" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-danger animate-pulse" />
            Blood Work / Pathology
          </button>
        </div>
      </div>

      {/* Urgent Warning Alerts */}
      {urgentCasesList.length > 0 && activeCategory === "Prosthetic" && (
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-950">Urgent Case Warnings ({urgentCasesList.length})</h4>
            <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
              The following prosthetic cases have clinical fit appointments scheduled within 48 hours but have not yet been marked as Arrived/QC Passed at the clinic:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {urgentCasesList.map(uc => (
                <button
                  key={uc.id}
                  onClick={() => handleCardClick(uc.id)}
                  className="bg-white hover:bg-red-100 border border-red-200 text-[10px] font-black text-red-750 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  {uc.id} - {uc.patient_name} (Due: {uc.due_date})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Board Grid (Dashboard List + Sidebar Inventory) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch overflow-hidden">
        
        {/* Left Side: Cases List Desk */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-5 flex flex-col h-full shadow-sm overflow-hidden">
          
          {/* List Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-gray-100 pb-4 shrink-0">
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient, doctor, or case ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto py-0.5 scrollbar-thin select-none">
              {[
                { id: "All", label: "Active" },
                { id: "Needs Scan", label: "Needs Scan", hideForBlood: true },
                { id: "Outsourced", label: "Outsourced" },
                { id: "In-House", label: "In-House" },
                { id: "QC Pending", label: "QC Check" },
                { id: "Reworks", label: "Reworks", hideForBlood: true },
                { id: "Completed", label: "Completed" }
              ].map(tab => {
                if (tab.hideForBlood && activeCategory === "Blood Work") return null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabFilter(tab.id)}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer whitespace-nowrap border transition-all ${
                      activeTabFilter === tab.id
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-850 hover:bg-gray-100/55"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Cases Content */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {filteredCases.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-3">
                <span className="text-4xl">📁</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">No matching cases found</h3>
                  <p className="text-xs text-gray-400 mt-0.5">There are no lab items fitting this selection currently.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCases.map((c) => {
                  const isRework = c.parent_order_id;
                  
                  return (
                    <div 
                      key={c.id}
                      onClick={() => handleCardClick(c.id)}
                      className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer rounded-xl px-2.5 border border-transparent hover:border-gray-150/40 relative group"
                    >
                      {/* Left Block: Case ID & Patient */}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          activeCategory === "Blood Work" 
                            ? "bg-red-50 text-red-600 border-red-100" 
                            : "bg-primary/5 text-primary border-primary/10"
                        }`}>
                          {activeCategory === "Blood Work" ? <Activity className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{c.id}</span>
                            {isRework && (
                              <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                                Rework
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wide border rounded ${getPriorityBadgeColor(c.priority)}`}>
                              {c.priority || "Medium"}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-extrabold text-gray-800">{c.patient_name || "Walk-in Patient"}</h4>
                          <p className="text-[10px] text-gray-400">Doctor: {c.dentist_name || "Dr. Nair"}</p>
                        </div>
                      </div>

                      {/* Middle Block: Specs & Logistics */}
                      <div className="flex items-center gap-6 text-left">
                        {activeCategory === "Prosthetic" ? (
                          <div className="space-y-1">
                            <div className="bg-gray-50 border border-gray-150/60 px-2 py-0.5 rounded text-[10px] text-gray-650 flex items-center gap-1.5">
                              <span className="font-bold">{c.prosthetic_type}</span>
                              <span className="text-gray-300">|</span>
                              <span>{c.material}</span>
                              {c.shade && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-amber-800 bg-amber-50 px-1 rounded font-bold">{c.shade}</span>
                                </>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" /> Vendor: <span className="font-semibold text-gray-700">{c.lab_name || "Assigning..."}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="bg-gray-50 border border-gray-150/60 px-2 py-0.5 rounded text-[10px] text-gray-650 font-bold">
                              {c.prosthetic_type || "Blood Test Group"}
                            </div>
                            <p className="text-[9px] text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" /> Lab: <span className="font-semibold text-gray-700">{c.lab_name || "Pathology Dept"}</span>
                            </p>
                          </div>
                        )}
                        
                        {/* Due/Courier Column */}
                        <div className="hidden md:flex flex-col text-[10px] space-y-0.5">
                          <span className="text-gray-455 font-medium">Expected Return</span>
                          <span className="font-bold text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" /> {c.expected_return_date || c.due_date || "Not set"}
                          </span>
                        </div>
                      </div>

                      {/* Right Block: Status & Action */}
                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getStatusBadgeColor(c.status)}`}>
                          {c.status}
                        </span>

                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                          {activeCategory === "Blood Work" ? (
                            c.status !== "Completed" ? (
                              <button
                                onClick={() => handleUploadReport(c.id)}
                                className="bg-primary hover:bg-primary/95 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <UploadCloud className="w-3.5 h-3.5" /> Upload Report
                              </button>
                            ) : (
                              c.result_document_url && (
                                <a
                                  href={c.result_document_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-primary flex items-center justify-center cursor-pointer border border-transparent hover:border-gray-155"
                                  title="View Report PDF"
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                              )
                            )
                          ) : (
                            c.status === "QC Pending" ? (
                              <button
                                onClick={() => handleCardClick(c.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 animate-pulse"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" /> Inspect
                              </button>
                            ) : (
                              c.status === "Ready / Shipped" ? (
                                <button
                                  onClick={() => handleDirectComplete(c.id)}
                                  className="bg-success hover:bg-success/95 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Fit Case
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCardClick(c.id)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 flex items-center justify-center cursor-pointer transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )
                            )
                          )}
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Local Materials Inventory Widget */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden">
          
          {/* Material Stock Tracker Widget */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col flex-1 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 pb-4 shrink-0">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                In-House Materials
              </h3>
              <p className="text-[10px] text-gray-505 mt-1">Consumables loaded by admin for chairside mills and 3D printers.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1">
              {inventory.length === 0 ? (
                <p className="text-[11px] text-gray-450 text-center py-6">No materials registered in pharmacy database.</p>
              ) : (
                inventory.map(item => {
                  const isLow = item.current_stock <= item.minimum_stock_alert;
                  const isOut = item.current_stock === 0;
                  
                  return (
                    <div key={item.id} className="p-3 border border-gray-150/70 rounded-2xl flex flex-col gap-2 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 leading-tight">{item.name}</h4>
                          <span className="text-[8px] bg-primary/10 text-primary font-black uppercase px-1.5 py-0.2 rounded mt-1 inline-block">
                            {item.category}
                          </span>
                        </div>
                        {isOut ? (
                          <span className="bg-red-100 text-red-800 border border-red-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">Out</span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">Low</span>
                        ) : (
                          <span className="bg-green-100 text-green-800 border border-green-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">OK</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-650 pt-2 border-t border-gray-100/70">
                        <span>Stock: <strong className="text-gray-900 font-bold">{item.current_stock} {item.unit}</strong></span>
                        <button
                          onClick={() => { setRestockItem(item); setRestockQty(5); setIsRestockModalOpen(true); }}
                          className="text-[9px] text-primary hover:text-primary-dark font-black uppercase flex items-center gap-0.5 cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" /> Restock
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* External Labs Partners Directory */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col h-[280px] shadow-sm overflow-hidden shrink-0">
            <div className="border-b border-gray-100 pb-3.5 shrink-0">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary" />
                External Vendors
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mt-3.5 pr-1">
              {vendors.map(v => (
                <div key={v.id} className="p-2.5 border border-gray-150/70 hover:border-gray-200 rounded-xl bg-gray-50/20 text-[10px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{v.name}</span>
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-1 rounded flex items-center gap-0.5 border border-amber-200/50">
                      ★ {v.rating?.toFixed(1) || "5.0"}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400">Avg Turnaround: <strong className="text-gray-700">{v.average_tat_days} days</strong></p>
                  <p className="text-[9px] text-gray-400">Phone: {v.phone || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

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
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wide border rounded ${getPriorityBadgeColor(currentCase.priority)}`}>
                    {currentCase.priority || "Medium"}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">{currentCase.patient_name || "Walk-in Patient"}</h3>
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
                { id: "viewer", label: "Scanner File" },
                { id: "comments", label: "Doctor Comments" },
                { id: "qc", label: "Quality Control", hideForBlood: true },
                { id: "dispatch", label: "Logistics" }
              ].map(tab => {
                if (tab.hideForBlood && activeCategory === "Blood Work") return null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                      drawerTab === tab.id 
                        ? "bg-primary text-white shadow-sm" 
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/55"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tab: Specs & Timeline */}
              {drawerTab === "specs" && (
                <div className="space-y-6">
                  {/* Specification Card */}
                  <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Case Specifications</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-medium">Type / Category</span>
                        <p className="font-bold text-gray-800 mt-0.5">{currentCase.prosthetic_type || currentCase.order_category}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Material</span>
                        <p className="font-bold text-gray-800 mt-0.5">{currentCase.material || "Blood Pathology Sample"}</p>
                      </div>
                      {currentCase.shade && (
                        <div>
                          <span className="text-gray-400 font-medium">Shade Tone</span>
                          <p className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-250/20 inline-block mt-0.5">{currentCase.shade}</p>
                        </div>
                      )}
                      {currentCase.tooth_quadrant && (
                        <div>
                          <span className="text-gray-400 font-medium">Tooth Position</span>
                          <p className="font-bold text-gray-800 mt-0.5">Quadrant / Tooth: #{currentCase.tooth_quadrant}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400 font-medium">Delivery Deadline</span>
                        <p className="font-bold text-danger flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-danger" /> {currentCase.due_date || "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Impression Mode</span>
                        <p className="font-bold text-gray-850 mt-0.5">{currentCase.impression_type || "Digital Intraoral Scan"}</p>
                      </div>
                    </div>

                    {currentCase.notes && (
                      <div className="border-t border-gray-200 pt-3 text-xs text-gray-600 italic">
                        "{currentCase.notes}"
                      </div>
                    )}
                  </div>

                  {/* Dentist Contact Card */}
                  <div className="border border-gray-155 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Issuing Dentist</span>
                      <h4 className="text-sm font-bold text-gray-900 mt-2">{currentCase.dentist_name || "Dr. Anoop Nair"}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{currentCase.dentist_contact || "+91 98765 43210"}</p>
                    </div>
                    <span className="text-2xl bg-gray-50 p-2.5 rounded-xl border border-gray-100">👤</span>
                  </div>

                  {/* Work Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Fabrication Timeline</h4>
                    <div className="relative pl-5 space-y-5 border-l-2 border-gray-100 ml-2 py-1">
                      {[
                        { name: "Order Created / Scan Uploaded", done: true, desc: "Impression model registered in system." },
                        { name: "Dispatched to External Lab", done: !!currentCase.lab_name && currentCase.lab_name !== "In-House" || currentCase.status !== "Pending", desc: `Assigned lab: ${currentCase.lab_name || "In-House"}` },
                        { name: "In Fabrication / Testing", done: currentCase.status === "In Progress" || currentCase.status === "QC Pending" || currentCase.status === "Ready / Shipped" || currentCase.status === "Completed", desc: "Laboratories are processing materials." },
                        { name: "QC Passed at Clinic", done: currentCase.status === "Ready / Shipped" || currentCase.status === "Completed", desc: "Technician verified fit tolerances." },
                        { name: "Completed & Fitted", done: currentCase.status === "Completed", desc: "Prosthetic is placed in patient's mouth." }
                      ].map((step, idx) => (
                        <div key={idx} className="relative">
                          <span className={`absolute -left-[28.5px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${
                            step.done ? "bg-success border-success text-white" : "bg-white border-gray-200 text-transparent"
                          }`}>
                            ✓
                          </span>
                          <div>
                            <p className={`text-xs font-bold ${step.done ? "text-success" : "text-gray-450"}`}>{step.name}</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Scan Viewer */}
              {drawerTab === "viewer" && (
                <div className="space-y-5 h-full flex flex-col">
                  {activeCategory === "Prosthetic" ? (
                    <>
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
                              className="w-20 h-20 border border-primary/45 rounded-xl flex items-center justify-center self-center animate-spin duration-15000"
                            >
                              <Layers className="w-8 h-8 text-primary" />
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-gray-400">
                              <span>Rotate model:</span>
                              <input 
                                type="range" 
                                min="0" 
                                max="360"
                                value={stlRotation}
                                onChange={(e) => setStlRotation(Number(e.target.value))}
                                className="w-24 accent-primary cursor-pointer"
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
                          </div>
                        )}

                        {/* PDF prescription mock */}
                        {viewerType === "PDF" && (
                          <div className="flex flex-col items-center justify-center text-white space-y-3">
                            <span className="text-3xl">📄</span>
                            <div className="text-center">
                              <p className="text-xs font-bold">presc_{currentCase.id.toLowerCase()}.pdf</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">SmileCare digital prescription sheet</p>
                            </div>
                            <button className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all">
                              Download Prescription
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-[300px] border border-gray-150/70 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center space-y-4">
                      {currentCase.result_document_url ? (
                        <>
                          <FileText className="w-12 h-12 text-primary" />
                          <div>
                            <h4 className="text-xs font-bold text-gray-800">Pathology Report Uploaded</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">The diagnostic lab files have been successfully registered.</p>
                          </div>
                          <a
                            href={currentCase.result_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer inline-block"
                          >
                            View Diagnostic Report PDF
                          </a>
                        </>
                      ) : (
                        <>
                          <Activity className="w-12 h-12 text-danger animate-pulse" />
                          <div>
                            <h4 className="text-xs font-bold text-gray-800">Awaiting Blood Sample Processing</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Pathology results have not yet been uploaded for this patient's blood sample.</p>
                          </div>
                          <button
                            onClick={() => handleUploadReport(currentCase.id)}
                            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-4 h-4" /> Upload Report PDF
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Comments / Collaboration */}
              {drawerTab === "comments" && (
                <div className="space-y-4 flex flex-col h-[400px]">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Doctor-Lab Communication Thread</h4>
                  
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 border border-gray-150 p-4 rounded-2xl bg-gray-50/30">
                    {caseComments.length === 0 ? (
                      <p className="text-[11px] text-gray-450 text-center py-10 italic">No notes logged for this case. Type below to start the thread.</p>
                    ) : (
                      caseComments.map(c => {
                        const isDr = c.user_role === "doctor";
                        return (
                          <div 
                            key={c.id} 
                            className={`flex flex-col max-w-[80%] rounded-2xl p-3 border text-xs gap-1 ${
                              isDr 
                                ? "bg-primary/5 text-primary border-primary/20 mr-auto rounded-tl-none" 
                                : "bg-gray-100 text-gray-700 border-gray-200 ml-auto rounded-tr-none"
                            }`}
                          >
                            <span className="text-[9px] font-black opacity-80 uppercase">
                              {c.user_name} ({c.user_role})
                            </span>
                            <p className="leading-relaxed font-medium">{c.message}</p>
                            <span className="text-[8px] opacity-60 text-right">
                              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type a message to the clinic/doctor..." 
                      value={newCommentMessage}
                      onChange={(e) => setNewCommentMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                    />
                    <button 
                      type="submit" 
                      className="px-3 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Quality Control */}
              {drawerTab === "qc" && (
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
                      <label key={item.key} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-105">
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

                  {/* QC Error/Rework details */}
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">QC Failure & Rework Logging</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Failure Category</label>
                        <select
                          value={rejectionCategory}
                          onChange={(e) => setRejectionCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-800 focus:outline-none"
                        >
                          <option value="Poor Fit">Poor Fit / Open Margin</option>
                          <option value="Wrong Shade">Wrong Shade matching</option>
                          <option value="Contact Issue">Contact Points open/tight</option>
                          <option value="Bite Issue">Bite Height / Occlusion error</option>
                          <option value="Material Flaw">Porcelain Fracture / Sintering Crack</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider">QC Comments / Failure Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details on what needs correction (e.g. adjust distal margin by 0.5mm)..."
                        value={qcComments}
                        onChange={(e) => setQcComments(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder-gray-400 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* QC Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
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

              {/* Tab: Dispatch / Logistics */}
              {drawerTab === "dispatch" && (
                <form onSubmit={handleSaveLogistics} className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Logistics</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Assign external labs, shipping couriers, and tracking codes.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* Lab Partner Selection */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Assigned Lab Partner / Department</label>
                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                      >
                        <option value="">In-House Fabrication</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name} (TAT: {v.average_tat_days} days)</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider">Courier Service</label>
                      <select
                        value={courierPartner}
                        onChange={(e) => setCourierPartner(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                      >
                        <option value="SmileCare Express">SmileCare Express Logistics</option>
                        <option value="DHL Express">DHL Express Delivery</option>
                        <option value="FedEx Clinical">FedEx Clinical Shipping</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider">Estimated Return Date</label>
                      <input
                        type="date"
                        value={estDeliveryDate}
                        onChange={(e) => setEstDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider">Tracking Code</label>
                      <input
                        type="text"
                        placeholder="TRK-XXXX-XXXX"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-855 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider">External Cost (₹)</label>
                      <input
                        type="number"
                        placeholder="Cost charged by external lab"
                        value={externalCost}
                        onChange={(e) => setExternalCost(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-855 focus:outline-none"
                      />
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" /> Save Logistics & Dispatch Case
                  </button>
                </form>
              )}

            </div>

          </div>
        </>
      )}

      {/* Restock Request Modal */}
      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-55 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-150 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in duration-250">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-primary" />
                Request Stock replenishment
              </h3>
              <button 
                onClick={() => setIsRestockModalOpen(false)}
                className="w-6 h-6 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="text-xs space-y-1">
                <span className="text-gray-400 font-medium">Material Name</span>
                <p className="font-bold text-gray-800">{restockItem.name}</p>
                <p className="text-[10px] text-gray-405 mt-0.5">Current Stock: {restockItem.current_stock} {restockItem.unit}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider">Replenishment Quantity ({restockItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-805 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Submit Replenishment Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-55 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 ${
            toast.type === "error" 
              ? "bg-danger/5 border-danger/25 text-danger" 
              : "bg-success/5 border-success/25 text-success"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}
