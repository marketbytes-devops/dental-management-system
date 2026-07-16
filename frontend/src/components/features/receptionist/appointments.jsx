"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Clock, CheckCircle2, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  getDoctorLeaves, 
  getTodayAppointments, 
  getTomorrowAppointments, 
  getAllPatients, 
  getFrontdeskDoctors, 
  updateAppointmentStatus, 
  createAppointment, 
  payConsultation 
} from "@/services/api";

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  "Checked In": "bg-green-50 text-green-700 border-green-200",
  Waiting: "bg-green-50 text-green-700 border-green-200",
  "In Chair": "bg-purple-50 text-purple-700 border-purple-200",
  Confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Pending OTP": "bg-yellow-50 text-yellow-700 border-yellow-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
  Completed: "bg-gray-100 text-gray-500 border-gray-200",
};
const statusStyle = (s) => STATUS_STYLES[s] ?? "bg-gray-100 text-gray-500 border-gray-200";

// ── reusable primitives ───────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={
        "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 " +
        "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition " +
        className
      }
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition appearance-none"
    >
      {children}
    </select>
  );
}

// ── appointment table ─────────────────────────────────────────────────────────
function AppointmentTable({ rows, isLoading, emptyText, onCancel, onElevateEmergency, onPayConsultation }) {
  if (isLoading)
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );

  if (!rows.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
        <CalendarDays className="w-9 h-9 opacity-25" />
        <p className="text-sm font-medium">{emptyText}</p>
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[680px]">
        <thead>
          <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {["Patient", "Time", "Doctor", "Treatment", "Status", ""].map((h, i) => (
              <th key={i} className={`px-5 py-3 ${h === "" ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => (
            <tr key={app.id} className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors">
              <td className="px-5 py-4">
                <p className="font-semibold text-sm text-gray-900">{app.patient?.name ?? "Unknown"}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{app.patient?.token} · {app.patient?.phone}</p>
              </td>
              <td className="px-5 py-4 text-sm font-mono text-gray-600">{app.appointment_time}</td>
              <td className="px-5 py-4 text-sm text-gray-600">{app.doctor_name}</td>
              <td className="px-5 py-4 text-sm text-gray-700">{app.treatment_type}</td>
              <td className="px-5 py-4">
                <span className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${statusStyle(app.status)}`}>
                  {app.status}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                {app.status === "In Chair" ? (
                  <span className="text-xs text-purple-600 font-semibold flex items-center justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> In Treatment
                  </span>
                ) : app.status === "Cancelled" || app.status === "Completed" ? (
                  <span className="text-xs text-gray-400">{app.status}</span>
                ) : (
                  <div className="flex gap-2 justify-end">
                    {app.status === "Confirmed" && app.payment_status !== "Paid" && (
                      <button
                        onClick={() => onPayConsultation(app.id, app.patient?.name)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg border border-green-600 transition cursor-pointer shadow-sm shadow-green-600/20"
                      >
                        Payment
                      </button>
                    )}
                    <button
                      onClick={() => onCancel(app.id, app.patient?.name)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

function PaymentModal({ isOpen, onClose, onConfirm, patientName }) {
  const [method, setMethod] = useState("Cash");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Payment Collection</h3>
            <p className="text-xs text-gray-500 mt-0.5">Consultation & Registration Fees</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition bg-white border border-gray-200 rounded-lg p-1.5 hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</p>
              <p className="font-bold text-gray-900 mt-0.5">{patientName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount Due</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">?100.00</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {["Cash", "Card", "Online"].map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={"py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all " + (
                      method === m 
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600" 
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {m === "Online" ? "UPI / Net" : m}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition shadow-sm">
            Cancel
          </button>
          <button onClick={() => onConfirm(method)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
            Confirm Payment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, id: null, name: "" });

  // booking form
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // schedule section
  const [activeTab, setActiveTab] = useState("today"); // "today" | "tomorrow"
  const [tableSearch, setTableSearch] = useState("");

  const TODAY = new Date().toISOString().split("T")[0];
  const TYPES = ["Consultation", "Routine check-up", "Follow-up checkup"];

  const getCurrentFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [form, setForm] = useState({
    appointment_time: getCurrentFormattedTime(),
    appointment_date: TODAY,
    doctor_name: "",
    treatment_type: "Consultation",
  });

  const [doctorLeaves, setDoctorLeaves] = useState([]);


  useEffect(() => {
    const fetchDoctorLeaves = async () => {
      if (!form.doctor_name) {
        setDoctorLeaves([]);
        return;
      }
      try {
        const data = await getDoctorLeaves(form.doctor_name);
        setDoctorLeaves(data);
      } catch (e) {
        console.error("Failed to fetch doctor leaves:", e);
      }
    };
    fetchDoctorLeaves();
  }, [form.doctor_name]);

  useEffect(() => {
    if (form.appointment_date && form.doctor_name && doctorLeaves.length > 0) {
      const selectedDate = new Date(form.appointment_date);
      selectedDate.setHours(0, 0, 0, 0);
      
      const isOnLeave = doctorLeaves.some(leave => {
        const start = new Date(leave.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.end_date);
        end.setHours(0, 0, 0, 0);
        return selectedDate >= start && selectedDate <= end;
      });
      
      if (isOnLeave) {
        alert(`${form.doctor_name} is on leave on this day. Please select another date.`);
        setForm(prev => ({ ...prev, appointment_date: "" }));
      }
    }
  }, [form.appointment_date, doctorLeaves, form.doctor_name]);

  // Fetch appointments and patients
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [todayData, tomorrowData, patientsData, doctorsData] = await Promise.all([
        getTodayAppointments(),
        getTomorrowAppointments(),
        getAllPatients(),
        getFrontdeskDoctors(form.appointment_date),
      ]);
      setAppointments(todayData);
      setTomorrowAppointments(tomorrowData);
      setPatients(patientsData);
      setDoctors(doctorsData);
      if (doctorsData.length > 0 && !doctorsData.some(d => d.name === form.doctor_name)) {
        setForm((f) => ({ ...f, doctor_name: doctorsData[0].name }));
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // Fetch active doctors based on selected date
  useEffect(() => {
    const fetchDoctorsForDate = async () => {
      try {
        const doctorsData = await getFrontdeskDoctors(form.appointment_date);
        setDoctors(doctorsData);
        if (doctorsData.length > 0 && !doctorsData.some(d => d.name === form.doctor_name)) {
          setForm(prev => ({ ...prev, doctor_name: doctorsData[0].name }));
        }
      } catch (err) {
        console.error("Error fetching doctors for date:", err);
      }
    };
    fetchDoctorsForDate();
  }, [form.appointment_date]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  // patient search dropdown
  const filteredPatients = searchPatient.trim() === "" ? [] : patients.filter((p) =>
    p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.token.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.phone.includes(searchPatient)
  );

  // table search filter
  const activeRows = (activeTab === "today" ? appointments : tomorrowAppointments).filter((app) => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      app.patient?.name?.toLowerCase().includes(q) ||
      app.patient?.token?.toLowerCase().includes(q) ||
      app.patient?.phone?.includes(q) ||
      app.doctor_name?.toLowerCase().includes(q) ||
      app.treatment_type?.toLowerCase().includes(q) ||
      app.status?.toLowerCase().includes(q)
    );
  });

  const handleCancel = async (id, name) => {
    if (!window.confirm(`Cancel appointment for ${name}?`)) return;
    try {
      await updateAppointmentStatus(id, { status: "Cancelled" });
      alert("Appointment cancelled.");
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to cancel.");
    }
  };

  const handleElevateEmergency = async (id, name) => {
    if (!window.confirm(`Elevate patient ${name}'s appointment to Emergency status?`)) return;
    try {
      await updateAppointmentStatus(id, { priority: "Emergency" });
      alert(`Appointment for ${name} elevated to Emergency.`);
      fetchData();
    } catch (err) {
      alert("Error elevating to emergency: " + (err.message || "Failed."));
    }
  };

  const handlePayConsultationClick = (id, name) => {
    setPaymentModal({ isOpen: true, id, name });
  };

  const handlePayConsultationConfirm = async (method) => {
    try {
      await payConsultation(paymentModal.id, { amount: 100.0, payment_method: method });
      alert(`Payment collected via ${method}! ${paymentModal.name} has been added to the queue.`);
      setPaymentModal({ isOpen: false, id: null, name: "" });
      fetchData();
    } catch (err) {
      alert(err.message || "Payment failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) { alert("Please select a registered patient."); return; }
    if (form.appointment_date < TODAY) { alert("Date cannot be in the past."); return; }
    try {
      const data = await createAppointment({
        patient_id: selectedPatient.id,
        doctor_name: form.doctor_name,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        treatment_type: form.treatment_type,
        status: "Confirmed",
        priority: "Routine",
      });

      let msg = `Appointment booked for ${selectedPatient.name}!`;
      alert(msg);
      setSelectedPatient(null);
      setSearchPatient("");
      setForm({ appointment_time: getCurrentFormattedTime(), appointment_date: TODAY, doctor_name: doctors[0]?.name ?? "", treatment_type: "Consultation" });
      fetchData();
    } catch (err) {
      alert(err.message || "Booking failed.");
    }
  };

  const todayCount = appointments.length;
  const tomorrowCount = tomorrowAppointments.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, id: null, name: "" })}
        onConfirm={handlePayConsultationConfirm}
        patientName={paymentModal.name}
      />

      {/* header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Appointment Booking</h1>
        <p className="text-sm text-gray-500 mt-1">Schedule visits for registered patients and review the daily schedule.</p>
      </div>

      {/* ── booking form ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">New Appointment</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to book a visit.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Patient search */}
            <div className="relative md:col-span-2">
              <FieldLabel required>Patient</FieldLabel>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name, ID, or phone…"
                  value={searchPatient}
                  onChange={(e) => { setSearchPatient(e.target.value); setShowDropdown(true); if (selectedPatient) setSelectedPatient(null); }}
                  onFocus={() => setShowDropdown(true)}
                />
                {selectedPatient && <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
              </div>
              {showDropdown && searchPatient.trim() !== "" && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <p className="p-3 text-xs text-gray-400 text-center">No patient found. Register them first.</p>
                  ) : filteredPatients.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelectedPatient(p); setSearchPatient(`${p.name} (${p.token})`); setShowDropdown(false); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex justify-between items-center gap-2"
                    >
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                        <span className="text-xs text-gray-400 ml-1">({p.token})</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <FieldLabel required>Date</FieldLabel>
              <Input type="date" value={form.appointment_date} min={TODAY} onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))} required />
            </div>

            {/* Doctor */}
            <div>
              <FieldLabel>Doctor</FieldLabel>
              <Select value={form.doctor_name} onChange={(e) => setForm((f) => ({ ...f, doctor_name: e.target.value }))}>
                <option value="">Select…</option>
                {doctors.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </Select>
            </div>

            {/* Time */}
            <div>
              <FieldLabel required>Time</FieldLabel>
              <Input type="text" placeholder="e.g. 11:30 AM" value={form.appointment_time} onChange={(e) => setForm((f) => ({ ...f, appointment_time: e.target.value }))} required />
            </div>

            {/* Treatment */}
            <div>
              <FieldLabel>Treatment</FieldLabel>
              <Select value={form.treatment_type} onChange={(e) => setForm((f) => ({ ...f, treatment_type: e.target.value }))}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-3 justify-end">
              <button type="submit"
                className="py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white text-sm font-bold rounded-xl transition cursor-pointer"
              >
                Book Appointment
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ── schedule section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* card header: title + toggle + search */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">

          {/* title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">
              {activeTab === "today" ? "Today's" : "Tomorrow's"} Appointments
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeTab === "today" ? todayCount : tomorrowCount} appointment{(activeTab === "today" ? todayCount : tomorrowCount) !== 1 ? "s" : ""}
              {tableSearch && ` · ${activeRows.length} match${activeRows.length !== 1 ? "es" : ""}`}
            </p>
          </div>

          {/* pill toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
            <button
              onClick={() => { setActiveTab("today"); setTableSearch(""); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === "today"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Today
              {todayCount > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "today" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                  {todayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("tomorrow"); setTableSearch(""); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === "tomorrow"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Tomorrow
              {tomorrowCount > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "tomorrow" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                  {tomorrowCount}
                </span>
              )}
            </button>
          </div>

          {/* search */}
          <div className="relative shrink-0 w-56">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter appointments…"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* table */}
        <div className="p-0">
          <AppointmentTable
            rows={activeRows}
            isLoading={isLoading}
            emptyText={
              tableSearch
                ? `No appointments match "${tableSearch}".`
                : `No appointments scheduled for ${activeTab === "today" ? "today" : "tomorrow"}.`
            }
            onCancel={handleCancel}
            onElevateEmergency={handleElevateEmergency}
            onPayConsultation={handlePayConsultationClick}
          />
        </div>
      </div>

    </div>
  );
}