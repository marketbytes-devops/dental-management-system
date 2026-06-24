"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Hourglass, Microscope, Flame, Search, Calendar } from "lucide-react";

const INITIAL_ORDERS = [
  {
    id: "CASE-2026-001",
    patientName: "Aditya Verma",
    dentistName: "Dr. Anoop Nair",
    dentistContact: "+91 98765 43210",
    prostheticType: "Crown",
    material: "Zirconia (Ultra-Translucent)",
    shade: "A2",
    priority: "High",
    dueDate: "2026-06-10",
    status: "Pending",
    notes: "Please ensure high-glaze finish on the margins. Check occlusion carefully.",
    rejectionReason: ""
  },
  {
    id: "CASE-2026-002",
    patientName: "Meera Nair",
    dentistName: "Dr. Sarah Smith",
    dentistContact: "+91 94477 12345",
    prostheticType: "Bridge (3-Unit)",
    material: "E-Max Lithium Disilicate",
    shade: "A1",
    priority: "Urgent",
    dueDate: "2026-06-11",
    status: "In Progress",
    notes: "Pontic on #24. Gingival characterization required.",
    rejectionReason: ""
  },
  {
    id: "CASE-2026-003",
    patientName: "Rajesh Kannan",
    dentistName: "Dr. Anoop Nair",
    dentistContact: "+91 98765 43210",
    prostheticType: "Implant Crown",
    material: "Screw-Retained Zirconia",
    shade: "A3",
    priority: "Medium",
    dueDate: "2026-06-15",
    status: "Accepted",
    notes: "Ti-base included. Torque to 35 Ncm during try-in.",
    rejectionReason: ""
  },
  {
    id: "CASE-2026-004",
    patientName: "Shruti Hegde",
    dentistName: "Dr. Sarah Smith",
    dentistContact: "+91 94477 12345",
    prostheticType: "Veneers (6 Units)",
    material: "E-Max Press",
    shade: "B1",
    priority: "High",
    dueDate: "2026-06-14",
    status: "Pending",
    notes: "Patient wants a natural bleach shade. Minimal prep design.",
    rejectionReason: ""
  },
  {
    id: "CASE-2026-005",
    patientName: "Vikram Malhotra",
    dentistName: "Dr. Anoop Nair",
    dentistContact: "+91 98765 43210",
    prostheticType: "Complete Denture",
    material: "High-Impact Acrylic",
    shade: "A2",
    priority: "Low",
    dueDate: "2026-06-25",
    status: "Completed",
    notes: "Anatomical teeth setup requested. Semi-adjustable articulator used.",
    rejectionReason: ""
  },
  {
    id: "CASE-2026-006",
    patientName: "Sneha Thomas",
    dentistName: "Dr. Elizabeth Rose",
    dentistContact: "+91 99955 88812",
    prostheticType: "Inlay",
    material: "Composite Resin",
    shade: "A3.5",
    priority: "Low",
    dueDate: "2026-06-08",
    status: "Rejected",
    notes: "Distal margin is subgingival. Impression is distorted near #16.",
    rejectionReason: "Impression margin distortion around #16. Scan is unreadable."
  },
  {
    id: "CASE-2026-007",
    patientName: "Arjun Sen",
    dentistName: "Dr. Elizabeth Rose",
    dentistContact: "+91 99955 88812",
    prostheticType: "Crown",
    material: "Porcelain Fused to Metal (PFM)",
    shade: "B2",
    priority: "Medium",
    dueDate: "2026-07-02",
    status: "In Progress",
    notes: "Metal collar on lingual aspect only.",
    rejectionReason: ""
  },
  {
    id: "CASE-2026-008",
    patientName: "Priyanka Rao",
    dentistName: "Dr. Sarah Smith",
    dentistContact: "+91 94477 12345",
    prostheticType: "Night Guard",
    material: "Thermo-Plastic Hard/Soft",
    shade: "Clear",
    priority: "High",
    dueDate: "2026-06-12",
    status: "Accepted",
    notes: "Maxillary arch. Patient has severe bruxism.",
    rejectionReason: ""
  }
];

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

      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            <div 
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            ></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-all duration-300 animate-in slide-in-from-right duration-300">
                <div className="flex h-full flex-col overflow-y-scroll bg-white">
                  <div className="bg-gray-50 px-6 py-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-primary uppercase tracking-wider">Lab Case Details</span>
                        <h2 className="text-xl font-black text-gray-900 mt-0.5">{selectedOrder.id}</h2>
                      </div>
                      <button 
                        onClick={() => setIsDrawerOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="relative flex-1 px-6 py-6 space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Current Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(selectedOrder.status)}`}></span>
                          <span className="text-sm font-black text-gray-800">{selectedOrder.status}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium text-right">Priority</p>
                        <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${getPriorityStyle(selectedOrder.priority)}`}>
                          {selectedOrder.priority}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Contacts</h4>
                      <div className="bg-white border border-gray-150 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-400">Patient Name</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedOrder.patientName}</p>
                        </div>
                        <div className="h-px bg-gray-100"></div>
                        <div>
                          <p className="text-xs text-gray-400">Ordering Dentist</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedOrder.dentistName}</p>
                          <p className="text-xs text-gray-500">{selectedOrder.dentistContact}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Prosthetic Specifications</h4>
                      <div className="bg-white border border-gray-150 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Type</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedOrder.prostheticType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Shade</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md inline-block">
                              {selectedOrder.shade}
                            </p>
                          </div>
                        </div>
                        <div className="h-px bg-gray-100"></div>
                        <div>
                          <p className="text-xs text-gray-400">Material</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedOrder.material}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Timeline & Notes</h4>
                      <div className="bg-white border border-gray-150 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-400">Due Date</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-500" /> {selectedOrder.dueDate}
                            {selectedOrder.dueDate === "2026-06-10" && (
                              <span className="text-xs text-danger font-extrabold bg-danger/5 px-2 py-0.5 rounded">
                                Urgent Delivery Today
                              </span>
                            )}
                          </p>
                        </div>

                        {selectedOrder.notes && (
                          <>
                            <div className="h-px bg-gray-100"></div>
                            <div>
                              <p className="text-xs text-gray-400">Notes from Dentist</p>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                                "{selectedOrder.notes}"
                              </p>
                            </div>
                          </>
                        )}

                        {selectedOrder.status === "Rejected" && selectedOrder.rejectionReason && (
                          <>
                            <div className="h-px bg-gray-100"></div>
                            <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                              <p className="text-xs font-bold text-danger">Rejection Reason</p>
                              <p className="text-xs text-danger/90 mt-1 leading-relaxed">
                                {selectedOrder.rejectionReason}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-6 py-6 bg-gray-50 flex flex-col gap-2.5">
                    <div className="flex gap-2">
                      {selectedOrder.status === "Pending" && (
                        <>
                          <button 
                            onClick={() => handleAcceptOrder(selectedOrder.id)}
                            className="flex-1 px-4 py-2.5 text-center text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors cursor-pointer shadow-sm shadow-primary/30"
                          >
                            Accept Case
                          </button>
                          <button 
                            onClick={() => openRejectModal(selectedOrder.id)}
                            className="flex-1 px-4 py-2.5 text-center text-sm font-bold text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors cursor-pointer shadow-sm shadow-danger/30"
                          >
                            Reject Case
                          </button>
                        </>
                      )}

                      {selectedOrder.status === "Accepted" && (
                        <button 
                          onClick={() => handleStartProduction(selectedOrder.id)}
                          className="w-full px-4 py-2.5 text-center text-sm font-bold text-white bg-purple-600 hover:bg-purple-750 transition-colors cursor-pointer rounded-xl shadow-sm shadow-purple-50/30"
                        >
                          Start Production Setup
                        </button>
                      )}

                      {selectedOrder.status === "In Progress" && (
                        <button 
                          onClick={() => handleCompleteOrder(selectedOrder.id)}
                          className="w-full px-4 py-2.5 text-center text-sm font-bold text-white bg-success hover:bg-success/90 transition-colors cursor-pointer rounded-xl shadow-sm shadow-success/30"
                        >
                          Mark Production Complete
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(selectedOrder)}
                        className="flex-1 px-4 py-2 text-center text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Edit Specs
                      </button>
                      <button 
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex-1 px-4 py-2 text-center text-xs font-bold text-gray-500 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
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
