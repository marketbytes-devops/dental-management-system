"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Stethoscope,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Bell,
  X,
  Calendar,
  Filter,
  Package
} from "lucide-react";
import { getLabOrdersForReceptionist, notifyPatientForLabOrder } from "@/services/api";

const STATUS_COLORS = {
  "Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Ready for Pickup": "bg-teal-50 text-teal-700 border-teal-200",
  "Dispatched": "bg-sky-50 text-sky-700 border-sky-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "In Fabrication": "bg-blue-50 text-blue-700 border-blue-200",
  "Pending Review": "bg-amber-50 text-amber-700 border-amber-200",
  "Rejected": "bg-red-50 text-red-700 border-red-200",
  "Revision Requested": "bg-orange-50 text-orange-700 border-orange-200",
  "Returned for Rework": "bg-rose-50 text-rose-700 border-rose-200",
  "Ordered": "bg-purple-50 text-purple-700 border-purple-200",
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-600 border-gray-200";
}

function isOrderReady(order) {
  const doneStatuses = ["Completed", "completed", "Ready for Pickup", "Dispatched"];
  return doneStatuses.includes(order.status);
}

export default function LabOrderPickupsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedPatientToken, setExpandedPatientToken] = useState(null);

  // Notify modal state
  const [notifyTarget, setNotifyTarget] = useState(null); // { patient_name, patient_token, patient_phone, ordersToNotify }
  const [contactNote, setContactNote] = useState("");
  const [contactMethod, setContactMethod] = useState("Phone Call");
  const [submitting, setSubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState("");

  const [notificationLogs, setNotificationLogs] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getLabOrdersForReceptionist();
      setOrders(data);
    } catch (err) {
      console.warn("Failed to fetch lab orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Group orders by patient token / name
  const groupedPatientsMap = {};
  orders.forEach((order) => {
    const key = order.patient_token || order.patient_name || "UNKNOWN";
    if (!groupedPatientsMap[key]) {
      groupedPatientsMap[key] = {
        patient_token: order.patient_token,
        patient_name: order.patient_name,
        patient_phone: order.patient_phone,
        patient_email: order.patient_email,
        orders: [],
      };
    }
    groupedPatientsMap[key].orders.push(order);
    if (!groupedPatientsMap[key].patient_phone && order.patient_phone) {
      groupedPatientsMap[key].patient_phone = order.patient_phone;
    }
  });

  const patientGroups = Object.values(groupedPatientsMap);

  const handleOpenNotifyForPatient = (patientGroup, specificOrders = null) => {
    const targetOrders = specificOrders || patientGroup.orders;
    setNotifyTarget({
      patient_name: patientGroup.patient_name,
      patient_token: patientGroup.patient_token,
      patient_phone: patientGroup.patient_phone,
      orders: targetOrders,
    });
    setContactNote("");
    setContactMethod("Phone Call");
    setNotifySuccess("");
  };

  const handleSubmitNotification = async (e) => {
    e.preventDefault();
    if (!notifyTarget || !contactNote.trim()) return;
    setSubmitting(true);
    try {
      const fullNote = `[${contactMethod}] ${contactNote.trim()}`;
      
      // Update notification for all selected orders for this patient
      await Promise.all(
        notifyTarget.orders.map((o) => notifyPatientForLabOrder(o.id, fullNote))
      );

      const timeStr = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
      });

      setNotificationLogs((prev) => {
        const next = { ...prev };
        notifyTarget.orders.forEach((o) => {
          next[o.id] = [...(next[o.id] || []), { note: fullNote, time: timeStr }];
        });
        return next;
      });

      setNotifySuccess("Patient contact logged successfully for all orders!");
      setTimeout(() => {
        setNotifyTarget(null);
      }, 1200);
    } catch (err) {
      console.error("Failed to log notification:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering grouped patients
  const filteredPatients = patientGroups.filter((group) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      group.patient_name?.toLowerCase().includes(q) ||
      group.patient_token?.toLowerCase().includes(q) ||
      group.patient_phone?.includes(q) ||
      group.orders.some(
        (o) =>
          o.order_type?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          o.dentist_name?.toLowerCase().includes(q)
      );

    if (!matchesSearch) return false;

    const hasReady = group.orders.some(isOrderReady);
    const hasInProgress = group.orders.some((o) => !isOrderReady(o) && o.status !== "Rejected");

    if (statusFilter === "All") return true;
    if (statusFilter === "Ready") return hasReady;
    if (statusFilter === "InProgress") return hasInProgress;
    return true;
  });

  const totalPatients = patientGroups.length;
  const readyPatientsCount = patientGroups.filter((g) => g.orders.some(isOrderReady)).length;
  const readyOrdersCount = orders.filter(isOrderReady).length;
  const inProgressOrdersCount = orders.filter((o) => !isOrderReady(o) && o.status !== "Rejected").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Lab Order Pickups</h1>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              Track lab orders grouped per patient. Click any patient to view all their pending & ready orders.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Patients</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{totalPatients}</h3>
            <p className="text-[10px] text-gray-400 font-medium">{orders.length} total lab orders</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Ready for Pickup</p>
            <h3 className="text-2xl font-black text-teal-700 mt-1">{readyPatientsCount} Patients</h3>
            <p className="text-[10px] text-teal-600 font-medium">{readyOrdersCount} orders ready to inform</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">In Fabrication</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{inProgressOrdersCount} Orders</h3>
            <p className="text-[10px] text-amber-600 font-medium">Awaiting lab completion</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-teal-200 shadow-xs flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, token, phone or order type..."
            className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-teal-200 shadow-xs">
          <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
          {["All", "Ready", "InProgress"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f === "InProgress" ? "In Progress" : f}
              {f === "Ready" && readyPatientsCount > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                    statusFilter === f ? "bg-white/20" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {readyPatientsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Patient Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400 bg-white rounded-2xl border border-teal-200">
            Loading lab orders...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-teal-200 space-y-2">
            <FlaskConical className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No matching patients or lab orders found</p>
          </div>
        ) : (
          filteredPatients.map((group) => {
            const isExpanded = expandedPatientToken === group.patient_token;
            const readyOrders = group.orders.filter(isOrderReady);
            const hasReady = readyOrders.length > 0;

            return (
              <div
                key={group.patient_token}
                className="bg-white rounded-2xl border border-teal-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Patient Summary Header Row */}
                <div
                  onClick={() => setExpandedPatientToken(isExpanded ? null : group.patient_token)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-gray-900">{group.patient_name}</h3>
                        {hasReady && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm animate-pulse shrink-0" title="Needs Attention: Ready for Pickup" />
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {group.patient_token}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {group.orders.length} Order{group.orders.length > 1 ? "s" : ""}
                        </span>
                        {hasReady && (
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 animate-pulse">
                            ✓ {readyOrders.length} Ready for Pickup
                          </span>
                        )}
                      </div>
                      {group.patient_phone ? (
                        <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {group.patient_phone}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic mt-1">No phone on record</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {hasReady ? (
                      <button
                        onClick={() => handleOpenNotifyForPatient(group, readyOrders)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition-all border-none cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400 border border-white animate-pulse shrink-0" />
                        <Bell className="w-3.5 h-3.5" /> Inform Patient ({readyOrders.length})
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenNotifyForPatient(group)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Log Contact
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPatientToken(isExpanded ? null : group.patient_token)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 border-none cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded View: All Lab Orders for this Patient */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-slate-50/50 p-5 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      All Orders for {group.patient_name}
                    </h4>

                    <div className="space-y-3">
                      {group.orders.map((order) => {
                        const isReady = isOrderReady(order);
                        const localLogs = notificationLogs[order.id] || [];
                        const techNoteLines = (order.tech_notes || "")
                          .split("\n")
                          .filter((l) => l.includes("[PATIENT NOTIFIED"));
                        const allLogs = [
                          ...techNoteLines.map((line) => ({
                            note: line.replace(/\[PATIENT NOTIFIED [^\]]+\]:/, "").trim(),
                            time: line.match(/\[PATIENT NOTIFIED ([^\]]+)\]/)?.[1] || "",
                          })),
                          ...localLogs,
                        ];

                        const createdDate = order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric"
                            })
                          : "—";

                        return (
                          <div
                            key={order.id}
                            className="bg-white p-4 rounded-xl border border-gray-150 space-y-2 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                  {order.order_category}
                                </span>
                                <span className="font-bold text-xs text-gray-900">{order.order_type}</span>
                                <span className="text-[10px] font-bold text-gray-400">#{order.id}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                <span>Doctor: <strong className="text-gray-700">{order.dentist_name || "—"}</strong></span>
                                <span>Date: <strong>{createdDate}</strong></span>
                              </div>
                            </div>

                            {order.notes && (
                              <p className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <span className="font-bold text-gray-400 block text-[9px] uppercase">Notes:</span>
                                {order.notes}
                              </p>
                            )}

                            {/* Contact Logs */}
                            {allLogs.length > 0 && (
                              <div className="pt-2 border-t border-gray-100 space-y-1">
                                <span className="text-[9px] font-black uppercase text-gray-400">Contact Logs</span>
                                {allLogs.map((log, idx) => (
                                  <div key={idx} className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 flex justify-between">
                                    <span>{log.note}</span>
                                    <span className="text-gray-400 text-[10px]">{log.time}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Inform Patient Modal */}
      {notifyTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-600" />
                  Log Patient Contact
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  {notifyTarget.patient_name} ({notifyTarget.orders.length} Order{notifyTarget.orders.length > 1 ? "s" : ""})
                </p>
              </div>
              <button
                onClick={() => setNotifyTarget(null)}
                className="text-gray-400 hover:text-gray-700 border-none bg-transparent cursor-pointer text-lg font-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info Card */}
            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-3.5 space-y-1.5">
              <p className="text-[10px] font-black text-teal-800 uppercase tracking-wider">Patient & Orders Summary</p>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <User className="w-4 h-4 text-gray-400" />
                {notifyTarget.patient_name}
                <span className="text-[10px] font-semibold text-gray-400">{notifyTarget.patient_token}</span>
              </div>
              {notifyTarget.patient_phone ? (
                <a
                  href={`tel:${notifyTarget.patient_phone}`}
                  className="flex items-center gap-2 text-sm font-black text-teal-700 hover:text-teal-900 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {notifyTarget.patient_phone}
                  <span className="text-[10px] font-semibold text-teal-500">Tap to call</span>
                </a>
              ) : (
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> No phone number on file
                </p>
              )}
              <div className="pt-1 text-[11px] font-semibold text-gray-600 space-y-0.5">
                {notifyTarget.orders.map((o) => (
                  <div key={o.id} className="flex justify-between text-[10px] bg-white px-2 py-1 rounded border border-teal-100">
                    <span className="font-bold text-gray-800">{o.order_type} (#{o.id})</span>
                    <span className="text-teal-700 font-black">{o.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {notifySuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900">{notifySuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitNotification} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Contact Method
                  </label>
                  <select
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="SMS">SMS</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Contact Note <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                    placeholder="e.g. Patient informed — coming in tomorrow morning. / Left voicemail. / Spoke with family member..."
                    rows={3}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setNotifyTarget(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !contactNote.trim()}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-xs border-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {submitting ? "Saving..." : "Log Contact"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
