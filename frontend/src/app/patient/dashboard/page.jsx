"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LastVisitSummaryCard from "@/components/ui/patients/dashboard/lastVisitSummaryCard";
import { Calendar, CreditCard, CheckSquare, Clock, Pill } from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { getPatientProfile } from "@/services/api";
import { getPatientAppointments } from "@/services/api";

export default function PatientDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Fetch patient profile
        const profileData = await getPatientProfile();
        setProfile(profileData);

        // Fetch patient appointments
        const apptsData = await getPatientAppointments(profileData.id);
        setAppointments(apptsData.map(appt => ({
          id: appt.id,
          date: appt.appointment_date,
          time: appt.appointment_time,
          doctor: appt.doctor_name,
          treatment: appt.treatment_type,
          status: appt.status,
          priority: appt.priority
        })));
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-4">Loading dashboard...</p>
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

  const currentPatient = {
    id: profile?.token || `PT-${profile?.id}`,
    name: profile?.name || "Patient",
    avatar: profile?.name ? profile.name.charAt(0).toUpperCase() : "P",
    dob: profile?.date_of_birth || "N/A",
    phone: profile?.phone || "N/A",
    email: profile?.email || "N/A",
    memberSince: profile?.created_at ? new Date(profile.created_at).toISOString().split("T")[0] : "N/A",
    oralHealthScore: 80,
    registeredVia: profile?.address_line1 ? "Online" : "Walk-in",
    insurance: { provider: "None", policyId: "N/A", coverage: 0 },
    emergencyContact: { 
      name: profile?.emergency_contact_name || "N/A", 
      phone: profile?.emergency_contact_phone || "N/A" 
    },
  };

  // Derived values
  const confirmedAppointments = appointments.filter(a => a.status === "Confirmed" || a.status === "Pending" || a.status === "Pending OTP" || a.status === "Waiting");
  const nextAppointment = confirmedAppointments[0];
  const completedAppointments = appointments.filter(a => a.status === "Completed");

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Oral Health Score</p>
            <h3 className="text-2xl font-bold text-gray-900">{currentPatient.oralHealthScore}/100</h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> Good condition
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Upcoming Appointments</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {confirmedAppointments.length}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-2">
              Next: {nextAppointment?.date ?? "None scheduled"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-danger/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Outstanding Balance</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹0
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-2">
              0 invoice(s) pending
            </p>
          </div>
        </div>

        <LastVisitSummaryCard lastVisit={completedAppointments[0]} />

      </div>

      {/* Row 2 — Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/patient/appointments" className="bg-primary/5 border border-primary/20 text-primary rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors flex items-center justify-center gap-2 group">
            <Calendar className="w-4 h-4 text-primary group-hover:text-white transition-colors" /> Book Appointment
          </Link>
          <Link href="/patient/billing" className="bg-primary/5 border border-primary/20 text-primary rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors flex items-center justify-center gap-2 group">
            <CreditCard className="w-4 h-4 text-primary group-hover:text-white transition-colors" /> Pay Outstanding Bill
          </Link>
          <Link href="/patient/check-in" className="bg-primary/5 border border-primary/20 text-primary rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors flex items-center justify-center gap-2 group">
            <CheckSquare className="w-4 h-4 text-primary group-hover:text-white transition-colors" /> Self Check-In
          </Link>
        </div>
      </div>

      {/* Row 3 — Next Appointment + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Next Appointment */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Next Appointment</h3>
          {nextAppointment ? (
            <div className="space-y-3">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-sm font-semibold text-gray-900">{nextAppointment.treatment}</p>
                <p className="text-xs text-gray-500 mt-1">{nextAppointment.doctor}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-medium text-primary flex items-center gap-1"><Calendar className="w-3 h-3" /> {nextAppointment.date}</span>
                  <span className="text-xs font-medium text-primary flex items-center gap-1"><Clock className="w-3 h-3" /> {nextAppointment.time}</span>
                </div>
                <span className="inline-block mt-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-success/10 text-success">
                  {nextAppointment.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href="/patient/check-in" className="flex-1 text-xs font-medium bg-primary/5 border border-primary/20 text-primary rounded-xl py-2 hover:bg-primary hover:text-white hover:border-primary transition-colors text-center shadow-sm">
                  Check In
                </Link>
                <Link href="/patient/appointments" className="flex-1 text-xs font-medium bg-primary/5 border border-primary/20 text-primary rounded-xl py-2 hover:bg-primary hover:text-white hover:border-primary transition-colors text-center shadow-sm">
                  Reschedule
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No upcoming appointments.</p>
              <Link href="/patient/appointments" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                Book one now →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <Link href="/patient/records" className="text-sm text-primary font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {completedAppointments.slice(0, 3).map(appt => (
              <div key={appt.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                  <ToothIcon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Visit Completed</p>
                  <p className="text-xs text-gray-500">{appt.treatment} by {appt.doctor}</p>
                </div>
                <span className="text-xs text-gray-400">{appt.date}</span>
              </div>
            ))}

            {completedAppointments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No recent completed visits.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}