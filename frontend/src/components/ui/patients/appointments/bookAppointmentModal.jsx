"use client";

import { useState } from "react";
import { Calendar, CheckCircle2 } from "lucide-react";

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM",
];

const DOCTORS = [
  { id: "D01", name: "Dr. Anoop Nair", speciality: "Endodontist" },
  { id: "D02", name: "Dr. Priya Sharma", speciality: "Orthodontist" },
  { id: "D03", name: "Dr. Rajan Mehta", speciality: "Periodontist" },
  { id: "D04", name: "Dr. Sunita Pillai", speciality: "Oral Surgeon" },
];

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

export default function BookAppointmentModal({ onClose, onBook }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
    // Simulate async submit
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess(true);

    const newAppt = {
      id: `APT-${Math.floor(Math.random() * 900 + 100)}`,
      doctor: DOCTORS.find((d) => d.id === form.doctor)?.name ?? form.doctor,
      treatment: form.treatment,
      date: form.date,
      time: form.time,
      status: "Pending",
      notes: form.notes,
    };
    onBook?.(newAppt);

    setTimeout(() => onClose(), 1500);
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
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.speciality}
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
