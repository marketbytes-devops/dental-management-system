"use client";

import { useState, useEffect } from "react";
import { Receipt, Download, Loader2, IndianRupee, TrendingUp, Calendar as CalIcon, Send, Banknote, CreditCard, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import client from "@/services/api";

export default function ReceptionistTransactions() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("today"); // "today" | "yesterday" | "this_month" | "month"
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [physicalCash, setPhysicalCash] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchDailySummary = async (type = filterType, monthVal = selectedMonth) => {
    try {
      setIsLoading(true);
      let url = `/payment/daily-summary?filter_type=${type}`;
      if (type === "month" && monthVal) {
        url += `&month_str=${monthVal}`;
      }
      const res = await client.get(url);
      setSummary(res.data);
      setPhysicalCash(res.data.system_cash_total ? res.data.system_cash_total.toString() : "0");
    } catch (e) {
      console.error("Error loading daily summary:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary(filterType, selectedMonth);
  }, [filterType, selectedMonth]);

  const systemCash = summary?.system_cash_total || 0;
  const countedCash = parseFloat(physicalCash) || 0;
  const discrepancy = countedCash - systemCash;

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        physical_cash_submitted: countedCash,
        accountant_notes: notes,
        shift_date: summary?.shift_date
      };
      const res = await client.post("/payment/shift-handover", payload);
      setSuccessMsg(`Transaction Ledger for ${summary?.shift_date || 'Shift'} submitted to Accountant! Register ID: #${res.data.id}`);
      setIsHandoverModalOpen(false);
      fetchDailySummary(filterType, selectedMonth);
    } catch (err) {
      console.error("Failed to submit shift handover", err);
      alert("Failed to submit shift handover register.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const payments = summary?.payments || [];
    if (payments.length === 0) {
      alert("No transactions to export.");
      return;
    }
    
    const headers = ["ID", "Patient Name", "Token ID", "Phone", "Doctor", "Treatment", "Payment Method", "Ref ID", "Amount", "Timestamp"];
    const rows = payments.map(p => [
      p.id,
      `"${p.patient_name || ''}"`,
      p.patient_token || '',
      p.patient_phone || '',
      `"${p.doctor_name || ''}"`,
      `"${p.treatment_type || ''}"`,
      p.payment_method || 'Cash',
      p.razorpay_payment_id || p.razorpay_order_id || `TXN-${p.id}`,
      p.amount,
      p.created_at || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_ledger_${filterType}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Consultation Charge Ledger & Handover</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
            <CalIcon className="w-4 h-4 text-emerald-600" />
            {todayStr} • Frontdesk Consultation Billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => setIsHandoverModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send Ledger to Accountant
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setFilterType("today")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "today"
                ? "bg-white text-emerald-800 shadow-sm border border-gray-200 font-extrabold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterType("yesterday")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "yesterday"
                ? "bg-white text-emerald-800 shadow-sm border border-gray-200 font-extrabold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setFilterType("this_month")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "this_month"
                ? "bg-white text-emerald-800 shadow-sm border border-gray-200 font-extrabold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            This Month
          </button>
        </div>

        {/* Custom Month Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setFilterType("month");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none bg-white transition-all cursor-pointer ${
              filterType === "month"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 font-extrabold"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>By Cash</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{(summary?.system_cash_total || 0).toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 font-semibold">Physical counter cash collected</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>By UPI / Online</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">₹{(summary?.system_upi_total || 0).toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 font-semibold">UPI, GPay & online transfers</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>By Card</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">₹{(summary?.system_card_total || 0).toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 font-semibold">POS card & digital swipe logs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>Total Collected</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary">₹{(summary?.system_grand_total || 0).toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 font-semibold">{summary?.payments?.length || 0} Total Token Receipts Issued</div>
        </div>
      </div>

      {/* Detailed Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
              <Receipt className="w-5 h-5 text-gray-400" /> Consultation & Token Fee Receipts Ledger
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Line-item transaction records with date/time, patient details, fee types & reference IDs</p>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
            {summary?.payments?.length || 0} Token Receipts
          </span>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading transaction ledger...
          </div>
        ) : !summary?.payments || summary.payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Receipt className="w-10 h-10 mb-4 opacity-20" />
            <p className="text-sm font-semibold">No token issue charges recorded for this period.</p>
            <p className="text-xs text-gray-400 mt-1">Check back once patient booking & consultation fees are processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Patient Identification</th>
                  <th className="px-6 py-3.5">Consulting Doctor & Department</th>
                  <th className="px-6 py-3.5">Type of Consultation Fee</th>
                  <th className="px-6 py-3.5">Payment Mode & Ref ID</th>
                  <th className="px-6 py-3.5 text-right">Fee Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {summary.payments.map((p) => {
                  const pmLower = (p.payment_method || "").toLowerCase();
                  const isCash = pmLower.includes("cash") || pmLower.includes("counter");
                  const isCard = pmLower.includes("card") || pmLower.includes("pos");
                  const refId = p.razorpay_payment_id || p.razorpay_order_id || `TXN-${p.id || '101'}`;
                  const category = p.tariff_category || "General Consultation";

                  const isFollowup = category === "Follow-up Checkup";
                  const isSpecialist = category === "Specialist Consultation";

                  const dateFormatted = p.created_at
                    ? new Date(p.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                    : "Today";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-xs">{dateFormatted}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">Receipt #{p.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-gray-900 text-sm">{p.patient_name || "Patient"}</div>
                        <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
                          Token: <span className="font-mono text-gray-800 font-bold">{p.patient_token || `PT-${p.appointment_id}`}</span> • Ph: {p.patient_phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 text-sm">{p.doctor_name || "General Doctor"}</div>
                        <div className="text-xs text-gray-400">{p.treatment_type || "Consultation"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          isSpecialist
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : isFollowup
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isCash
                            ? "bg-emerald-100 text-emerald-800"
                            : isCard
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {p.payment_method || "Cash"}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">Ref: {refId}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-gray-900 text-base">₹{(p.amount || 0).toLocaleString()}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Ledger to Accountant Modal */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" /> Send Ledger to Accountant
                </h3>
                <p className="text-xs text-gray-500">End-of-day cash drawer reconciliation</p>
              </div>
              <button onClick={() => setIsHandoverModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} className="space-y-4 text-left">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">System Cash Total:</span>
                  <span className="font-bold text-emerald-600">₹{systemCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">UPI & Card Total:</span>
                  <span className="font-bold text-blue-600">₹{((summary?.system_upi_total || 0) + (summary?.system_card_total || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-gray-700 font-bold">Grand Total Collection:</span>
                  <span className="font-extrabold text-slate-900">₹{(summary?.system_grand_total || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Physical Cash Counted in Drawer (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={physicalCash}
                  onChange={(e) => setPhysicalCash(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                discrepancy === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : discrepancy < 0
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <div>
                  <div className="font-bold uppercase text-[10px]">Calculated Cash Discrepancy</div>
                  <div className="text-base font-black">
                    {discrepancy === 0 ? "₹0.00 (Balanced)" : `₹${discrepancy.toFixed(2)}`}
                  </div>
                </div>
                {discrepancy !== 0 && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Shift Notes for Accountant (Optional)</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Counter cash balanced. Total 12 consultation payments collected."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-gray-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit to Accountant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

