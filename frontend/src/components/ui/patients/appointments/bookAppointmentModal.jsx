"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2 } from "lucide-react";


const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM",
];

<<<<<<< HEAD
=======


>>>>>>> d63e5e655db2a293e9474fe97d705bc7cdbde092
const TREATMENTS = [
  "Routine Check-up",
  "Scaling & Polishing",
  "Root Canal",
  "Tooth Extraction",
  "Dental Filling",
  "Orthodontic Consultation",
  "Teeth Whitening",
  "Crown & Bridge",
  "Implant Consultation",
  "Gum Treatment",
];

const INITIAL_FORM = {
  doctor: "",
  treatment: "",
  date: "",
  time: "",
  notes: "",
};

export default function BookAppointmentModal({ patientId, onClose, onBook }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
<<<<<<< HEAD
    const fetchDoctors = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("patient_jwt_token") : null;
        const response = await fetch("http://localhost:8000/auth/doctors", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setDoctors(data);
        } else {
          // Fallback to static doctors list if API fails
          setDoctors([
            { id: "D01", name: "Dr. Anoop Nair", specialty: "Endodontist", status: "On Duty" },
            { id: "D02", name: "Dr. Priya Sharma", specialty: "Orthodontist", status: "On Duty" },
            { id: "D03", name: "Dr. Rajan Mehta", specialty: "Periodontist", status: "On Duty" },
            { id: "D04", name: "Dr. Sunita Pillai", specialty: "Oral Surgeon", status: "On Duty" },
          ]);
        }
      } catch (e) {
        console.error("Failed to fetch doctors:", e);
        setDoctors([
          { id: "D01", name: "Dr. Anoop Nair", specialty: "Endodontist", status: "On Duty" },
          { id: "D02", name: "Dr. Priya Sharma", specialty: "Orthodontist", status: "On Duty" },
          { id: "D03", name: "Dr. Rajan Mehta", specialty: "Periodontist", status: "On Duty" },
          { id: "D04", name: "Dr. Sunita Pillai", specialty: "Oral Surgeon", status: "On Duty" },
        ]);
      }
    };
=======
    async function fetchDoctors() {
      try {
        const res = await fetch("http://localhost:8000/frontdesk/doctors");
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    }
>>>>>>> d63e5e655db2a293e9474fe97d705bc7cdbde092
    fetchDoctors();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  function validate() {
    const errs = {};
    if (!form.doctor) errs.doctor = "Please select a doctor.";
    if (!form.treatment) errs.treatment = "Please select a treatment.";
    if (!form.date) errs.date = "Please pick a date.";
    if (!form.time) errs.time = "Please select a time slot.";
    return errs;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
<<<<<<< HEAD
      const selectedDoctorName = form.doctor;
=======
      const selectedDoctorName = doctors.find((d) => String(d.id) === String(form.doctor))?.name ?? form.doctor;
>>>>>>> d63e5e655db2a293e9474fe97d705bc7cdbde092
      const response = await fetch("http://localhost:8000/frontdesk/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_name: selectedDoctorName,
          appointment_date: form.date,
          appointment_time: form.time,
          treatment_type: form.treatment,
          status: "Confirmed",
          priority: "Routine",
          symptoms: form.notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Booking failed.");
      }

      const data = await response.json();
      setSubmitting(false);
      setSuccess(true);

      const newAppt = {
        id: data.id,
        doctor: data.doctor_name,
        treatment: data.treatment_type,
        date: data.appointment_date,
        time: data.appointment_time,
        status: data.status,
        notes: data.symptoms || "",
      };
      onBook?.(newAppt);

      setTimeout(() => onClose(), 1500);
    } catch (err) {
      alert(err.message || "An error occurred during booking.");
      setSubmitting(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Book Appointment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details below to schedule a visit</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-success" /></div>
            <h3 className="text-base font-bold text-gray-900">Appointment Requested!</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your appointment has been submitted and is pending confirmation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>

            {/* Doctor */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Doctor <span className="text-danger">*</span>
              </label>
              <select
                value={form.doctor}
                onChange={(e) => handleChange("doctor", e.target.value)}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.doctor ? "border-danger/50 bg-danger/5" : "border-gray-200"
                  }`}
              >
                <option value="">Select a doctor…</option>
                {doctors.map((d) => (
<<<<<<< HEAD
                  <option 
                    key={d.id || d.name} 
                    value={d.name}
                    disabled={d.status === "Off Duty"}
                    className={d.status === "Off Duty" ? "text-gray-400" : ""}
                  >
                    {d.name} — {d.specialty} ({d.status === "Off Duty" ? "Off Duty" : d.status === "On Break" ? "On Break" : "Available"})
=======
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
>>>>>>> d63e5e655db2a293e9474fe97d705bc7cdbde092
                  </option>
                ))}
              </select>
              {errors.doctor && <p className="mt-1 text-xs text-danger">{errors.doctor}</p>}
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Treatment Type <span className="text-danger">*</span>
              </label>
              <select
                value={form.treatment}
                onChange={(e) => handleChange("treatment", e.target.value)}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.treatment ? "border-danger/50 bg-danger/5" : "border-gray-200"
                  }`}
              >
                <option value="">Select treatment…</option>
                {TREATMENTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.treatment && <p className="mt-1 text-xs text-danger">{errors.treatment}</p>}
            </div>

            {/* Date & Time row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.date ? "border-danger/50 bg-danger/5" : "border-gray-200"
                    }`}
                />
                {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Time Slot <span className="text-danger">*</span>
                </label>
                <select
                  value={form.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.time ? "border-danger/50 bg-danger/5" : "border-gray-200"
                    }`}
                >
                  <option value="">Select time…</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.time && <p className="mt-1 text-xs text-danger">{errors.time}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Describe your symptoms or concerns…"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 resize-none placeholder-gray-400"
              />
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary/5 border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary group-hover:border-white/30 group-hover:border-t-white rounded-full animate-spin" /> Booking…</>
                ) : (
                  <><Calendar className="w-4 h-4 text-primary group-hover:text-white" /> Confirm Booking</>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}