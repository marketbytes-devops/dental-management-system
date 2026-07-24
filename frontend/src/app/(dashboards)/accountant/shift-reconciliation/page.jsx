"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle, AlertOctagon, Clock, Loader2, FileText, Check, AlertTriangle } from "lucide-react";
import client from "@/services/api";

export default function AccountantShiftReconciliationPage() {
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/20 text-primary rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </span>
            <h1 className="text-2xl font-black">Accountant Shift Reconciliation Ledger</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
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
                    <td colSpan="7" className="p-8 text-center text-gray-400 font-semibold">
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
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-base font-black flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Audit Shift Register #{selectedShift.id}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="p-6 space-y-4 text-left">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Receptionist:</span>
                  <span className="font-black text-gray-900">{selectedShift.receptionist_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">System Cash Total:</span>
                  <span className="font-black text-emerald-600">₹{(selectedShift.system_cash_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Physical Cash Handed Over:</span>
                  <span className="font-black text-gray-900">₹{(selectedShift.physical_cash_submitted || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1">
                  <span className="font-bold text-gray-500">Net Discrepancy:</span>
                  <span className={`font-black ${selectedShift.discrepancy_amount === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ₹{selectedShift.discrepancy_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reconciliation Action Status</label>
                <select
                  value={reconcileStatus}
                  onChange={(e) => setReconcileStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
                >
                  <option value="Reconciled">Reconciled & Posted to General Ledger</option>
                  <option value="Discrepancy Flagged">Flag Discrepancy (Requires Audit Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Accountant Audit Notes</label>
                <textarea
                  rows="3"
                  value={accountantNotes}
                  onChange={(e) => setAccountantNotes(e.target.value)}
                  placeholder="e.g. Verified physical cash drawer with Receptionist. Verified zero variance."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
