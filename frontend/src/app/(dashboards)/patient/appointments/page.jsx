"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MyAppointmentList from "@/components/features/patients/appointments/myAppointmentList";
import BookAppointmentModal from "@/components/features/patients/appointments/bookAppointmentModal";
import RescheduleModal from "@/components/features/patients/appointments/rescheduleModal";
import { Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getPatientProfile, getPatientAppointments, updateAppointmentStatus } from "@/services/api";

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [patientId, setPatientId] = useState(null);
    const [showBookModal, setShowBookModal] = useState(false);
    const [rescheduleTarget, setRescheduleTarget] = useState(null); // appointment obj
    const searchParams = useSearchParams();
    const [prefilledBooking, setPrefilledBooking] = useState(null);

    const fetchPatientAppointments = async (pId) => {
        try {
            const data = await getPatientAppointments(pId);
            setAppointments(data.map(appt => ({
                id: appt.id,
                date: appt.appointment_date,
                time: appt.appointment_time,
                doctor: appt.doctor_name,
                treatment: appt.treatment_type,
                status: appt.status,
                notes: appt.symptoms || "",
            })));
        } catch (err) {
            console.error("Error fetching appointments:", err);
        }
    };

    useEffect(() => {
        async function initAppointments() {
            const token = localStorage.getItem("patient_jwt_token");
            if (!token) {
                setError("Please log in to view appointments.");
                setLoading(false);
                return;
            }

            try {
                // Fetch profile to get patient ID
                const profileData = await getPatientProfile();
                setPatientId(profileData.id);
                await fetchPatientAppointments(profileData.id);
            } catch (err) {
                console.error("Appointments page initialization error:", err);
                setError(err.message || "An error occurred.");
            } finally {
                setLoading(false);
                
                // Check if we need to auto-open the booking modal
                if (searchParams.get("action") === "book") {
                    setPrefilledBooking({
                        doctorId: searchParams.get("doctorId"),
                        date: searchParams.get("date"),
                        time: searchParams.get("time"),
                        autoSubmit: true,
                    });
                    setShowBookModal(true);
                }
            }
        }
        initAppointments();
    }, [searchParams]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    function handleBook(newAppt) {
        setAppointments((prev) => [newAppt, ...prev]);
    }

    async function handleReschedule(updated) {
        try {
            const data = await updateAppointmentStatus(updated.id, {
                appointment_date: updated.date,
                appointment_time: updated.time
            });

            setAppointments((prev) =>
                prev.map((a) => (a.id === data.id ? { 
                    ...a, 
                    date: data.appointment_date, 
                    time: data.appointment_time,
                    status: data.status 
                } : a))
            );
            setRescheduleTarget(null);
        } catch (err) {
            alert(err.message || "Failed to reschedule appointment.");
        }
    }

    async function handleCancel(appointment) {
        if (!window.confirm(`Cancel appointment "${appointment.treatment}" on ${appointment.date}?`)) {
            return;
        }

        try {
            const data = await updateAppointmentStatus(appointment.id, {
                status: "Cancelled"
            });

            setAppointments((prev) =>
                prev.map((a) => (a.id === data.id ? { ...a, status: "Cancelled" } : a))
            );
        } catch (err) {
            alert(err.message || "Failed to cancel appointment.");
        }
    }

    // ── Derived stats ─────────────────────────────────────────────────────────
    const upcoming = appointments.filter((a) => a.status === "Confirmed" || a.status === "Pending" || a.status === "Pending OTP" || a.status === "Waiting");
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 mt-4">Loading appointments...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto text-center space-y-4 py-10 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <p className="text-sm text-gray-700 font-semibold">{error}</p>
                <Link
                    href="/login"
                    className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

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
                        <p className="text-xs font-semibold text-gray-505 uppercase tracking-wider mb-1">
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
                    patientId={patientId}
                    initialData={prefilledBooking}
                    onClose={() => {
                        setShowBookModal(false);
                        setPrefilledBooking(null);
                        // Optional: clean up URL
                        if (searchParams.get("action") === "book") {
                            window.history.replaceState(null, "", "/patient/appointments");
                        }
                    }}
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
