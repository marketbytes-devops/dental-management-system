"use client";

import { useState, useEffect } from "react";
import { Bell, Phone, Mail, RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const PRIORITY_STYLE = {
  Emergency: "bg-red-50 text-red-700 border border-red-200",
  Urgent: "bg-amber-50 text-amber-700 border border-amber-200",
  Routine: "bg-gray-100 text-gray-600",
};

const DAY_STYLE = {
  Today: "bg-blue-50 text-blue-700 border border-blue-200",
  Tomorrow: "bg-purple-50 text-purple-700 border border-purple-200",
};

export default function ReceptionistReminders() {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [search, setSearch] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("staff_jwt_token")
      : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/frontdesk/reminders", {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch reminders.");
      setReminders(await res.json());
    } catch (err) {
      console.error("Reminders fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleRemindNow = async (reminder) => {
    setSendingId(reminder.id);
    try {
      const message = `Dear ${reminder.name}, this is a reminder for your dental appointment with ${reminder.doctor} on ${reminder.date} at ${reminder.time}. Please arrive 10 minutes early. – SmileCare Dental Clinic`;

      const payload = {
        patient_id: reminder.patient_id,
        recipient_name: reminder.name,
        recipient_phone: reminder.phone,
        recipient_email: reminder.email,
        channel: "SMS + Email",
        template: "appointment_reminder",
        message_body: message,
        sent_by: "Receptionist",
      };

      const res = await fetch("http://localhost:8000/frontdesk/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send reminder.");

      // Optimistic update
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, status: "Sent" } : r))
      );
    } catch (err) {
      console.error("Error sending reminder:", err);
      alert("Failed to dispatch reminder. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  const filtered = reminders.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.doctor?.toLowerCase().includes(search.toLowerCase()) ||
      r.treatment?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = reminders.filter((r) => r.status === "Pending").length;
  const sentCount = reminders.filter((r) => r.status === "Sent").length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Appointment Reminders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review upcoming appointments and dispatch SMS/email reminders to patients.
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} Pending
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            {sentCount} Sent
          </div>
          <button
            onClick={fetchReminders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Reminder Queue</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Today & tomorrow's confirmed appointments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search patient, doctor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-52"
            />
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2.5 py-1 font-semibold flex items-center gap-1">
              <Bell className="w-3 h-3" /> Auto-reminders ON
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Appointment</th>
                <th className="py-3 px-4">Doctor & Treatment</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-14 text-center text-xs text-gray-400 animate-pulse font-medium"
                  >
                    Loading reminder queue…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Bell className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium">
                        {search
                          ? `No reminders match "${search}"`
                          : "No upcoming appointments need reminders right now."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/70 transition-colors text-sm text-gray-700"
                  >
                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Phone className="w-3 h-3" /> {r.phone}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Mail className="w-3 h-3" /> {r.email}
                        </span>
                      </div>
                    </td>

                    {/* Appointment */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-xs text-gray-700 font-medium">
                        {r.date}
                      </p>
                      <p className="font-mono text-xs text-gray-400">{r.time}</p>
                    </td>

                    {/* Doctor & Treatment */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-gray-800">{r.doctor}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{r.treatment}</p>
                    </td>

                    {/* Day */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          DAY_STYLE[r.day_label] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.day_label}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                          PRIORITY_STYLE[r.priority] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {r.status === "Sent" ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {r.status === "Sent" ? (
                        <span className="text-xs text-gray-400 font-medium">
                          Reminded
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemindNow(r)}
                          disabled={sendingId === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-lg transition font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        >
                          {sendingId === r.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Bell className="w-3 h-3" />
                              Remind Now
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        {!isLoading && reminders.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400">
            Reminders are auto-dispatched 24 hrs before appointment. "Remind Now" logs a manual
            reminder into the Communication Log and marks the patient as notified.
          </div>
        )}
      </div>
    </div>
  );
}
