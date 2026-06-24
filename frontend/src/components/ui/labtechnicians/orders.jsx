"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Hourglass, 
  Flame, 
  Search, 
  Calendar,
  X,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  Truck,
  UploadCloud,
  AlertCircle,
  Check,
  ChevronRight,
  Eye,
  Settings,
  ShieldCheck,
  RefreshCw,
  Plus,
  Microscope
} from "lucide-react";



export default function LabOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://localhost:8000/lab/orders", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map(o => ({
          id: o.id,
          patientName: o.patient_name || "Walk-in Patient",
          dentistName: o.dentist_name || "Dr. Anoop Nair",
          dentistContact: o.dentist_contact || "+91 98765 43210",
          prostheticType: o.prosthetic_type,
          material: o.material || "Zirconia",
          shade: o.shade || "A2",
          priority: o.priority || "Medium",
          dueDate: o.due_date || "2026-06-15",
          status: o.status,
          notes: o.notes || "",
          rejectionReason: o.rejection_reason || ""
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch lab orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dentistFilter, setDentistFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Drawer tab and viewer states
  const [activeTab, setActiveTab] = useState("specs");
  const [stlRotation, setStlRotation] = useState(45);
  const [stlZoom, setStlZoom] = useState(1);
  const [viewerType, setViewerType] = useState("STL");

  // CAD Design desk states
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

  // QC checklist states
  const [qcChecklist, setQcChecklist] = useState({
    dimensions: false,
    colorMatch: false,
    surfaceFinish: false,
    accuracy: false,
    materialQuality: false
  });
  const [qcComments, setQcComments] = useState("");

  // Courier/Dispatch states
  const [courierPartner, setCourierPartner] = useState("SmileCare Express");
  const [estDeliveryDate, setEstDeliveryDate] = useState("Tomorrow, 02:00 PM");

  const currentCase = selectedOrder ? {
    id: selectedOrder.id,
    patient: selectedOrder.patientName,
    dentist: selectedOrder.dentistName,
    dentistContact: selectedOrder.dentistContact,
    type: selectedOrder.prostheticType,
    material: selectedOrder.material,
    priority: selectedOrder.priority,
    dueDate: selectedOrder.dueDate,
    shade: selectedOrder.shade,
    status: selectedOrder.status,
    notes: selectedOrder.notes,
    rejectionReason: selectedOrder.rejectionReason
  } : null;

  const updateDbStatus = async (caseId, statusValue, rejectionReason = null) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const body = { status: statusValue };
      if (rejectionReason) {
        body.rejection_reason = rejectionReason;
      }
      const response = await fetch(`http://localhost:8000/lab/orders/${caseId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        if (selectedOrder && selectedOrder.id === caseId) {
          setSelectedOrder(prev => ({
            ...prev,
            status: statusValue,
            rejectionReason: rejectionReason || ""
          }));
        }
        fetchOrders();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateStage = (caseId, targetStage) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lab_production_stage_map");
      const currentMap = saved ? JSON.parse(saved) : {};
      const nextMap = { ...currentMap, [caseId]: targetStage };
      localStorage.setItem("lab_production_stage_map", JSON.stringify(nextMap));
    }
  };

  const handleQCPass = async () => {
    const allChecked = Object.values(qcChecklist).every(v => v === true);
    if (!allChecked) {
      alert("Please verify all QC checklist parameters before passing.");
      return;
    }
    const ok = await updateDbStatus(selectedOrder.id, "Ready / Shipped");
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} successfully passed Quality Control!`);
      updateStage(selectedOrder.id, "QC");
    } else {
      triggerToast("Failed to pass Quality Control status.", "error");
    }
  };

  const handleQCFailRework = async () => {
    if (qcComments.trim() === "") {
      alert("Please specify rework comments.");
      return;
    }
    const ok = await updateDbStatus(selectedOrder.id, "In Progress", qcComments);
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} returned to Production for rework.`, "error");
      updateStage(selectedOrder.id, "Finishing");
    } else {
      triggerToast("Failed to update status.", "error");
    }
  };

  const handleQCReject = async () => {
    if (qcComments.trim() === "") {
      alert("Please specify reasons for rejection.");
      return;
    }
    const ok = await updateDbStatus(selectedOrder.id, "Rejected", qcComments);
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} has been rejected.`, "error");
      setIsDrawerOpen(false);
    } else {
      triggerToast("Failed to reject order.", "error");
    }
  };

  const handleDispatchOrder = async () => {
    const ok = await updateDbStatus(selectedOrder.id, "Completed");
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} marked as completed and shipped!`);
      setIsDrawerOpen(false);
    } else {
      triggerToast("Failed to dispatch order.", "error");
    }
  };

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

  const handleAddDesignerNote = (e) => {
    e.preventDefault();
    if (designerNote.trim() === "") return;
    setDesignerNotesList([...designerNotesList, designerNote.trim()]);
    setDesignerNote("");
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    prostheticType: "",
    material: "",
    shade: "",
    priority: "",
    dueDate: "",
    notes: ""
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const dentists = Array.from(new Set(orders.map((o) => o.dentistName)));

  useEffect(() => {
    let result = [...orders];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.patientName.toLowerCase().includes(q) ||
          o.dentistName.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (priorityFilter !== "") {
      result = result.filter((o) => o.priority === priorityFilter);
    }

    if (dentistFilter !== "") {
      result = result.filter((o) => o.dentistName === dentistFilter);
    }

    if (dateFilter !== "") {
      const today = new Date("2026-06-10");
      result = result.filter((o) => {
        const orderDate = new Date(o.dueDate);
        const timeDiff = orderDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dateFilter === "Today") {
          return o.dueDate === "2026-06-10";
        } else if (dateFilter === "Next 7 Days") {
          return daysDiff >= 0 && daysDiff <= 7;
        } else if (dateFilter === "Next 30 Days") {
          return daysDiff >= 0 && daysDiff <= 30;
        }
        return true;
      });
    }

    setFilteredOrders(result);
  }, [orders, searchQuery, statusFilter, priorityFilter, dentistFilter, dateFilter]);

  const totalCases = orders.length;
  const pendingCases = orders.filter((o) => o.status === "Pending").length;
  const inProductionCases = orders.filter((o) => o.status === "Accepted" || o.status === "In Progress").length;
  const urgentHighCases = orders.filter((o) => o.priority === "Urgent" || o.priority === "High").length;

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-danger/10 text-danger border border-danger/20";
      case "High":
        return "bg-warning/10 text-warning border border-warning/20";
      case "Medium":
        return "bg-primary/10 text-primary border border-primary/20";
      case "Low":
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-warning";
      case "Accepted":
        return "bg-primary";
      case "In Progress":
        return "bg-purple-500";
      case "Completed":
        return "bg-success";
      case "Rejected":
        return "bg-danger";
      default:
        return "bg-gray-400";
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/lab/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "Accepted" })
      });
      if (!response.ok) throw new Error("Failed to accept order");
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: "Accepted" }));
      }
      triggerToast(`Case ${orderId} has been successfully accepted.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to accept order.", "error");
    }
  };

  const handleStartProduction = async (orderId) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/lab/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "In Progress" })
      });
      if (!response.ok) throw new Error("Failed to start production");

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: "In Progress" }));
      }
      triggerToast(`Case ${orderId} status updated to In Production.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to start production.", "error");
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/lab/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "Completed" })
      });
      if (!response.ok) throw new Error("Failed to complete order");

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: "Completed" }));
      }
      triggerToast(`Case ${orderId} marked as Completed.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to complete order.", "error");
    }
  };

  const openRejectModal = (orderId) => {
    setRejectTargetId(orderId);
    setRejectReasonText("");
    setIsRejectModalOpen(true);
  };

  const handleRejectOrder = async () => {
    if (rejectReasonText.trim() === "") {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/lab/orders/${rejectTargetId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "Rejected", rejection_reason: rejectReasonText })
      });
      if (!response.ok) throw new Error("Failed to reject order");

      if (selectedOrder && selectedOrder.id === rejectTargetId) {
        setSelectedOrder((prev) => ({
          ...prev,
          status: "Rejected",
          rejectionReason: rejectReasonText
        }));
      }
      setIsRejectModalOpen(false);
      triggerToast(`Case ${rejectTargetId} has been rejected.`, "error");
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to reject order.", "error");
    }
  };

  const openEditModal = (order) => {
    setEditFormData({
      id: order.id,
      prostheticType: order.prostheticType,
      material: order.material,
      shade: order.shade,
      priority: order.priority,
      dueDate: order.dueDate,
      notes: order.notes
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/lab/orders/${editFormData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prosthetic_type: editFormData.prostheticType,
          material: editFormData.material,
          shade: editFormData.shade,
          priority: editFormData.priority,
          due_date: editFormData.dueDate,
          notes: editFormData.notes
        })
      });
      if (!response.ok) throw new Error("Failed to edit order specifications");

      if (selectedOrder && selectedOrder.id === editFormData.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          prostheticType: editFormData.prostheticType,
          material: editFormData.material,
          shade: editFormData.shade,
          priority: editFormData.priority,
          dueDate: editFormData.dueDate,
          notes: editFormData.notes
        }));
      }
      setIsEditModalOpen(false);
      triggerToast(`Case ${editFormData.id} specifications updated.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update specifications.", "error");
    }
  };

  const openDetailsDrawer = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
    setQcChecklist({
      dimensions: false,
      colorMatch: false,
      surfaceFinish: false,
      accuracy: false,
      materialQuality: false
    });
    setQcComments("");
  };

  return (
    <div className="space-y-6 relative pb-10">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 bg-white border-gray-100">
          <span className={`w-3 h-3 rounded-full ${toast.type === "error" ? "bg-danger animate-pulse" : "bg-success animate-pulse"}`}></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage prosthetic fabrications, track statuses, and coordinate with dentists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-primary/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Cases</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{totalCases}</h3>
            <p className="text-xs text-gray-500 font-medium mt-2">Active cases in dashboard</p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0 z-10">
            <ClipboardList className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-warning/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pending Review</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{pendingCases}</h3>
            <p className="text-xs text-warning font-semibold mt-2 flex items-center gap-1">
              <span>●</span> Requires attention
            </p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0 z-10">
            <Hourglass className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-purple-55/35 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">In Production</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{inProductionCases}</h3>
            <p className="text-xs text-purple-650 font-semibold mt-2">Accepted & active</p>
          </div>
          <span className="bg-purple-50 p-3 rounded-xl text-purple-600 flex items-center justify-center shrink-0 z-10">
            <Microscope className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-danger/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Urgent & High</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{urgentHighCases}</h3>
            <p className="text-xs text-danger font-semibold mt-2 flex items-center gap-1">
              <span>⚠️</span> Priority handling
            </p>
          </div>
          <span className="bg-danger/10 p-3 rounded-xl text-danger flex items-center justify-center shrink-0 z-10">
            <Flame className="w-6 h-6" />
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96 flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-gray-400 mr-2.5 w-4 h-4 shrink-0" />
            <input 
              type="text" 
              placeholder="Search Case ID, patient, or dentist..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 text-gray-800"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 ml-1.5 text-xs bg-gray-200/60 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
            {(searchQuery || statusFilter || priorityFilter || dentistFilter || dateFilter) && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setDentistFilter("");
                  setDateFilter("");
                }}
                className="px-3 py-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 rounded-lg cursor-pointer"
              >
                Reset Filters
              </button>
            )}

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[110px]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[110px]"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            <select 
              value={dentistFilter}
              onChange={(e) => setDentistFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[130px]"
            >
              <option value="">All Dentists</option>
              {dentists.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[130px]"
            >
              <option value="">All Due Dates</option>
              <option value="Today">Today (June 10)</option>
              <option value="Next 7 Days">Next 7 Days</option>
              <option value="Next 30 Days">Next 30 Days</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Case ID</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Dentist</th>
                <th className="px-6 py-4">Prosthetic Specs</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-450">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-base text-gray-750">No lab orders found</p>
                      <p className="text-xs text-gray-400">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => openDetailsDrawer(order)}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 text-xs group-hover:text-primary transition-colors">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {order.patientName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>
                        <p className="font-medium text-gray-800">{order.dentistName}</p>
                        <p className="text-xs text-gray-400">{order.dentistContact}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>
                        <p className="font-semibold text-gray-750 text-xs">{order.prostheticType}</p>
                        <p className="text-[11px] text-gray-400">{order.material} (Shade: {order.shade})</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${getPriorityStyle(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {order.dueDate === "2026-06-10" ? (
                        <span className="text-danger font-semibold flex items-center gap-1">
                          Today ⚠️
                        </span>
                      ) : (
                        order.dueDate
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(order.status)}`}></span>
                        <span className="text-sm font-semibold text-gray-700">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {order.status === "Pending" && (
                          <>
                            <button 
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => openRejectModal(order.id)}
                              className="px-2.5 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {order.status === "Accepted" && (
                          <button 
                            onClick={() => handleStartProduction(order.id)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-purple-100"
                          >
                            Start Production
                          </button>
                        )}
                        {order.status === "In Progress" && (
                          <button 
                            onClick={() => handleCompleteOrder(order.id)}
                            className="px-2.5 py-1.5 bg-success/10 hover:bg-success text-success hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        <button 
                          onClick={() => openDetailsDrawer(order)}
                          className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isDrawerOpen && currentCase && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Wrapper */}
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-right duration-300 pointer-events-auto">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/60 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">{currentCase.id}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPriorityStyle(currentCase.priority)}`}>
                    {currentCase.priority}
                  </span>
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
                      : "text-gray-550 hover:text-gray-800 hover:bg-gray-100/50"
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
                  <div className="bg-gray-55 border border-gray-150 p-4 rounded-2xl space-y-3.5">
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
                        <p className="font-bold text-amber-805 bg-amber-50 px-2 py-0.5 rounded border border-amber-250/20 inline-block mt-0.5">{currentCase.shade}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Estimated Delivery</span>
                        <p className="font-bold text-danger flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-danger" /> {currentCase.dueDate}
                        </p>
                      </div>
                    </div>

                    {currentCase.notes && (
                      <div className="border-t border-gray-250/40 pt-3 text-xs text-gray-600 italic">
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
                    <div className="relative pl-5 space-y-5 border-l-2 border-gray-105 ml-2 py-1">
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
                          <p className="text-[9px] text-gray-455">{v.date} by {v.author}</p>
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
                          className="mt-0.5 w-4 h-4 border-gray-305 rounded text-primary focus:ring-primary accent-primary"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-805 group-hover:text-primary transition-colors">{item.name}</span>
                          <p className="text-[10px] text-gray-405 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-455 uppercase tracking-wider">QC Comments / Failure Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Input rework instructions or inspection pass observations..."
                      value={qcComments}
                      onChange={(e) => setQcComments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-850 placeholder-gray-400 leading-relaxed"
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
                      <p className="text-[10px] text-gray-450 mt-0.5">Courier shipping provider information</p>
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
                          className="w-full px-3 py-2 border border-gray-205 rounded-xl text-xs text-gray-850 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-455 uppercase tracking-wider">Tracking Code</label>
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Edit Lab Specifications</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Case ID</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={editFormData.id}
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none text-sm cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prosthetic Type</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.prostheticType}
                      onChange={(e) => setEditFormData({ ...editFormData, prostheticType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Shade</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.shade}
                      onChange={(e) => setEditFormData({ ...editFormData, shade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                      placeholder="e.g. A1, B2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Material</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.material}
                    onChange={(e) => setEditFormData({ ...editFormData, material: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Priority</label>
                    <select 
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                    <input 
                      type="date" 
                      required
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes / Instructions</label>
                  <textarea 
                    rows="3"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 resize-none"
                    placeholder="Enter special lab instructions..."
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-danger">⚠️</span> Reject Lab Case {rejectTargetId}
              </h2>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Please provide a reason for rejecting this case. This reason will be communicated back to the ordering dentist immediately.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reason for Rejection</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="e.g. Impression margins are distorted; please take a new scanner model and resubmit."
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none transition-all text-sm text-gray-800 resize-none placeholder:text-gray-400"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleRejectOrder}
                className="px-5 py-2 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors shadow-sm shadow-danger/30 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
