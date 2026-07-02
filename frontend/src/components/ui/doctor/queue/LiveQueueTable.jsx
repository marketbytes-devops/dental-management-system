"use client";

import { X } from "lucide-react";

export default function LiveQueueTable({
  queue = [],
  patients = {},
  onCallPatient,
  onSkipPatient,
  onRequeuePatient,
  onRemovePatient
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit animate-fade-in">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-gray-900">Active Checked-In Patients</h3>
          <p className="text-xs text-gray-505 font-semibold mt-0.5">Call patients into dental chair or load history</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Token</th>
              <th className="px-6 py-4">Patient details</th>
              <th className="px-6 py-4">Check-In Time</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {queue.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-xs text-gray-400 font-semibold">
                  Queue is empty. Waiting room is clear.
                </td>
              </tr>
            ) : (
              queue.map((item, index) => {
                const pt = patients[item.token];
                if (!pt) return null;
                const isWaiting = item.status === "Waiting";
                const isUrgent = item.priority === "Urgent";
                return (
                  <tr key={item.id || `${item.token}-${index}`} className={`hover:bg-gray-50/50 transition-colors ${isUrgent ? "bg-red-50/[0.02]" : ""}`}>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded">
                        {item.token}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {pt.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-955 block">{pt.name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{pt.gender}, {pt.age} yrs • {pt.procedure}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{item.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        isUrgent ? "bg-danger/10 text-danger border-danger/20" : "bg-gray-100 text-gray-550 border-gray-200"
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        isWaiting ? "bg-primary/5 text-primary border-primary/20" : "bg-danger/5 text-danger border-danger/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1 justify-end">
                        {isWaiting ? (
                          <>
                            <button
                              onClick={() => onCallPatient(item.token)}
                              className="px-3 py-1.5 bg-success/15 hover:bg-success/20 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Call to Chair
                            </button>
                            <button
                              onClick={() => onSkipPatient(item.token)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-250 text-gray-650 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Skip
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onRequeuePatient(item.token)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Recall
                          </button>
                        )}
                        <button
                          onClick={() => onRemovePatient(item.token)}
                          className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg cursor-pointer"
                          title="Remove patient from queue"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
