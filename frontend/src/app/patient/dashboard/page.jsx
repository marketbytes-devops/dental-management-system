"use client";

import Link from "next/link";

export default function PatientDashboardPage() {

  // Mock Data — replace with API calls when backend is ready
  const currentPatient = {
    id: "PT-10042",
    name: "Rahul Kumar",
    avatar: "R",
    dob: "1990-04-15",
    phone: "+91 98765 43210",
    email: "rahul@example.com",
    memberSince: "2022-08-10",
    oralHealthScore: 78,
    registeredVia: "Walk-in",
    insurance: { provider: "Star Health", policyId: "SH-2024-991", coverage: 70 },
    emergencyContact: { name: "Priya Kumar", relation: "Spouse", phone: "+91 91234 56789" },
  };

  const myAppointments = [
    { id: "APT-201", date: "2026-06-15", time: "10:30 AM", doctor: "Dr. Anoop Nair", treatment: "Root Canal", status: "Confirmed" },
    { id: "APT-198", date: "2026-05-12", time: "11:00 AM", doctor: "Dr. Anoop Nair", treatment: "Scaling & Polishing", status: "Completed" },
  ];

  const myPrescriptions = [
    { id: "RX-501", date: "2026-05-12", drug: "Amoxicillin 500mg", dosage: "1 cap × 3 times/day for 5 days", doctor: "Dr. Anoop Nair", active: true },
  ];

  const myInvoices = [
    { id: "INV-089", date: "2026-05-12", treatment: "Scaling & Polishing", gross: 1500, insurancePaid: 1050, patientDue: 450, status: "Paid" },
    { id: "INV-094", date: "2026-06-15", treatment: "Root Canal", gross: 8000, insurancePaid: 5600, patientDue: 2400, status: "Pending" },
  ];

  // Derived values
  const nextAppointment = myAppointments.find(a => a.status === "Confirmed");
  const completedAppointments = myAppointments.filter(a => a.status === "Completed");
  const pendingInvoices = myInvoices.filter(i => i.status === "Pending");
  const activeRx = myPrescriptions.filter(p => p.active);
  const outstandingBalance = pendingInvoices.reduce((sum, i) => sum + i.patientDue, 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {currentPatient.name}. Here's your health summary.
        </p>
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
              {myAppointments.filter(a => a.status === "Confirmed").length}
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
              ₹{outstandingBalance.toLocaleString()}
            </h3>
            <p className="text-xs text-danger font-medium mt-2">
              {pendingInvoices.length} invoice(s) pending
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Prescriptions</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeRx.length}</h3>
            <p className="text-xs text-warning font-medium mt-2">
              Take medications on time
            </p>
          </div>
        </div>

      </div>

      {/* Row 2 — Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/patient/appointments" className="bg-primary text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary/90 shadow-sm shadow-primary/30 transition-colors flex items-center justify-center gap-2">
            📅 Book Appointment
          </Link>
          <Link href="/patient/billing" className="bg-white text-gray-700 rounded-xl px-6 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            💳 Pay Outstanding Bill
          </Link>
          <Link href="/patient/check-in" className="bg-white text-gray-700 rounded-xl px-6 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            ✅ Self Check-In
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
                  <span className="text-xs font-medium text-primary">📅 {nextAppointment.date}</span>
                  <span className="text-xs font-medium text-primary">🕐 {nextAppointment.time}</span>
                </div>
                <span className="inline-block mt-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-success/10 text-success">
                  {nextAppointment.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href="/patient/check-in" className="flex-1 text-xs font-medium bg-primary text-white rounded-xl py-2 hover:bg-primary/90 transition-colors text-center">
                  Check In
                </Link>
                <Link href="/patient/appointments" className="flex-1 text-xs font-medium border border-gray-200 text-gray-600 rounded-xl py-2 hover:bg-gray-50 transition-colors text-center">
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

            {completedAppointments.slice(0, 1).map(appt => (
              <div key={appt.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                  🦷
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Visit Completed</p>
                  <p className="text-xs text-gray-500">{appt.treatment} by {appt.doctor}</p>
                </div>
                <span className="text-xs text-gray-400">{appt.date}</span>
              </div>
            ))}

            {activeRx.slice(0, 1).map(rx => (
              <div key={rx.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning text-lg">
                  💊
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Prescription Issued</p>
                  <p className="text-xs text-gray-500">{rx.drug} — {rx.dosage}</p>
                </div>
                <span className="text-xs text-gray-400">{rx.date}</span>
              </div>
            ))}

            {pendingInvoices.slice(0, 1).map(inv => (
              <div key={inv.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger text-lg">
                  💳
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Invoice Pending</p>
                  <p className="text-xs text-gray-505">{inv.treatment} — ₹{inv.patientDue.toLocaleString()} due</p>
                </div>
                <span className="text-xs text-gray-405">{inv.date}</span>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}