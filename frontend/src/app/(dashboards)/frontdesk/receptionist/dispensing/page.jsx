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
  Printer,
  X,
  Receipt,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertCircle,
  Sparkles,
  Calendar
} from "lucide-react";
import {
  getDispensingQueue,
  getLabOrdersForReceptionist,
  updateDispenseStatus,
  collectDispensingPayment,
  collectLabOrderPayment
} from "@/services/api";

export default function MedicinesToDispensePage() {
  const [dispenseList, setDispenseList] = useState([]);
  const [labOrdersList, setLabOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Modals state
  const [paymentModalItem, setPaymentModalItem] = useState(null); // Item being paid for
  const [selectedReceipt, setSelectedReceipt] = useState(null);   // Item for printable receipt
  const [expandedPatients, setExpandedPatients] = useState({});

  // Payment form states
  const [paymentOption, setPaymentOption] = useState("50_PERCENT"); // "50_PERCENT" or "FULL"
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customAmountPaid, setCustomAmountPaid] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
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
      triggerToast("Prescription marked as Dispensed!");
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

  // Open Payment Modal with initial threshold calculation
  const handleOpenPaymentModal = (item) => {
    const total = item.total_amount || item.patient_total_amount || (item.item_type === "lab" ? 3500 : 500);
    const requiresFull = total < 1000;
    
    setPaymentModalItem(item);
    setPaymentOption(requiresFull ? "FULL" : "50_PERCENT");
    setCustomAmountPaid(requiresFull ? total.toString() : (total / 2).toString());
    setPaymentMethod("Cash");
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalItem) return;

    setIsSubmittingPayment(true);
    const total = paymentModalItem.total_amount || paymentModalItem.patient_total_amount || (paymentModalItem.item_type === "lab" ? 3500 : 500);
    let amountToPay = parseFloat(customAmountPaid);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      amountToPay = paymentOption === "FULL" ? total : total / 2;
    }

    const payload = {
      total_amount: total,
      amount_paid: amountToPay,
      payment_method: paymentMethod
    };

    try {
      if (paymentModalItem.item_type === "prescription") {
        await collectDispensingPayment(paymentModalItem.id, payload);
      } else {
        await collectLabOrderPayment(paymentModalItem.id, payload);
      }

      triggerToast(`Payment of ₹${amountToPay.toFixed(2)} received successfully!`);
      setPaymentModalItem(null);
      fetchAllOrders();
    } catch (err) {
      console.error("Failed to collect payment:", err);
      triggerToast("Failed to process payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Normalize & Combine Prescription & Lab Entries into single list
  const combinedEntries = useMemo(() => {
    const list = [];

    // 1. Map Prescriptions
    dispenseList.forEach((rx) => {
      const total = rx.total_amount || 0;
      const paid = rx.amount_paid || 0;
      const bal = rx.balance_due !== undefined ? rx.balance_due : maxZero(total - paid);
      const payStatus = rx.payment_status || (paid >= total && total > 0 ? "Paid in Full" : (paid > 0 ? "50% Advance Paid" : "Pending Payment"));

      list.push({
        ...rx,
        unique_key: `rx-${rx.id}`,
        item_type: "prescription",
        title: "Medicine Prescription",
        total_amount: total,
        amount_paid: paid,
        balance_due: bal,
        payment_status: payStatus,
        payment_method: rx.payment_method || "Cash",
        date_received: rx.date_received || rx.dispensed_at || rx.created_at
      });
    });

    // 2. Map Lab Orders
    labOrdersList.forEach((lab) => {
      const total = lab.patient_total_amount || 3500.0;
      const paid = lab.patient_amount_paid || 0.0;
      const bal = lab.patient_balance_due !== undefined ? lab.patient_balance_due : maxZero(total - paid);
      const payStatus = lab.payment_status || (paid >= total && total > 0 ? "Paid in Full" : (paid > 0 ? "50% Advance Paid" : "Pending Payment"));

      list.push({
        ...lab,
        unique_key: `lab-${lab.id}`,
        item_type: "lab",
        title: `Lab Order (${lab.prosthetic_type || lab.order_category || 'Prosthetic'})`,
        doctor_name: lab.dentist_name || "Dr. Anoop Nair",
        patient_token: lab.patient_token,
        patient_name: lab.patient_name || "Patient",
        total_amount: total,
        amount_paid: paid,
        balance_due: bal,
        payment_status: payStatus,
        payment_method: lab.payment_method || "Cash",
        date_received: lab.date_received || lab.created_at,
        created_at: lab.created_at
      });
    });

    return list;
  }, [dispenseList, labOrdersList]);

  // Filter combined list by search query
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

  // Group by patient folder
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
          pendingPaymentCount: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }
      groups[key].entries.push(item);
      if (item.payment_status === "Pending Payment") groups[key].pendingPaymentCount += 1;
      groups[key].totalAmount += item.total_amount || 0;
      groups[key].totalPaid += item.amount_paid || 0;
      groups[key].totalBalance += item.balance_due || 0;
    });

    // Sort entries within each patient folder
    Object.values(groups).forEach((g) => {
      g.entries.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    });

    return Object.values(groups);
  }, [filteredList]);

  const totalPendingPayments = combinedEntries.filter((i) => i.payment_status === "Pending Payment").length;
  const totalAdvancePaid = combinedEntries.filter((i) => i.payment_status === "50% Advance Paid").length;
  const totalPaidInFull = combinedEntries.filter((i) => i.payment_status === "Paid in Full").length;

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
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Post-Consultation Orders & Receipts</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Automatic prescription dispensing & lab order checkout with smart 50% / 100% payment rules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Patient Folders</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{patientGroups.length}</h3>
            <p className="text-[10px] text-gray-400 font-medium">{combinedEntries.length} Total Orders</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Payment</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{totalPendingPayments}</h3>
            <p className="text-[10px] text-amber-600 font-medium">Awaiting payment collection</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">50% Advance Paid</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{totalAdvancePaid}</h3>
            <p className="text-[10px] text-blue-600 font-medium">Deposit collected upfront</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Paid in Full</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{totalPaidInFull}</h3>
            <p className="text-[10px] text-emerald-600 font-medium">Fully settled orders</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
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
          placeholder="Search by patient name, token, doctor, medicine, or lab case ID..."
          className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Patient Folders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400 bg-white rounded-2xl border border-gray-150">
            Loading post-consultation orders & receipts...
          </div>
        ) : patientGroups.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-2xl border border-gray-150">
            <Pill className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No post-consultation checkout entries found</p>
            <p className="text-[11px] text-gray-400">
              When doctors order lab fabrication or prescribe medications, they automatically appear here grouped by patient folder.
            </p>
          </div>
        ) : (
          patientGroups.map((group) => {
            const isExpanded = !!expandedPatients[group.key];
            return (
              <div
                key={group.key}
                className="bg-white rounded-2xl border border-teal-200/80 shadow-xs overflow-hidden transition-all"
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
                        {group.pendingPaymentCount > 0 && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs animate-pulse shrink-0"
                            title="Needs Payment Collection"
                          />
                        )}
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          {group.patient_token}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.entries.length} Order{group.entries.length > 1 ? "s" : ""} (Lab & Prescriptions)
                        {group.pendingPaymentCount > 0 && (
                          <span className="text-amber-600 font-bold ml-2">• {group.pendingPaymentCount} Pending Payment</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                        Folder Summary (Total / Paid)
                      </span>
                      <span className="text-sm font-black text-gray-900">
                        ₹{group.totalAmount.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-bold block">
                        Paid: ₹{group.totalPaid.toFixed(2)}
                      </span>
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
                          <th className="py-3 px-5">Type / ID</th>
                          <th className="py-3 px-5">Prescribing Doctor</th>
                          <th className="py-3 px-5">Prescription / Lab Specification Breakdown</th>
                          <th className="py-3 px-5 text-right">Total Cost</th>
                          <th className="py-3 px-5">Payment Rule & Status</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {group.entries.map((item) => {
                          const isLab = item.item_type === "lab";
                          const total = item.total_amount || 0;
                          const paid = item.amount_paid || 0;
                          const bal = item.balance_due || maxZero(total - paid);
                          const requiresFullPayment = total < 1000;

                          const dateFormatted = item.date_received || item.created_at
                            ? new Date(item.date_received || item.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })
                            : "—";

                          return (
                            <tr key={item.unique_key} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-4 px-5 font-semibold text-gray-700 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                                      isLab ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                                    }`}
                                  >
                                    {isLab ? <FlaskConical className="w-3.5 h-3.5" /> : <Pill className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-gray-900 block text-xs">
                                      {isLab ? `Lab Order (${item.id})` : `Prescription`}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-semibold">{dateFormatted}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-5">
                                <div className="flex items-center gap-1.5 text-gray-800 font-bold text-xs">
                                  <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>{item.doctor_name || item.dentist_name || "Doctor"}</span>
                                </div>
                              </td>

                              {/* Breakdown Column */}
                              <td className="py-4 px-5 max-w-md">
                                {isLab ? (
                                  <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-bold text-purple-950">
                                        {item.prosthetic_type || item.order_category || "Prosthetic Fabrication"}
                                      </span>
                                      {item.material && (
                                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-purple-200 font-semibold text-purple-700">
                                          {item.material}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-purple-800 font-medium space-x-2">
                                      {item.shade && <span>Shade: <strong>{item.shade}</strong></span>}
                                      {(item.tooth_quadrant || item.tooth_number) && <span>Tooth: <strong>{item.tooth_quadrant || item.tooth_number}</strong></span>}
                                      {item.notes && <span className="block truncate italic mt-0.5 text-purple-700">"{item.notes}"</span>}
                                    </div>
                                  </div>
                                ) : (
                                  item.medications && item.medications.length > 0 ? (
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
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic text-[11px]">No medications prescribed</span>
                                  )
                                )}
                              </td>

                              <td className="py-4 px-5 text-right font-black text-sm text-gray-900 whitespace-nowrap">
                                ₹{total.toFixed(2)}
                              </td>

                              {/* Payment Rule & Status */}
                              <td className="py-4 px-5 whitespace-nowrap">
                                <div className="space-y-1">
                                  {/* Rule tag */}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      requiresFullPayment
                                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                                        : "bg-blue-100 text-blue-800 border border-blue-300"
                                    }`}
                                  >
                                    {requiresFullPayment ? "100% Upfront (< ₹1k)" : "50% Advance (≥ ₹1k)"}
                                  </span>

                                  {/* Payment status badge */}
                                  <div className="flex items-center gap-1.5">
                                    {item.payment_status === "Paid in Full" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid in Full
                                      </span>
                                    ) : item.payment_status === "50% Advance Paid" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                                        <CreditCard className="w-3 h-3 text-blue-600" /> Paid 50% (Bal: ₹{bal.toFixed(0)})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                                        <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Pending Payment
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Collect Payment Button */}
                                  {item.payment_status !== "Paid in Full" && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPaymentModal(item)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer flex items-center gap-1.5"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      {item.payment_status === "50% Advance Paid" ? "Pay Remaining" : "Collect Payment"}
                                    </button>
                                  )}

                                  {/* Receipt Button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReceipt(item)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all border border-gray-200 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> Receipt
                                  </button>

                                  {/* Dispense Action for Prescription */}
                                  {!isLab && item.status !== "Dispensed" && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkDispensed(item.id)}
                                      disabled={updatingId === item.id}
                                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-xl transition-all border border-blue-200 cursor-pointer disabled:opacity-50"
                                      title="Mark Medicine Dispensed"
                                    >
                                      {updatingId === item.id ? "..." : "Dispense"}
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

      {/* Collect Payment Modal */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 border border-gray-200 text-left animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-gray-900">Collect Checkout Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary & Smart Rule Banner */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start text-xs font-bold text-gray-900">
                <span>{paymentModalItem.patient_name} ({paymentModalItem.patient_token})</span>
                <span className="text-teal-800 font-black">{paymentModalItem.title}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-gray-900 pt-1 border-t border-teal-200/60">
                <span>Total Order Cost:</span>
                <span className="text-base">
                  ₹{(paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Threshold Rule Explainer */}
              <div className="pt-2">
                {(paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0) < 1000 ? (
                  <div className="bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] p-2.5 rounded-xl font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Rule (&lt; ₹1,000):</strong> Total cost is below ₹1,000 threshold. 100% full payment is collected upfront.
                    </span>
                  </div>
                ) : (
                  <div className="bg-blue-100/80 border border-blue-300 text-blue-900 text-[11px] p-2.5 rounded-xl font-semibold flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Rule (≥ ₹1,000):</strong> Order total is ₹1,000 or higher. Minimum 50% advance deposit is collected upfront.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Payment Option Radio Buttons */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Select Payment Amount
                </label>
                {(paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0) >= 1000 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentOption("50_PERCENT");
                        const tot = paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0;
                        setCustomAmountPaid((tot / 2).toString());
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        paymentOption === "50_PERCENT"
                          ? "bg-blue-50 border-blue-600 text-blue-950 shadow-xs"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase text-blue-600">50% Advance Deposit</span>
                      <span className="text-sm font-black block mt-0.5">
                        ₹{((paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0) / 2).toFixed(2)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentOption("FULL");
                        const tot = paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0;
                        setCustomAmountPaid(tot.toString());
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        paymentOption === "FULL"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase text-emerald-600">100% Full Payment</span>
                      <span className="text-sm font-black block mt-0.5">
                        ₹{(paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0).toFixed(2)}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-black">
                    100% Full Payment Required: ₹{(paymentModalItem.total_amount || paymentModalItem.patient_total_amount || 0).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customAmountPaid}
                  onChange={(e) => setCustomAmountPaid(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Payment Method Dropdown */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Card">Credit / Debit Card</option>
                </select>
              </div>

              {/* Auto Stamped Date Received */}
              <div className="text-[11px] text-gray-500 font-semibold flex items-center justify-between pt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Date Received:</span>
                <span className="font-bold text-gray-800">{new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs border-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingPayment ? "Processing..." : "Confirm & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Itemized Official Receipt Modal */}
      {selectedReceipt && (
        <div
          id="post-consultation-receipt-print-wrapper"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #post-consultation-receipt-print-wrapper,
              #post-consultation-receipt-print-wrapper * {
                visibility: visible !important;
              }
              #post-consultation-receipt-print-wrapper {
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
              #post-consultation-receipt-card {
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
            id="post-consultation-receipt-card"
            className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl space-y-6 border border-gray-200 animate-fadeIn my-6 text-left"
          >
            {/* Header Actions (Hidden when printing) */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {selectedReceipt.item_type === "lab" ? "Lab Order Fabrication Receipt" : "Pharmacy Prescription Receipt"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
                >
                  <Printer className="w-4 h-4" /> Print Official Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition border-none bg-transparent cursor-pointer"
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
                  <p className="text-xs text-gray-600 font-semibold mt-0.5">
                    Official Post-Consultation Patient Receipt
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">123 Dental Plaza, Jubilee Hills, Hyderabad — 500001</p>
                  <p className="text-[11px] text-gray-500">Phone: +91 40 2345 6789 | Email: billing@smilecare.com</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-800">Receipt #: REC-2026-{(selectedReceipt.id || 101)}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">
                    Date Received: {selectedReceipt.date_received || selectedReceipt.created_at ? new Date(selectedReceipt.date_received || selectedReceipt.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Details */}
              <div className="grid grid-cols-2 gap-6 py-2 border-b border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Patient Details</span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedReceipt.patient_name || "Patient"}</p>
                  <p className="text-gray-500 font-semibold mt-0.5">Token: {selectedReceipt.patient_token}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Prescribing Doctor</span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedReceipt.doctor_name || selectedReceipt.dentist_name || "Dr. Anoop Nair"}</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                  {selectedReceipt.item_type === "lab" ? "Lab Order Specifications" : "Prescribed Medications Breakdown"}
                </h4>
                <table className="w-full text-left border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-black uppercase text-gray-700">
                      <th className="p-3 border-r border-gray-300">#</th>
                      <th className="p-3 border-r border-gray-300">Item Description</th>
                      <th className="p-3 border-r border-gray-300">Specifications / Dosage</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {selectedReceipt.item_type === "lab" ? (
                      <tr>
                        <td className="p-3 border-r border-gray-300 font-semibold text-gray-600">1</td>
                        <td className="p-3 border-r border-gray-300 font-bold text-gray-900">
                          {selectedReceipt.prosthetic_type || selectedReceipt.order_category || "Prosthetic Crown / Fabrication"}
                        </td>
                        <td className="p-3 border-r border-gray-300 text-gray-700">
                          Material: {selectedReceipt.material || "Zirconia"} • Shade: {selectedReceipt.shade || "A2"} • Tooth: {selectedReceipt.tooth_quadrant || selectedReceipt.tooth_number || "Full Arch"}
                        </td>
                        <td className="p-3 text-right font-extrabold text-gray-900">
                          ₹{(selectedReceipt.total_amount || selectedReceipt.patient_total_amount || 3500).toFixed(2)}
                        </td>
                      </tr>
                    ) : (
                      (selectedReceipt.medications || []).map((med, idx) => (
                        <tr key={idx}>
                          <td className="p-3 border-r border-gray-300 font-semibold text-gray-600">{idx + 1}</td>
                          <td className="p-3 border-r border-gray-300 font-bold text-gray-900">{med.medicine || med.name}</td>
                          <td className="p-3 border-r border-gray-300 text-gray-700">
                            {med.schedule || "1-0-1"} ({med.timing || "As directed"}) • {med.duration || "3 days"} ({med.total_pills || 1} pills)
                          </td>
                          <td className="p-3 text-right font-extrabold text-gray-900">₹{(med.line_total || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 font-semibold">
                  <span>Total Estimated Order Cost:</span>
                  <span className="font-bold text-gray-900">₹{(selectedReceipt.total_amount || selectedReceipt.patient_total_amount || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600 font-semibold">
                  <span>Payment Condition Applied:</span>
                  <span className="font-bold text-blue-700">
                    {(selectedReceipt.total_amount || selectedReceipt.patient_total_amount || 0) < 1000 ? "100% Upfront Required (< ₹1,000)" : "50% Advance Deposit Required (≥ ₹1,000)"}
                  </span>
                </div>

                <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-300">
                  <span>Amount Received Upfront ({selectedReceipt.payment_method || "Cash"}):</span>
                  <span className="text-emerald-700">₹{(selectedReceipt.amount_paid || selectedReceipt.patient_amount_paid || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-700 font-bold text-xs pt-1">
                  <span>Remaining Balance Due on Delivery:</span>
                  <span className={(selectedReceipt.balance_due || selectedReceipt.patient_balance_due || 0) > 0 ? "text-amber-700" : "text-gray-900"}>
                    ₹{(selectedReceipt.balance_due || selectedReceipt.patient_balance_due || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-gray-400 pt-2 font-bold text-gray-700">Receptionist / Pharmacist Signature</div>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-2 font-bold text-gray-700">Clinic Stamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function maxZero(num) {
  return num > 0 ? num : 0;
}
