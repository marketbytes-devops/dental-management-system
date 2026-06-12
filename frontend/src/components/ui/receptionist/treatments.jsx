"use client";

import { useState } from "react";

export default function ReceptionistTreatments() {
  const [coordinations, setCoordinations] = useState([
    { id: 1, name: "Sneha Joseph", treatment: "Scaling & Extraction", doctor: "Dr. Anoop Nair", room: "Chair #1", status: "Ongoing" },
    { id: 2, name: "Rahul Kumar", treatment: "Root Canal Treatment", doctor: "Dr. Anoop Nair", room: "Chair #2", status: "Pre-Op Setup" },
    { id: 3, name: "Meera Pillai", treatment: "Tooth Extraction", doctor: "Dr. James Kurt", room: "Surgical Room", status: "Post-Op Check" },
  ]);

  const handleUpdateStatus = (id, newStatus) => {
    setCoordinations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Treatment Coordination</h1>
        <p className="text-sm text-gray-500 mt-1">Coordinate current clinic treatments and surgical room mappings.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-extrabold text-gray-900 mb-4">Active Treatment Floor</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Treatment Room</th>
                <th className="py-3 px-2">Assigned Doctor</th>
                <th className="py-3 px-2">Procedure Plan</th>
                <th className="py-3 px-2">Floor Status</th>
                <th className="py-3 px-2 text-right">Coordination Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coordinations.map(c => (
                <tr key={c.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-2 font-medium text-primary text-xs">{c.room}</td>
                  <td className="py-3.5 px-2 text-gray-500 text-xs">{c.doctor}</td>
                  <td className="py-3.5 px-2 text-gray-650">{c.treatment}</td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      c.status === "Ongoing" ? "bg-success/10 text-success animate-pulse" :
                      c.status === "Pre-Op Setup" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right space-x-1.5">
                    <button
                      onClick={() => handleUpdateStatus(c.id, "Ongoing")}
                      className="px-2.5 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c.id, "Finished")}
                      className="px-2.5 py-1 text-xs bg-gray-100 text-gray-650 hover:bg-gray-200 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      Finish
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
