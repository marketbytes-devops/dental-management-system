"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Stethoscope,
  Tag,
  FileText,
  Printer,
  Phone,
  Mail,
  MapPin,
  Clock,
  Pill,
  X,
  Calendar,
  Sparkles
} from "lucide-react";
import { getPatientLedgers, createPayment, getReceipt, getAccountantPendingLabTasks, finalizeAccountantLabBill } from "@/services/api";

// --------------------------------------------------------------------------
// Printable Receipt Component
// --------------------------------------------------------------------------
function ReceiptModal({ receiptData, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=800,height=700");
    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData.receipt_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 32px; }
            .receipt-header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .clinic-name { font-size: 22px; font-weight: 900; color: #1e3a5f; }
            .clinic-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .clinic-meta { display: flex; justify-content: center; gap: 20px; font-size: 11px; color: #374151; margin-top: 8px; }
            .receipt-id { font-size: 12px; color: #6b7280; text-align: center; margin-top: 6px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
            .info-row { display: flex; justify-between; font-size: 12px; padding: 3px 0; color: #374151; }
            .info-label { color: #6b7280; }
            .info-val { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; padding: 6px 8px; text-align: left; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
            td { font-size: 12px; padding: 8px 8px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }
            .amount-col { text-align: right; font-weight: 700; }
            .total-section { border-top: 2px solid #1e3a5f; margin-top: 16px; padding-top: 12px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
            .grand-total { font-weight: 900; font-size: 16px; color: #1e3a5f; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
            .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 28px; border-top: 1px solid #f3f4f6; padding-top: 14px; }
            .tag { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const visitDate = receiptData.visit_date
    ? new Date(receiptData.visit_date).toLocaleString("en-IN", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
      })
    : "—";

  const workingHoursText = (() => {
    const wh = receiptData.doctor_working_hours || {};
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todaySchedule = wh[today];
    if (todaySchedule && !todaySchedule.is_off) {
      return `${todaySchedule.start || "09:00 AM"} – ${todaySchedule.end || "06:00 PM"}`;
    }
    const anyDay = Object.entries(wh).find(([, v]) => !v.is_off);
    if (anyDay) return `${anyDay[1].start || "09:00 AM"} – ${anyDay[1].end || "06:00 PM"}`;
    return "Mon – Sat: 9:00 AM – 6:00 PM";
  })();

  const statusClass = receiptData.status?.toLowerCase() === "paid" ? "status-paid" : "status-pending";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 no-print">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Receipt Preview
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-black rounded-xl transition-all border-none cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="p-8 space-y-6">
          <div className="receipt-header text-center border-b border-gray-200 pb-5">
            <div className="clinic-name text-xl font-black text-slate-900 mb-1">
              {receiptData.clinic.name}
            </div>
            <div className="clinic-sub text-xs text-gray-500 mt-1">
              <span className="flex items-center justify-center gap-1.5">
                <MapPin className="w-3 h-3" /> {receiptData.clinic.address}
              </span>
            </div>
            <div className="clinic-meta flex items-center justify-center gap-5 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {receiptData.clinic.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {receiptData.clinic.email}
              </span>
            </div>
            <div className="receipt-id text-[11px] text-gray-400 mt-3 font-semibold tracking-wider">
              RECEIPT #{receiptData.receipt_id} •{" "}
              <span className={`status-badge ${statusClass} px-2 py-0.5 rounded-full text-[9px] font-black uppercase`}>
                {receiptData.status || "Pending"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="section">
              <div className="section-title text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Patient Information</div>
              <div className="info-row flex justify-between text-xs py-1">
                <span className="info-label text-gray-500">Name</span>
                <span className="info-val font-bold text-gray-900">{receiptData.patient_name}</span>
              </div>
              <div className="info-row flex justify-between text-xs py-1">
                <span className="info-label text-gray-500">Token</span>
                <span className="info-val font-semibold text-gray-700">{receiptData.patient_token}</span>
              </div>
              {receiptData.patient_phone && (
                <div className="info-row flex justify-between text-xs py-1">
                  <span className="info-label text-gray-500">Phone</span>
                  <span className="info-val font-semibold text-gray-700">{receiptData.patient_phone}</span>
                </div>
              )}
              <div className="info-row flex justify-between text-xs py-1">
                <span className="info-label text-gray-500">Visit Date</span>
                <span className="info-val font-semibold text-gray-700">{visitDate}</span>
              </div>
            </div>

            <div className="section">
              <div className="section-title text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Attending Doctor</div>
              <div className="info-row flex justify-between text-xs py-1">
                <span className="info-label text-gray-500">Doctor</span>
                <span className="info-val font-bold text-gray-900">{receiptData.doctor_name}</span>
              </div>
              <div className="info-row flex justify-between text-xs py-1">
                <span className="info-label text-gray-500">Visiting Hours</span>
                <span className="info-val font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" /> {workingHoursText}
                </span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Charges Breakdown</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                  <th className="py-2.5 px-3 rounded-l-lg">Description</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="text-xs">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="tag px-2 py-0.5 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                        {receiptData.source_type === "treatment_plan" ? "Treatment Plan" : "Treatment Done"}
                      </span>
                      <span className="font-bold text-gray-900">
                        {receiptData.procedure_name || (receiptData.source_type === "treatment_plan" ? "Treatment Plan Procedure" : "Treatment Procedure")}
                      </span>
                    </div>
                    {receiptData.notes && !receiptData.notes.toLowerCase().includes("clinical workspace") && (
                      <p className="text-[10px] text-gray-400 mt-1 italic">{receiptData.notes}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-500">—</td>
                  <td className="py-3 px-3 text-right font-black text-gray-900">
                    ₹{receiptData.consultation_fee.toLocaleString()}
                  </td>
                </tr>

                {receiptData.medications && receiptData.medications.length > 0 && (
                  receiptData.medications.map((med, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="tag px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black">Medicine</span>
                          <span className="font-bold text-gray-900">{med.medicine}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 text-[11px]">
                        <div>{med.schedule && <span className="font-semibold">{med.schedule}</span>}</div>
                        <div className="text-gray-400">
                          {[med.timing, med.duration].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        {med.unit_price > 0 ? `₹${med.unit_price.toLocaleString()}` : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="total-section border-t border-gray-200 pt-4 space-y-1">
            <div className="total-row flex justify-between text-xs text-gray-600 py-0.5">
              <span>Treatment Fee</span>
              <span className="font-semibold">₹{receiptData.consultation_fee.toLocaleString()}</span>
            </div>
            {receiptData.medication_total > 0 && (
              <div className="total-row flex justify-between text-xs text-gray-600 py-0.5">
                <span>Medicines Subtotal</span>
                <span className="font-semibold">₹{receiptData.medication_total.toLocaleString()}</span>
              </div>
            )}
            <div className="grand-total flex justify-between text-base font-black text-slate-900 border-t border-gray-200 pt-3 mt-2">
              <span>Total Amount Due</span>
              <span>₹{receiptData.grand_total.toLocaleString()}</span>
            </div>
          </div>

          <div className="footer text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4 mt-4">
            <p className="font-semibold text-gray-500">{receiptData.clinic.name}</p>
            <p>{receiptData.clinic.phone} · {receiptData.clinic.email}</p>
            <p className="mt-1">Thank you for choosing SmileCare. Please retain this receipt for your records.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Accountant Billing Page Component
// --------------------------------------------------------------------------
export default function AccountantBillingPage() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTokens, setExpandedTokens] = useState({});

  // Payment Modal state
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // Receipt Modal state
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState(null);

  // Pending External Dental Lab Billing States
  const [pendingLabCases, setPendingLabCases] = useState([]);
  const [viewCaseModal, setViewCaseModal] = useState(null);
  const [generateBillModal, setGenerateBillModal] = useState(null);
  const [billingForm, setBillingForm] = useState({
    vendorInvoiceNumber: "",
    vendorCost: 1200,
    doctorFee: 3000,
    consultationFee: 500,
    handlingFee: 1000,
    extraCharge: 0,
    discountPercent: 0,
    taxPercent: 0,
    notes: ""
  });

  const fetchPendingLabCases = async () => {
    try {
      const data = await getAccountantPendingLabTasks();
      const pending = (data || []).filter(
        c => c.accountant_bill_status !== "Bill Ready"
      );
      setPendingLabCases(pending);
    } catch (err) {
      console.warn("Failed to fetch pending lab cases:", err);
    }
  };

  const calculateBillTotals = () => {
    const vc = Number(billingForm.vendorCost) || 0;
    const df = Number(billingForm.doctorFee) || 0;
    const cf = Number(billingForm.consultationFee) || 0;
    const hf = Number(billingForm.handlingFee) || 0;
    const ec = Number(billingForm.extraCharge) || 0;
    
    const clinicCharges = df + cf + hf + ec;
    const subtotal = vc + clinicCharges;
    const discountAmt = subtotal * ((Number(billingForm.discountPercent) || 0) / 100);
    const taxableAmt = subtotal - discountAmt;
    const taxAmt = taxableAmt * ((Number(billingForm.taxPercent) || 0) / 100);
    const grandTotal = Math.round(taxableAmt + taxAmt);
    
    return { vc, clinicCharges, subtotal, discountAmt, taxAmt, grandTotal };
  };

  const handleFinalizeBillSubmit = async (e) => {
    e.preventDefault();
    if (!generateBillModal) return;
    const { grandTotal } = calculateBillTotals();
    try {
      await finalizeAccountantLabBill(generateBillModal.id, {
        vendor_invoice_number: billingForm.vendorInvoiceNumber || `LAB-INV-${generateBillModal.id}`,
        vendor_invoice_amount: Number(billingForm.vendorCost) || 0,
        final_patient_bill_amount: grandTotal,
        notes: billingForm.notes
      });
      alert(`Patient bill for ${generateBillModal.patientName || generateBillModal.patient_name} finalized (₹${grandTotal.toLocaleString("en-IN")})! Receptionist notified.`);
      setGenerateBillModal(null);
      fetchPendingLabCases();
      fetchLedgers();
    } catch (err) {
      console.error("Failed to finalize bill:", err);
      alert("Failed to finalize lab bill.");
    }
  };

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const data = await getPatientLedgers();
      setLedgers(data || []);

      const initialExpanded = {};
      (data || []).forEach((l) => {
        initialExpanded[l.patient_token] = true;
      });
      setExpandedTokens(initialExpanded);
    } catch (err) {
      console.warn("Failed to fetch patient ledgers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
    fetchPendingLabCases();
  }, []);

  const toggleExpand = (token) => {
    setExpandedTokens((prev) => ({ ...prev, [token]: !prev[token] }));
  };

  const handleOpenPaymentModal = (ledger, prefillAmount) => {
    setSelectedLedger(ledger);
    const amt = prefillAmount !== undefined ? prefillAmount : (ledger.outstanding_balance > 0 ? ledger.outstanding_balance : ledger.total_charges);
    setPaymentAmount(amt > 0 ? amt.toString() : "");
    setPaymentMethod("Cash");
    setTransactionId("");
    setPaymentSuccess("");
  };

  const handleViewReceipt = async (item) => {
    const idStr = item.id;
    if (!idStr.startsWith("br-")) return;
    const billingId = parseInt(idStr.replace("br-", ""), 10);
    if (isNaN(billingId)) return;

    setLoadingReceiptId(idStr);
    try {
      const data = await getReceipt(billingId);
      setReceiptData(data);
    } catch (err) {
      console.error("Failed to load receipt:", err);
    } finally {
      setLoadingReceiptId(null);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedLedger || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    setSubmittingPayment(true);
    setPaymentSuccess("");

    try {
      await createPayment({
        invoice_id: 1,
        patient_token: selectedLedger.patient_token,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || `TXN-${Date.now()}`,
        type: "Payment"
      });

      setPaymentSuccess("Payment recorded successfully!");
      setTimeout(() => {
        setSelectedLedger(null);
        fetchLedgers();
      }, 1500);
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredLedgers = ledgers.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.patient_name?.toLowerCase().includes(q) ||
      l.patient_token?.toLowerCase().includes(q) ||
      l.patient_phone?.includes(q) ||
      l.stacked_items?.some(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.doctor_name?.toLowerCase().includes(q) ||
          item.source_type?.toLowerCase().includes(q)
      )
    );
  });

  // Group ledgers & stacked items by Date
  const dateGroupedLedgers = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });

    const groups = {};

    filteredLedgers.forEach((ledger) => {
      const itemsByDate = {};
      (ledger.stacked_items || []).forEach((item) => {
        const itemDate = item.date ? new Date(item.date) : new Date();
        const dateStr = !isNaN(itemDate.getTime())
          ? itemDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "Recent Date";

        if (!itemsByDate[dateStr]) itemsByDate[dateStr] = [];
        itemsByDate[dateStr].push(item);
      });

      Object.entries(itemsByDate).forEach(([dateStr, items]) => {
        if (!groups[dateStr]) {
          groups[dateStr] = {
            dateStr,
            isToday: dateStr === todayStr,
            rawDate: items[0]?.date || new Date().toISOString(),
            ledgerSlices: []
          };
        }

        const dateTotal = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const hasUnpaid = items.some((i) => i.status === "Pending" || ledger.outstanding_balance > 0);

        groups[dateStr].ledgerSlices.push({
          ...ledger,
          dateItems: items,
          dateTotal,
          hasUnpaid
        });
      });
    });

    const sortedGroups = Object.values(groups);
    sortedGroups.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0));

    return sortedGroups;
  }, [filteredLedgers]);

  const totalChargesAll = ledgers.reduce((acc, curr) => acc + (curr.total_charges || 0), 0);
  const totalPaidAll = ledgers.reduce((acc, curr) => acc + (curr.total_paid || 0), 0);
  const totalOutstandingAll = ledgers.reduce((acc, curr) => acc + (curr.outstanding_balance || 0), 0);

  const getSourceBadge = (sourceType) => {
    const src = (sourceType || "").toLowerCase();
    if (src === "treatment_plan") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <Tag className="w-3 h-3" /> Treatment Plan
        </span>
      );
    }
    if (src === "lab") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <FileText className="w-3 h-3" /> Lab Order
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
        <Tag className="w-3 h-3" /> Treatment Done
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Accountant Billing & Payments</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Bills arranged by date. Record payments and issue printable receipts per encounter.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Billed</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">₹{totalChargesAll.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Collected</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">₹{totalPaidAll.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Outstanding Dues</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">₹{totalOutstandingAll.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 💳 Pending Lab Billing Section */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4 font-sans text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Lab Case Financial Pipeline
            </span>
            <h2 className="text-lg font-black text-gray-900 mt-1 flex items-center gap-2">
              <span>💳</span> Pending Lab Billing ({pendingLabCases.length})
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              Prosthetic lab cases confirmed received at clinic requiring final patient bill generation.
            </p>
          </div>
        </div>

        {pendingLabCases.length === 0 ? (
          <div className="text-center py-6 text-xs font-semibold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            ✓ No pending lab bills! All received external lab cases have been finalized & approved.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingLabCases.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400">#{item.id}</span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {item.accountant_bill_status || "Pending Billing"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs font-semibold text-gray-800">
                    <p className="text-sm font-black text-gray-900">Patient: <span className="text-primary font-bold">{item.patientName || item.patient_name}</span></p>
                    <p className="text-gray-600">Doctor: <span className="font-bold text-gray-800">{item.dentistName || item.dentist_name}</span></p>
                    <p className="text-gray-600">Procedure: <span className="font-bold text-teal-700">{item.prostheticType || item.orderCategory}</span></p>
                    <p className="text-gray-600">External Lab: <span className="font-bold text-gray-800">{item.vendor_name || "Apex Dental Lab"}</span></p>
                    <p className="text-gray-600">Lab Invoice Amount: <span className="font-black text-rose-600">₹{(item.vendor_invoice_amount || 1200).toLocaleString("en-IN")}</span></p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewCaseModal(item)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    View Case
                  </button>
                  <button
                    onClick={() => {
                      setGenerateBillModal(item);
                      setBillingForm({
                        vendorInvoiceNumber: item.vendor_invoice_number || `LAB-INV-${item.id}`,
                        vendorCost: item.vendor_invoice_amount || 1200,
                        doctorFee: 3000,
                        consultationFee: 500,
                        handlingFee: 1000,
                        extraCharge: 0,
                        discountPercent: 0,
                        taxPercent: 0,
                        notes: ""
                      });
                    }}
                    className="px-4 py-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1"
                  >
                    Generate Bill ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient name, token, doctor or charge type..."
          className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Date Grouped Bills */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400 bg-white rounded-2xl border border-gray-150">
            Loading patient ledgers by date...
          </div>
        ) : dateGroupedLedgers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-150 space-y-2">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No billing ledgers found</p>
          </div>
        ) : (
          dateGroupedLedgers.map((dateGroup) => (
            <div key={dateGroup.dateStr} className="space-y-3">
              {/* Date Group Header */}
              <div className="flex items-center justify-between bg-slate-100/90 px-4 py-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-700" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {dateGroup.isToday ? `Today's Bills (${dateGroup.dateStr})` : `Bills on ${dateGroup.dateStr}`}
                  </h2>
                  {dateGroup.isToday && (
                    <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> Active Today
                    </span>
                  )}
                </div>
                <span className="text-xs font-extrabold text-slate-700">
                  {dateGroup.ledgerSlices.length} Patient{dateGroup.ledgerSlices.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Patient Cards for this Date */}
              <div className="space-y-3">
                {dateGroup.ledgerSlices.map((ledger) => {
                  const isExpanded = !!expandedTokens[ledger.patient_token];
                  const hasDues = ledger.outstanding_balance > 0;
                  const isNewBill = ledger.hasUnpaid;

                  return (
                    <div
                      key={`${dateGroup.dateStr}-${ledger.patient_token}`}
                      className={`bg-white rounded-2xl border ${
                        isNewBill ? "border-red-300 shadow-sm shadow-red-500/10" : "border-gray-150 shadow-xs"
                      } overflow-hidden transition-all`}
                    >
                      {/* Patient Card Header */}
                      <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-gray-900">{ledger.patient_name}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                {ledger.patient_token}
                              </span>
                              {isNewBill && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> NEW BILL
                                </span>
                              )}
                            </div>
                            {ledger.patient_phone && (
                              <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Phone: {ledger.patient_phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-5">
                          <div className="flex items-center gap-5 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">Date Billed</span>
                              <span className="font-extrabold text-gray-900">₹{ledger.dateTotal.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Dues</span>
                              <span className={`font-black ${hasDues ? "text-amber-600" : "text-emerald-600"}`}>
                                ₹{ledger.outstanding_balance.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Record Payment Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(ledger, ledger.dateTotal)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer flex items-center gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Record Payment
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpand(ledger.patient_token)}
                              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 border-none cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Items for this Date */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-slate-50/50 p-4.5 space-y-2.5">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Items Billed on {dateGroup.dateStr}
                          </h4>

                          <div className="space-y-2">
                            {ledger.dateItems.map((item) => {
                              const formattedTime = item.date
                                ? new Date(item.date).toLocaleTimeString("en-IN", {
                                    hour: "2-digit", minute: "2-digit", hour12: true
                                  })
                                : "—";
                              const isReceiptLoading = loadingReceiptId === item.id;

                              return (
                                <div
                                  key={item.id}
                                  className="bg-white p-3.5 rounded-xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      {getSourceBadge(item.source_type)}
                                      <span className="font-bold text-xs text-gray-900">{item.title}</span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-gray-500">
                                      Doctor: <strong className="text-gray-700">{item.doctor_name}</strong> · {formattedTime}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                    <span className="text-sm font-black text-gray-900">₹{item.amount.toLocaleString()}</span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        item.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {item.status || "Pending"}
                                    </span>
                                    {item.id.startsWith("br-") && (
                                      <button
                                        type="button"
                                        onClick={() => handleViewReceipt(item)}
                                        disabled={isReceiptLoading}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg border-none cursor-pointer transition-all disabled:opacity-50 whitespace-nowrap"
                                      >
                                        {isReceiptLoading ? (
                                          <span className="animate-pulse">Loading…</span>
                                        ) : (
                                          <>
                                            <Receipt className="w-3 h-3" /> View Receipt
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedLedger && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">Record Payment</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Patient: {selectedLedger.patient_name} ({selectedLedger.patient_token})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLedger(null)}
                className="text-gray-400 hover:text-gray-600 font-black text-lg border-none bg-transparent cursor-pointer"
              >
                ×
              </button>
            </div>

            {paymentSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900">{paymentSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Amount Due / Bill Total
                  </label>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-base font-black">
                    ₹{selectedLedger.outstanding_balance > 0 ? selectedLedger.outstanding_balance.toLocaleString() : selectedLedger.total_charges.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Payment Option / Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                  >
                    <option value="Cash">Cash Payment</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Transaction Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TXN-984920428"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedLedger(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs border-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {submittingPayment ? "Recording..." : "Confirm & Settle Payment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />
      )}

      {/* View Case Modal */}
      {viewCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 font-sans text-left">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-indigo-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">External Lab Case Details</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">#{viewCaseModal.id}</h3>
              </div>
              <button 
                onClick={() => setViewCaseModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-semibold text-gray-800">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Patient Name</span>
                  <span className="text-sm font-black text-gray-900">{viewCaseModal.patientName || viewCaseModal.patient_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Ordering Doctor</span>
                  <span className="text-sm font-black text-gray-900">{viewCaseModal.dentistName || viewCaseModal.dentist_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Procedure / Restoration</span>
                  <span className="text-teal-700 font-bold">{viewCaseModal.prostheticType || viewCaseModal.orderCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">External Vendor</span>
                  <span className="text-indigo-700 font-bold">{viewCaseModal.vendor_name || "Apex Dental Lab"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p><strong className="text-gray-500">Tooth Number:</strong> {viewCaseModal.toothNumber || viewCaseModal.tooth_number || "Full Arch"}</p>
                <p><strong className="text-gray-500">Material & Shade:</strong> {viewCaseModal.material || "Zirconia"} (Shade {viewCaseModal.shade || "A2"})</p>
                <p><strong className="text-gray-500">Clinic Arrival Date:</strong> {viewCaseModal.clinicReceivedAt ? new Date(viewCaseModal.clinicReceivedAt).toLocaleString() : "05-Aug-2026"}</p>
                <p><strong className="text-gray-500">External Lab Invoice Amount:</strong> <span className="text-rose-600 font-bold">₹{(viewCaseModal.vendor_invoice_amount || 1200).toLocaleString()}</span></p>
              </div>

              {viewCaseModal.notes && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-900 text-xs">
                  <span className="font-bold block text-[10px] uppercase text-indigo-500">Lab Notes / Instructions:</span>
                  {viewCaseModal.notes}
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setViewCaseModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {generateBillModal && (() => {
        const { vc, clinicCharges, subtotal, discountAmt, taxAmt, grandTotal } = calculateBillTotals();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 font-sans text-left my-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-indigo-50/50">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Accountant Billing Terminal</span>
                  <h3 className="text-lg font-black text-gray-900 mt-0.5 flex items-center gap-2">
                    <span>💳</span> Generate Bill for #{generateBillModal.id}
                  </h3>
                </div>
                <button 
                  onClick={() => setGenerateBillModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFinalizeBillSubmit} className="p-6 space-y-4">
                {/* Header Case Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Patient Name</span>
                    <span className="font-black text-gray-900 text-sm">{generateBillModal.patientName || generateBillModal.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Ordering Doctor</span>
                    <span className="font-black text-gray-900 text-sm">{generateBillModal.dentistName || generateBillModal.dentist_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Procedure</span>
                    <span className="font-bold text-teal-700">{generateBillModal.prostheticType || generateBillModal.orderCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">External Lab</span>
                    <span className="font-bold text-indigo-700">{generateBillModal.vendor_name || "Apex Dental Lab"}</span>
                  </div>
                </div>

                {/* External Lab Invoice Verification */}
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>📑</span> External Lab Vendor Invoice (Reference)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vendor Invoice #</label>
                      <input 
                        type="text" 
                        required
                        value={billingForm.vendorInvoiceNumber}
                        onChange={(e) => setBillingForm({ ...billingForm, vendorInvoiceNumber: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                        placeholder="e.g. LAB-INV-9921"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vendor Invoice Amount (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={billingForm.vendorCost}
                        onChange={(e) => setBillingForm({ ...billingForm, vendorCost: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinic Charges Section */}
                <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                    <span>🏥</span> Clinic Charges & Fees
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Doctor Procedure Fee (₹)</label>
                      <input 
                        type="number" 
                        value={billingForm.doctorFee}
                        onChange={(e) => setBillingForm({ ...billingForm, doctorFee: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Consultation Fee (₹)</label>
                      <input 
                        type="number" 
                        value={billingForm.consultationFee}
                        onChange={(e) => setBillingForm({ ...billingForm, consultationFee: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lab Handling & Material (₹)</label>
                      <input 
                        type="number" 
                        value={billingForm.handlingFee}
                        onChange={(e) => setBillingForm({ ...billingForm, handlingFee: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Extra Charges (₹)</label>
                      <input 
                        type="number" 
                        value={billingForm.extraCharge}
                        onChange={(e) => setBillingForm({ ...billingForm, extraCharge: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Taxes & Discounts */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Discount (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={billingForm.discountPercent}
                      onChange={(e) => setBillingForm({ ...billingForm, discountPercent: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tax / GST (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="50"
                      value={billingForm.taxPercent}
                      onChange={(e) => setBillingForm({ ...billingForm, taxPercent: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
                    />
                  </div>
                </div>

                {/* Calculations Summary Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>External Lab Cost:</span>
                    <span>₹{vc.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Clinic Fees & Charges:</span>
                    <span>₹{clinicCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({billingForm.discountPercent}%):</span>
                      <span>- ₹{discountAmt.toLocaleString()}</span>
                    </div>
                  )}
                  {taxAmt > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Tax / GST ({billingForm.taxPercent}%):</span>
                      <span>+ ₹{taxAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-black">
                    <span className="text-slate-100">Final Patient Payable Amount:</span>
                    <span className="text-emerald-400 text-lg">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      alert(`Billing draft saved for ${generateBillModal.patientName || generateBillModal.patient_name}!`);
                      setGenerateBillModal(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Finalize Bill & Notify Receptionist ↗
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
