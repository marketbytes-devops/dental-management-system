"use client";

import { useState } from "react";

export default function AccountantRevenue() {
  const [breakdown, setBreakdown] = useState([
    { category: "Consultations", count: 85, amount: "₹42,500" },
    { category: "Scaling & Cleaning", count: 42, amount: "₹50,400" },
    { category: "Endodontics (RCT)", count: 20, amount: "₹1,60,000" },
    { category: "Prosthodontics (Crowns)", count: 12, amount: "₹1,80,000" },
    { category: "Extractions", count: 15, amount: "₹49,100" },
  ]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Revenue Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Audit daily collections and analyze procedure-wise earnings breakdowns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase">Gross Monthly Billing</span>
          <h3 className="text-2xl font-black text-gray-800 mt-1">₹4,82,000</h3>
          <p className="text-xs text-success font-semibold mt-2">↑ 8% vs average target</p>
        </div>
        <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase">Net Realized Collection</span>
          <h3 className="text-2xl font-black text-gray-800 mt-1">₹4,64,500</h3>
          <p className="text-xs text-gray-450 mt-2">96.3% realization score</p>
        </div>
        <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase">Aged Accounts Receivable</span>
          <h3 className="text-2xl font-black text-danger mt-1">₹17,500</h3>
          <p className="text-xs text-danger font-semibold mt-2">Follow-up actions needed</p>
        </div>
      </div>

      {/* Breakdown Board */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-extrabold text-gray-900 mb-4">Procedure-wise Revenue Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Procedure Category</th>
                <th className="py-3 px-2">Cases Billed</th>
                <th className="py-3 px-2 text-right">Sum Total Collections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {breakdown.map((b, idx) => (
                <tr key={idx} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{b.category}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{b.count} cases</td>
                  <td className="py-3.5 px-2 text-right font-black text-success">{b.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
