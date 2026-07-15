"use client";

import { useState } from "react";

export default function AccountantReports() {
  const [reports, setReports] = useState([
    { id: 1, name: "Income Statement Q1", type: "P&L Report", date: "2026-03-31" },
    { id: 2, name: "Dental Consumables Inventory Audit", type: "Asset Valuation", date: "2026-04-15" },
    { id: 3, name: "GST Tax Ledger May", type: "Tax Report", date: "2026-05-31" },
  ]);

  const handleExport = (name) => {
    alert(`Exporting document "${name}" in PDF and Excel formats...`);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Financial Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Review balance sheets, profit/loss statements, and export tax reports.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Report Archive</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Report Document Name</th>
                <th className="py-3 px-2">Category Type</th>
                <th className="py-3 px-2">Generation Date</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map(rep => (
                <tr key={rep.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{rep.name}</td>
                  <td className="py-3.5 px-2 text-xs text-gray-500 font-medium">{rep.type}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-450">{rep.date}</td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleExport(rep.name)}
                      className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      Export File
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
