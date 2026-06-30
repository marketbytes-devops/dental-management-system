"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LastVisitSummaryCard from "@/components/ui/patients/dashboard/lastVisitSummaryCard";
import HealthScoreCard from "@/components/ui/patients/dashboard/HealthScoreCard";
import { Calendar, CreditCard, CheckSquare, Clock, Pill, X, AlertCircle, Award, CheckCircle } from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { getPatientProfile, getPatientAppointments, getOralHealthDetails, getPatientPrescriptions } from "@/services/api";

export default function PatientDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [oralHealthDetails, setOralHealthDetails] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isLastVisitModalOpen, setIsLastVisitModalOpen] = useState(false);

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
          priority: appt.priority,
          symptoms: appt.symptoms
        })));

        // Fetch dynamic oral health score
        try {
          const healthData = await getOralHealthDetails();
          setOralHealthDetails(healthData);
        } catch (healthErr) {
          console.error("Failed to load oral health score details:", healthErr);
        }

        // Fetch prescriptions
        try {
          const rxData = await getPatientPrescriptions();
          setPrescriptions(rxData);
        } catch (rxErr) {
          console.error("Failed to load prescriptions:", rxErr);
        }

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
  const lastVisit = completedAppointments[0];

  // Match medications for last visit
  const lastVisitPrescriptions = lastVisit
    ? prescriptions.filter(rx => {
        const rxDate = new Date(rx.created_at).toISOString().split("T")[0];
        return rxDate === lastVisit.date || rx.doctor_name === lastVisit.doctor;
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <HealthScoreCard score={oralHealthDetails?.score ?? 95} onClick={() => setIsHealthModalOpen(true)} />

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

        <LastVisitSummaryCard lastVisit={lastVisit} onClick={() => setIsLastVisitModalOpen(true)} />

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

      {/* Oral Health Score Details Modal */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Oral Health Report</h3>
                  <p className="text-xs text-gray-500">Comprehensive health breakdown</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHealthModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Score Display */}
              <div className="flex items-center gap-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-150">
                  <span className="text-3xl font-extrabold text-primary">{oralHealthDetails?.score ?? 95}</span>
                  <span className="text-[10px] text-gray-400 font-bold absolute bottom-2">/100</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    Status: <span className="text-primary">{oralHealthDetails?.label ?? "Excellent"}</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated dynamically based on your diagnosed conditions and treatment completion rate ({Math.round((oralHealthDetails?.completion_rate ?? 1.0) * 100)}%).
                  </p>
                </div>
              </div>

              {/* Diagnosed Conditions / Deductions */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Diagnosed Conditions & Impacts</h4>
                {oralHealthDetails?.deductions && oralHealthDetails.deductions.length > 0 ? (
                  <div className="space-y-2.5">
                    {oralHealthDetails.deductions.map((ded, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-danger/5 border border-danger/10 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800">{ded.condition}</span>
                        </div>
                        <span className="text-xs font-semibold text-danger">-{ded.penalty} pts</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-success font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> 
                      Progress recovery applied: +{Math.round((oralHealthDetails?.completion_rate ?? 0) * 100)}% of penalties restored!
                    </p>
                  </div>
                ) : (
                  <div className="bg-success/5 border border-success/10 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-success flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> No active clinical anomalies detected.
                    </p>
                  </div>
                )}
              </div>

              {/* Personalized Tips */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personalized Care Tips</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {oralHealthDetails?.tips && oralHealthDetails.tips.length > 0 ? (
                    oralHealthDetails.tips.map((tip, idx) => (
                      <div key={idx} className="bg-primary/5 rounded-xl p-3 border border-primary/10 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{tip}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No active tips available. Keep up the good hygiene!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsHealthModalOpen(false)}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Visit Details Modal */}
      {isLastVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <ToothIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Visit Summary Detail</h3>
                  <p className="text-xs text-gray-500">History and clinical records</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLastVisitModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Visit Details */}
              {lastVisit ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Treatment</p>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{lastVisit.treatment}</h4>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attending Dentist</p>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{lastVisit.doctor}</h4>
                    </div>
                    <div className="pt-2 border-t border-gray-200/60 col-span-2 flex justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                        <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 inline text-gray-400" /> {lastVisit.date}
                        </h4>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
                        <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 inline text-gray-400" /> {lastVisit.time}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaint / Symptoms */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chief Complaint / Symptoms</h4>
                    <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100 text-xs text-purple-950 font-medium">
                      {lastVisit.symptoms || "Routine check-up and clinical observation."}
                    </div>
                  </div>

                  {/* Associated Prescriptions */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prescriptions Issued</h4>
                    {lastVisitPrescriptions.length > 0 ? (
                      <div className="space-y-3">
                        {lastVisitPrescriptions.map((rx, idx) => (
                          <div key={idx} className="border border-gray-150 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                              <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                <Pill className="w-3.5 h-3.5 text-primary" /> Prescription #{rx.id}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold">{new Date(rx.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="space-y-1.5">
                              {rx.medications.map((med, mIdx) => (
                                <div key={mIdx} className="flex justify-between text-xs">
                                  <span className="font-semibold text-gray-700">{med.name} ({med.dosage})</span>
                                  <span className="text-gray-500">{med.frequency} — {med.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400 font-medium">No medications or prescriptions were issued during this visit.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No visit history found.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsLastVisitModalOpen(false)}
                className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}