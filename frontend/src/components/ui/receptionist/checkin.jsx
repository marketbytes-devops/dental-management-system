"use client";

import { useState, useEffect } from "react";
import { UserCheck, AlertTriangle, Clock, KeyRound, CheckCircle, Shield } from "lucide-react";

export default function ReceptionistCheckIn() {
  const [appointments, setAppointments] = useState([]);
  const [activeQueue, setActiveQueue] = useState([]);
  const [pendingOtpPatients, setPendingOtpPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState("");
  const [priority, setPriority] = useState("Routine");
  const [assignedDoctor, setAssignedDoctor] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      // Fetch today's appointments
      const apptsRes = await fetch("http://127.0.0.1:8000/frontdesk/appointments/today");
      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        setAppointments(apptsData);
        
        const pendingOtp = apptsData.filter(a => a.status === "Pending OTP" || a.otp_status === "Pending" || a.otp_status === "Sent");
        setPendingOtpPatients(pendingOtp);
      }

      // Fetch live waiting queue
      const queueRes = await fetch("http://127.0.0.1:8000/frontdesk/queue");
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setActiveQueue(queueData);
      }

      // Fetch live doctors status
      const doctorsRes = await fetch("http://127.0.0.1:8000/auth/doctors", { headers });
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setDoctorsList(doctorsData);
        if (doctorsData.length > 0 && !assignedDoctor) {
          // Default to first active doctor
          const activeDocs = doctorsData.filter(d => d.status !== "Off Duty");
          if (activeDocs.length > 0) {
            setAssignedDoctor(activeDocs[0].name);
          } else {
            setAssignedDoctor(doctorsData[0].name);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching check-in data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Direct manual check-in (receptionist booking / offline check-in)
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      alert("Please select a patient to check-in.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${selectedAppId}/direct-checkin?priority=${priority}&doctor_name=${assignedDoctor}`, {
        method: "POST"
      });
      if (response.ok) {
        alert("Patient checked in directly. Added to live queue.");
        setSelectedAppId("");
        fetchData();
      } else {
        const err = await response.json();
        alert(err.detail || "Direct check-in failed.");
      }
    } catch (err) {
      alert("Error checking in patient.");
    }
  };

  // Checkout patient
  const handleCheckout = async (id, name) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      if (response.ok) {
        alert(`Patient ${name} checked out. Billing invoice updated.`);
        fetchData();
      } else {
        const err = await response.json();
        alert(err.detail || "Checkout failed.");
      }
    } catch (err) {
      alert("Error checking out patient.");
    }
  };

  // Call patient to dental chair
  const handleCallToChair = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "In Chair" })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      alert("Error calling patient to chair.");
    }
  };

  // Send OTP trigger
  const handleSendOtp = async (id, phone, name) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${id}/send-otp`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        alert(`OTP Code (${data.otp}) sent to registered number (${phone}) for patient ${name}.`);
        fetchData();
      }
    } catch (err) {
      alert("Error sending OTP.");
    }
  };

  // Direct bypass check-in for emergency/flexible workflows
  const handleBypassOtp = async (id, name, isEmergency) => {
    try {
      const pLevel = isEmergency ? "Emergency" : "Routine";
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${id}/direct-checkin?priority=${pLevel}`, {
        method: "POST"
      });
      if (response.ok) {
        alert(`OTP bypassed for ${name}. Patient entered queue with ${pLevel} priority.`);
        fetchData();
      }
    } catch (err) {
      alert("Error bypassing OTP.");
    }
  };

  const eligibleForDirectCheckIn = appointments.filter(
    a => a.status === "Confirmed" && a.otp_status === "None"
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Check-In / Check-Out Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Check-in arriving patients, verify OTP check-ins, handle emergency overrides, and complete billing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Check In Panel (Manual) */}
        <div className="lg:col-span-6 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Direct Patient Check-In (No OTP Required)</h3>
          
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Select Arrived Appointment</label>
              <select
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  const selected = appointments.find(a => a.id === parseInt(e.target.value));
                  if (selected) {
                    setAssignedDoctor(selected.doctor_name);
                    setPriority(selected.priority);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="">-- Choose Patient --</option>
                {eligibleForDirectCheckIn.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.patient?.name} ({a.appointment_time} - {a.doctor_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Priority / Triage</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Route to Doctor</label>
                <select
                  value={assignedDoctor}
                  onChange={(e) => setAssignedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  {doctorsList.map(d => (
                    <option 
                      key={d.id} 
                      value={d.name}
                      disabled={d.status === "Off Duty"}
                      className={d.status === "Off Duty" ? "text-gray-400" : ""}
                    >
                      {d.name} {d.status === "Off Duty" ? "(Off Duty)" : d.status === "On Break" ? "(On Break)" : "(Available)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
            >
              Check-In Patient
            </button>
          </form>

          {eligibleForDirectCheckIn.length === 0 && (
            <p className="text-xs text-gray-400 italic">No offline/confirmed appointments ready for direct check-in.</p>
          )}
        </div>

        {/* Pending App Check-ins (OTP & Emergency Bypass) */}
        <div className="lg:col-span-6 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-gray-900">App Check-Ins (OTP Verification)</h3>
            <span className="bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Action Required</span>
          </div>
          
          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {pendingOtpPatients.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">No patients waiting for OTP verification.</p>
            ) : (
              pendingOtpPatients.map(p => {
                const isEmergency = p.priority === "Emergency";
                return (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{p.patient?.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono">OTP Status: <span className="font-semibold text-primary">{p.otp_status}</span></p>
                      {isEmergency ? (
                        <span className="inline-block mt-1 bg-danger/10 text-danger text-[9px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse">
                          Emergency Flagged
                        </span>
                      ) : (
                        <p className="text-[9px] text-gray-400 mt-1">Appt time: {p.appointment_time}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      {isEmergency ? (
                        <button
                          onClick={() => handleBypassOtp(p.id, p.patient?.name, true)}
                          className="px-3 py-1.5 bg-danger hover:bg-danger/95 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                        >
                          Bypass &amp; Queue
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSendOtp(p.id, p.patient?.phone, p.patient?.name)}
                            className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                          >
                            {p.otp_status === "Sent" ? "Resend OTP" : "Send OTP"}
                          </button>
                          <button
                            onClick={() => handleBypassOtp(p.id, p.patient?.name, false)}
                            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Directly check in if patient forgot device"
                          >
                            Bypass
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Checked In Queue & Checkout Panel (12 cols) */}
        <div className="lg:col-span-12 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Arrived Patients Queue</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Doctor Route</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2">Est. Wait</th>
                  <th className="py-3 px-2">Stage</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-xs text-gray-400 font-bold">No active checked-in patients in wait room.</td>
                  </tr>
                ) : (
                  activeQueue.map(q => (
                    <tr key={q.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-gray-900">{q.patient_name}</div>
                        <div className="text-[10px] text-gray-400">{q.token} • {q.patient_phone}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-gray-550">{q.doctor_name}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          q.priority === "Emergency" ? "bg-danger/10 text-danger animate-pulse border border-danger/20" :
                          q.priority === "Urgent" ? "bg-warning/10 text-warning border border-warning/20" : 
                          "bg-success/10 text-success border border-success/20"
                        }`}>
                          {q.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-xs font-semibold text-gray-800">
                        {q.status === "In Chair" ? "N/A" : `${q.wait_time_estimate} mins`}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          q.status === "In Chair" ? "bg-purple-55 text-purple-650 border-purple-100" : "bg-gray-50 text-gray-550 border-gray-150"
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right space-x-1.5">
                        {q.status === "Waiting" && (
                          <button
                            onClick={() => handleCallToChair(q.id)}
                            className="px-2.5 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-bold cursor-pointer"
                          >
                            Call to Chair
                          </button>
                        )}
                        <button
                          onClick={() => handleCheckout(q.id, q.patient_name)}
                          className="px-2.5 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Checkout / Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
