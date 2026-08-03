"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Pill,
  FlaskConical,
  CheckCircle2,
  Clock,
  Search,
  User,
  Stethoscope,
  X,
  Receipt,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Send,
  Eye,
  AlertCircle
} from "lucide-react";
import {
  getDispensingQueue,
  getLabOrdersForReceptionist,
  updateDispenseStatus,
  createBillingRequest
} from "@/services/api";

export default function MedicinesToDispensePage() {
  const [dispenseList, setDispenseList] = useState([]);
  const [labOrdersList, setLabOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Encounter modal & state
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [expandedPatients, setExpandedPatients] = useState({});
  const [sentToAccountantMap, setSentToAccountantMap] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const [rxData, labData] = await Promise.all([
        getDispensingQueue().catch(() => []),
        getLabOrdersForReceptionist().catch(() => [])
      ]);

      setDispenseList(rxData || []);
      setLabOrdersList(labData || []);

      // Auto-expand patient folders by default
      const initialExpanded = {};
      (rxData || []).forEach((item) => {
        const key = item.patient_token || item.patient_name || "Unknown";
        initialExpanded[key] = true;
      });
      (labData || []).forEach((item) => {
        const key = item.patient_token || item.patient_name || "Unknown";
        initialExpanded[key] = true;
      });
      setExpandedPatients(initialExpanded);
    } catch (err) {
      console.warn("Failed to fetch post-consultation orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleMarkDispensed = async (id) => {
    setUpdatingId(id);
    try {
      await updateDispenseStatus(id, "Dispensed");
      setDispenseList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "Dispensed", dispensed_at: new Date().toISOString() } : item
        )
      );

      if (selectedEncounter) {
        setSelectedEncounter((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((it) =>
              it.id === id ? { ...it, status: "Dispensed" } : it
            )
          };
        });
      }

      triggerToast("Medicine Dispensed successfully!");
    } catch (err) {
      console.error("Failed to mark as dispensed:", err);
      triggerToast("Failed to mark medicine dispensed.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendToAccountant = async (item) => {
    setUpdatingId(item.id || item.unique_key);
    try {
      let procs = [];
      let srcType = "consultation";

      if (item.item_type === "lab") {
        srcType = "lab";
        procs = [{
          name: `Lab Order (${item.prosthetic_type || item.order_category || "Prosthetic"})`,
          title: `Lab Order (${item.prosthetic_type || item.order_category || "Prosthetic"})`,
          rate: Number(item.total_amount || item.patient_total_amount || 3500)
        }];
      } else {
        srcType = "consultation";
        procs = (item.medications || []).map((m) => ({
          name: `Medicine: ${m.medicine || m.name}`,
          title: `Medicine: ${m.medicine || m.name}`,
          rate: Number(m.line_total || m.unit_price || 0)
        }));
      }

      await createBillingRequest({
        patient_token: item.patient_token,
        doctor_name: item.doctor_name || "Doctor",
        total_amount: Number(item.total_amount || 0),
        source_type: srcType,
        procedures: procs.length > 0 ? procs : [{ name: "Post-Consultation Charge", title: "Post-Consultation Charge", rate: item.total_amount || 0 }],
        notes: null
      });

      setSentToAccountantMap((prev) => ({ ...prev, [item.unique_key]: true }));
      triggerToast(`Sent bill for ${item.patient_name} to Accountant!`);
    } catch (err) {
      console.error("Failed to send bill to accountant:", err);
      triggerToast("Failed to send bill to Accountant.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendAllEncounterToAccountant = async (encounter) => {
    if (!encounter || !encounter.items || encounter.items.length === 0) return;
    setUpdatingId("all");
    try {
      for (const item of encounter.items) {
        if (!sentToAccountantMap[item.unique_key]) {
          await handleSendToAccountant(item);
        }
      }
      triggerToast(`All encounter bills for ${encounter.patientName} sent to Accountant!`);
    } catch (err) {
      console.error("Failed to send all encounter bills:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const togglePatient = (key) => {
    setExpandedPatients((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Combine Prescription & Lab Entries
  const combinedEntries = useMemo(() => {
    const list = [];

    dispenseList.forEach((rx) => {
      const total = rx.total_amount || 0;
      list.push({
        ...rx,
        unique_key: `rx-${rx.id}`,
        item_type: "prescription",
        title: "Medicine Prescription",
        total_amount: total,
        date_received: rx.date_received || rx.dispensed_at || rx.created_at
      });
    });

    labOrdersList.forEach((lab) => {
      const total = lab.patient_total_amount || 3500.0;
      list.push({
        ...lab,
        unique_key: `lab-${lab.id}`,
        item_type: "lab",
        title: `Lab Order (${lab.prosthetic_type || lab.order_category || 'Prosthetic'})`,
        doctor_name: lab.dentist_name || "Dr. Anoop Nair",
        patient_token: lab.patient_token,
        patient_name: lab.patient_name || "Patient",
        total_amount: total,
        date_received: lab.date_received || lab.created_at,
        created_at: lab.created_at
      });
    });

    return list;
  }, [dispenseList, labOrdersList]);

  // Filter combined list
  const filteredList = combinedEntries.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.patient_name?.toLowerCase().includes(q) ||
      item.patient_token?.toLowerCase().includes(q) ||
      item.doctor_name?.toLowerCase().includes(q) ||
      item.id?.toString().toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      (item.medications || []).some((m) =>
        (m.medicine || m.name || "").toLowerCase().includes(q)
      )
    );
  });

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

  // Group by Patient -> Group by Visit Date & Time
  const patientGroups = useMemo(() => {
    const groups = {};
    filteredList.forEach((item) => {
      const pKey = item.patient_token || item.patient_name || "Unknown";
      if (!groups[pKey]) {
        groups[pKey] = {
          key: pKey,
          patient_name: item.patient_name || "Patient",
          patient_token: item.patient_token || "—",
          visitsMap: {},
          totalAmount: 0,
          hasNewVisit: false
        };
      }

      const rawDate = item.date_received || item.created_at || new Date().toISOString();
      const dateObj = new Date(rawDate);
      const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "Recent Visit";

      const timeStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : "";

      if (!groups[pKey].visitsMap[dateStr]) {
        groups[pKey].visitsMap[dateStr] = {
          dateStr,
          timeStr,
          rawDate,
          isToday: dateStr === todayStr,
          doctorName: item.doctor_name || item.dentist_name || "Doctor",
          items: [],
          totalAmount: 0
        };
      }

      if (dateStr === todayStr) {
        groups[pKey].hasNewVisit = true;
      }

      groups[pKey].visitsMap[dateStr].items.push(item);
      groups[pKey].visitsMap[dateStr].totalAmount += item.total_amount || 0;
      groups[pKey].totalAmount += item.total_amount || 0;
    });

    return Object.values(groups).map((g) => {
      const visitList = Object.values(g.visitsMap);
      visitList.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0));
      return {
        ...g,
        visits: visitList
      };
    });
  }, [filteredList, todayStr]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Post-Consultation Dispensing & Routing</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Clear distinction between Today's New Visits and Past Visits. Dispense medicines and route bills to Accountant.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient name, token, doctor, medicine or lab case ID..."
          className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Patient Folders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400 bg-white rounded-2xl border border-gray-150">
            Loading patient encounter folders...
          </div>
        ) : patientGroups.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-2xl border border-gray-150">
            <Pill className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No post-consultation orders found</p>
          </div>
        ) : (
          patientGroups.map((group) => {
            const isExpanded = !!expandedPatients[group.key];
            return (
              <div
                key={group.key}
                className={`bg-white rounded-2xl border ${
                  group.hasNewVisit
                    ? "border-red-300 shadow-sm shadow-red-500/10"
                    : "border-gray-200 shadow-xs"
                } overflow-hidden transition-all`}
              >
                {/* Patient Folder Header */}
                <button
                  type="button"
                  onClick={() => togglePatient(group.key)}
                  className={`w-full p-4.5 ${
                    group.hasNewVisit ? "bg-red-50/30 hover:bg-red-50/50" : "bg-slate-50/80 hover:bg-slate-100/80"
                  } border-b border-gray-200 flex items-center justify-between transition cursor-pointer text-left`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-gray-900">{group.patient_name}</h3>
                        <span className="text-xs font-semibold text-gray-600 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                          {group.patient_token}
                        </span>
                        {group.hasNewVisit && (
                          <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" /> NEW TODAY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.visits.length} Visit Encounter{group.visits.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                        Total Encounter Value
                      </span>
                      <span className="text-sm font-black text-gray-900">
                        ₹{group.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Visit Dates Cards Grid */}
                {isExpanded && (
                  <div className="p-5 bg-white space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Encounter Visits Timeline (Newest First)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.visits.map((visit, vIdx) => {
                        const rxItems = visit.items.filter((i) => i.item_type === "prescription");
                        const labItems = visit.items.filter((i) => i.item_type === "lab");
                        const hasPendingAction = visit.items.some(
                          (i) => i.status !== "Dispensed" || !sentToAccountantMap[i.unique_key]
                        );
                        const isNewVisit = visit.isToday || hasPendingAction || vIdx === 0;

                        return (
                          <div
                            key={visit.dateStr}
                            className={`p-4 rounded-2xl border ${
                              isNewVisit
                                ? "border-red-300 bg-red-50/20 shadow-xs shadow-red-500/10"
                                : "border-gray-200 bg-gray-50/50"
                            } hover:border-blue-300 transition-all flex flex-col justify-between space-y-3`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl font-bold ${isNewVisit ? "bg-red-100 text-red-700" : "bg-purple-50 text-purple-600"}`}>
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-gray-900">
                                      {visit.dateStr} {visit.timeStr && `• ${visit.timeStr}`}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                                    <Stethoscope className="w-3 h-3 text-blue-500" /> {visit.doctorName}
                                  </span>
                                </div>
                              </div>

                              {/* NEW / STATUS BADGES */}
                              {visit.isToday ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> TODAY'S VISIT (NEW)
                                </span>
                              ) : hasPendingAction ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> ACTION REQUIRED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Past Visit (Settled)
                                </span>
                              )}
                            </div>

                            {/* Items Breakdown Pills */}
                            <div className="flex flex-wrap items-center gap-2">
                              {rxItems.length > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                                  <Pill className="w-3 h-3" /> Medicine Prescription ({rxItems.length})
                                </span>
                              )}
                              {labItems.length > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1">
                                  <FlaskConical className="w-3 h-3" /> Lab Order ({labItems.length})
                                </span>
                              )}
                            </div>

                            {/* View & Dispense Action */}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedEncounter({
                                  patientName: group.patient_name,
                                  patientToken: group.patient_token,
                                  dateStr: visit.dateStr,
                                  timeStr: visit.timeStr,
                                  doctorName: visit.doctorName,
                                  items: visit.items
                                })
                              }
                              className={`w-full py-2 ${
                                isNewVisit ? "bg-red-600 hover:bg-red-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
                              } text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border-none`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isNewVisit ? "Open Today's Visit & Dispense" : "View Past Visit Details"}
                            </button>
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

      {/* Encounter Modal */}
      {selectedEncounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 border border-gray-100 text-left animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900">
                      Encounter: {selectedEncounter.patientName}
                    </h3>
                    {selectedEncounter.dateStr === todayStr && (
                      <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                        TODAY'S NEW VISIT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Token: <strong>{selectedEncounter.patientToken}</strong> · Visit: <strong>{selectedEncounter.dateStr} {selectedEncounter.timeStr}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEncounter(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Items List */}
            <div className="space-y-4">
              {selectedEncounter.items.map((item) => {
                const isLab = item.item_type === "lab";
                const isSent = !!sentToAccountantMap[item.unique_key];
                const needsDispensing = !isLab && item.status !== "Dispensed";

                return (
                  <div
                    key={item.unique_key}
                    className={`p-4 rounded-2xl border ${
                      needsDispensing || !isSent ? "border-amber-300 bg-amber-50/30" : "border-gray-200 bg-gray-50/60"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                            isLab ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isLab ? <FlaskConical className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                        </div>
                        <span className="font-extrabold text-sm text-gray-900">
                          {isLab ? `Lab Order (${item.id})` : "Prescription Medicine"}
                        </span>
                      </div>
                      <span className="text-sm font-black text-gray-900">
                        ₹{(item.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Breakdown */}
                    {isLab ? (
                      <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-purple-950">
                            {item.prosthetic_type || item.order_category || "Prosthetic Fabrication"}
                          </span>
                          {item.material && (
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-purple-200 font-bold text-purple-700">
                              {item.material}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-purple-800 space-x-2">
                          {item.shade && <span>Shade: <strong>{item.shade}</strong></span>}
                          {(item.tooth_quadrant || item.tooth_number) && <span>Tooth: <strong>{item.tooth_quadrant || item.tooth_number}</strong></span>}
                        </div>
                      </div>
                    ) : (
                      item.medications && item.medications.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.medications.map((med, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-medium text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-gray-900">{med.medicine || med.name}</span>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {med.schedule && <span>{med.schedule}</span>}
                                  {med.timing && <span> • {med.timing}</span>}
                                  {med.duration && <span> • {med.duration}</span>}
                                </div>
                              </div>
                              <span className="font-bold text-emerald-700 text-xs">
                                ₹{(med.line_total || med.unit_price || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No medications prescribed</span>
                      )
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-200/60">
                      {!isLab && (
                        item.status !== "Dispensed" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkDispensed(item.id)}
                            disabled={updatingId === item.id}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            {updatingId === item.id ? "Dispensing..." : "Dispense Medicine"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Dispensed
                          </span>
                        )
                      )}

                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sent to Accountant
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendToAccountant(item)}
                          disabled={updatingId === (item.id || item.unique_key)}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Send to Accountant
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEncounter(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer border-none"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleSendAllEncounterToAccountant(selectedEncounter)}
                disabled={updatingId === "all"}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Send All Visit Charges to Accountant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
