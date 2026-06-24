"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckSquare, Hourglass, Stethoscope, Users } from "lucide-react";

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch today's appointments and the live queue from backend
  const fetchDashboardData = async () => {
    try {
      const apptsRes = await fetch("http://127.0.0.1:8000/frontdesk/appointments/today");
      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        setAppointments(apptsData);
      }

      const queueRes = await fetch("http://127.0.0.1:8000/frontdesk/queue");
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setQueue(queueData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 5 seconds for automatic updates (e.g. when doctor calls patient or check-in occurs)
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveFromQueue = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the waiting queue?`)) {
      return;
    }
    try {
      // Complete or Cancel the appointment to remove from queue
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error removing from queue:", err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-gray-100 text-gray-550 border border-gray-200";
      case "Confirmed":
        return "bg-primary/10 text-primary border border-primary/20";
      case "Checked In":
      case "Waiting":
        return "bg-success/10 text-success border border-success/20";
      case "In Chair":
        return "bg-purple-50 text-purple-650 border border-purple-100 animate-pulse";
      case "Cancelled":
        return "bg-danger/10 text-danger border border-danger/20";
      default:
        return "bg-warning/10 text-warning border border-warning/20";
    }
  };

  const formatCheckedInTime = (timestampStr) => {
    if (!timestampStr) return "";
    try {
      const dt = new Date(timestampStr);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "";
    }
  };

  // Wait time calculation description: 10 mins per waiting patient ahead
  const waitingPatientsCount = queue.filter(q => q.status === "Waiting").length;
  const estimatedLoungeWait = waitingPatientsCount * 10;

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
            <p className="text-xs text-primary font-semibold mt-1">
              {appointments.filter(a => a.status === "Confirmed").length} confirmed slots
            </p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Checked In Today</p>
            <h3 className="text-2xl font-black text-gray-800">
              {appointments.filter(a => a.status === "Checked In" || a.status === "Waiting" || a.status === "In Chair").length}
            </h3>
            <p className="text-xs text-success font-semibold mt-1">In clinic</p>
          </div>
          <span className="bg-success/10 p-3 rounded-xl text-success flex items-center justify-center shrink-0">
            <CheckSquare className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Waiting in Lounge</p>
            <h3 className="text-2xl font-black text-gray-800">
              {queue.filter(q => q.status === "Waiting").length}
            </h3>
            <p className="text-xs text-warning font-semibold mt-1">Est. Wait: {estimatedLoungeWait} min</p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <Hourglass className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Doctors</p>
            <h3 className="text-2xl font-black text-gray-800">3</h3>
            <p className="text-xs text-purple-650 font-semibold mt-1">On duty today</p>
          </div>
          <span className="bg-purple-50 p-3 rounded-xl text-purple-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Appointments Table (8 cols) - Action Column Removed */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-gray-900">Today's Appointment Board</h3>
              <span suppressHydrationWarning className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-500 font-semibold">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="overflow-x-auto">
              {appointments.length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-400 font-bold">No appointments booked for today.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-2">Time</th>
                      <th className="py-3 px-2">Patient</th>
                      <th className="py-3 px-2">Doctor</th>
                      <th className="py-3 px-2">Treatment</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {appointments.map(app => (
                      <tr key={app.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-2 font-mono text-xs text-gray-500 font-bold">{app.appointment_time}</td>
                        <td className="py-3.5 px-2">
                          <div className="font-semibold text-gray-900">{app.patient?.name || "Walk-In Patient"}</div>
                          <div className="text-[10px] text-gray-400">{app.patient?.token || ""}</div>
                        </td>
                        <td className="py-3.5 px-2 text-gray-505 text-xs">{app.doctor_name}</td>
                        <td className="py-3.5 px-2 text-gray-650">{app.treatment_type}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Live Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Live Waiting Queue</h3>
            <p className="text-xs text-gray-400 mt-0.5">Patients waiting in receptionist lounge</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {queue.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl flex flex-col items-center">
                <Users className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400 mt-2 font-bold">Lounge is currently empty.</p>
              </div>
            ) : (
              queue.map(q => (
                <div key={q.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-800">{q.patient_name}</h4>
                    <p className="text-[10px] text-gray-450 mt-0.5">Assigned: {q.doctor_name}</p>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1.5">
                      <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        In: {formatCheckedInTime(q.checked_in_at)}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                        q.priority === "Emergency" ? "bg-danger/10 text-danger animate-pulse" :
                        q.priority === "Urgent" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                      }`}>
                        {q.priority}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        q.status === "In Chair" ? "bg-purple-50 text-purple-650 border border-purple-100" : "bg-gray-100 text-gray-500"
                      }`}>
                        {q.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromQueue(q.id, q.patient_name)}
                    className="p-1 text-gray-400 hover:text-danger rounded-lg transition-colors cursor-pointer text-lg outline-none"
                    title="Remove from queue"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 italic">Queue updates automatically when a doctor calls the next patient.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
