"use client";

import { useState } from "react";

export default function AccountantClaims() {
  const [claims, setClaims] = useState([
    { id: "CLM-901", patient: "Sneha Joseph", provider: "Star Health", amount: "₹8,000", filedDate: "2026-06-10", status: "Approved" },
    { id: "CLM-902", patient: "Deepak Kurian", provider: "HDFC Ergo", amount: "₹15,000", filedDate: "2026-06-11", status: "Sent" },
    { id: "CLM-903", patient: "Maria George", provider: "Niva Bupa", amount: "₹4,500", filedDate: "2026-06-08", status: "Rejected" },
  ]);

  const [form, setForm] = useState({
    patient: "",
    provider: "Star Health",
    amount: ""
  });

  const handleSubmitClaim = (e) => {
    e.preventDefault();
    if (!form.patient || !form.amount) {
      alert("Please fill in patient name and claim amount.");
      return;
    }
    const newClaim = {
      id: `CLM-${Math.floor(904 + Math.random() * 100)}`,
      patient: form.patient,
      provider: form.provider,
      amount: `₹${Number(form.amount).toLocaleString("en-IN")}`,
      filedDate: new Date().toISOString().split("T")[0],
      status: "Sent"
    };
    setClaims(prev => [newClaim, ...prev]);
    setForm({ patient: "", provider: "Star Health", amount: "" });
    alert("Insurance claim dispatch complete!");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Insurance Claims</h1>
        <p className="text-sm text-gray-500 mt-1">Submit procedure pre-auths and verify claim payment status logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Claim filing form */}
        <form onSubmit={handleSubmitClaim} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">File Insurance Claim</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
            <input
              type="text"
              placeholder="e.g. Deepak Kurian"
              value={form.patient}
              onChange={(e) => setForm(prev => ({ ...prev, patient: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Insurance Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              <option value="Star Health">Star Health Insurance</option>
              <option value="HDFC Ergo">HDFC Ergo Wellness</option>
              <option value="Niva Bupa">Niva Bupa Health</option>
              <option value="Care Health">Care Health Insurance</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Claim Amount (₹)</label>
            <input
              type="number"
              placeholder="Amount to claim"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Submit Claim File
          </button>
        </form>

        {/* Claim Log List */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Submitted Claims Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Claim ID</th>
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Insurance Partner</th>
                  <th className="py-3 px-2">Claim Amount</th>
                  <th className="py-3 px-2">Filed Date</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map(claim => (
                  <tr key={claim.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{claim.id}</td>
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{claim.patient}</td>
                    <td className="py-3.5 px-2 text-xs text-gray-500 font-semibold">{claim.provider}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-750 font-bold">{claim.amount}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-400">{claim.filedDate}</td>
                    <td className="py-3.5 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        claim.status === "Approved" ? "bg-success/10 text-success" :
                        claim.status === "Sent" ? "bg-primary/10 text-primary animate-pulse" : "bg-danger/10 text-danger"
                      }`}>
                        {claim.status}
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
