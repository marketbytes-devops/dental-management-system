"use client";

import { useState } from "react";

export default function AccountantRefunds() {
  const [refunds, setRefunds] = useState([
    { id: "RFD-011", name: "Maria George", invoice: "INV-049", amount: "₹500", reason: "Consultation rescheduled", status: "Pending" },
    { id: "RFD-010", name: "Aby Thomas", invoice: "INV-044", amount: "₹1,500", reason: "Overpayment correction", status: "Approved" },
  ]);

  const handleApprove = (id) => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" } : r));
    alert("Refund request approved and bank settlement triggered.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Refund Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Process cancelled procedure refunds and payment reversals.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Active Refund Queue</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Refund ID</th>
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Invoice Ref</th>
                <th className="py-3 px-2">Reversal Amount</th>
                <th className="py-3 px-2">Reason Notes</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {refunds.map(r => (
                <tr key={r.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{r.id}</td>
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{r.name}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{r.invoice}</td>
                  <td className="py-3.5 px-2 font-mono text-xs font-bold text-danger">{r.amount}</td>
                  <td className="py-3.5 px-2 text-xs text-gray-650">{r.reason}</td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      r.status === "Approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    {r.status === "Pending" && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-2.5 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {r.status === "Approved" && (
                      <span className="text-xs text-gray-450 font-semibold">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
