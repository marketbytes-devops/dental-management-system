"use client";

import { useState } from "react";

export default function ReceptionistSupport() {
  const [tickets, setTickets] = useState([
    { id: 1001, patient: "Rahul Kumar", subject: "Reschedule request for RCT", date: "2026-06-11", status: "Open" },
    { id: 1002, patient: "Meera Pillai", subject: "Post-extraction instructions query", date: "2026-06-10", status: "Resolved" },
    { id: 1003, patient: "Rohan Varma", subject: "Inquiry on insurance pre-auth", date: "2026-06-09", status: "Open" },
  ]);

  const handleResolve = (id) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Support Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">Review reschedule requests, general enquiries, and support updates.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Support Operations Board</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Ticket ID</th>
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Subject / Inquiry</th>
                <th className="py-3 px-2">Received Date</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map(t => (
                <tr key={t.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-450 font-bold">#{t.id}</td>
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{t.patient}</td>
                  <td className="py-3.5 px-2 text-gray-650">{t.subject}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{t.date}</td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      t.status === "Open" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    {t.status === "Open" && (
                      <button
                        onClick={() => handleResolve(t.id)}
                        className="px-2.5 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Resolve Ticket
                      </button>
                    )}
                    {t.status === "Resolved" && (
                      <span className="text-xs text-gray-400 font-semibold">Archived</span>
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
