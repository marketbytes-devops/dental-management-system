"use client";

import { useState } from "react";

export default function ReceptionistCheckIn() {
  const [appointments, setAppointments] = useState([
    { id: 1, name: "Sneha Joseph", time: "11:30 AM", doctor: "Dr. Anoop Nair", status: "Confirmed" },
    { id: 2, name: "Rahul Kumar", time: "12:00 PM", doctor: "Dr. Anoop Nair", status: "Confirmed" },
    { id: 3, name: "Maria George", time: "12:45 PM", doctor: "Dr. Priya Varma", status: "Confirmed" },
  ]);

  const [activeQueue, setActiveQueue] = useState([
    { id: 101, name: "Commander Vikram", doctor: "Dr. Sarah Smith", checkedInAt: "11:00 AM", priority: "Urgent", status: "In Chair" },
    { id: 102, name: "Aby Thomas", doctor: "Dr. Priya Varma", checkedInAt: "11:15 AM", priority: "Routine", status: "Waiting" },
  ]);

  const [selectedAppId, setSelectedAppId] = useState("");
  const [priority, setPriority] = useState("Routine");
  const [assignedDoctor, setAssignedDoctor] = useState("Dr. Anoop Nair");

  const handleCheckIn = (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      alert("Please select a patient to check-in.");
      return;
    }
    const app = appointments.find(a => a.id === parseInt(selectedAppId));
    if (!app) return;

    // Remove from active appointments list
    setAppointments(prev => prev.filter(a => a.id !== app.id));

    // Add to waiting queue
    const newQueueItem = {
      id: Date.now(),
      name: app.name,
      doctor: assignedDoctor || app.doctor,
      checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: priority,
      status: "Waiting"
    };
    setActiveQueue(prev => [...prev, newQueueItem]);
    setSelectedAppId("");
  };

  const handleCheckout = (id) => {
    const item = activeQueue.find(q => q.id === id);
    if (!item) return;

    setActiveQueue(prev => prev.filter(q => q.id !== id));
    alert(`Patient ${item.name} has checked out. Billing invoice notification sent to Accounting department.`);
  };

  const handleCallToChair = (id) => {
    setActiveQueue(prev => prev.map(q => q.id === id ? { ...q, status: "In Chair" } : q));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Check-In / Check-Out Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Check-in arriving patients, set triage priorities, and trigger bills at checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Check In Panel */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Patient Check-In</h3>
          
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Select Arrived Appointment</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="">-- Choose Patient --</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.time} - {a.doctor})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Priority / Triage</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Route to Doctor</label>
                <select
                  value={assignedDoctor}
                  onChange={(e) => setAssignedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  <option value="Dr. Anoop Nair">Dr. Anoop Nair</option>
                  <option value="Dr. Priya Varma">Dr. Priya Varma</option>
                  <option value="Dr. Sarah Smith">Dr. Sarah Smith</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
            >
              Check-In Patient
            </button>
          </form>

          {appointments.length === 0 && (
            <p className="text-xs text-gray-400 italic">No remaining scheduled appointments for checking in.</p>
          )}
        </div>

        {/* Checked In Queue & Checkout Panel */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Arrived Patients Queue</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Doctor</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2">Stage</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeQueue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-xs text-gray-400 font-bold">No active checked-in patients.</td>
                  </tr>
                ) : (
                  activeQueue.map(q => (
                    <tr key={q.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-gray-900">{q.name}</div>
                        <div className="text-[10px] text-gray-400">Checked in at {q.checkedInAt}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-gray-500">{q.doctor}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          q.priority === "Emergency" ? "bg-danger/10 text-danger animate-pulse" :
                          q.priority === "Urgent" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                        }`}>
                          {q.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          q.status === "In Chair" ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-gray-100 text-gray-650"
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right space-x-1.5">
                        {q.status === "Waiting" && (
                          <button
                            onClick={() => handleCallToChair(q.id)}
                            className="px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-bold cursor-pointer"
                          >
                            Call to Chair
                          </button>
                        )}
                        <button
                          onClick={() => handleCheckout(q.id)}
                          className="px-2 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Checkout / Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
