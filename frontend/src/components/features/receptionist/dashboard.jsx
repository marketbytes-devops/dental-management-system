"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckSquare, Hourglass, Stethoscope, Users } from "lucide-react";
import { getTodayAppointments, getQueue, updateAppointmentStatus } from "@/services/api";
import { getDoctors } from "@/services/api";

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueFilter, setQueueFilter] = useState("All");


  const fetchDoctorStats = async () => {
    try {
      const doctors = await getDoctors();

      setStats({
        total_doctors: doctors.length,
        active_doctors: doctors.filter(
          (doctor) => doctor.status !== "Off Duty"
        ).length,
      });
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  };

  const [stats, setStats] = useState({
    total_doctors: 0,
    active_doctors: 0,
  });


  useEffect(() => {
    fetchDashboardData();
    fetchDoctorStats();
  }, []);

  // Fetch today's appointments and the live queue from backend
  const fetchDashboardData = async () => {
    try {
      const [apptsData, queueData] = await Promise.all([
        getTodayAppointments(),
        getQueue()
      ]);
      setAppointments(apptsData);
      setQueue(queueData);
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
      await updateAppointmentStatus(id, { status: "Completed" });
      fetchDashboardData();
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

  // Queue filtering logic
  const uniqueDoctors = Array.from(new Set(queue.map(q => q.doctor_name))).filter(Boolean);
  const queueByDoctor = uniqueDoctors.map(doc => ({
    name: doc,
    count: queue.filter(q => q.doctor_name === doc).length
  })).sort((a, b) => b.count - a.count);

  const filteredQueue = queueFilter === "All" 
    ? queue 
    : queue.filter(q => q.doctor_name === queueFilter);

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
            <h3 className="text-2xl font-black">
              {stats.active_doctors} / {stats.total_doctors}
            </h3>
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
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col max-h-[600px]">
          <div className="shrink-0">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center justify-between">
              Live Waiting Queue
              <span className="bg-warning/10 text-warning px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold">
                {waitingPatientsCount} Waiting
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Filter by assigned doctor</p>
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mt-3 pb-1">
              <button 
                onClick={() => setQueueFilter("All")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  queueFilter === "All" 
                    ? "bg-gray-900 text-white shadow-md" 
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${queueFilter === "All" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {queue.length}
                </span>
              </button>
              {queueByDoctor.map(doc => (
                <button
                  key={doc.name}
                  onClick={() => setQueueFilter(doc.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    queueFilter === doc.name 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <span className="truncate max-w-[80px]" title={doc.name}>
                    {doc.name.replace("Dr. ", "")}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${queueFilter === doc.name ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {doc.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center bg-gray-50/50">
                <Users className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400 mt-2 font-bold">
                  {queueFilter === "All" ? "Lounge is currently empty." : "No patients waiting for this doctor."}
                </p>
              </div>
            ) : (
              filteredQueue.map(q => (
                <div key={q.id} className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-primary/30 transition-all group flex flex-col gap-3 relative overflow-hidden">
                  {/* Decorative side bar for status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    q.status === "In Chair" ? "bg-purple-500" : 
                    q.priority === "Emergency" ? "bg-danger" : 
                    "bg-success"
                  }`}></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-primary transition-colors">{q.patient_name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Stethoscope className="w-3 h-3 text-gray-400" />
                        <p className="text-[10px] font-semibold text-gray-500">{q.doctor_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromQueue(q.id, q.patient_name)}
                      className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer outline-none"
                      title="Remove from queue"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center pl-2">
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                      <Hourglass className="w-3 h-3" />
                      {formatCheckedInTime(q.checked_in_at)}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md ${
                      q.priority === "Emergency" ? "bg-danger/10 text-danger animate-pulse" :
                      q.priority === "Urgent" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    }`}>
                      {q.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ml-auto ${
                      q.status === "In Chair" ? "bg-purple-50 text-purple-650 border border-purple-100" : "bg-gray-100 text-gray-600"
                    }`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 shrink-0 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-medium">Queue updates automatically in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
