"use client";

import { useState } from "react";

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM",
];

export default function RescheduleModal({ appointment, onClose, onReschedule }) {
  const today = new Date().toISOString().split("T")[0];

  const [newDate, setNewDate] = useState(appointment?.date ?? "");
  const [newTime, setNewTime] = useState(appointment?.time ?? "");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!appointment) return null;

  function validate() {
    const errs = {};
    if (!newDate) errs.date = "Please pick a new date.";
    if (!newTime) errs.time = "Please select a time slot.";
    if (newDate === appointment.date && newTime === appointment.time)
      errs.date = "Please choose a different date or time.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess(true);

    onReschedule?.({ ...appointment, date: newDate, time: newTime, reason });
    setTimeout(() => onClose(), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🔄 Reschedule Appointment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose a new date & time for your visit</p>
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
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-3xl mb-4">✅</div>
            <h3 className="text-base font-bold text-gray-900">Appointment Rescheduled!</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your appointment has been updated to {newDate} at {newTime}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>

            {/* Current appointment summary */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Booking</p>
              <p className="text-sm font-bold text-gray-900">{appointment.treatment}</p>
              <p className="text-xs text-gray-500 mt-1">
                {appointment.doctor} · {appointment.date} at {appointment.time}
              </p>
            </div>

            {/* New date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                New Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                min={today}
                value={newDate}
                onChange={(e) => { setNewDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.date ? "border-danger/50 bg-danger/5" : "border-gray-200"
                  }`}
              />
              {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
            </div>

            {/* New time */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                New Time Slot <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setNewTime(t); setErrors((p) => ({ ...p, time: undefined })); }}
                    className={`text-[11px] font-semibold py-2 px-1 rounded-xl border transition-all ${newTime === t
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30 hover:text-primary"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.time && <p className="mt-1 text-xs text-danger">{errors.time}</p>}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Reason for Rescheduling <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Conflict with work schedule…"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 resize-none placeholder-gray-400"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Keep Original
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                ) : (
                  "🔄 Confirm Reschedule"
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
