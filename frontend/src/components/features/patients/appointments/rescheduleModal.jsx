"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { getAvailableDoctors, getDoctorAvailableSlots } from "@/services/api";

export default function RescheduleModal({ appointment, onClose, onReschedule }) {
  const today = new Date().toISOString().split("T")[0];

  const [newDate, setNewDate] = useState(appointment?.date ?? today);
  const [newTime, setNewTime] = useState(appointment?.time ?? "");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorObj, setDoctorObj] = useState(null);

  // Fetch doctor ID and available shift slots when newDate or appointment changes
  useEffect(() => {
    async function loadShiftSlots() {
      if (!appointment?.doctor || !newDate) return;
      setLoadingSlots(true);
      try {
        const allDoctors = await getAvailableDoctors();
        const doc = allDoctors.find(
          (d) => d.name?.toLowerCase() === appointment.doctor?.toLowerCase()
        );
        setDoctorObj(doc || null);

        if (doc?.id) {
          const slotRes = await getDoctorAvailableSlots(doc.id, newDate);
          setTimeSlots(slotRes.available_slots || []);
        } else {
          setTimeSlots([]);
        }
      } catch (err) {
        console.error("Failed to load shift slots for doctor:", err);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadShiftSlots();
  }, [appointment?.doctor, newDate]);

  if (!appointment) return null;

  const isPastTime = (timeStr, selectedDate) => {
    if (!selectedDate || selectedDate !== today) return false;
    const now = new Date();
    const [timePart, modifier] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate <= now;
  };

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
    await new Promise((r) => setTimeout(r, 600));
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
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-primary" /> Reschedule Appointment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Shift-based doctor slot availability</p>
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
                onChange={(e) => { setNewDate(e.target.value); setNewTime(""); setErrors((p) => ({ ...p, date: undefined })); }}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 ${errors.date ? "border-danger/50 bg-danger/5" : "border-gray-200"
                  }`}
              />
              {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
            </div>

            {/* Shift-based Time slots */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Doctor Shift Time Slots for {newDate} <span className="text-danger">*</span></span>
                {loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              </label>

              {loadingSlots ? (
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-150 text-xs text-gray-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Fetching Dr. {appointment.doctor}'s shift schedule...
                </div>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {timeSlots.map((slot) => {
                    const isPast = isPastTime(slot.time, newDate);
                    const isDisabled = slot.is_full || isPast;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => { setNewTime(slot.time); setErrors((p) => ({ ...p, time: undefined })); }}
                        className={`text-[11px] font-semibold py-2 px-1 rounded-xl border transition-all ${
                          isDisabled
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : newTime === slot.time
                              ? "bg-primary text-white border-primary shadow-sm shadow-primary/30 font-bold"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/40 hover:text-primary"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs font-medium space-y-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 mx-auto" />
                  <p className="font-bold">No active shift slots available on this date.</p>
                  <p className="text-[11px] text-amber-700">Dr. {appointment.doctor} may be off-duty or on leave. Please select a different date.</p>
                </div>
              )}

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
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary/5 border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary group-hover:border-white/30 group-hover:border-t-white rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><RefreshCw className="w-4 h-4 text-primary group-hover:text-white" /> Confirm Reschedule</>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}

