"use client";

import { useState } from "react";

export default function ReceptionistReminders() {
  const [reminders, setReminders] = useState([
    { id: 1, name: "Maria George", date: "2026-06-11", time: "12:45 PM", status: "Sent", auto: true },
    { id: 2, name: "Aby Thomas", date: "2026-06-12", time: "02:00 PM", status: "Pending", auto: true },
    { id: 3, name: "Sneha Joseph", date: "2026-06-13", time: "09:30 AM", status: "Pending", auto: false },
  ]);

  const handleTriggerManual = (id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: "Sent" } : r));
    alert("Manual SMS and email reminder dispatched to patient.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Appointment Reminders</h1>
        <p className="text-sm text-gray-500 mt-1">Configure automated text/email notifications and trigger manual reminders.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold text-gray-900">Active Reminder Queue</h3>
          <span className="text-xs bg-success/10 text-success rounded-lg px-2.5 py-1 font-bold">Auto-reminders ON</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Scheduled Date</th>
                <th className="py-3 px-2">Scheduled Time</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reminders.map(r => (
                <tr key={r.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{r.name}</td>
                  <td className="py-3.5 px-2 text-xs font-mono text-gray-500">{r.date}</td>
                  <td className="py-3.5 px-2 text-xs font-mono text-gray-500">{r.time}</td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      r.auto ? "bg-gray-100 text-gray-650" : "bg-primary/5 text-primary border border-primary/10"
                    }`}>
                      {r.auto ? "Automatic" : "Manual Request"}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      r.status === "Sent" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    {r.status !== "Sent" && (
                      <button
                        onClick={() => handleTriggerManual(r.id)}
                        className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Remind Now
                      </button>
                    )}
                    {r.status === "Sent" && (
                      <span className="text-xs text-gray-400 font-semibold">Reminded</span>
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
