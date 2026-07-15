"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { getDoctorLeaves, getDoctors, createAppointment } from "@/services/api";


const VISIT_REASONS = [
  "Consultation",
  "Follow-up Check-up",
  "Routine Check-up"
];

const SPECIALTY_DESCRIPTIONS = {
  "General Dentistry": "Focuses on routine cleanings, fillings, checkups, and general oral health maintenance.",
  "Orthodontics": "Specializes in correcting misaligned teeth, bite problems, braces, and clear aligners.",
  "Endodontics": "Specializes in root canal treatments and treating issues with the tooth pulp/nerve.",
  "Periodontics": "Focuses on diagnosing and treating gum diseases, deep scaling, and dental implants.",
  "Prosthodontics": "Specializes in replacing missing teeth with crowns, bridges, veneers, or dentures.",
  "Pediatric Dentistry": "Dedicated to the oral health of children from infancy through the teen years.",
  "Oral Surgery": "Specializes in complex extractions, wisdom teeth removal, and surgical jaw treatments."
};

const INITIAL_FORM = {
  doctor: "",
  treatment: "Consultation",
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
  const [doctorLeaves, setDoctorLeaves] = useState([]);

  useEffect(() => {
    const fetchDoctorLeaves = async () => {
      if (!form.doctor) {
        setDoctorLeaves([]);
        return;
      }
      try {
        const data = await getDoctorLeaves(form.doctor);
        setDoctorLeaves(data);
      } catch (e) {
        console.error("Failed to fetch doctor leaves:", e);
      }
    };
    fetchDoctorLeaves();
  }, [form.doctor]);

  useEffect(() => {
    if (form.date && form.doctor && doctorLeaves.length > 0) {
      const selectedDate = new Date(form.date);
      selectedDate.setHours(0, 0, 0, 0);

      const isOnLeave = doctorLeaves.some(leave => {
        const start = new Date(leave.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.end_date);
        end.setHours(0, 0, 0, 0);
        return selectedDate >= start && selectedDate <= end;
      });

      if (isOnLeave) {
        alert(`${form.doctor} is on leave on this day. Please select another date.`);
        setForm(prev => ({ ...prev, date: "" }));
      }
    }
  }, [form.date, doctorLeaves, form.doctor]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getDoctors(form.date);
        setDoctors(data);
      } catch (e) {
        console.error("Failed to fetch doctors:", e);
        setDoctors([]);
      }
    };
    fetchDoctors();
  }, [form.date]);

  const today = new Date().toISOString().split("T")[0];

  const selectedDoctorObj = doctors.find((d) => d.name === form.doctor);
  const selectedDoctorSpecialty = selectedDoctorObj ? selectedDoctorObj.specialty : "";
  const specialtyDescription = SPECIALTY_DESCRIPTIONS[selectedDoctorSpecialty] || (selectedDoctorSpecialty ? `Provides comprehensive assessment and specialized dental care in ${selectedDoctorSpecialty}.` : "");
  
  const TIME_SLOTS = selectedDoctorObj ? (selectedDoctorObj.slots || []) : [];

  function validate() {
    const errs = {};
    if (!form.doctor) errs.doctor = "Please select a doctor.";
    if (!form.treatment) errs.treatment = "Please select a visit reason.";
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
      const data = await createAppointment({
        patient_id: patientId,
        doctor_name: form.doctor,
        appointment_date: form.date,
        appointment_time: form.time,
        treatment_type: form.treatment,
        status: "Confirmed",
        priority: "Routine",
        symptoms: form.notes || null
      });

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

            {/* Date & Time row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => {
                    handleChange("date", e.target.value);
                    // Reset doctor when date changes since doctors list will refresh
                    handleChange("doctor", "");
                  }}
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.date ? "border-danger/50 bg-danger/5" : "border-gray-200"}`}
                />
                {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Time Slot <span className="text-danger">*</span>
                </label>
                {form.doctor ? (
                  <select
                    value={form.time}
                    onChange={(e) => handleChange("time", e.target.value)}
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.time ? "border-danger/50 bg-danger/5" : "border-gray-200"}`}
                  >
                    <option value="">Select time…</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.time} value={slot.time} disabled={slot.is_full}>
                        {slot.time} {slot.is_full ? "(Fully Booked)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select disabled className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                    <option>Select doctor first...</option>
                  </select>
                )}
                {errors.time && <p className="mt-1 text-xs text-danger">{errors.time}</p>}
              </div>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Doctor <span className="text-danger">*</span>
              </label>
              {!form.date ? (
                <p className="text-sm text-gray-500">Pick a date first to view available doctors...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((d) => (
                    <button
                      type="button"
                      key={d.id || d.name}
                      onClick={() => handleChange("doctor", d.name)}
                      disabled={d.status !== "Available"}
                      className={`w-full p-4 text-left border rounded-xl transition-colors ${form.doctor === d.name ? "border-primary bg-primary/5" : "border-gray-200 bg-white"} ${d.status !== "Available" ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"}`}
                    >
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-sm text-gray-600">{d.specialty}</div>
                      <div className="mt-2 text-xs text-primary">
                        {SPECIALTY_DESCRIPTIONS[d.specialty] || `Provides comprehensive assessment and specialized dental care in ${d.specialty}.`}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">Status: {d.status}</div>
                    </button>
                  ))}
                </div>
              )}
              {errors.doctor && <p className="mt-1 text-xs text-danger">{errors.doctor}</p>}
            </div>

            {/* Visit Reason / Treatment */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Visit Reason <span className="text-danger">*</span>
              </label>
              <select
                value={form.treatment}
                onChange={(e) => handleChange("treatment", e.target.value)}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.treatment ? "border-danger/50 bg-danger/5" : "border-gray-200"}`}
              >
                {VISIT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.treatment && <p className="mt-1 text-xs text-danger">{errors.treatment}</p>}
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