"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Pill, CheckCircle2, Clock, Search, User, Stethoscope, Printer, X, Receipt, Folder, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import { getDispensingQueue, updateDispenseStatus } from "@/services/api";

export default function MedicinesToDispensePage() {
  const [dispenseList, setDispenseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [expandedPatients, setExpandedPatients] = useState({});

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await getDispensingQueue();
      setDispenseList(data);

      // Auto-expand all patient folders by default
      const initialExpanded = {};
      data.forEach((item) => {
        const key = item.patient_token || item.patient_name || "Unknown";
        initialExpanded[key] = true;
      });
      setExpandedPatients(initialExpanded);
    } catch (err) {
      console.warn("Failed to fetch dispensing queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
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
    } catch (err) {
      console.error("Failed to mark as dispensed:", err);
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

  const filteredList = dispenseList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.patient_name?.toLowerCase().includes(q) ||
      item.patient_token?.toLowerCase().includes(q) ||
      item.doctor_name?.toLowerCase().includes(q) ||
      (item.medications || []).some((m) =>
        (m.medicine || m.name || "").toLowerCase().includes(q)
      )
    );
  });

  // Group filtered entries by patient token / patient name
  const patientGroups = useMemo(() => {
    const groups = {};
    filteredList.forEach((item) => {
      const key = item.patient_token || item.patient_name || "Unknown";
      if (!groups[key]) {
        groups[key] = {
          key,
          patient_name: item.patient_name || "Patient",
          patient_token: item.patient_token || "—",
          entries: [],
          pendingCount: 0,
          dispensedCount: 0,
          totalAmount: 0,
        };
      }
      groups[key].entries.push(item);
      if (item.status === "Pending") groups[key].pendingCount += 1;
      if (item.status === "Dispensed") groups[key].dispensedCount += 1;
      groups[key].totalAmount += item.total_amount || 0;
    });

    // Sort entries within each patient by date desc
    Object.values(groups).forEach((g) => {
      g.entries.sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    });

    return Object.values(groups);
  }, [filteredList]);

  const pendingCount = dispenseList.filter((i) => i.status === "Pending").length;
  const dispensedCount = dispenseList.filter((i) => i.status === "Dispensed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Medicines to Dispense</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Real-time pharmacy dispensing queue grouped by patient folders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Patients in Queue</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{patientGroups.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Dispense</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completed / Dispensed</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{dispensedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient name, token, doctor or medicine..."
          className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Patient Folders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400 bg-white rounded-2xl border border-gray-150">
            Loading dispensing queue...
          </div>
        ) : patientGroups.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-2xl border border-gray-150">
            <Pill className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No dispensing entries found</p>
            <p className="text-[11px] text-gray-400">
              When doctors save diagnostic records with prescriptions, they will automatically appear here grouped by patient.
            </p>
          </div>
        ) : (
          patientGroups.map((group) => {
            const isExpanded = !!expandedPatients[group.key];
            return (
              <div
                key={group.key}
                className="bg-white rounded-2xl border border-teal-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Patient Folder Header */}
                <button
                  type="button"
                  onClick={() => togglePatient(group.key)}
                  className="w-full p-4 bg-gray-50/80 hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-gray-900">{group.patient_name}</h3>
                        {group.pendingCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm animate-pulse shrink-0" title="Needs Attention: Pending Dispense" />
                        )}
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          {group.patient_token}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.entries.length} Prescription{group.entries.length > 1 ? "s" : ""}
                        {group.pendingCount > 0 && (
                          <span className="text-amber-600 font-bold ml-2">• {group.pendingCount} Pending</span>
                        )}
                        {group.dispensedCount > 0 && (
                          <span className="text-emerald-600 font-bold ml-2">• {group.dispensedCount} Dispensed</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Total Prescription Fee</span>
                      <span className="text-base font-black text-gray-900">₹{group.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Patient Entries Table (Accordion Content) */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <th className="py-3 px-5">Time / Date</th>
                          <th className="py-3 px-5">Prescribing Doctor</th>
                          <th className="py-3 px-5">Prescribed Medicines Breakdown</th>
                          <th className="py-3 px-5 text-right">Amount Payable</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {group.entries.map((item) => {
                          const isDispensed = item.status === "Dispensed";
                          const createdTime = item.created_at
                            ? new Date(item.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—";

                          return (
                            <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-4 px-5 font-semibold text-gray-700 whitespace-nowrap">
                                {createdTime}
                              </td>

                              <td className="py-4 px-5">
                                <div className="flex items-center gap-1.5 text-gray-800 font-bold text-xs">
                                  <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>{item.doctor_name || "Doctor"}</span>
                                </div>
                              </td>

                              <td className="py-4 px-5 max-w-sm">
                                {item.medications && item.medications.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {item.medications.map((med, idx) => (
                                      <div
                                        key={idx}
                                        className="text-[11px] font-medium text-gray-800 bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-200 flex items-center justify-between gap-2"
                                      >
                                        <div>
                                          <span className="font-bold text-gray-900">{med.medicine || med.name}</span>
                                          <div className="text-[10px] text-gray-500 mt-0.5">
                                            {med.schedule && <span>{med.schedule}</span>}
                                            {med.timing && <span> • {med.timing}</span>}
                                            {med.duration && <span> • {med.duration}</span>}
                                            {med.total_pills > 0 && (
                                              <span className="font-bold text-gray-700 ml-1">({med.total_pills} pills)</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="font-bold text-emerald-700">₹{(med.line_total || 0).toFixed(2)}</div>
                                          <div className="text-[9px] text-gray-400">₹{(med.unit_price || 0).toFixed(2)}/pill</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">No specific meds prescribed</span>
                                )}
                              </td>

                              <td className="py-4 px-5 text-right font-black text-sm text-gray-900 whitespace-nowrap">
                                ₹{(item.total_amount || 0).toFixed(2)}
                              </td>

                              <td className="py-4 px-5 whitespace-nowrap">
                                {isDispensed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                                    <CheckCircle2 className="w-3 h-3" /> Dispensed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                                    <Clock className="w-3 h-3 animate-pulse" /> Pending
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedReceipt(item)}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all border border-blue-200 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                                  </button>

                                  {!isDispensed && (
                                    <button
                                      onClick={() => handleMarkDispensed(item.id)}
                                      disabled={updatingId === item.id}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-red-400 border border-white animate-pulse shrink-0" />
                                      {updatingId === item.id ? "Updating..." : "Mark Dispensed"}
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Printable Pharmacy Receipt Modal */}
      {selectedReceipt && (
        <div
          id="pharmacy-receipt-print-wrapper"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #pharmacy-receipt-print-wrapper,
              #pharmacy-receipt-print-wrapper * {
                visibility: visible !important;
              }
              #pharmacy-receipt-print-wrapper {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                z-index: 999999 !important;
                overflow: visible !important;
              }
              #pharmacy-receipt-card {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div
            id="pharmacy-receipt-card"
            className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl space-y-6 border border-gray-200 animate-fadeIn my-6 text-left"
          >
            {/* Modal Actions Header (Hidden when printing) */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Pharmacy Prescription Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document Area */}
            <div className="space-y-6">
              {/* Clinic Branding */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">SMILECARE DENTAL CLINIC</h2>
                  <p className="text-xs text-gray-600 font-semibold mt-0.5">Clinical Pharmacy & Dispensary Receipt</p>
                  <p className="text-[11px] text-gray-500 mt-1">123 Dental Plaza, Jubilee Hills, Hyderabad - 500001</p>
                  <p className="text-[11px] text-gray-500">Phone: +91 40 2345 6789 | Email: info@smilecare.com</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600">
                    Date: {selectedReceipt.created_at ? new Date(selectedReceipt.created_at).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Meta Info */}
              <div className="grid grid-cols-2 gap-6 py-2 border-b border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Patient Details</span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedReceipt.patient_name || "Patient"}</p>
                  <p className="text-gray-500 font-semibold mt-0.5">Token: {selectedReceipt.patient_token}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Prescribing Doctor</span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedReceipt.doctor_name || "Doctor"}</p>
                </div>
              </div>

              {/* Prescribed Items Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Prescribed Medication Breakdown</h4>
                <table className="w-full text-left border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-black uppercase text-gray-700">
                      <th className="p-3 border-r border-gray-300">#</th>
                      <th className="p-3 border-r border-gray-300">Medicine Name</th>
                      <th className="p-3 border-r border-gray-300">Dosage Schedule</th>
                      <th className="p-3 border-r border-gray-300">Duration</th>
                      <th className="p-3 border-r border-gray-300 text-center">Total Quantity</th>
                      <th className="p-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {(selectedReceipt.medications || []).map((med, idx) => (
                      <tr key={idx}>
                        <td className="p-3 border-r border-gray-300 font-semibold text-gray-600">{idx + 1}</td>
                        <td className="p-3 border-r border-gray-300 font-bold text-gray-900">{med.medicine || med.name}</td>
                        <td className="p-3 border-r border-gray-300 text-gray-700">{med.schedule || "1-0-1"} ({med.timing || "As directed"})</td>
                        <td className="p-3 border-r border-gray-300 text-gray-700">{med.duration || "3 days"}</td>
                        <td className="p-3 border-r border-gray-300 text-center font-bold text-gray-900">{med.total_pills || 1} pills</td>
                        <td className="p-3 text-right font-extrabold text-gray-900">₹{(med.line_total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Row */}
              <div className="flex justify-between items-center border-t-2 border-b-2 border-gray-900 py-3">
                <span className="text-base font-black text-gray-900 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-black text-gray-900">₹{(selectedReceipt.total_amount || 0).toFixed(2)}</span>
              </div>

              {/* Signature Footer */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-gray-400 pt-2 font-bold text-gray-700">Pharmacist Signature</div>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-2 font-bold text-gray-700">Authorized Stamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
