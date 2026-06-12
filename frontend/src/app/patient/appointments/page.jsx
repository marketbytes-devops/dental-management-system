"use client";

import { useState } from "react";
import MyAppointmentList from "@/components/ui/patients/appointments/myAppointmentList";
import BookAppointmentModal from "@/components/ui/patients/appointments/bookAppointmentModal";
import RescheduleModal from "@/components/ui/patients/appointments/rescheduleModal";

// ─── Mock data (replace with API calls when backend is ready) ───────────────
const INITIAL_APPOINTMENTS = [
    {
        id: "APT-201",
        date: "2026-06-15",
        time: "10:30 AM",
        doctor: "Dr. Anoop Nair",
        treatment: "Root Canal",
        status: "Confirmed",
        notes: "Bring previous X-ray report",
    },
    {
        id: "APT-207",
        date: "2026-07-03",
        time: "2:00 PM",
        doctor: "Dr. Priya Sharma",
        treatment: "Orthodontic Consultation",
        status: "Pending",
        notes: "",
    },
    {
        id: "APT-198",
        date: "2026-05-12",
        time: "11:00 AM",
        doctor: "Dr. Anoop Nair",
        treatment: "Scaling & Polishing",
        status: "Completed",
        notes: "",
    },
    {
        id: "APT-185",
        date: "2026-03-20",
        time: "9:30 AM",
        doctor: "Dr. Rajan Mehta",
        treatment: "Dental Filling",
        status: "Completed",
        notes: "Lower left molar filled",
    },
    {
        id: "APT-172",
        date: "2026-01-08",
        time: "4:00 PM",
        doctor: "Dr. Sunita Pillai",
        treatment: "Tooth Extraction",
        status: "Cancelled",
        notes: "Cancelled due to scheduling conflict",
    },
];
// ────────────────────────────────────────────────────────────────────────────

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
    const [showBookModal, setShowBookModal] = useState(false);
    const [rescheduleTarget, setRescheduleTarget] = useState(null); // appointment obj

    // ── Handlers ──────────────────────────────────────────────────────────────
    function handleBook(newAppt) {
        setAppointments((prev) => [newAppt, ...prev]);
    }

    function handleReschedule(updated) {
        setAppointments((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...updated } : a))
        );
        setRescheduleTarget(null);
    }

    function handleCancel(appointment) {
        if (window.confirm(`Cancel appointment "${appointment.treatment}" on ${appointment.date}?`)) {
            setAppointments((prev) =>
                prev.map((a) => (a.id === appointment.id ? { ...a, status: "Cancelled" } : a))
            );
        }
    }

    // ── Derived stats ─────────────────────────────────────────────────────────
    const upcoming = appointments.filter((a) => a.status === "Confirmed" || a.status === "Pending");
    const completed = appointments.filter((a) => a.status === "Completed");
    const nextAppt = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    const kpiCards = [
        {
            label: "Total Appointments",
            value: appointments.length,
            sub: "All time",
            accent: "primary",
        },
        {
            label: "Upcoming",
            value: upcoming.length,
            sub: nextAppt ? `Next: ${nextAppt.date}` : "None scheduled",
            accent: "secondary",
        },
        {
            label: "Completed",
            value: completed.length,
            sub: "Visits done",
            accent: "success",
        },
        {
            label: "Cancelled",
            value: appointments.filter((a) => a.status === "Cancelled").length,
            sub: "Past cancellations",
            accent: "danger",
        },
    ];

    return (
        <div className="space-y-6">

            {/* ── Page Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage all your dental visits in one place.
                    </p>
                </div>
                <button
                    onClick={() => setShowBookModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary/30 hover:bg-primary/90 transition-colors"
                >
                    📅 Book New Appointment
                </button>
            </div>

            {/* ── KPI Cards ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => (
                    <div
                        key={card.label}
                        className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-${card.accent}/30 transition-colors`}
                    >
                        <div
                            className={`absolute top-0 right-0 w-20 h-20 bg-${card.accent}/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
                        />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            {card.label}
                        </p>
                        <h3 className="text-3xl font-extrabold text-gray-900">{card.value}</h3>
                        <p className={`text-xs font-medium mt-2 text-${card.accent}`}>{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Appointment List ─────────────────────────────────────────────── */}
            <MyAppointmentList
                appointments={appointments}
                onReschedule={(appt) => setRescheduleTarget(appt)}
                onCancel={handleCancel}
            />

            {/* ── Modals ───────────────────────────────────────────────────────── */}
            {showBookModal && (
                <BookAppointmentModal
                    onClose={() => setShowBookModal(false)}
                    onBook={handleBook}
                />
            )}

            {rescheduleTarget && (
                <RescheduleModal
                    appointment={rescheduleTarget}
                    onClose={() => setRescheduleTarget(null)}
                    onReschedule={handleReschedule}
                />
            )}

        </div>
    );
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, CheckSquare, Clock, User, AlertCircle, Sparkles, Smile, ShieldAlert } from "lucide-react";

