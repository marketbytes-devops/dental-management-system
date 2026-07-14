"use client";

import { useState } from "react";

export default function AccountantExpenses() {
  const [expenses, setExpenses] = useState([
    { id: "EXP-301", description: "Apex Dental Lab (Custom Crowns)", category: "Lab Fees", amount: "₹18,500", date: "2026-06-10" },
    { id: "EXP-302", description: "Surgical glove batches & masks", category: "Supplies", amount: "₹4,200", date: "2026-06-11" },
    { id: "EXP-303", description: "Water and electricity utilities", category: "Utilities", amount: "₹12,000", date: "2026-06-05" },
  ]);

  const [form, setForm] = useState({
    desc: "",
    cat: "Lab Fees",
    amt: ""
  });

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!form.desc || !form.amt) {
      alert("Please enter description and amount.");
      return;
    }
    const newExp = {
      id: `EXP-${Math.floor(304 + Math.random() * 100)}`,
      description: form.desc,
      category: form.cat,
      amount: `₹${Number(form.amt).toLocaleString("en-IN")}`,
      date: new Date().toISOString().split("T")[0]
    };
    setExpenses(prev => [newExp, ...prev]);
    setForm({ desc: "", cat: "Lab Fees", amt: "" });
    alert("Expense voucher saved successfully.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Expense Management</h1>
        <p className="text-sm text-gray-500 mt-1">Log external laboratory invoices, clinic supplies, and overhead expenses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleAddExpense} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Add Expense Voucher</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Expense Description</label>
            <input
              type="text"
              placeholder="e.g. Rent, Lab invoice No. #99"
              value={form.desc}
              onChange={(e) => setForm(prev => ({ ...prev, desc: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
              <select
                value={form.cat}
                onChange={(e) => setForm(prev => ({ ...prev, cat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="Lab Fees">Lab Fees</option>
                <option value="Supplies">Clinical Supplies</option>
                <option value="Utilities">Utilities</option>
                <option value="Salaries">Payroll / Salary</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Amount (₹)</label>
              <input
                type="number"
                placeholder="Voucher amount"
                value={form.amt}
                onChange={(e) => setForm(prev => ({ ...prev, amt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Post Expense
          </button>
        </form>

        {/* Expense List */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Expense Ledger Book</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Voucher ID</th>
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Voucher Date</th>
                  <th className="py-3 px-2 text-right">Debit Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(exp => (
                  <tr key={exp.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{exp.id}</td>
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{exp.description}</td>
                    <td className="py-3.5 px-2 text-xs text-gray-500 font-medium">{exp.category}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-450">{exp.date}</td>
                    <td className="py-3.5 px-2 text-right font-black text-danger">{exp.amount}</td>
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
