"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Flame, 
  Check, 
  X, 
  AlertTriangle, 
  ArrowRight, 
  Calendar, 
  User,
  Clock
} from "lucide-react";
import Link from "next/link";
import { getLabOrders, updateLabOrderStatus } from "@/services/api";

export default function LabDashboard() {
  const [animate, setAnimate] = useState(false);
  const [orders, setOrders] = useState([]);
  
  // Rejection modal states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState("");
  const [rejectReasonText, setRejectReasonText] = useState("");
  
  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchOrders = async () => {
    try {
      const data = await getLabOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch lab orders for dashboard:", err);
    }
  };

  useEffect(() => {
    setAnimate(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      await updateLabOrderStatus(orderId, { status: "Accepted" });
      triggerToast(`Case ${orderId} has been accepted successfully.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to accept order.", "error");
    }
  };

  const openRejectModal = (orderId) => {
    setRejectTargetId(orderId);
    setRejectReasonText("");
    setIsRejectModalOpen(true);
  };

  const handleRejectOrderSubmit = async (e) => {
    e.preventDefault();
    if (rejectReasonText.trim() === "") {
      alert("Please enter a reason for rejection.");
      return;
    }
    try {
      await updateLabOrderStatus(rejectTargetId, { status: "Rejected", rejection_reason: rejectReasonText });
      setIsRejectModalOpen(false);
      triggerToast(`Case ${rejectTargetId} has been rejected.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to reject order.", "error");
    }
  };

  const getRelativeTime = (date, referenceTime = new Date("2026-06-10T12:00:00")) => {
    const diffMs = referenceTime - date;
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "submit":
        return (
          <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </span>
        );
      case "accept":
        return (
          <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Check className="w-4 h-4" />
          </span>
        );
      case "fabrication":
        return (
          <span className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </span>
        );
      case "qc":
        return (
          <span className="w-7 h-7 rounded-lg bg-warning/10 border border-warning/20 text-warning flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </span>
        );
      case "invoice":
        return (
          <span className="w-7 h-7 rounded-lg bg-success/10 border border-success/20 text-success flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </span>
        );
      default:
        return (
          <span className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </span>
        );
    }
  };

  const generateActivityLogs = (ordersList) => {
    const activities = [];
    const referenceTime = new Date("2026-06-10T12:00:00");

    ordersList.forEach(order => {
      let createdTime;
      try {
        createdTime = order.created_at ? new Date(order.created_at) : new Date("2026-06-09T10:00:00");
        if (isNaN(createdTime.getTime())) {
          createdTime = new Date("2026-06-09T10:00:00");
        }
      } catch (e) {
        createdTime = new Date("2026-06-09T10:00:00");
      }

      // 1. Submitted event (all orders)
      activities.push({
        id: `${order.id}-submitted`,
        caseId: order.id,
        text: `${order.dentist_name || "Doctor"} submitted case ${order.id}`,
        time: createdTime,
        type: "submit"
      });

      // 2. Accepted event (Accepted, In Progress, QC Pending, Ready / Shipped, Completed)
      if (["Accepted", "In Progress", "QC Pending", "Ready / Shipped", "Completed"].includes(order.status)) {
        const acceptedTime = new Date(createdTime.getTime() + 15 * 60 * 1000); // 15 mins later
        if (acceptedTime <= referenceTime) {
          activities.push({
            id: `${order.id}-accepted`,
            caseId: order.id,
            text: `Case ${order.id} accepted by technician`,
            time: acceptedTime,
            type: "accept"
          });
        }
      }

      // 3. Fabrication (QC Pending, Ready / Shipped, Completed)
      if (["QC Pending", "Ready / Shipped", "Completed"].includes(order.status)) {
        const designTime = new Date(createdTime.getTime() + 45 * 60 * 1000); // 45 mins later
        if (designTime <= referenceTime) {
          activities.push({
            id: `${order.id}-crown-completed`,
            caseId: order.id,
            text: `${order.prosthetic_type || order.order_category} processing completed for case ${order.id}`,
            time: designTime,
            type: "fabrication"
          });
        }
      }

      // 4. QC passed (Ready / Shipped, Completed)
      if (["Ready / Shipped", "Completed"].includes(order.status)) {
        const qcTime = new Date(createdTime.getTime() + 90 * 60 * 1000); // 90 mins later
        if (qcTime <= referenceTime) {
          activities.push({
            id: `${order.id}-qc-passed`,
            caseId: order.id,
            text: `QC check completed for case ${order.id}`,
            time: qcTime,
            type: "qc"
          });
        }
      }

      // 5. Complete / Invoice generated (Completed)
      if (order.status === "Completed") {
        const completeTime = new Date(createdTime.getTime() + 120 * 60 * 1000); // 120 mins later
        if (completeTime <= referenceTime) {
          activities.push({
            id: `${order.id}-invoice`,
            caseId: order.id,
            text: `Invoice and warranty generated for case ${order.id}`,
            time: completeTime,
            type: "invoice"
          });
        }
      }
    });

    activities.sort((a, b) => b.time - a.time);
    return activities.slice(0, 15);
  };

  const emergencyCases = orders.filter(o => o.priority === "Urgent" || o.priority === "High").length;

  // Filters for lists
  const pendingOrders = orders.filter(o => o.status === "Pending");
  
  const recentOrders = [...orders].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  }).slice(0, 5);

  const urgentCases = orders.filter(
    o => (o.priority === "Urgent" || o.priority === "High") && o.status !== "Completed" && o.status !== "Rejected"
  );

  const getOrderDate = (order) => {
    if (!order.created_at) return "2026-06-10";
    return order.created_at.split("T")[0];
  };

  const activityLogs = generateActivityLogs(orders);

  const stats = [
    {
    name: "Pending Cases",
    value: pendingOrders.length,
    icon: ClipboardList,
    change: "New & unreviewed cases",
    color: "border-primary/30 text-primary bg-primary/5"
  },
  {
    name: "Emergency Cases",
    value: emergencyCases,
    icon: Flame,
    change: "Immediate action required",
    color: "border-danger/30 text-danger bg-danger/5"
  },
   
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return <span className="bg-danger/10 text-danger border border-danger/20 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Urgent</span>;
      case "High":
        return <span className="bg-warning/10 text-warning border border-warning/20 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">High</span>;
      case "Medium":
        return <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Medium</span>;
      default:
        return <span className="bg-gray-150 text-gray-550 border border-gray-205 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">{priority}</span>;
    }
  };

  const getStatusDot = (status) => {
    let color = "bg-gray-400";
    if (status === "Pending") color = "bg-warning";
    else if (status === "Accepted") color = "bg-primary";
    else if (status === "In Progress") color = "bg-purple-500";
    else if (status === "Completed") color = "bg-success";
    else if (status === "Rejected") color = "bg-danger";

    return (
      <span className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-xs font-semibold text-gray-700">{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Technician Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time fabrication tracking and pending case analytics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.name}
            style={{ transitionDelay: `${i * 75}ms` }}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-150 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-500 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400 font-bold truncate uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
            </div>

            <div className="mt-2 text-[10px] font-bold text-gray-500 flex items-center gap-1 border-t border-gray-100 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Dashboard Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Doctor Orders Inbox (8 Cols) */}
        <div className="xl:col-span-8 bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                📥 Doctor Orders Inbox
                <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-bold rounded-full">{pendingOrders.length} New</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Review and accept incoming dentist requests</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[480px]">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 space-y-2">
                <span className="text-3xl">🎉</span>
                <p className="text-sm font-semibold">All caught up! No pending doctor orders.</p>
                <p className="text-xs text-gray-400">Approved orders will automatically flow to your Lab Orders Board.</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{order.id}</span>
                      {getPriorityBadge(order.priority)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-650">
                      <span className="font-bold flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" /> {order.patient_name || "Walk-in Patient"}</span>
                      <span className="text-gray-300">•</span>
                      <span>Dentist: {order.dentist_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-600">{order.order_category}</span>
                      {order.order_category === "Prosthetic" ? (
                        <>
                          <span>Type: {order.prosthetic_type || "N/A"}</span>
                          <span>Material: {order.material || "N/A"}</span>
                          {order.shade && order.shade !== "N/A" && <span>Shade: <span className="font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-100">{order.shade}</span></span>}
                        </>
                      ) : (
                        <>
                          <span>Test: {order.order_details?.test_type || "Diagnostic"}</span>
                        </>
                      )}
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 font-semibold text-danger"><Calendar className="w-3.5 h-3.5 text-danger" /> Due: {order.due_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center justify-end">
                    <button 
                      onClick={() => openRejectModal(order.id)}
                      className="px-3 py-1.5 text-xs font-bold text-danger bg-danger/5 hover:bg-danger/10 border border-danger/10 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button 
                      onClick={() => handleAcceptOrder(order.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Case
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed (4 Cols) */}
        <div className="xl:col-span-4 bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              ⚡ Recent Activity
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Real-time case progression logs</p>
          </div>

          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[480px]">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 space-y-2">
                <span className="text-3xl font-normal">⏱️</span>
                <p className="text-sm font-semibold">No recent activity.</p>
                <p className="text-xs text-gray-400">Activity updates will appear as cases move through stages.</p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(log.type)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs text-gray-700 leading-snug font-semibold">
                      {log.text}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{getRelativeTime(log.time)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Deadlines & Escalations Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Orders Widget (6 Cols) */}
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                📅 Recent Orders
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {recentOrders.length}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest clinical cases received for processing</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[300px]">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 space-y-2">
                <span className="text-3xl">☕</span>
                <p className="text-sm font-semibold">No recent orders found!</p>
                <p className="text-xs text-gray-400">All set for now.</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{order.id}</span>
                      {getPriorityBadge(order.priority)}
                    </div>
                    <div className="text-xs text-gray-650 font-medium">
                      Patient: {order.patient_name || "Walk-in Patient"}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Category: {order.order_category} • Details: {order.prosthetic_type || order.order_details?.test_type || "N/A"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusDot(order.status)}
                    <Link 
                      href="/labtechnicians/orders"
                      className="px-2.5 py-1 text-[10px] font-bold text-primary hover:text-white hover:bg-primary border border-primary/20 hover:border-transparent rounded transition-all"
                    >
                      Track Case
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Urgent Cases Widget (6 Cols) */}
        <div className="bg-white border border-danger/20 rounded-2xl shadow-sm overflow-hidden flex flex-col bg-danger/[0.01]">
          <div className="px-5 py-4 border-b border-danger/10 bg-danger/[0.02] flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-danger flex items-center gap-2">
                ⚠ Urgent Cases
                <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs font-bold rounded-full animate-pulse">
                  {urgentCases.length}
                </span>
              </h3>
              <p className="text-xs text-red-500/80 mt-0.5">Active cases that require immediate fabrication attention</p>
            </div>
          </div>

          <div className="divide-y divide-red-100/50 overflow-y-auto max-h-[300px]">
            {urgentCases.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 space-y-2">
                <span className="text-3xl">🎉</span>
                <p className="text-sm font-semibold text-gray-500">No urgent cases!</p>
                <p className="text-xs text-gray-400">Excellent pace! Everything is stable.</p>
              </div>
            ) : (
              urgentCases.map((order) => (
                <div key={order.id} className="p-4 hover:bg-danger/[0.02] transition-colors flex justify-between items-center text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{order.id}</span>
                      {getPriorityBadge(order.priority)}
                      <span className="bg-danger/10 text-danger border border-danger/20 text-[9px] px-1.5 py-0.5 rounded font-bold">
                        {order.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-650 font-medium">
                      Patient: {order.patient_name || "Walk-in Patient"}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Ordered: <span className="font-semibold text-gray-500">{getOrderDate(order)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusDot(order.status)}
                    <Link 
                      href="/labtechnicians/orders"
                      className="px-2.5 py-1 text-[10px] font-bold text-danger hover:text-white hover:bg-danger border border-danger/20 hover:border-transparent rounded transition-all"
                    >
                      Escalate
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-150 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Reject Case {rejectTargetId}</h3>
                <p className="text-xs text-gray-400 mt-0.5">This will send a notification back to the ordering dentist.</p>
              </div>
            </div>

            <form onSubmit={handleRejectOrderSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">Reason for Rejection</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this impression or prescription cannot be fabricated (e.g. poor scan definition, shade query)..."
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger text-gray-800 placeholder-gray-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifier */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
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

