"use client";

import { useState } from "react";

export default function AccountantInvoices() {
  const [invoices, setInvoices] = useState([
    { id: "INV-051", patient: "Sneha Joseph", amount: "₹1,200", date: "2026-06-11", status: "Paid" },
    { id: "INV-052", patient: "Deepak Kurian", amount: "₹45,000", date: "2026-06-11", status: "Paid" },
    { id: "INV-053", patient: "Aby Thomas", amount: "₹15,000", date: "2026-06-10", status: "Unpaid" },
    { id: "INV-054", patient: "Meera Pillai", amount: "₹2,500", date: "2026-06-09", status: "Unpaid" },
  ]);

  const [form, setForm] = useState({
    patient: "",
    procedure: "Consultation",
    customAmount: "500",
  });

  const procedures = [
    { name: "Consultation", fee: "500" },
    { name: "Scaling & Polishing", fee: "1200" },
    { name: "Dental Filling", fee: "1500" },
    { name: "Root Canal Treatment", fee: "8000" },
    { name: "Zirconia Crown Fitting", fee: "15000" },
    { name: "Surgical Extraction", fee: "5000" },
  ];

  const handleProcedureChange = (e) => {
    const pName = e.target.value;
    const proc = procedures.find(p => p.name === pName);
    setForm(prev => ({ ...prev, procedure: pName, customAmount: proc ? proc.fee : "0" }));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!form.patient || !form.customAmount) {
      alert("Please fill in patient name and amount.");
      return;
    }

    const newInvoice = {
      id: `INV-${String(invoices.length + 51).padStart(3, "0")}`,
      patient: form.patient,
      amount: `₹${Number(form.customAmount).toLocaleString("en-IN")}`,
      date: new Date().toISOString().split("T")[0],
      status: "Unpaid"
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setForm({ patient: "", procedure: "Consultation", customAmount: "500" });
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Invoice Management</h1>
        <p className="text-sm text-gray-500 mt-1">Generate dental invoice drafts, calculate procedure items, and check bill statuses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Invoice Form */}
        <form onSubmit={handleCreateInvoice} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Create Dental Invoice</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
            <input
              type="text"
              placeholder="e.g. Aby Thomas"
              value={form.patient}
              onChange={(e) => setForm(prev => ({ ...prev, patient: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Procedure Category</label>
            <select
              value={form.procedure}
              onChange={handleProcedureChange}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              {procedures.map(p => (
                <option key={p.name} value={p.name}>{p.name} (₹{p.fee})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Total Bill Amount (₹)</label>
            <input
              type="number"
              value={form.customAmount}
              onChange={(e) => setForm(prev => ({ ...prev, customAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Create Invoice
          </button>
        </form>

        {/* Invoice List */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Invoice Log Ledger</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Invoice ID</th>
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Total Bill</th>
                  <th className="py-3 px-2">Issued Date</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-450 font-bold">{inv.id}</td>
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{inv.patient}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-700">{inv.amount}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{inv.date}</td>
                    <td className="py-3.5 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        inv.status === "Paid" ? "bg-success/10 text-success" : "bg-danger/10 text-danger animate-pulse"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
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
