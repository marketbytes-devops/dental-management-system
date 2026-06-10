"use client";

import { useState } from "react";

export default function DoctorAppointments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("2026-06-10"); // Today's date representation

  // Mock list of appointments for the doctor
  const [appointments, setAppointments] = useState([
    { id: 1, time: "09:30 AM", patientName: "Aswin Kumar", age: 41, gender: "Male", phone: "+91 98765 43210", procedure: "Consultation & Diagnostics", status: "Completed", chair: "Chair 1" },
    { id: 2, time: "10:15 AM", patientName: "Karthika Menon", age: 29, gender: "Female", phone: "+91 99887 76655", procedure: "Composite Restoration #26", status: "Completed", chair: "Chair 2" },
    { id: 3, time: "11:00 AM", patientName: "Jibin Jose", age: 37, gender: "Male", phone: "+91 88776 65544", procedure: "Crown Fitting #46", status: "Completed", chair: "Chair 1" },
    { id: 4, time: "11:45 AM", patientName: "Rohan Varma", age: 28, gender: "Male", phone: "+91 77665 54433", procedure: "Consultation", status: "Scheduled", chair: "Chair 2" },
    { id: 5, time: "12:15 PM", patientName: "Priya Nair", age: 34, gender: "Female", phone: "+91 66554 43322", procedure: "Scaling & Polishing", status: "Scheduled", chair: "Chair 1" },
    { id: 6, time: "12:45 PM", patientName: "Deepak Kurian", age: 45, gender: "Male", phone: "+91 55443 32211", procedure: "Root Canal Treatment #16", status: "Scheduled", chair: "Chair 2" },
    { id: 7, time: "01:30 PM", patientName: "Meera Pillai", age: 62, gender: "Female", phone: "+91 44332 21100", procedure: "Extraction #38", status: "Scheduled", chair: "Chair 1" },
    { id: 8, time: "03:00 PM", patientName: "Sherin George", age: 23, gender: "Female", phone: "+91 33221 10099", procedure: "Orthodontic Adjustment", status: "Scheduled", chair: "Chair 2" },
    { id: 9, time: "03:45 PM", patientName: "George Mathew", age: 54, gender: "Male", phone: "+91 22110 09988", procedure: "Bridge Preparation #35-37", status: "Scheduled", chair: "Chair 1" },
    { id: 10, time: "04:30 PM", patientName: "Varun Dev", age: 19, gender: "Male", phone: "+91 11009 98877", procedure: "Wisdom Tooth Assessment", status: "Cancelled", chair: "Chair 2" },
  ]);

  const [notification, setNotification] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  // Change Appointment Status
  const updateStatus = (id, newStatus) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    setAppointments(appointments.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    }));

    showNotification(`Appointment for ${apt.patientName} marked as ${newStatus}.`);
  };

  // Count summaries
  const totalCount = appointments.length;
  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const scheduledCount = appointments.filter(a => a.status === "Scheduled").length;
  const cancelledCount = appointments.filter(a => a.status === "Cancelled").length;

  // Filtered List
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.procedure.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ||
      apt.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-success/10 text-success border-success/20";
      case "scheduled": return "bg-primary/10 text-primary border-primary/20";
      case "cancelled": return "bg-danger/10 text-danger border-danger/20";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
          <span className="text-primary">📅</span>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Profile Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Today's Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Schedules, treatment agendas, and status tracking.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 border border-gray-100 shadow-sm rounded-xl">
          <button
            onClick={() => showNotification("Navigating to previous day")}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg text-sm font-bold cursor-pointer"
          >
            ←
          </button>
          <span className="text-xs font-bold text-gray-700 px-2 uppercase tracking-wide">
            10 Jun 2026 (Today)
          </span>
          <button
            onClick={() => showNotification("Navigating to next day")}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg text-sm font-bold cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Booked</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalCount} Patients</h3>
            <p className="text-xs text-gray-500 mt-2">Scheduled slots for today</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-success/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900">{completedCount}</h3>
            <p className="text-xs text-success font-semibold mt-2 flex items-center gap-1">
              <span>↑</span> {Math.round((completedCount / totalCount) * 100)}% completion rate
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
            <h3 className="text-2xl font-bold text-gray-900">{scheduledCount}</h3>
            <p className="text-xs text-warning font-semibold mt-2">Active slots left</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-danger/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cancelled</p>
            <h3 className="text-2xl font-bold text-gray-900">{cancelledCount}</h3>
            <p className="text-xs text-danger font-semibold mt-2">Requires rescheduling</p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters and Search */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
          <div className="flex flex-1 gap-3 max-w-lg">
            <input
              type="text"
              placeholder="Search by Patient name, procedure, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "scheduled", "completed", "cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer outline-none ${statusFilter === tab ? "bg-primary text-white border-primary shadow-sm shadow-primary/10" : "bg-white text-gray-600 border-gray-200 hover:border-primary/30 hover:text-primary"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Slot Time</th>
                <th className="px-6 py-4">Patient details</th>
                <th className="px-6 py-4">Dental Procedure</th>
                <th className="px-6 py-4">Chair Assign</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                    No appointments found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {apt.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {apt.patientName.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">{apt.patientName}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{apt.gender}, {apt.age} yrs • {apt.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        🦷 {apt.procedure}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{apt.chair}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {apt.status === "Scheduled" && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => updateStatus(apt.id, "Completed")}
                            className="px-2.5 py-1.5 bg-success/10 hover:bg-success/15 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => updateStatus(apt.id, "Cancelled")}
                            className="px-2.5 py-1.5 bg-danger/10 hover:bg-danger/15 text-danger text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {apt.status === "Completed" && (
                        <span className="text-xs text-success font-medium flex items-center justify-end gap-1">
                          <span>✓</span> Saved
                        </span>
                      )}
                      {apt.status === "Cancelled" && (
                        <button
                          onClick={() => updateStatus(apt.id, "Scheduled")}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
