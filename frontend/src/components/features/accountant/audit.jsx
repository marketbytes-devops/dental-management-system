"use client";

import { useState } from "react";

export default function AccountantAudit() {
  const [logs, setLogs] = useState([
    { id: 1, action: "Payment Settle Success", details: "Invoice INV-051 marked Paid via UPI", user: "Accountant (Sneha)", time: "2026-06-11 11:45 AM" },
    { id: 2, action: "Invoice Creation", details: "Invoice INV-053 drafted for Aby Thomas (₹15,000)", user: "Accountant (Sneha)", time: "2026-06-10 03:00 PM" },
    { id: 3, action: "Refund Released", details: "Approved refund RFD-010 for ₹1,500 to Aby Thomas", user: "Admin User", time: "2026-06-09 10:30 AM" },
  ]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Billing Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Review read-only log history of transaction edits, invoice postings, and refund audits.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">System Transaction Log</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Log ID</th>
                <th className="py-3 px-2">Event Action</th>
                <th className="py-3 px-2">Audit Detail</th>
                <th className="py-3 px-2">Authorized By</th>
                <th className="py-3 px-2 text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-450 font-bold">#{log.id}</td>
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{log.action}</td>
                  <td className="py-3.5 px-2 text-xs text-gray-650">{log.details}</td>
                  <td className="py-3.5 px-2 text-xs font-medium text-primary">{log.user}</td>
                  <td className="py-3.5 px-2 text-right font-mono text-xs text-gray-400">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
