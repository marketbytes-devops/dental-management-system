"use client";

import { useState, useEffect } from "react";
import { Calendar, Search, UserCheck, AlertTriangle, Clock } from "lucide-react";

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    appointment_time: "09:00 AM",
    appointment_date: new Date().toISOString().split("T")[0],
    doctor_name: "",
    treatment_type: "Consultation",
    priority: "Routine",
    directCheckIn: false
  });

  const [doctors, setDoctors] = useState([]);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const types = ["Consultation", "Scaling & Polishing", "Root Canal", "Extraction", "Orthodontics", "Dental Filling"];

  useEffect(() => {
    const fetchDoctorLeaves = async () => {
      if (!form.doctor_name) {
        setDoctorLeaves([]);
        return;
      }
      try {
        const response = await fetch(`http://127.0.0.1:8000/leave/doctor/leaves?doctor_name=${encodeURIComponent(form.doctor_name)}`);
        if (response.ok) {
          const data = await response.json();
          setDoctorLeaves(data);
        }
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
      // Fetch today's appointments
      const apptsRes = await fetch("http://127.0.0.1:8000/frontdesk/appointments/today");
      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        setAppointments(apptsData);
      }
      // Fetch all patients
      const patientsRes = await fetch("http://127.0.0.1:8000/patient/all");
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
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
        const url = form.appointment_date
          ? `http://127.0.0.1:8000/frontdesk/doctors?date=${form.appointment_date}`
          : "http://127.0.0.1:8000/frontdesk/doctors";
        const doctorsRes = await fetch(url);
        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json();
          setDoctors(doctorsData);
          if (doctorsData.length > 0 && !doctorsData.some(d => d.name === form.doctor_name)) {
            setForm(prev => ({ ...prev, doctor_name: doctorsData[0].name }));
          }
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

  // Filter patients for dropdown search
  const filteredPatients = searchPatient.trim() === "" 
    ? [] 
    : patients.filter(p => 
        p.name.toLowerCase().includes(searchPatient.toLowerCase()) || 
        p.token.toLowerCase().includes(searchPatient.toLowerCase()) ||
        p.phone.includes(searchPatient)
      );

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchPatient(`${patient.name} (${patient.token})`);
    setShowPatientDropdown(false);
  };

  const handleCancelAppointment = async (id, patientName) => {
    if (!window.confirm(`Are you sure you want to cancel the appointment for ${patientName}?`)) {
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" })
      });
      if (response.ok) {
        alert("Appointment cancelled successfully.");
        fetchData();
      } else {
        const errData = await response.json();
        alert(errData.detail || "Failed to cancel appointment.");
      }
    } catch (err) {
      alert("Error cancelling appointment.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert("Please select a registered patient.");
      return;
    }

    // Validate date and time
    const todayStr = new Date().toISOString().split("T")[0];
    if (form.appointment_date < todayStr) {
      alert("Appointment date cannot be in the past.");
      return;
    }

    try {
      const payload = {
        patient_id: selectedPatient.id,
        doctor_name: form.doctor_name,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        treatment_type: form.treatment_type,
        status: form.directCheckIn ? "Waiting" : "Confirmed",
        priority: form.priority
      };

      const response = await fetch("http://127.0.0.1:8000/frontdesk/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Booking failed.");
      }

      let successMsg = `Appointment scheduled successfully for ${selectedPatient.name}!`;

      // Direct check-in check
      if (form.directCheckIn) {
        const checkinResponse = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${data.id}/direct-checkin?priority=${form.priority}&doctor_name=${form.doctor_name}`, {
          method: "POST",
        });
        const checkinData = await checkinResponse.json();
        if (checkinResponse.ok) {
          successMsg += ` Checked in to wait queue directly. Estimated wait: ${checkinData.wait_time_estimate} mins.`;
        }
      }

      alert(successMsg);
      
      // Reset form
      setSelectedPatient(null);
      setSearchPatient("");
      setForm({
        appointment_time: "09:00 AM",
        appointment_date: new Date().toISOString().split("T")[0],
        doctor_name: doctors.length > 0 ? doctors[0].name : "",
        treatment_type: "Consultation",
        priority: "Routine",
        directCheckIn: false
      });

      fetchData();

    } catch (err) {
      alert(err.message || "An error occurred during booking.");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Appointment Booking</h1>
        <p className="text-sm text-gray-500 mt-1">Book new dental appointments for registered patients and review schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Form (4 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">New Booking Form</h3>
          
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-gray-500 uppercase">Search Patient *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID, Name or Phone..."
                value={searchPatient}
                onChange={(e) => {
                  setSearchPatient(e.target.value);
                  setShowPatientDropdown(true);
                  if (selectedPatient) setSelectedPatient(null); // Clear selected if modified
                }}
                onFocus={() => setShowPatientDropdown(true)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
              {selectedPatient && (
                <span className="absolute right-3 top-2 text-success text-[10px] font-bold flex items-center gap-1">
                  ✓ Verified
                </span>
              )}
            </div>
            {showPatientDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1 divide-y divide-gray-50">
                {filteredPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="p-2.5 text-xs text-gray-700 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{p.name}</span>
                      <span className="text-gray-400 ml-1">({p.token})</span>
                    </div>
                    <div className="text-[10px] text-gray-550">{p.phone}</div>
                  </div>
                ))}
              </div>
            )}
            {showPatientDropdown && searchPatient.trim() !== "" && filteredPatients.length === 0 && !selectedPatient && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-400 text-center mt-1">
                No registered patient found. Go to Registrations tab to add them first.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Date *</label>
              <input
                type="date"
                name="appointment_date"
                value={form.appointment_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Time Slot *</label>
              <input
                type="text"
                name="appointment_time"
                placeholder="e.g. 11:30 AM"
                value={form.appointment_time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Doctor</label>
              <select
                name="doctor_name"
                value={form.doctor_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="">Select a doctor...</option>
                {doctors.map(d => (
                  <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Treatment Type</label>
            <select
              name="treatment_type"
              value={form.treatment_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
            <input
              type="checkbox"
              id="directCheckIn"
              name="directCheckIn"
              checked={form.directCheckIn}
              onChange={handleInputChange}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="directCheckIn" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Direct Check-In (Enter wait queue immediately)
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Create Appointment
          </button>
        </form>

        {/* Today's Scheduled Appointments List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-extrabold text-gray-900 mb-4">Today's Scheduled Appointments</h3>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-center py-10 text-xs text-gray-400 animate-pulse">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="text-center py-10 text-xs text-gray-400 font-bold">No appointments scheduled for today.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Time Slot</th>
                    <th className="py-3 px-2">Doctor</th>
                    <th className="py-3 px-2">Treatment</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.map(app => (
                    <tr key={app.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-gray-900">{app.patient?.name || "Unknown Patient"}</div>
                        <div className="text-[10px] text-gray-400">{app.patient?.token || ""} • {app.patient?.phone || ""}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs font-mono font-bold text-gray-500">
                        {app.appointment_time}
                      </td>
                      <td className="py-3.5 px-2 text-gray-500 text-xs">{app.doctor_name}</td>
                      <td className="py-3.5 px-2 text-gray-650">{app.treatment_type}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          app.status === "Checked In" || app.status === "Waiting" || app.status === "In Chair" ? "bg-success/10 text-success" :
                          app.status === "Confirmed" ? "bg-primary/10 text-primary" :
                          app.status === "Pending" || app.status === "Pending OTP" ? "bg-warning/10 text-warning" : 
                          "bg-danger/10 text-danger"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {app.status !== "Cancelled" && app.status !== "Completed" && app.status !== "In Chair" && (
                          <button
                            onClick={() => handleCancelAppointment(app.id, app.patient?.name)}
                            className="px-2.5 py-1 text-xs bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        {(app.status === "Cancelled" || app.status === "Completed") && (
                          <span className="text-xs text-gray-400 font-semibold">{app.status}</span>
                        )}
                        {app.status === "In Chair" && (
                          <span className="text-xs text-purple-650 font-bold flex items-center justify-end gap-1">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> In Treatment
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

