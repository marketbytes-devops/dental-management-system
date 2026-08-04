"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle, AlertOctagon, Clock, Loader2, FileText, Check, AlertTriangle } from "lucide-react";
import client from "@/services/api";

export default function AccountantReceptionistLedgerPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reconcileStatus, setReconcileStatus] = useState("Reconciled");
  const [accountantNotes, setAccountantNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await client.get("/payment/shift-handovers");
      setShifts(res.data);
    } catch (err) {
      console.error("Failed to fetch shift handovers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const openReconcileModal = (shift) => {
    setSelectedShift(shift);
    setReconcileStatus(shift.discrepancy_amount === 0 ? "Reconciled" : "Discrepancy Flagged");
    setAccountantNotes(shift.accountant_notes || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
  };

  const handleReconcileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShift) return;
    setSubmitting(true);
    try {
      const payload = {
        status: reconcileStatus,
        accountant_notes: accountantNotes
      };
      await client.put(`/payment/shift-handover/${selectedShift.id}/reconcile`, payload);
      closeModal();
      fetchShifts();
    } catch (err) {
      console.error("Failed to reconcile shift handover", err);
      alert("Failed to reconcile shift handover");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Receptionist Ledger</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Audit daily front-desk Receptionist shift closures, verify physical cash submitted, and post reconciled registers.
          </p>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                <tr>
                  <th className="p-4">Shift ID & Date</th>
                  <th className="p-4">Receptionist</th>
                  <th className="p-4 text-right">Total Collected (₹)</th>
                  <th className="p-4 text-right">System Cash Log (₹)</th>
                  <th className="p-4 text-right">Physical Cash Submitted (₹)</th>
                  <th className="p-4 text-center">Discrepancy</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-400 font-semibold">
                      No shift handover records submitted yet.
                    </td>
                  </tr>
                ) : (
                  shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-black text-gray-900">Shift Register #{s.id}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {s.shift_date}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-800">{s.receptionist_name}</td>
                      <td className="p-4 text-right font-bold text-gray-900">₹{(s.system_grand_total || 0).toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-emerald-600">₹{(s.system_cash_total || 0).toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-gray-900">₹{(s.physical_cash_submitted || 0).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        {s.discrepancy_amount === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <Check className="w-3 h-3" /> Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                            <AlertTriangle className="w-3 h-3" /> ₹{s.discrepancy_amount.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          s.status === "Reconciled"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "Discrepancy Flagged"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openReconcileModal(s)}
                          className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                        >
                          Audit & Reconcile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit & Reconcile Modal */}
      {isModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Audit Shift Register #{selectedShift.id}
                </h3>
                <p className="text-[11px] text-slate-400">Shift Date: {selectedShift.shift_date} • Submitted by {selectedShift.receptionist_name}</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="p-6 space-y-5 text-left overflow-y-auto flex-1">
              
              {/* Financial Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                  <span className="font-bold text-gray-500 block text-[10px] uppercase">System Cash</span>
                  <span className="font-black text-emerald-600 text-base">₹{(selectedShift.system_cash_total || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                  <span className="font-bold text-gray-500 block text-[10px] uppercase">UPI / Online</span>
                  <span className="font-black text-blue-600 text-base">₹{(selectedShift.system_upi_total || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                  <span className="font-bold text-gray-500 block text-[10px] uppercase">By Card</span>
                  <span className="font-black text-purple-600 text-base">₹{(selectedShift.system_card_total || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                  <span className="font-bold text-gray-500 block text-[10px] uppercase">Total Collected</span>
                  <span className="font-black text-gray-900 text-base">₹{(selectedShift.system_grand_total || 0).toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                  <span className="font-bold text-gray-600 block text-[10px] uppercase">Physical Cash</span>
                  <span className="font-black text-gray-900 text-base">₹{(selectedShift.physical_cash_submitted || 0).toLocaleString()}</span>
                </div>
                <div className={`p-3 rounded-xl border text-xs ${selectedShift.discrepancy_amount === 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <span className="font-bold text-gray-500 block text-[10px] uppercase">Discrepancy</span>
                  <span className={`font-black text-base ${selectedShift.discrepancy_amount === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    ₹{selectedShift.discrepancy_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Line-Item Transaction Audit Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden space-y-0">
                <div className="p-3 bg-slate-100 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Line-Item Transaction Audit Trail</span>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedShift.payments?.length || 0} Line Items
                  </span>
                </div>

                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">Patient Details</th>
                        <th className="p-2.5">Doctor & Dept</th>
                        <th className="p-2.5">Payment Method & Ref ID</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {!selectedShift.payments || selectedShift.payments.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-gray-400 text-xs">
                            No individual payment line items found for this shift.
                          </td>
                        </tr>
                      ) : (
                        selectedShift.payments.map((p) => {
                          const isCash = (p.payment_method || "").toLowerCase() === "cash";
                          const isCard = (p.payment_method || "").toLowerCase().includes("card");
                          const refId = p.razorpay_payment_id || p.razorpay_order_id || `TXN-${p.id || '101'}`;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <div className="font-bold text-gray-900">{p.patient_name}</div>
                                <div className="text-[10px] text-gray-500">Token: <span className="font-mono font-bold text-gray-700">{p.patient_token}</span> • Ph: {p.patient_phone}</div>
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-gray-800">{p.doctor_name}</div>
                                <div className="text-[10px] text-gray-400">{p.treatment_type}</div>
                              </td>
                              <td className="p-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  isCash ? "bg-emerald-100 text-emerald-800" : isCard ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                  {p.payment_method || "Cash"}
                                </span>
                                <div className="text-[10px] font-mono text-gray-500 mt-0.5">Ref: {refId}</div>
                              </td>
                              <td className="p-2.5 text-right font-black text-gray-900">
                                ₹{(p.amount || 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reconciliation Action Status</label>
                <select
                  value={reconcileStatus}
                  onChange={(e) => setReconcileStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="Reconciled">Reconciled & Posted to General Ledger</option>
                  <option value="Discrepancy Flagged">Flag Discrepancy (Requires Audit Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Accountant Audit Notes</label>
                <textarea
                  rows="2"
                  value={accountantNotes}
                  onChange={(e) => setAccountantNotes(e.target.value)}
                  placeholder="e.g. Verified physical cash drawer with Receptionist. Verified zero variance."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 shrink-0 border-t border-gray-150">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 font-bold text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Reconciliation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
