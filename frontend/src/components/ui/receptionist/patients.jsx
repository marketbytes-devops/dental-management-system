"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, Calendar, Shield, Clock } from "lucide-react";

export default function ReceptionistPatients() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    date_of_birth: "",
    gender: "Female",
    blood_group: "",
    phone: "",
    email: "",
    password: "SmileCare123!",
    confirm_password: "SmileCare123!",
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    known_allergies: ""
  });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    doctor_name: "",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "09:00 AM",
    treatment_type: "Consultation",
    priority: "Routine",
    directCheckIn: true
  });

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Puducherry"
  ];
  const [doctors, setDoctors] = useState([]);
  const treatments = ["Consultation", "Scaling & Polishing", "Root Canal", "Extraction", "Orthodontics", "Dental Filling"];

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://127.0.0.1:8000/patient/all");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
      
      const doctorsRes = await fetch("http://127.0.0.1:8000/frontdesk/doctors");
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setDoctors(doctorsData);
        if (doctorsData.length > 0) {
          setBookingForm(prev => ({ ...prev, doctor_name: doctorsData[0].name }));
        }
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate password from phone number if phone changes, for flexibility
      if (name === "phone" && value.trim()) {
        const cleanPhone = value.replace(/\D/g, "");
        if (cleanPhone.length >= 6) {
          updated.password = `SmileCare${cleanPhone}`;
          updated.confirm_password = `SmileCare${cleanPhone}`;
        }
      }
      return updated;
    });
  };

  const handleBookingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Submit patient registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date_of_birth || !form.email) {
      alert("Please fill in Name, Date of Birth, Phone, and Email.");
      return;
    }
    if (form.password !== form.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        blood_group: form.blood_group || null,
        phone: form.phone.replace(/\s+/g, ""),
        email: form.email.trim(),
        password: form.password,
        address_line1: form.address_line1.trim() || null,
        city: form.city.trim() || null,
        state: form.state || null,
        pincode: form.pincode.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        known_allergies: form.known_allergies.trim() || null,
      };

      const response = await fetch("http://127.0.0.1:8000/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      // Success
      alert(`Patient ${data.name} registered successfully! ID Token: ${data.token}`);
      setRegisteredPatient(data);
      fetchPatients();

      // Reset form
      setForm({
        name: "",
        date_of_birth: "",
        gender: "Female",
        blood_group: "",
        phone: "",
        email: "",
        password: "SmileCare123!",
        confirm_password: "SmileCare123!",
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        known_allergies: ""
      });

      // Show booking redirection modal
      setShowBookingModal(true);

    } catch (err) {
      alert(err.message || "An error occurred during registration.");
    }
  };

  // Submit appointment booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!registeredPatient) return;

    // Validate date and time is not in the past
    const today = new Date().toISOString().split("T")[0];
    if (bookingForm.appointment_date < today) {
      alert("Appointment date cannot be in the past.");
      return;
    }

    try {
      const payload = {
        patient_id: registeredPatient.id,
        doctor_name: bookingForm.doctor_name,
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time,
        treatment_type: bookingForm.treatment_type,
        status: bookingForm.directCheckIn ? "Waiting" : "Confirmed",
        priority: bookingForm.priority
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

      let successMsg = `Appointment scheduled successfully for ${registeredPatient.name}!`;

      // If direct check-in requested, call direct-checkin bypass endpoint
      if (bookingForm.directCheckIn) {
        const checkinResponse = await fetch(`http://127.0.0.1:8000/frontdesk/appointments/${data.id}/direct-checkin?priority=${bookingForm.priority}&doctor_name=${bookingForm.doctor_name}`, {
          method: "POST",
        });
        const checkinData = await checkinResponse.json();
        if (checkinResponse.ok) {
          successMsg += ` Patient has been checked in directly to queue. Estimated wait: ${checkinData.wait_time_estimate} mins.`;
        }
      }

      alert(successMsg);
      setShowBookingModal(false);
      setRegisteredPatient(null);

    } catch (err) {
      alert(err.message || "An error occurred during booking.");
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search) || 
    p.token.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Register new patients and view EDR profile summaries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registration Form (4 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Register New Patient</h3>

          <div className="max-h-[68vh] overflow-y-auto pr-1 space-y-4">
            
            {/* Section 1: Personal Info */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider border-b border-gray-100 pb-1">Personal Info</p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-505 uppercase">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Rahul Kumar"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-505 uppercase">DOB *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleInputChange}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-505 uppercase">Gender *</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-505 uppercase">Blood Group</label>
                  <select
                    name="blood_group"
                    value={form.blood_group}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 uppercase">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. patient@example.com"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Confirm *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider border-b border-gray-100 pb-1">Address Details</p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 uppercase">Address Line 1</label>
                <input
                  type="text"
                  name="address_line1"
                  placeholder="Street / Apt / Suite"
                  value={form.address_line1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 uppercase">State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 3: Emergency & Medical */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider border-b border-gray-100 pb-1">Emergency &amp; Medical</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    placeholder="Name"
                    value={form.emergency_contact_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    name="emergency_contact_phone"
                    placeholder="Phone"
                    value={form.emergency_contact_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 uppercase">Known Allergies</label>
                <textarea
                  name="known_allergies"
                  placeholder="e.g. Penicillin, Latex, None"
                  value={form.known_allergies}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 resize-none"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Register Patient
          </button>
        </form>

        {/* Patient Directory List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-base font-extrabold text-gray-900">Patient Database</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search by ID, name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-center py-10 text-xs text-gray-400 animate-pulse">Loading patient records...</p>
            ) : filteredPatients.length === 0 ? (
              <p className="text-center py-10 text-xs text-gray-400 font-bold">No patients found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Patient Details</th>
                    <th className="py-3 px-2">Contact Info</th>
                    <th className="py-3 px-2">DOB &amp; Allergies</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2 font-mono text-xs text-gray-500 font-bold">{p.token}</td>
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{calculateAge(p.date_of_birth)} years • {p.gender}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs">
                        <div>{p.phone}</div>
                        <div className="text-gray-400 mt-0.5">{p.email}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-gray-500">
                        <div>{p.date_of_birth || "N/A"}</div>
                        <div className="text-danger font-semibold mt-0.5 text-[10px] truncate max-w-[150px]" title={p.known_allergies}>
                          {p.known_allergies ? `Allergies: ${p.known_allergies}` : "No allergies"}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          p.is_active ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
                        }`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Redirection booking modal */}
      {showBookingModal && registeredPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-150 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center text-success shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-950">Patient Registered</h3>
                <p className="text-xs text-gray-500">Token: <span className="font-mono font-bold text-gray-700">{registeredPatient.token}</span></p>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-800">New Walk-In Appointment Booking</p>
                <p className="text-xs text-gray-500 mt-0.5">Directly schedule a slot and add to queue.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-505 uppercase">Assign Doctor</label>
                <select
                  name="doctor_name"
                  value={bookingForm.doctor_name}
                  onChange={handleBookingInputChange}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map(d => (
                    <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-505 uppercase">Date</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={bookingForm.appointment_date}
                    onChange={handleBookingInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-550 uppercase">Time Slot</label>
                  <input
                    type="text"
                    name="appointment_time"
                    placeholder="e.g. 10:30 AM"
                    value={bookingForm.appointment_time}
                    onChange={handleBookingInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-555 uppercase">Treatment Type</label>
                  <select
                    name="treatment_type"
                    value={bookingForm.treatment_type}
                    onChange={handleBookingInputChange}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    {treatments.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-555 uppercase">Priority</label>
                  <select
                    name="priority"
                    value={bookingForm.priority}
                    onChange={handleBookingInputChange}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <input
                  type="checkbox"
                  id="directCheckIn"
                  name="directCheckIn"
                  checked={bookingForm.directCheckIn}
                  onChange={handleBookingInputChange}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="directCheckIn" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Direct Check-In (Enter waiting queue immediately)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setRegisteredPatient(null);
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-success hover:bg-success/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Confirm &amp; Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

