"use client";

import { useState } from "react";

export default function ReceptionistQueue() {
  const [queue, setQueue] = useState([
    { id: 1, name: "Sneha Joseph", doctor: "Dr. Anoop Nair", checkinTime: "11:30 AM", waitTime: "10m", priority: "Routine", status: "Waiting" },
    { id: 2, name: "Deepak Kurian", doctor: "Dr. Sarah Smith", checkinTime: "11:45 AM", waitTime: "5m", priority: "Routine", status: "Waiting" },
    { id: 3, name: "Commander Vikram", doctor: "Dr. Sarah Smith", checkinTime: "11:00 AM", waitTime: "40m", priority: "Urgent", status: "In Chair" },
  ]);

  const handlePriorityChange = (id, newPriority) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, priority: newPriority } : q));
  };

  const handleUpdateStatus = (id, newStatus) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
  };

  const handleRemove = (id) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Waiting Queue Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage waiting patients, assign clinical triage, and direct dental chairs.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-extrabold text-gray-900 mb-4">Live Patient Waiting Board</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Doctor Route</th>
                <th className="py-3 px-2">Check-In Time</th>
                <th className="py-3 px-2">Wait Duration</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Stage</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {queue.map(q => (
                <tr key={q.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{q.name}</td>
                  <td className="py-3.5 px-2 text-gray-500 text-xs">{q.doctor}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-400">{q.checkinTime}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{q.waitTime}</td>
                  <td className="py-3.5 px-2">
                    <select
                      value={q.priority}
                      onChange={(e) => handlePriorityChange(q.id, e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-gray-800"
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      q.status === "In Chair" ? "bg-purple-50 text-purple-600 border border-purple-100 animate-pulse" :
                      q.status === "Finished" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-650"
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right space-x-1">
                    {q.status === "Waiting" && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, "In Chair")}
                        className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Call to Chair
                      </button>
                    )}
                    {q.status === "In Chair" && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, "Finished")}
                        className="px-2.5 py-1 text-xs bg-success hover:bg-success/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(q.id)}
                      className="px-2.5 py-1 text-xs bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      Remove
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
