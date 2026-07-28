"use client";

import React, { useState, useEffect, useRef } from "react";
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
  X
} from "lucide-react";
import { getPatientLedgers, createPayment, getReceipt } from "@/services/api";

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
            .info-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #374151; }
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
            .tag { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
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

  // Format working hours as a readable string
  const workingHoursText = (() => {
    const wh = receiptData.doctor_working_hours || {};
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todaySchedule = wh[today];
    if (todaySchedule && !todaySchedule.is_off) {
      return `${todaySchedule.start || "09:00 AM"} – ${todaySchedule.end || "06:00 PM"}`;
    }
    // Find any weekday
    const anyDay = Object.entries(wh).find(([, v]) => !v.is_off);
    if (anyDay) return `${anyDay[1].start || "09:00 AM"} – ${anyDay[1].end || "06:00 PM"}`;
    return "Mon – Sat: 9:00 AM – 6:00 PM";
  })();

  const statusClass = receiptData.status?.toLowerCase() === "paid" ? "status-paid" : "status-pending";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Top toolbar (not printed) */}
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

        {/* Printable Receipt Content */}
        <div ref={printRef} className="p-8 space-y-6">
          {/* Clinic Header */}
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

          {/* Patient & Doctor Info */}
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
              <div className="section-title text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Consulting Doctor</div>
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
              <div className="info-row flex justify-between text-xs py-1">
                <span className="info-label text-gray-500">Specialty</span>
                <span className="info-val font-semibold text-gray-700">General Dentistry</span>
              </div>
            </div>
          </div>

          {/* Charges Table */}
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
                {/* Consultation Row */}
                <tr className="text-xs">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="tag px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black">Consultation</span>
                      <span className="font-bold text-gray-900">Clinical Consultation</span>
                    </div>
                    {receiptData.notes && (
                      <p className="text-[10px] text-gray-400 mt-1 italic">{receiptData.notes}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-500">—</td>
                  <td className="py-3 px-3 text-right font-black text-gray-900">
                    ₹{receiptData.consultation_fee.toLocaleString()}
                  </td>
                </tr>

                {/* Medicine rows */}
                {receiptData.medications && receiptData.medications.length > 0 && (
                  receiptData.medications.map((med, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="tag px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black">Medicine</span>
                          <span className="font-bold text-gray-900">{med.medicine}</span>
                        </div>
                        {!med.found_in_inventory && (
                          <p className="text-[9px] text-amber-600 italic mt-0.5">Price not in inventory – not billed</p>
                        )}
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

          {/* Totals */}
          <div className="total-section border-t border-gray-200 pt-4 space-y-1">
            <div className="total-row flex justify-between text-xs text-gray-600 py-0.5">
              <span>Consultation Fee</span>
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

          {/* Footer */}
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
// Accountant Billing Page
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

  // Receipt state
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState(null);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const data = await getPatientLedgers();
      setLedgers(data);
      const initialExpanded = {};
      data.forEach((l) => {
        if (l.outstanding_balance > 0) {
          initialExpanded[l.patient_token] = true;
        }
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
  }, []);

  const toggleExpand = (token) => {
    setExpandedTokens((prev) => ({ ...prev, [token]: !prev[token] }));
  };

  const handleOpenPaymentModal = (ledger) => {
    setSelectedLedger(ledger);
    setPaymentAmount(ledger.outstanding_balance > 0 ? ledger.outstanding_balance.toString() : "");
    setPaymentMethod("UPI");
    setTransactionId("");
    setPaymentSuccess("");
  };

  const handleViewReceipt = async (item) => {
    // Extract numeric billing request ID from item.id (format: "br-123")
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
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || `TXN-${Date.now()}`,
        type: "Payment"
      });

      setPaymentSuccess("Payment recorded successfully!");
      setTimeout(() => {
        setSelectedLedger(null);
        fetchLedgers();
      }, 1000);
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

  const totalChargesAll = ledgers.reduce((acc, curr) => acc + (curr.total_charges || 0), 0);
  const totalPaidAll = ledgers.reduce((acc, curr) => acc + (curr.total_paid || 0), 0);
  const totalOutstandingAll = ledgers.reduce((acc, curr) => acc + (curr.outstanding_balance || 0), 0);

  const getSourceBadge = (sourceType) => {
    const src = (sourceType || "consultation").toLowerCase();
    if (src === "consultation") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Consultation
        </span>
      );
    }
    if (src === "treatment") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <Tag className="w-3 h-3" /> Treatment
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
      <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-[9px] font-black uppercase tracking-wider">
        {src}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Billing & Payments</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Consultation charges, treatments, and lab orders stacked per patient. Click any row to view its receipt.
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

      {/* Patient Ledgers */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400 bg-white rounded-2xl border border-gray-150">
            Loading patient ledgers...
          </div>
        ) : filteredLedgers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-150 space-y-2">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No billing ledgers found</p>
          </div>
        ) : (
          filteredLedgers.map((ledger) => {
            const isExpanded = !!expandedTokens[ledger.patient_token];
            const hasDues = ledger.outstanding_balance > 0;

            return (
              <div key={ledger.patient_token} className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
                {/* Patient Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-gray-900">{ledger.patient_name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{ledger.patient_token}</span>
                      </div>
                      {ledger.patient_phone && (
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Phone: {ledger.patient_phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Charges</span>
                        <span className="font-extrabold text-gray-900">₹{ledger.total_charges.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Paid</span>
                        <span className="font-extrabold text-emerald-600">₹{ledger.total_paid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Outstanding</span>
                        <span className={`font-black ${hasDues ? "text-amber-600" : "text-emerald-600"}`}>
                          ₹{ledger.outstanding_balance.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPaymentModal(ledger)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Record Payment
                      </button>
                      <button
                        onClick={() => toggleExpand(ledger.patient_token)}
                        className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 border-none cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stacked Items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-slate-50/50 p-5 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Visit & Service Charges</h4>

                    <div className="space-y-2">
                      {ledger.stacked_items.map((item) => {
                        const formattedDate = item.date
                          ? new Date(item.date).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit", hour12: true
                            })
                          : "—";
                        const isReceiptLoading = loadingReceiptId === item.id;

                        return (
                          <div key={item.id} className="bg-white p-3.5 rounded-xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {getSourceBadge(item.source_type)}
                                <span className="font-bold text-xs text-gray-900">{item.title}</span>
                              </div>
                              <p className="text-[11px] font-semibold text-gray-500">
                                Doctor: <strong className="text-gray-700">{item.doctor_name}</strong> · {formattedDate}
                              </p>
                              {item.notes && (
                                <p className="text-[10px] text-gray-400 italic">{item.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                              <span className="text-sm font-black text-gray-900">₹{item.amount.toLocaleString()}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                {item.status || "Pending"}
                              </span>
                              {/* View Receipt only for billing_request items */}
                              {item.id.startsWith("br-") && (
                                <button
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

                    {/* Payment history */}
                    {ledger.payments && ledger.payments.length > 0 && (
                      <div className="pt-3 border-t border-gray-150 space-y-1">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Payment Transactions</h5>
                        {ledger.payments.map((p) => (
                          <div key={p.id} className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 flex justify-between">
                            <span>Payment via <strong>{p.payment_method}</strong> ({p.transaction_id || "Auto"})</span>
                            <span className="font-black">+ ₹{p.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedLedger && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">Record Payment</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Patient: {selectedLedger.patient_name} ({selectedLedger.patient_token})
                </p>
              </div>
              <button onClick={() => setSelectedLedger(null)} className="text-gray-400 hover:text-gray-600 font-black text-lg border-none bg-transparent cursor-pointer">×</button>
            </div>

            {paymentSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900">{paymentSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Outstanding Balance</label>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-base font-black">
                    ₹{selectedLedger.outstanding_balance.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Amount (₹)</label>
                  <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none">
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Insurance">Insurance Claim</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Transaction ID (Optional)</label>
                  <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. UPI-984920428"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setSelectedLedger(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submittingPayment}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs border-none cursor-pointer disabled:opacity-50">
                    {submittingPayment ? "Recording..." : "Confirm Payment"}
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
    </div>
  );
}
