"use client";

import { useState } from "react";
import MyAppointmentList from "@/components/ui/patients/appointments/myAppointmentList";
import BookAppointmentModal from "@/components/ui/patients/appointments/bookAppointmentModal";
import RescheduleModal from "@/components/ui/patients/appointments/rescheduleModal";
import { Calendar } from "lucide-react";

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
                </div>
                <button
                    onClick={() => setShowBookModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 border border-primary/20 text-primary text-sm font-semibold rounded-xl shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-pointer"
                >
                    <Calendar className="w-4 h-4" /> Book New Appointment
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
}
