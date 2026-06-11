"use client";

import { useState } from "react";

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([
    { id: 1, name: "Sneha Joseph", time: "11:30 AM", doctor: "Dr. Anoop Nair", type: "Scaling", status: "Checked In" },
    { id: 2, name: "Rahul Kumar", time: "12:00 PM", doctor: "Dr. Anoop Nair", type: "Root Canal", status: "Confirmed" },
    { id: 3, name: "Maria George", time: "12:45 PM", doctor: "Dr. Priya Varma", type: "Consultation", status: "Confirmed" },
    { id: 4, name: "Aby Thomas", time: "02:00 PM", doctor: "Dr. Priya Varma", type: "Orthodontics", status: "Pending" },
  ]);

  const [queue, setQueue] = useState([
    { id: 1, name: "Sneha Joseph", doctor: "Dr. Anoop Nair", time: "11:30 AM", priority: "Routine" },
    { id: 2, name: "Deepak Kurian", doctor: "Dr. Sarah Smith", time: "11:45 AM", priority: "Routine" },
  ]);

  const handleCheckIn = (id) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        const updated = { ...app, status: "Checked In" };
        // Add to queue if not already there
        if (!queue.some(q => q.name === app.name)) {
          setQueue(qPrev => [...qPrev, {
            id: Date.now(),
            name: app.name,
            doctor: app.doctor,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            priority: "Routine"
          }]);
        }
        return updated;
      }
      return app;
    }));
  };

  const handleRemoveFromQueue = (id) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Receptionist Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage patient check-ins, direct waiting queues, and check daily schedules.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Today's Bookings</p>
            <h3 className="text-2xl font-black text-gray-800">{appointments.length}</h3>
            <p className="text-xs text-primary font-semibold mt-1">2 remaining slots</p>
          </div>
          <span className="text-3xl bg-primary/10 p-3 rounded-xl">📅</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Checked In</p>
            <h3 className="text-2xl font-black text-gray-800">
              {appointments.filter(a => a.status === "Checked In").length}
            </h3>
            <p className="text-xs text-success font-semibold mt-1">Direct to chair</p>
          </div>
          <span className="text-3xl bg-success/10 p-3 rounded-xl">✅</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Waiting Queue</p>
            <h3 className="text-2xl font-black text-gray-800">{queue.length}</h3>
            <p className="text-xs text-warning font-semibold mt-1">Est. wait: 15 min</p>
          </div>
          <span className="text-3xl bg-warning/10 p-3 rounded-xl">⏳</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Doctors</p>
            <h3 className="text-2xl font-black text-gray-800">3</h3>
            <p className="text-xs text-purple-650 font-semibold mt-1">All departments</p>
          </div>
          <span className="text-3xl bg-purple-50 p-3 rounded-xl text-purple-600">👨‍⚕️</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Appointments Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-gray-900">Today's Appointment Board</h3>
              <span className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-500 font-semibold">June 11, 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Time</th>
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Doctor</th>
                    <th className="py-3 px-2">Treatment</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.map(app => (
                    <tr key={app.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{app.time}</td>
                      <td className="py-3.5 px-2 font-semibold text-gray-900">{app.name}</td>
                      <td className="py-3.5 px-2 text-gray-500 text-xs">{app.doctor}</td>
                      <td className="py-3.5 px-2 text-gray-650">{app.type}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          app.status === "Checked In" ? "bg-success/10 text-success" :
                          app.status === "Confirmed" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {app.status !== "Checked In" && (
                          <button
                            onClick={() => handleCheckIn(app.id)}
                            className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                        {app.status === "Checked In" && (
                          <span className="text-xs text-gray-400 font-semibold">Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Live Waiting Queue</h3>
            <p className="text-xs text-gray-400 mt-0.5">Patients waiting in receptionist lounge</p>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {queue.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                <span className="text-2xl">🛋️</span>
                <p className="text-xs text-gray-400 mt-2 font-bold">Lounge is currently empty.</p>
              </div>
            ) : (
              queue.map(q => (
                <div key={q.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-800">{q.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Assigned to: {q.doctor}</p>
                    <div className="flex gap-2 items-center mt-1.5">
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Checked in at {q.time}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-success bg-success/10 px-1.5 py-0.5 rounded">{q.priority}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromQueue(q.id)}
                    className="p-1 text-gray-400 hover:text-danger rounded-lg transition-colors cursor-pointer text-lg outline-none"
                    title="Remove from queue"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (appointments.some(a => a.status === "Confirmed")) {
                  const firstConfirmed = appointments.find(a => a.status === "Confirmed");
                  handleCheckIn(firstConfirmed.id);
                } else {
                  alert("No confirmed appointments to check in at this moment.");
                }
              }}
              className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Simulate Next Patient Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
