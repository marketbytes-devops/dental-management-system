"use client";

import { useState } from "react";

export default function AccountantPayments() {
  const [unpaidInvoices, setUnpaidInvoices] = useState([
    { id: "INV-053", patient: "Aby Thomas", amount: 15000, date: "2026-06-10" },
    { id: "INV-054", patient: "Meera Pillai", amount: 2500, date: "2026-06-09" },
  ]);

  const [paymentLog, setPaymentLog] = useState([
    { id: "TXN-801", invoiceId: "INV-051", patient: "Sneha Joseph", amount: "₹1,200", mode: "UPI", date: "2026-06-11" },
    { id: "TXN-802", invoiceId: "INV-052", patient: "Deepak Kurian", amount: "₹45,000", mode: "Card", date: "2026-06-11" },
  ]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [method, setMethod] = useState("UPI");
  const [txId, setTxId] = useState("");

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert("Please select an unpaid invoice to process.");
      return;
    }
    const inv = unpaidInvoices.find(u => u.id === selectedInvoiceId);
    if (!inv) return;

    // Remove from unpaid
    setUnpaidInvoices(prev => prev.filter(u => u.id !== inv.id));

    // Add to paid transactions log
    const newTx = {
      id: `TXN-${Math.floor(803 + Math.random() * 100)}`,
      invoiceId: inv.id,
      patient: inv.patient,
      amount: `₹${inv.amount.toLocaleString("en-IN")}`,
      mode: method,
      date: new Date().toISOString().split("T")[0]
    };
    setPaymentLog(prev => [newTx, ...prev]);
    setSelectedInvoiceId("");
    setTxId("");
    alert(`Payment recorded successfully for invoice ${inv.id}!`);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Payment Processing Terminal</h1>
        <p className="text-sm text-gray-500 mt-1">Settle open bills, link transaction reference numbers, and record incoming revenues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Terminal Form */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Process Invoice Payment</h3>

          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Select Open Invoice</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="">-- Choose Unpaid Bill --</option>
                {unpaidInvoices.map(u => (
                  <option key={u.id} value={u.id}>{u.id} • {u.patient} (₹{u.amount})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  <option value="UPI">UPI / QR Scan</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Cash">Cash Settle</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Transaction ID / Ref</label>
                <input
                  type="text"
                  placeholder="Reference No."
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
            >
              Post Payment
            </button>
          </form>

          {unpaidInvoices.length === 0 && (
            <p className="text-xs text-gray-400 italic">Excellent! There are no unpaid invoices currently.</p>
          )}
        </div>

        {/* Payment History Log */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Success Transaction Ledger</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Txn ID</th>
                  <th className="py-3 px-2">Invoice</th>
                  <th className="py-3 px-2">Patient Name</th>
                  <th className="py-3 px-2">Mode</th>
                  <th className="py-3 px-2 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paymentLog.map(txn => (
                  <tr key={txn.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{txn.id}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{txn.invoiceId}</td>
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{txn.patient}</td>
                    <td className="py-3.5 px-2 text-xs font-semibold text-primary">{txn.mode}</td>
                    <td className="py-3.5 px-2 text-right font-black text-success">{txn.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
