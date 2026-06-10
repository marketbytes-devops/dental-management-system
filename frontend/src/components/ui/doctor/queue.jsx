"use client";

import { useState } from "react";

export default function PatientQueue() {
  const [queue, setQueue] = useState([
    { token: "#004", name: "Rahul Kumar", age: 32, gender: "Male", checkInTime: "11:15 AM", procedure: "Root Canal Treatment", status: "In-Chair", priority: "Routine" },
    { token: "#005", name: "Rohan Varma", age: 28, gender: "Male", checkInTime: "11:30 AM", procedure: "Consultation", status: "Waiting", priority: "Routine" },
    { token: "#006", name: "Priya Nair", age: 34, gender: "Female", checkInTime: "11:55 AM", procedure: "Scaling & Polishing", status: "Waiting", priority: "Routine" },
    { token: "#007", name: "Deepak Kurian", age: 45, gender: "Male", checkInTime: "12:10 PM", procedure: "Root Canal Treatment", status: "Waiting", priority: "Urgent" },
    { token: "#008", name: "Meera Pillai", age: 62, gender: "Female", checkInTime: "12:30 PM", procedure: "Extraction", status: "Waiting", priority: "Routine" },
  ]);

  const [notification, setNotification] = useState("");
  const [showAddWalkin, setShowAddWalkin] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinProcedure, setWalkinProcedure] = useState("Consultation");
  const [walkinPriority, setWalkinPriority] = useState("Routine");
  const [walkinAge, setWalkinAge] = useState("");
  const [walkinGender, setWalkinGender] = useState("Male");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleStatusChange = (token, newStatus) => {
    const patient = queue.find(p => p.token === token);
    if (!patient) return;

    let updatedQueue = [...queue];

    if (newStatus === "In-Chair") {
      // Mark any other In-Chair patient as Waiting or Completed
      updatedQueue = updatedQueue.map(p => {
        if (p.status === "In-Chair") {
          return { ...p, status: "Waiting" }; // Move back to waiting or complete it
        }
        return p;
      });
    }

    setQueue(updatedQueue.map(p => {
      if (p.token === token) {
        return { ...p, status: newStatus };
      }
      return p;
    }));

    showNotification(`Patient ${patient.name} (${token}) marked as ${newStatus}.`);
  };

  const handleRemovePatient = (token) => {
    const patient = queue.find(p => p.token === token);
    if (!patient) return;

    setQueue(queue.filter(p => p.token !== token));
    showNotification(`Patient ${patient.name} (${token}) removed from queue.`);
  };

  const handleAddWalkinSubmit = (e) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinAge) return;

    // Generate new token
    const lastTokenNum = parseInt(queue[queue.length - 1]?.token.replace("#", "") || "0");
    const newToken = `#${String(lastTokenNum + 1).padStart(3, "0")}`;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPatient = {
      token: newToken,
      name: walkinName,
      age: parseInt(walkinAge),
      gender: walkinGender,
      checkInTime: timeString,
      procedure: walkinProcedure,
      status: "Waiting",
      priority: walkinPriority
    };

    setQueue([...queue, newPatient]);
    setWalkinName("");
    setWalkinAge("");
    setShowAddWalkin(false);
    showNotification(`Walk-in Patient ${walkinName} registered & checked into queue at token ${newToken}.`);
  };

  const getPriorityColor = (priority) => {
    return priority === "Urgent"
      ? "bg-danger/10 text-danger border-danger/10"
      : "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "In-Chair": return "bg-success/15 text-success border-success/20";
      case "Waiting": return "bg-primary/10 text-primary border-primary/20";
      case "Skipped": return "bg-danger/10 text-danger border-danger/20";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
          <span className="text-primary">⏳</span>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Profile Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patient Queue Room</h1>
          <p className="text-sm text-gray-500 mt-1">Manage waiting list, call queue status, and clinic load.</p>
        </div>
        <button
          onClick={() => setShowAddWalkin(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 transition-colors shadow-sm shadow-primary/20 flex items-center gap-2 cursor-pointer outline-none"
        >
          <span>+</span> Register Walk-In
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Checked-In</p>
            <h3 className="text-2xl font-bold text-gray-900">{queue.length} Patients</h3>
            <p className="text-xs text-gray-500 mt-2">Active in facility</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-success/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">In Dental Chair</p>
            <h3 className="text-xl font-bold text-gray-900">
              {queue.find(p => p.status === "In-Chair")?.name || "None"}
            </h3>
            <p className="text-xs text-success font-semibold mt-2">Currently being treated</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Waiting Room</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {queue.filter(p => p.status === "Waiting").length} Patients
            </h3>
            <p className="text-xs text-warning font-semibold mt-2">Awaiting call</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-danger/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Urgent Cases</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {queue.filter(p => p.priority === "Urgent" && p.status === "Waiting").length} Cases
            </h3>
            <p className="text-xs text-danger font-semibold mt-2">Requires priority priority</p>
          </div>
        </div>
      </div>

      {/* Queue Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">Live Active Patient Queue</h3>
          <span className="text-xs text-gray-500 font-semibold">Updated: Live simulation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Patient details</th>
                <th className="px-6 py-4">Check-In Time</th>
                <th className="px-6 py-4">Dental Procedure</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Queue Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-400">
                    No patients currently checked in.
                  </td>
                </tr>
              ) : (
                queue.map((patient) => (
                  <tr key={patient.token} className={`hover:bg-gray-50/50 transition-colors group ${patient.status === "In-Chair" ? "bg-success/[0.02]" : ""}`}>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {patient.token}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-950 block">{patient.name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{patient.gender}, {patient.age} yrs</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{patient.checkInTime}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-700">
                        🦷 {patient.procedure}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(patient.priority)}`}>
                        {patient.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1 justify-end">
                        {patient.status === "Waiting" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(patient.token, "In-Chair")}
                              className="px-2 py-1.5 bg-success/10 hover:bg-success/15 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Call to Chair
                            </button>
                            <button
                              onClick={() => handleStatusChange(patient.token, "Skipped")}
                              className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Skip
                            </button>
                          </>
                        )}
                        {patient.status === "In-Chair" && (
                          <button
                            onClick={() => handleRemovePatient(patient.token)}
                            className="px-2.5 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-primary/10"
                          >
                            Mark Completed
                          </button>
                        )}
                        {patient.status === "Skipped" && (
                          <button
                            onClick={() => handleStatusChange(patient.token, "Waiting")}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Recall
                          </button>
                        )}
                        <button
                          onClick={() => handleRemovePatient(patient.token)}
                          className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors cursor-pointer"
                          title="Remove Patient"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Walkin Modal */}
      {showAddWalkin && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">📝 Register Walk-In Patient</h3>
              <button
                onClick={() => setShowAddWalkin(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-lg cursor-pointer select-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddWalkinSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Patient Name</label>
                  <input
                    type="text"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Age</label>
                    <input
                      type="number"
                      value={walkinAge}
                      onChange={(e) => setWalkinAge(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Gender</label>
                    <select
                      value={walkinGender}
                      onChange={(e) => setWalkinGender(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Dental Procedure</label>
                  <select
                    value={walkinProcedure}
                    onChange={(e) => setWalkinProcedure(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Scaling & Polishing">Scaling & Polishing</option>
                    <option value="Root Canal Treatment">Root Canal Treatment</option>
                    <option value="Extraction">Extraction</option>
                    <option value="Crown Fitting">Crown Fitting</option>
                    <option value="Orthodontic Adjustment">Orthodontic Adjustment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Priority Status</label>
                  <select
                    value={walkinPriority}
                    onChange={(e) => setWalkinPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddWalkin(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 transition-colors rounded-xl shadow-sm shadow-primary/15 cursor-pointer"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
