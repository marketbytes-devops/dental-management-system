"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import DashboardHeader from "@/components/features/doctor/dashboard/DashboardHeader";
import KpiCards from "@/components/features/doctor/dashboard/KpiCards";
import { getDoctorDashboardAppointments } from "@/services/api";
import { 
  ArrowRight, 
  Calendar, 
  Stethoscope, 
  Pill, 
  Award, 
  ShieldAlert, 
  Scissors, 
  Sparkles 
} from "lucide-react";

const SPECIALTY_MAP = {
  "General Dentistry": "general",
  "Endodontics": "endodontics",
  "Orthodontics": "orthodontics",
  "Periodontics": "periodontics",
  "Oral Surgery": "surgery",
  "Prosthodontics": "prosthodontics"
};

const SPECIALTY_DETAILS = {
  general: { label: "General Dentistry", icon: Stethoscope },
  endodontics: { label: "Endodontics", icon: Pill },
  orthodontics: { label: "Orthodontics", icon: Award },
  periodontics: { label: "Periodontics", icon: ShieldAlert },
  surgery: { label: "Oral Surgery", icon: Scissors },
  prosthodontics: { label: "Prosthodontics", icon: Sparkles }
};

const SPECIALTY_PROCEDURES = {
  general: ["general dentistry", "consultation", "routine check-up", "follow-up check-up", "teeth cleaning", "scaling & polishing", "dental filling", "composite filling", "amalgam filling", "scaling and polishing", "teeth cleaning / polishing", "fluoride treatment", "sealants (pit and fissure)", "teeth whitening", "night guard / occlusal splint"],
  endodontics: ["endodontics", "root canal", "rct", "pulpotomy", "apicoectomy", "root canal treatment (rct)", "root canal treatment (rct) - single sitting", "root canal treatment (rct) - multiple sitting", "root canal retreatment"],
  orthodontics: ["orthodontics", "orthodontic", "braces", "braces - metal", "braces - self-ligating", "braces - ceramic", "clear aligners", "palatal expander (rme)", "space maintainer", "habit-breaking appliance", "retainer-only treatment", "retainer fitting", "orthodontic consultation"],
  periodontics: ["periodontics", "deep cleaning", "gum surgery", "scaling and root planing", "periodontal maintenance"],
  surgery: ["oral surgery", "surgery", "simple extraction", "surgical extraction (impacted tooth, wisdom tooth)", "orthognathic surgery", "tooth extraction", "wisdom tooth removal", "dental implant surgery", "biopsy"],
  prosthodontics: ["prosthodontics", "crown – single tooth", "bridge (multi-tooth)", "complete denture (full set)", "partial denture (removable)", "implant-supported crown/bridge", "veneers", "crown fitting", "bridge installation", "denture adjustment"]
};