// Wrap the main content in a Suspense boundary as Next.js requires it when using useSearchParams
function AppointmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Default to appointments list, but switch to checkin if searchParam tab is checkin
  const [activeTab, setActiveTab] = useState("history");
  
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "checkin") {
      setActiveTab("checkin");
    } else {
      setActiveTab("history");
    }
  }, [searchParams]);

  // Mock appointments state
  const [appointments, setAppointments] = useState([
    { id: "APT-201", date: "2026-06-15", time: "10:30 AM", doctor: "Dr. Anoop Nair", treatment: "Root Canal", status: "Confirmed" },
    { id: "APT-198", date: "2026-05-12", time: "11:00 AM", doctor: "Dr. Anoop Nair", treatment: "Scaling & Polishing", status: "Completed" },
  ]);

  // Self Check-in state
  const [symptoms, setSymptoms] = useState({
    pain: false,
    bleeding: false,
    swelling: false,
    sensitivity: false,
    other: "",
  });
  const [painLevel, setPainLevel] = useState(0);
  const [confirmedDetails, setConfirmedDetails] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [isCheckedInAlready, setIsCheckedInAlready] = useState(false);

  const upcomingAppt = appointments.find(a => a.status === "Confirmed" || a.status === "Checked In");

  // Handle symptoms toggle
  const toggleSymptom = (key) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Perform check-in
  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    if (!confirmedDetails) {
      alert("Please confirm that your personal and contact details are correct.");
      return;
    }

    // Update appointment status to Checked In
    setAppointments(prev => 
      prev.map(appt => appt.id === upcomingAppt.id ? { ...appt, status: "Checked In" } : appt)
    );
    setCheckInSuccess(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "checkin") {
      router.push("/patient/appointments?tab=checkin");
    } else {
      router.push("/patient/appointments");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your schedule, book new visits, and self check-in for today's treatments.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange("history")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "history"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointments History
        </button>
        <button
          onClick={() => handleTabChange("checkin")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "checkin"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Self Check-In
        </button>
      </div>

      {/* Content */}
      {activeTab === "history" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Appointment list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Your Visits</h3>
            
            {appointments.map((appt) => (
              <div 
                key={appt.id} 
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:border-primary/20 ${
                  appt.status === "Checked In" ? "border-success/30 bg-success/5" : "border-gray-100"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      appt.status === "Completed" ? "bg-gray-100 text-gray-500" : "bg-primary/10 text-primary"
                    }`}>
                      🦷
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-gray-900">{appt.treatment}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          appt.status === "Completed" 
                            ? "bg-gray-100 text-gray-500" 
                            : appt.status === "Checked In"
                              ? "bg-success/20 text-success"
                              : "bg-primary/10 text-primary"
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{appt.doctor}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {appt.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appt.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  {appt.status === "Confirmed" && (
                    <div className="flex sm:flex-col gap-2">
                      <button 
                        onClick={() => handleTabChange("checkin")}
                        className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
                      >
                        Self Check-In
                      </button>
                      <button className="px-4 py-2 border border-gray-200 text-gray-650 text-xs font-semibold rounded-xl hover:bg-gray-55 transition-colors cursor-pointer">
                        Reschedule
                      </button>
                    </div>
                  )}

                  {appt.status === "Checked In" && (
                    <div className="flex items-center gap-2 bg-success/10 text-success text-xs font-bold px-3 py-2 rounded-xl border border-success/20">
                      <span>✓ checked in. Waiting for call.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-gray-905 uppercase tracking-wider mb-4">Patient Clinic Rules</h4>
              <ul className="space-y-3 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Please arrive 10 minutes prior to your scheduled slot.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Self Check-in becomes available 1 hour before appointment time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Ensure your dental insurance details are current.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Wear masks when entering treatment chambers.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Self Check-In Form Workflow */
        <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          {!upcomingAppt ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                🗓️
              </div>
              <h3 className="text-lg font-bold text-gray-905">No Active Upcoming Appointment</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                We couldn't find any upcoming visits confirmed for today. If you have a walk-in schedule, please consult the front desk.
              </p>
            </div>
          ) : upcomingAppt.status === "Checked In" || checkInSuccess ? (
            /* Check-in success state */
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto text-4xl border border-success/20 animate-pulse">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Check-In Successful!</h3>
                <p className="text-sm text-gray-500">
                  You are now checked in for your appointment.
                </p>
              </div>

              {/* Triage / Waiting Board summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Appointment</span>
                  <span className="text-xs font-bold text-primary">{upcomingAppt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-650">Procedure:</span>
                  <span className="text-sm font-bold text-gray-900">{upcomingAppt.treatment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-650">Physician:</span>
                  <span className="text-sm font-bold text-gray-900">{upcomingAppt.doctor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-650">Expected Call:</span>
                  <span className="text-sm font-bold text-success">Within 15 mins</span>
                </div>
              </div>

              <div className="pt-4 flex gap-4 justify-center">
                <button 
                  onClick={() => handleTabChange("history")}
                  className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
                >
                  View My Appointments
                </button>
              </div>
            </div>
          ) : (
            /* Active Form */
            <form onSubmit={handleCheckInSubmit} className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-905">Self Check-In Portal</h3>
                  <p className="text-xs text-gray-500">For today's appointment: {upcomingAppt.treatment} at {upcomingAppt.time}</p>
                </div>
              </div>

              {/* Patient Verify Box */}
              <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> 1. Verify Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Patient Name</span>
                    <span className="font-bold text-gray-800">Rahul Kumar</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Patient ID</span>
                    <span className="font-bold text-gray-800">PT-10042</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Linked Insurance</span>
                    <span className="font-bold text-gray-800">Star Health (SH-2024-991)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Phone Contact</span>
                    <span className="font-bold text-gray-800">+91 98765 43210</span>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-2 border-t border-primary/10 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={confirmedDetails}
                    onChange={(e) => setConfirmedDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-primary/20"
                  />
                  <span className="text-xs font-medium text-gray-750">I confirm that all contact and insurance details listed are correct</span>
                </label>
              </div>

              {/* Symptom Checker */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> 2. Symptoms Verification (Optional)
                </h4>
                <p className="text-xs text-gray-400">Are you currently experiencing any of the following symptoms?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "pain", label: "Severe Tooth Pain 😭" },
                    { key: "bleeding", label: "Gum Bleeding 🩸" },
                    { key: "swelling", label: "Gum Swelling 🎈" },
                    { key: "sensitivity", label: "Hot/Cold Sensitivity ⚡" },
                  ].map(symp => (
                    <button
                      key={symp.key}
                      type="button"
                      onClick={() => toggleSymptom(symp.key)}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                        symptoms[symp.key] 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-gray-150 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {symp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Scale slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> 3. Rate Current Dental Pain
                  </h4>
                  <span className="text-sm font-bold text-primary">Score: {painLevel}/10</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={painLevel} 
                  onChange={(e) => setPainLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-1">
                  <span>0 - No Pain 🟢</span>
                  <span>5 - Moderate Pain 🟡</span>
                  <span>10 - Severe Pain 🔴</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!confirmedDetails}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  confirmedDetails 
                    ? "bg-success text-white hover:bg-success/90 shadow-sm shadow-success/30" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Smile className="w-4 h-4" /> Check-In My Appointment
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 animate-pulse">Loading Appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
