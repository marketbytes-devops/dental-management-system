"use client";

import { useState } from "react";

export default function AccountantDues() {
  const [dues, setDues] = useState([
    { id: 1, name: "Aby Thomas", phone: "+91 77665 54433", amount: "₹15,000", dueSince: "2026-06-01", status: "Overdue" },
    { id: 2, name: "Meera Pillai", phone: "+91 55443 32211", amount: "₹2,500", dueSince: "2026-06-05", status: "Overdue" },
  ]);

  const handleSendReminder = (name) => {
    alert(`Reminder SMS/Email sent to ${name} regarding their outstanding dues.`);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Outstanding Patient Dues</h1>
        <p className="text-sm text-gray-500 mt-1">Review ledger accounts with unpaid balances and dispatch billing notifications.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Aged accounts receivable</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Patient Details</th>
                <th className="py-3 px-2">Phone No</th>
                <th className="py-3 px-2">Pending Due Since</th>
                <th className="py-3 px-2">Outstanding Dues</th>
                <th className="py-3 px-2">Arrears Status</th>
                <th className="py-3 px-2 text-right">Dunning Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dues.map(d => (
                <tr key={d.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{d.name}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{d.phone}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{d.dueSince}</td>
                  <td className="py-3.5 px-2 font-mono text-xs font-bold text-danger">{d.amount}</td>
                  <td className="py-3.5 px-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-danger/10 text-danger animate-pulse">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleSendReminder(d.name)}
                      className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      Remind Patient
                    </button>
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