export default function DoctorDashboardPage() {
  const {
    activePatientToken,
    queue,
    labOrders,
    activePatient,
    hasUrgentInQueue,
    currentDoctorName,
    patients = {}
  } = useDoctor();

  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("today");
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [doctorSpecialties, setDoctorSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("general");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const isIncomplete = !user.dob || !user.phone || !user.address || !user.licence_id || !user.chair_setup || !user.board;
          setIsProfileIncomplete(isIncomplete);

          const specs = user.specialties || ["General Dentistry"];
          const mappedSpecs = specs.map(s => SPECIALTY_MAP[s] || "general");
          setDoctorSpecialties(mappedSpecs);
          if (mappedSpecs.length > 0) {
            setSelectedSpecialty(mappedSpecs[0]);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!currentDoctorName) return;
    let isMounted = true;
    
    const fetchAppointments = async () => {
      setAppointmentsLoading(true);
      try {
        const response = await getDoctorDashboardAppointments(currentDoctorName, appointmentFilter);
        if (isMounted) setAppointments(response);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
        if (isMounted) setAppointments([]);
      } finally {
        if (isMounted) setAppointmentsLoading(false);
      }
    };

    fetchAppointments();
    
    return () => { isMounted = false; };
  }, [currentDoctorName, appointmentFilter]);

  const isPatientForSpecialty = (patient, specId) => {
    if (!patient || !specId) return false;
    const proc = (patient.procedure || "").toLowerCase();
    const validProcs = SPECIALTY_PROCEDURES[specId] || [];
    return validProcs.some(val => proc.includes(val) || val.includes(proc));
  };

  // Filter active patient by selected specialty
  const activePatientForSpec = isPatientForSpecialty(activePatient, selectedSpecialty) ? activePatient : null;
  const activePatientTokenForSpec = activePatientForSpec ? activePatientToken : "";

  // Filter queue by selected specialty
  const filteredQueue = queue.filter(q => {
    const pt = patients[q.token];
    return isPatientForSpecialty(pt, selectedSpecialty);
  });

  // Metrics
  const totalWaiting = filteredQueue.filter(q => q.status === "Waiting").length;
  // Fallback for totalAlerts since patients dictionary was removed
  const totalAlerts = 0; 

  // Filter appointments list by selected specialty
  const filteredAppointments = appointments.filter(appt => {
    const treatment = (appt.treatment_type || "").toLowerCase();
    const validProcs = SPECIALTY_PROCEDURES[selectedSpecialty] || [];
    return validProcs.some(val => treatment.includes(val) || val.includes(treatment));
  });

  // Generate past 6 months for the dropdown
  const getRecentMonths = () => {
    const months = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const label = m.toLocaleString('default', { month: 'long', year: 'numeric' });
      const val = `month_${m.getFullYear()}-${(m.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push({ label, val });
    }
    return months;
  };
  const recentMonths = getRecentMonths();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <DashboardHeader />

      {/* Profile Incomplete Notification Banner */}
      {isProfileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <span>
              <strong>Profile Incomplete:</strong> Please update your profile details (Date of Birth, Phone, Address) and professional credentials (License ID, Chair Setup, Board) to complete your clinic account setup.
            </span>
          </div>
          <Link 
            href="/doctor/profile"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 text-center hover:scale-102"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {/* Specialty Tabs Switcher */}
      {doctorSpecialties.length > 1 && (
        <div className="flex flex-wrap gap-2.5 pb-2 border-b border-gray-100">
          {doctorSpecialties.map((specId) => {
            const specInfo = SPECIALTY_DETAILS[specId];
            if (!specInfo) return null;
            const Icon = specInfo.icon;
            const isActive = selectedSpecialty === specId;

            return (
              <button
                key={specId}
                type="button"
                onClick={() => setSelectedSpecialty(specId)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer outline-none hover:scale-102 ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20 shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50/80"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {specInfo.label}
              </button>
            );
          })}
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards
        activePatientName={activePatientForSpec?.name}
        activePatientToken={activePatientTokenForSpec}
        totalWaiting={totalWaiting}
        totalAlerts={totalAlerts}
        hasUrgentInQueue={hasUrgentInQueue}
        activePatientHref={activePatientTokenForSpec ? `/doctor/workspace/${selectedSpecialty}?patientToken=${activePatientTokenForSpec}` : `/doctor/workspace/${selectedSpecialty}`}
      />

      {/* Appointments Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mt-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> My Appointments
            </h3>
            <p className="text-sm text-gray-500 mt-1">View and manage your scheduled visits.</p>
          </div>
          <div className="flex bg-gray-100/80 p-1 rounded-xl">
            {['today', 'tomorrow'].map((f) => (
              <button
                key={f}
                onClick={() => setAppointmentFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  appointmentFilter === f 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                {f === 'today' ? 'Today' : 'Tomorrow'}
              </button>
            ))}
            <select
              value={appointmentFilter.startsWith('month_') ? appointmentFilter : ''}
              onChange={(e) => setAppointmentFilter(e.target.value)}
              className={`ml-1 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none cursor-pointer ${
                appointmentFilter.startsWith('month_') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 bg-transparent hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <option value="" disabled>Select Month</option>
              {recentMonths.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Patient</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Token ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Treatment</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointmentsLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Loading appointments...</td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-2xl">📅</div>
                      <p>No appointments found for {appointmentFilter === 'today' ? 'today' : appointmentFilter === 'tomorrow' ? 'tomorrow' : 'this month'}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
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
                        <span 
                          className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-semibold ${
                            appt.payment_status === 'Paid' ? 'bg-success/10 text-success border border-success/20' :
                            appt.payment_status === 'Cancelled' ? 'bg-gray-200 text-gray-600' :
                            'bg-warning/10 text-warning-700 border border-warning/20'
                          }`}
                        >
                          {appt.payment_status}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
