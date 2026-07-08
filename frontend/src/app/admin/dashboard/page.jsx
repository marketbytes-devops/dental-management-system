"use client";

import { useState, useEffect } from "react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import client from "@/services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    active_doctors: 0,
    revenue_today: 0,
    alerts_count: 0,
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("today");
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // History state
  const [historyModalPatient, setHistoryModalPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Doctors Roster state
  const [doctorsRoster, setDoctorsRoster] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Doctor Schedule Print Modal state
  const [doctorScheduleModal, setDoctorScheduleModal] = useState(null);
  const [doctorScheduleData, setDoctorScheduleData] = useState(null);
  const [doctorScheduleLoading, setDoctorScheduleLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await client.get("/admin/dashboard/stats");
      setStats(response.data);
    } catch (err) {
      console.warn("Failed to fetch dashboard stats", err);
      // Fallback to empty values if API is not responding
      setStats({
        total_patients: 0,
        total_doctors: 0,
        active_doctors: 0,
        revenue_today: 0,
        alerts_count: 0,
        recent_activities: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const response = await client.get(`/admin/appointments?filter=${appointmentFilter}`);
      setAppointments(response.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const response = await client.get("/admin/doctors");
      setDoctorsRoster(response.data);
    } catch (err) {
      console.error("Failed to fetch doctors roster", err);
      setDoctorsRoster([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [appointmentFilter]);

  const fetchPatientHistory = async (patientId, patientName) => {
    setHistoryModalPatient({ id: patientId, name: patientName });
    setHistoryLoading(true);
    try {
      const response = await client.get(`/admin/patients/${patientId}/history`);
      setPatientHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
      setPatientHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchDoctorSchedule = async (doctorId, doctorName) => {
    setDoctorScheduleModal({ id: doctorId, name: doctorName });
    setDoctorScheduleLoading(true);
    try {
      const response = await client.get(`/admin/doctors/${doctorId}/schedule`);
      setDoctorScheduleData(response.data);
    } catch (err) {
      console.error("Failed to fetch doctor schedule", err);
      setDoctorScheduleData(null);
    } finally {
      setDoctorScheduleLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and clinic performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Patients</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.total_patients.toLocaleString()}
            </h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> 12% this month
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : `₹${stats.revenue_today.toLocaleString()}`}
            </h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> 8% vs yesterday
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Doctors</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : `${stats.active_doctors} / ${stats.total_doctors}`}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-2">
              Across departments
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-danger/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">System Alerts</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.alerts_count}
            </h3>
            <p className="text-xs text-danger font-medium mt-2">
              Requires attention
            </p>
          </div>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mt-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Appointments</h3>
            <p className="text-sm text-gray-500">View and manage scheduled visits.</p>
          </div>
          <div className="flex bg-gray-100/80 p-1 rounded-xl">
            {['today', 'tomorrow', 'this_month'].map((f) => (
              <button
                key={f}
                onClick={() => setAppointmentFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  appointmentFilter === f 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                {f === 'today' ? 'Today' : f === 'tomorrow' ? 'Tomorrow' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Patient</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Token ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Treatment</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Doctor</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointmentsLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-2xl">📅</div>
                      <p>No appointments found for {appointmentFilter === 'today' ? 'today' : appointmentFilter === 'tomorrow' ? 'tomorrow' : 'this month'}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{appt.patient_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-600 font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                        {appt.token_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{appt.treatment_type || 'Consultation'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{appt.doctor_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{appt.appointment_date}</div>
                      <div className="text-xs text-gray-500">{appt.appointment_time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        appt.status === 'Confirmed' ? 'bg-success/10 text-success' :
                        appt.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        appt.status === 'Cancelled' ? 'bg-danger/10 text-danger' :
                        appt.status === 'Waiting' ? 'bg-warning/10 text-warning-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {appt.payment_status ? (
                        <button 
                          onClick={() => setSelectedAppointment(appt)}
                          className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-semibold hover:opacity-80 transition-opacity ${
                            appt.payment_status === 'Paid' ? 'bg-success/10 text-success border border-success/20' :
                            appt.payment_status === 'Cancelled' ? 'bg-gray-200 text-gray-600' :
                            'bg-warning/10 text-warning-700 border border-warning/20'
                          }`}
                        >
                          {appt.payment_status}
                        </button>
                      ) : (
                        <span className="text-gray-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => fetchPatientHistory(appt.patient_id, appt.patient_name)}
                          className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                          title="View Patient History"
                        >
                          History
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                          title="Print schedule or slip"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Dashboard Section: Doctors Roster & Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 print:block">
        
        {/* Doctors Directory Container */}
        <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden lg:col-span-2 print:border-none print:shadow-none print-section ${!historyModalPatient ? 'active-print' : 'print:hidden'}`}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:bg-white print:border-b-2 print:border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Doctors Directory & Schedule</h3>
              <p className="text-sm text-gray-500 print:hidden">Current working performance and shifts.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Specialty</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operatory</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Patients</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                {doctorsLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">Loading directory...</td>
                  </tr>
                ) : doctorsRoster.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">No active doctors found.</td>
                  </tr>
                ) : (
                  doctorsRoster.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors print:hover:bg-transparent">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{doc.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{doc.specialty}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {doc.shift}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {doc.operatory}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'On Duty' ? 'bg-success/10 text-success' :
                          doc.status === 'On Break' ? 'bg-warning/10 text-warning-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            doc.status === 'On Duty' ? 'bg-success' :
                            doc.status === 'On Break' ? 'bg-warning-500' :
                            'bg-gray-400'
                          }`}></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                          {doc.patientsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right print:hidden">
                        <button 
                          onClick={() => fetchDoctorSchedule(doc.id, doc.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors"
                          title={`Print schedule for ${doc.name}`}
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Chart Placeholder Container */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col print:hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Analytics</h3>
              <p className="text-sm text-gray-500">Track financial performance.</p>
            </div>
            <div className="flex bg-gray-100/80 p-1 rounded-xl w-full">
              <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all bg-white text-primary shadow-sm">
                Last 7 Days
              </button>
              <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-200/50">
                Last Month
              </button>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px] bg-gray-50/50">
            <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h4 className="text-gray-700 font-semibold mb-1">Chart Data Unavailable</h4>
            <p className="text-xs text-gray-500 text-center max-w-[220px]">
              Revenue chart will be populated once the Accountant Module is fully set up.
            </p>
          </div>
        </div>

      </div>

      {/* Doctor Schedule Print Modal */}
      {doctorScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity print:bg-white print:p-0 print:absolute print:inset-0 print-section active-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:rounded-none">
            
            {/* Modal Header (hidden when printing) */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
              <h3 className="text-lg font-bold text-gray-900">Schedule: {doctorScheduleModal.name}</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Print Schedule
                </button>
                <button 
                  onClick={() => { setDoctorScheduleModal(null); setDoctorScheduleData(null); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1.5 hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print-Only Header */}
            <div className="hidden print:block p-8 border-b border-gray-200 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 text-center uppercase tracking-wide">Marketbytes Dental Clinic</h1>
              <h2 className="text-xl text-gray-700 text-center mt-2">Doctor Schedule Report</h2>
              <div className="mt-6 flex justify-between text-sm text-gray-600">
                <p><strong>Doctor:</strong> {doctorScheduleData?.doctor?.name}</p>
                <p><strong>Specialty:</strong> {doctorScheduleData?.doctor?.specialty}</p>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600">
                <p><strong>Shift:</strong> {doctorScheduleData?.doctor?.shift}</p>
                <p><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto print:overflow-visible print:p-8">
              {doctorScheduleLoading ? (
                <div className="py-12 text-center text-gray-400">Loading schedule...</div>
              ) : !doctorScheduleData ? (
                <div className="py-12 text-center text-gray-400">Failed to load schedule data.</div>
              ) : (
                <>
                  {/* Doctor Info Card (screen only) */}
                  <div className="bg-gray-50/80 rounded-xl p-4 mb-6 border border-gray-100 print:hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Name</p>
                        <p className="text-sm font-medium text-gray-900">{doctorScheduleData.doctor.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Specialty</p>
                        <p className="text-sm font-medium text-gray-900">{doctorScheduleData.doctor.specialty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Shift</p>
                        <p className="text-sm font-medium text-gray-900">{doctorScheduleData.doctor.shift}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Operatory</p>
                        <p className="text-sm font-medium text-gray-900">{doctorScheduleData.doctor.operatory}</p>
                      </div>
                    </div>
                  </div>

                  {/* Appointments Table */}
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Appointments ({doctorScheduleData.appointments.length})</h4>
                  {doctorScheduleData.appointments.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                      No upcoming appointments scheduled for this doctor.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden print:border-none print:rounded-none">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 print:bg-gray-100 border-b border-gray-200">
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Treatment</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                          {doctorScheduleData.appointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{appt.appointment_date}</div>
                                <div className="text-xs text-gray-500">{appt.appointment_time}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{appt.patient_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{appt.treatment_type}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  appt.priority === 'Emergency' ? 'bg-danger/10 text-danger' :
                                  appt.priority === 'Urgent' ? 'bg-warning/10 text-warning-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {appt.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 print:text-black">
                                {appt.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1.5 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {selectedAppointment.payment_status ? (
                <div className="bg-gray-50/50 p-4 rounded-xl flex justify-between items-center border border-gray-100 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${
                      selectedAppointment.payment_status === 'Paid' ? 'bg-success/10 text-success border border-success/20' :
                      selectedAppointment.payment_status === 'Cancelled' ? 'bg-gray-200 text-gray-600' :
                      'bg-warning/10 text-warning-700 border border-warning/20'
                    }`}>
                      {selectedAppointment.payment_status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center mb-6">
                  <p className="text-sm text-gray-500">No payment data available.</p>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Patient</span>
                  <span className="text-sm font-medium text-gray-900">{selectedAppointment.patient_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Treatment</span>
                  <span className="text-sm font-medium text-gray-900">{selectedAppointment.treatment_type || 'Consultation'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-medium text-gray-900">{selectedAppointment.appointment_date}</span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="px-5 py-2 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal & Print View */}
      {historyModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity print:bg-white print:p-0 print:absolute print:inset-0 print-section active-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:rounded-none">
            
            {/* Header (Hidden when printing via specific print styling handled in a style block) */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
              <h3 className="text-lg font-bold text-gray-900">Patient History: {historyModalPatient.name}</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Print History
                </button>
                <button 
                  onClick={() => setHistoryModalPatient(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1.5 hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block p-8 border-b border-gray-200 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 text-center uppercase tracking-wide">Marketbytes Dental Clinic</h1>
              <h2 className="text-xl text-gray-700 text-center mt-2">Appointment History Report</h2>
              <div className="mt-6 flex justify-between text-sm text-gray-600">
                <p><strong>Patient Name:</strong> {historyModalPatient.name}</p>
                <p><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto print:overflow-visible print:p-8">
              {historyLoading ? (
                <div className="py-12 text-center text-gray-400">Loading history...</div>
              ) : patientHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400">No past appointments found for this patient.</div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden print:border-none print:rounded-none">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 print:bg-gray-100 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Treatment</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                      {patientHistory.map((appt) => (
                        <tr key={appt.id} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{appt.appointment_date}</div>
                            <div className="text-xs text-gray-500">{appt.appointment_time}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{appt.doctor_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{appt.treatment_type}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900 print:text-black">
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Injecting print media styles directly here so that printing specific sections hides everything else */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section.active-print, .print-section.active-print * {
            visibility: visible;
          }
          .print-section.active-print {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />

    </div>
  );
}
