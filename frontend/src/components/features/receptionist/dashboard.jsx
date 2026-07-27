"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, CheckSquare, Hourglass, Stethoscope, Users,
  AlertTriangle, Activity, X, Phone, User as UserIcon,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  getTodayAppointments, getQueue, updateAppointmentStatus,
  getAppointmentsByMonth,
} from "@/services/api";
import { getDoctors } from "@/services/api";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG = {
  Completed:    { dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-600 border border-gray-200" },
  Confirmed:    { dot: "bg-primary",    badge: "bg-primary/10 text-primary border border-primary/20" },
  "Checked In": { dot: "bg-success",   badge: "bg-success/10 text-success border border-success/20" },
  Waiting:      { dot: "bg-success",   badge: "bg-success/10 text-success border border-success/20" },
  "In Chair":   { dot: "bg-purple-500", badge: "bg-purple-50 text-purple-650 border border-purple-100 animate-pulse" },
  Cancelled:    { dot: "bg-danger",     badge: "bg-danger/10 text-danger border border-danger/20" },
  Scheduled:    { dot: "bg-warning",    badge: "bg-warning/10 text-warning border border-warning/20" },
};

function getStatusCfg(status) {
  return STATUS_CONFIG[status] || { dot: "bg-warning", badge: "bg-warning/10 text-warning border border-warning/20" };
}

function toYMD(dateObj) {
  return dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── Unified Appointments Panel ───────────────────────────────────────────────
function AppointmentsPanel() {
  const now   = new Date();
  const today = toYMD(now);
  const yesterdayDate = new Date(now); yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = toYMD(yesterdayDate);

  // "today" | "yesterday" | "monthly"
  const [view, setView] = useState("today");

  // Monthly picker state
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  // Data
  const [allAppts, setAllAppts] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // Filters
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (view === "today") {
        data = await getTodayAppointments();
      } else if (view === "yesterday") {
        // fetch the same month, filter client-side by date
        data = await getAppointmentsByMonth(yesterdayDate.getMonth() + 1, yesterdayDate.getFullYear());
        data = data.filter(a => a.appointment_date === yesterday);
      } else {
        data = await getAppointmentsByMonth(month, year);
      }
      setAllAppts(data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, month, year]);

  useEffect(() => {
    setDoctorFilter("All");
    setStatusFilter("All");
    fetchData();
  }, [fetchData]);

  // Month nav
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  // Derived filters
  const uniqueDoctors  = [...new Set(allAppts.map(a => a.doctor_name).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(allAppts.map(a => a.status).filter(Boolean))].sort();

  const filtered = allAppts.filter(a => {
    const docOk = doctorFilter === "All" || a.doctor_name === doctorFilter;
    const stsOk = statusFilter === "All" || a.status === statusFilter;
    return docOk && stsOk;
  });

  // Stats
  const stats = {
    total:     allAppts.length,
    completed: allAppts.filter(a => a.status === "Completed").length,
    pending:   allAppts.filter(a => !["Completed","Cancelled"].includes(a.status)).length,
    cancelled: allAppts.filter(a => a.status === "Cancelled").length,
  };

  // Label for the header
  const viewLabel = view === "today"
    ? `Today — ${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`
    : view === "yesterday"
    ? `Yesterday — ${yesterdayDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`
    : `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="flex flex-col bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden h-full">

      {/* ── Top bar: tabs + month nav ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
        {/* View tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: "today",     label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "monthly",   label: "Monthly" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                view === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Month navigator — only shown in monthly view */}
        {view === "monthly" ? (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-gray-900 min-w-[120px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); }}
                className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ml-1"
              >
                This Month
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            {viewLabel}
          </span>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { label: "Total",     value: stats.total,     color: "text-gray-800",    bg: "bg-white" },
          { label: "Completed", value: stats.completed, color: "text-success-700", bg: "bg-success/5" },
          { label: "Active",    value: stats.pending,   color: "text-primary",     bg: "bg-primary/5" },
          { label: "Cancelled", value: stats.cancelled, color: "text-danger",      bg: "bg-danger/5" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} px-3 py-3 text-center`}>
            <p className={`text-lg font-black ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters row ── */}
      {!loading && allAppts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-gray-50 bg-gray-50/40">
          {/* Doctor filter */}
          <select
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-gray-700"
          >
            <option value="All">All Doctors</option>
            {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {["All", ...uniqueStatuses].map(s => {
              const cfg = s !== "All" ? getStatusCfg(s) : null;
              const count = s === "All" ? allAppts.length : allAppts.filter(a => a.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  {s}
                  <span className={`text-[9px] px-1 rounded ${statusFilter === s ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="ml-auto text-[11px] font-bold text-gray-400">
            {filtered.length} shown
          </span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-semibold">Loading appointments…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="w-14 h-14 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No appointments found</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {allAppts.length === 0
                  ? `No bookings recorded for ${viewLabel}`
                  : "Try adjusting the filters above"}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                {view === "monthly" && <th className="py-3 px-4">Date</th>}
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Treatment</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(app => {
                const cfg = getStatusCfg(app.status);
                return (
                  <tr key={app.id} className="text-sm text-gray-700 hover:bg-gray-50/70 transition-colors group">
                    {view === "monthly" && (
                      <td className="py-3 px-4 font-mono text-xs text-gray-500 font-bold whitespace-nowrap">
                        {app.appointment_date}
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 font-bold whitespace-nowrap">
                      {app.appointment_time}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-xs">
                        {app.patient?.name || "Walk-In"}
                      </div>
                      <div className="text-[10px] text-gray-400">{app.patient?.token || ""}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 font-medium">{app.doctor_name}</td>
                    <td className="py-3 px-4 text-xs text-gray-700 font-medium">{app.treatment_type}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {app.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueFilter, setQueueFilter] = useState("All");
  const [emergencyPatients, setEmergencyPatients] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [stats, setStats] = useState({ total_doctors: 0, active_doctors: 0 });

  const fetchDoctorStats = async () => {
    try {
      const doctors = await getDoctors();
      setStats({
        total_doctors: doctors.length,
        active_doctors: doctors.filter(d => d.status !== "Off Duty").length,
      });
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [apptsData, queueData] = await Promise.all([
        getTodayAppointments(),
        getQueue(),
      ]);
      const emergencyData = queueData.filter(
        q => q.priority === "Emergency" || (q.chief_complaint && q.chief_complaint.includes("[UNVERIFIED EMERGENCY]"))
      );
      setEmergencyPatients(emergencyData);
      setAppointments(apptsData);
      setQueue(queueData);

      if (selectedEmergency) {
        const stillExists = emergencyData.find(e => e.id === selectedEmergency.id);
        if (!stillExists) setSelectedEmergency(null);
        else setSelectedEmergency(stillExists);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDoctorStats();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveFromQueue = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the waiting queue?`)) return;
    try {
      await updateAppointmentStatus(id, { status: "Completed" });
      fetchDashboardData();
    } catch (err) {
      console.error("Error removing from queue:", err);
    }
  };

  const formatCheckedInTime = (timestampStr) => {
    if (!timestampStr) return "";
    try {
      return new Date(timestampStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const waitingPatientsCount = queue.filter(q => q.status === "Waiting").length;
  const estimatedLoungeWait  = waitingPatientsCount * 10;

  const uniqueDoctors = Array.from(new Set(queue.map(q => q.doctor_name))).filter(Boolean);
  const queueByDoctor = uniqueDoctors
    .map(doc => ({ name: doc, count: queue.filter(q => q.doctor_name === doc).length }))
    .sort((a, b) => b.count - a.count);

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
              {appointments.filter(a => a.status === "Confirmed").length} confirmed
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
              {appointments.filter(a => ["Checked In","Waiting","In Chair"].includes(a.status)).length}
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
            <h3 className="text-2xl font-black text-gray-800">{waitingPatientsCount}</h3>
            <p className="text-xs text-warning font-semibold mt-1">Est. {estimatedLoungeWait} min wait</p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <Hourglass className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Doctors</p>
            <h3 className="text-2xl font-black">{stats.active_doctors} / {stats.total_doctors}</h3>
            <p className="text-xs text-purple-650 font-semibold mt-1">On duty today</p>
          </div>
          <span className="bg-purple-50 p-3 rounded-xl text-purple-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Emergency Notifications */}
      {emergencyPatients.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger animate-pulse" />
            Emergency Alerts ({emergencyPatients.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {emergencyPatients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedEmergency(patient.id === selectedEmergency?.id ? null : patient)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                    selectedEmergency?.id === patient.id
                      ? "bg-danger/5 border-danger"
                      : "bg-white border-danger/20 hover:border-danger/50"
                  }`}
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-danger" />
                  <div className="pl-2 flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        {patient.patient_name}
                        <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                      </h4>
                      <p className="text-xs text-gray-500 font-semibold mt-1">Waiting for {patient.doctor_name || "Assignment"}</p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-danger text-white px-2 py-1 rounded-lg uppercase tracking-widest">
                      Action Required
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedEmergency && (
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 shadow-lg p-6 relative animate-fade-in">
                <button onClick={() => setSelectedEmergency(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-danger/10 text-danger rounded-2xl flex items-center justify-center shrink-0">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{selectedEmergency.patient_name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm font-semibold text-gray-500">
                      <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" /> {selectedEmergency.gender || "Unknown"}, {selectedEmergency.age || "N/A"} yrs</span>
                      <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedEmergency.patient_phone || "No Contact"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Chief Complaint / Procedure</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedEmergency.procedure || selectedEmergency.chief_complaint || "Immediate Consultation Required"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Checked In At</p>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <Hourglass className="w-4 h-4 text-warning" />
                        {formatCheckedInTime(selectedEmergency.checked_in_at)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50/50 p-5 rounded-2xl border border-danger/20">
                    <p className="text-[10px] font-bold text-danger uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Medical Alerts & Warnings
                    </p>
                    {selectedEmergency.medical_alerts?.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedEmergency.medical_alerts.map((alert, idx) => (
                          <li key={idx} className="text-xs font-black text-danger bg-white px-3 py-2 rounded-xl shadow-sm border border-danger/10">• {alert}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 bg-white/60 rounded-xl border border-dashed border-danger/20">
                        <p className="text-xs font-bold text-danger/60">No specific medical flags.</p>
                        <p className="text-[10px] font-semibold text-gray-500 mt-1">Verify with patient immediately.</p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="mt-5 px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                  onClick={() => router.push(`/frontdesk/receptionist/patients/${selectedEmergency.patient_id}`)}
                >
                  Open Full Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Grid: Appointments Panel + Live Queue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ minHeight: "560px" }}>

        {/* Unified Appointments Panel — 8 cols, full height */}
        <div className="lg:col-span-8 flex flex-col" style={{ minHeight: "560px" }}>
          <AppointmentsPanel />
        </div>

        {/* Live Queue — 4 cols */}
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col" style={{ maxHeight: "600px" }}>
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
                  <span className="truncate max-w-[80px]" title={doc.name}>{doc.name.replace("Dr. ", "")}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${queueFilter === doc.name ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {doc.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable queue list */}
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0 mt-3">
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
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    q.status === "In Chair" ? "bg-purple-500" :
                    q.priority === "Emergency" ? "bg-danger" : "bg-success"
                  }`} />
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

          <div className="pt-3 shrink-0 text-center border-t border-gray-100 mt-3">
            <p className="text-[10px] text-gray-400 font-medium">Queue updates automatically every 5 seconds.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
