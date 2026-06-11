"use client";

import { useState } from "react";

export default function AccountantPayroll() {
  const [payroll, setPayroll] = useState([
    { id: 1, name: "Dr. Anoop Nair", role: "Sr. Dentist", base: 120000, incentive: 35000, status: "Paid" },
    { id: 2, name: "Dr. Priya Varma", role: "Orthodontist", base: 110000, incentive: 45000, status: "Pending" },
    { id: 3, name: "Sneha Thomas", role: "Receptionist", base: 25000, incentive: 2000, status: "Paid" },
    { id: 4, name: "Alen Joseph", role: "Lab Tech", base: 35000, incentive: 5000, status: "Pending" },
  ]);

  const handlePay = (id) => {
    setPayroll(prev => prev.map(p => p.id === id ? { ...p, status: "Paid" } : p));
    alert("Payroll payout processed successfully.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Staff Payroll Center</h1>
        <p className="text-sm text-gray-500 mt-1">Review basic salary brackets, dental splits/incentives, and release payments.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Payroll Ledger Sheet</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Staff Member</th>
                <th className="py-3 px-2">Clinic Role</th>
                <th className="py-3 px-2">Base Salary</th>
                <th className="py-3 px-2">Incentive Splits</th>
                <th className="py-3 px-2 font-black">Total Net Pay</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payroll.map(p => {
                const total = p.base + p.incentive;
                return (
                  <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-3.5 px-2 text-xs text-gray-500 font-medium">{p.role}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-700">₹{p.base.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-success font-medium">+₹{p.incentive.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2 font-mono text-xs font-black text-gray-900">₹{total.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        p.status === "Paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {p.status === "Pending" && (
                        <button
                          onClick={() => handlePay(p.id)}
                          className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Release Pay
                        </button>
                      )}
                      {p.status === "Paid" && (
                        <span className="text-xs text-gray-450 font-semibold">Disbursed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
