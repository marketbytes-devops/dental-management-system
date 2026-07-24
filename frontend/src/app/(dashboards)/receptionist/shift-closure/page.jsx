"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, CheckCircle2, AlertTriangle, Send, Loader2, ArrowRight, ShieldCheck, CreditCard, Banknote } from "lucide-react";
import client from "@/services/api";

export default function ReceptionistShiftClosurePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [physicalCash, setPhysicalCash] = useState("");
  const [notes, setNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const res = await client.get("/payment/daily-summary");
      setSummary(res.data);
      setPhysicalCash(res.data.system_cash_total ? res.data.system_cash_total.toString() : "0");
    } catch (err) {
      console.error("Failed to fetch daily collection summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary();
  }, []);

  const systemCash = summary?.system_cash_total || 0;
  const countedCash = parseFloat(physicalCash) || 0;
  const discrepancy = countedCash - systemCash;

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        physical_cash_submitted: countedCash,
        accountant_notes: notes
      };
      const res = await client.post("/payment/shift-handover", payload);
      setSuccessMsg(`Shift handover submitted successfully! Shift Register ID: #${res.data.id}`);
      fetchDailySummary();
    } catch (err) {
      console.error("Failed to submit shift handover", err);
      alert("Failed to submit shift handover register.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">End-of-Day Shift Closure & Handover</h1>
          </div>
          <p className="text-xs text-gray-550 mt-1 font-medium">Reconcile daily counter cash, audit collections, and submit daily register to the Accountant.</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shift Date</div>
          <div className="text-sm font-black text-gray-800">{summary?.shift_date || new Date().toISOString().split('T')[0]}</div>
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

      {loading ? (
        <div className="p-16 flex justify-center text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Summary Cards & Payment Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <span>System Cash Log</span>
                  <Banknote className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">₹{(summary?.system_cash_total || 0).toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 font-semibold">Physical counter cash</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <span>UPI & Online Log</span>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600">₹{(summary?.system_upi_total || 0).toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 font-semibold">Instant bank transfer</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <span>Grand Total</span>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-primary">₹{(summary?.system_grand_total || 0).toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 font-semibold">{summary?.total_transactions || 0} counter transactions</div>
              </div>
            </div>

            {/* Today's Transactions Log Table */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50/70 border-b border-gray-150 flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Today's Counter Payment Logs</h3>
                <span className="text-xs font-bold text-gray-500">{summary?.payments?.length || 0} Entries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                    <tr>
                      <th className="p-3">Patient & Token</th>
                      <th className="p-3">Assigned Doctor</th>
                      <th className="p-3 text-center">Payment Mode</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {!summary?.payments || summary.payments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-gray-400 font-semibold">
                          No payments recorded during this shift.
                        </td>
                      </tr>
                    ) : (
                      summary.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-gray-900">{p.patient_name || p.patient_token || `Appt #${p.appointment_id}`}</td>
                          <td className="p-3 text-gray-600">{p.doctor_name || "General Doctor"}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full ${
                              (p.payment_method || "").toLowerCase() === "cash"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {p.payment_method || "Cash"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-gray-900">₹{(p.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Shift Handoff Submission Form */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Send className="w-4 h-4 text-emerald-600" />
              Submit Handoff Register to Accountant
            </h3>

            <form onSubmit={handleSubmitHandover} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Physical Cash Counted in Drawer (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={physicalCash}
                  onChange={(e) => setPhysicalCash(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Discrepancy Box */}
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
                  placeholder="e.g. ₹200 cash shortage due to change deficit; verified with shift lead."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit Handoff to Accountant</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
