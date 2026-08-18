"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Phone,
  Mail,
  RefreshCw,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Zap,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  History,
  FileText,
  AlertCircle
} from "lucide-react";
import client, {
  getReminderQueue,
  triggerAutomatedReminders,
  sendWhatsAppReminder,
  sendSmsReminder,
  getCommunications
} from "@/services/api";

const PRIORITY_STYLE = {
  Emergency: "bg-red-50 text-red-700 border border-red-200 font-bold",
  Urgent: "bg-amber-50 text-amber-700 border border-amber-200 font-bold",
  Routine: "bg-gray-100 text-gray-600 font-medium",
};

const DAY_STYLE = {
  Today: "bg-blue-50 text-blue-700 border border-blue-200 font-bold",
  Tomorrow: "bg-purple-50 text-purple-700 border border-purple-200 font-bold",
};

export default function ReceptionistReminders() {
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "logs" | "templates"
  const [reminders, setReminders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalMode, setModalMode] = useState(null); // "whatsapp" | "sms" | "both"
  const [customMsg, setCustomMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  const showToast = (message, type = "success") => {
    setNotificationToast({ message, type });
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const data = await getReminderQueue();
      setReminders(data);
    } catch (err) {
      console.error("Reminders fetch error:", err);
      showToast("Failed to load reminder queue", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLogsLoading(true);
      const data = await getCommunications();
      setLogs(data);
    } catch (err) {
      console.error("Logs fetch error:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

  const handleRunAutoSweep = async () => {
    try {
      setIsSweeping(true);
      const res = await triggerAutomatedReminders();
      showToast(
        `Auto-sweep completed! ${res.total_dispatched || 0} automated reminders dispatched (${res.reminders_1day_sent || 0} for 1-day before, ${res.reminders_sameday_sent || 0} for today).`,
        "success"
      );
      fetchReminders();
    } catch (err) {
      console.error("Error running auto-sweep:", err);
      showToast("Failed to trigger automated reminder sweep.", "error");
    } finally {
      setIsSweeping(false);
    }
  };

  const openSendModal = (reminder, mode = "whatsapp") => {
    setSelectedAppointment(reminder);
    setModalMode(mode);
    setCustomMsg(reminder.message_preview || "");
  };

  const handleDispatchReminder = async () => {
    if (!selectedAppointment) return;
    setIsSending(true);

    try {
      if (modalMode === "whatsapp" || modalMode === "both") {
        await sendWhatsAppReminder(selectedAppointment.id, customMsg);
      }
      if (modalMode === "sms" || modalMode === "both") {
        await sendSmsReminder(selectedAppointment.id, customMsg);
      }

      showToast(
        `Reminder dispatched successfully via ${modalMode.toUpperCase()}!`,
        "success"
      );

      setSelectedAppointment(null);
      fetchReminders();
    } catch (err) {
      console.error("Error sending reminder:", err);
      showToast("Failed to send reminder. Please check connectivity.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const filtered = reminders.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.doctor?.toLowerCase().includes(search.toLowerCase()) ||
      r.treatment?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  );

  const pendingCount = reminders.filter((r) => r.status === "Pending").length;
  const sentCount = reminders.filter((r) => r.status === "Sent").length;
  const bookedCount = reminders.filter((r) => r.reminder_booked_sent).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notificationToast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-bounce transition-all ${
            notificationToast.type === "error"
              ? "bg-red-600 text-white border-red-700"
              : "bg-emerald-600 text-white border-emerald-700"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {notificationToast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Automated Reminders Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-white" /> Active Engine
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Automated WhatsApp & SMS notifications active when booked, 1-day before, and on appointment day.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunAutoSweep}
            disabled={isSweeping}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? "animate-spin" : ""}`} />
            {isSweeping ? "Running Auto-Sweep…" : "Run Auto-Reminders Sweep"}
          </button>
          <button
            onClick={fetchReminders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* 3 Automated Timeline Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Active When Booked */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-sm">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Trigger Stage 1
                </span>
                <h3 className="text-sm font-bold text-gray-900">Active When Booked</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              INSTANT
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
            Sends instant booking confirmation via WhatsApp & SMS immediately upon appointment creation.
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-200/50 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Confirmed & Dispatched</span>
            <span className="font-mono text-sm">{bookedCount} Sent</span>
          </div>
        </div>

        {/* Stage 2: One Day Before */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
                  Trigger Stage 2
                </span>
                <h3 className="text-sm font-bold text-gray-900">1 Day Before Visit</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800">
              AUTOMATIC
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
            Dispatches automated 24-hour advance WhatsApp & SMS appointment reminders to tomorrow's patients.
          </p>
          <div className="mt-3 pt-3 border-t border-purple-200/50 flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>Tomorrow's Queue</span>
            <span className="font-mono text-sm">
              {reminders.filter((r) => r.day_label === "Tomorrow").length} Scheduled
            </span>
          </div>
        </div>

        {/* Stage 3: On The Day */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Trigger Stage 3
                </span>
                <h3 className="text-sm font-bold text-gray-900">On The Appointment Day</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
              TODAY
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
            Sends morning arrival & time reminder via WhatsApp & SMS on the scheduled day of appointment.
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200/50 flex items-center justify-between text-xs font-semibold text-blue-800">
            <span>Today's Queue</span>
            <span className="font-mono text-sm">
              {reminders.filter((r) => r.day_label === "Today").length} Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("queue")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "queue"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Reminders Queue ({filtered.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "logs"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <History className="w-4 h-4" />
          Communication Logs History
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "templates"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Automated Message Templates
        </button>
      </div>

      {/* TAB 1: REMINDERS QUEUE */}
      {activeTab === "queue" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Upcoming Appointments Queue</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Multi-stage reminder tracking for Today & Tomorrow's patients
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search patient, phone, doctor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 w-60"
              />
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> WhatsApp + SMS Active
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
                  <th className="py-3 px-4">Automated Trigger Stages</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Overall Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
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
                          <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                            <Phone className="w-3 h-3 text-emerald-600" /> {r.phone || "No phone"}
                          </span>
                          {r.email && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Mail className="w-3 h-3" /> {r.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Appointment */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              DAY_STYLE[r.day_label] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {r.day_label}
                          </span>
                          <span className="font-mono text-xs text-gray-700 font-semibold">
                            {r.date}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-emerald-700 font-bold mt-1">
                          {r.time}
                        </p>
                      </td>

                      {/* Doctor & Treatment */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-semibold text-gray-800">{r.doctor}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{r.treatment || "General Consultation"}</p>
                      </td>

                      {/* Automated Trigger Stages Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {/* Stage 1: Booked */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 w-max ${
                              r.reminder_booked_sent
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5" /> Booked:{" "}
                            {r.reminder_booked_sent ? "Sent ✓" : "Pending"}
                          </span>

                          {/* Stage 2: 1-Day Before */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 w-max ${
                              r.reminder_1day_sent
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Calendar className="w-2.5 h-2.5" /> 1-Day:{" "}
                            {r.reminder_1day_sent ? "Sent ✓" : "Pending"}
                          </span>

                          {/* Stage 3: Same Day */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 w-max ${
                              r.reminder_sameday_sent
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" /> Same Day:{" "}
                            {r.reminder_sameday_sent ? "Sent ✓" : "Pending"}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide ${
                            PRIORITY_STYLE[r.priority] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {r.status === "Sent" ? (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Reminded
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> Due Now
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send WhatsApp */}
                          <button
                            onClick={() => openSendModal(r, "whatsapp")}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>

                          {/* Direct WhatsApp Web Link */}
                          {r.whatsapp_link && (
                            <a
                              href={r.whatsapp_link}
                              target="_blank"
                              rel="noreferrer"
                              title="Open Direct WhatsApp Web Chat"
                              className="p-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-700 hover:text-white border border-green-300 transition cursor-pointer flex items-center"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Send SMS */}
                          <button
                            onClick={() => openSendModal(r, "sms")}
                            title="Send SMS Reminder"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            SMS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LOGS HISTORY */}
      {activeTab === "logs" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Communication & Reminder Dispatch Logs</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Audit trail of all WhatsApp, SMS, and System notifications sent to patients
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Trigger / Template</th>
                  <th className="py-3 px-4">Message Content</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-gray-400 animate-pulse font-medium">
                      Loading communication audit history…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-gray-400">
                      No reminder logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono text-gray-500 whitespace-nowrap">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : "Recent"}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{log.recipient_name}</p>
                        <p className="font-mono text-[10px] text-gray-400">{log.recipient_phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-extrabold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                        {log.trigger_type || log.template}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-600" title={log.message_body}>
                        {log.message_body}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium">
                        {log.sent_by || "System"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MESSAGE TEMPLATES PREVIEW */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Template 1 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <Zap className="w-4 h-4 fill-emerald-600" />
              1. Active When Booked Template
            </div>
            <p className="text-xs text-gray-500">Triggered immediately when appointment is created in portal or desk.</p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs text-gray-700 leading-relaxed">
              "SmileCare Dental: Hi [Patient Name], your appointment for [Treatment] with [Doctor] has been CONFIRMED for [Date] at [Time]. Thank you for choosing SmileCare Dental Clinic!"
            </div>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Channels: WhatsApp + SMS
            </span>
          </div>

          {/* Template 2 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <Calendar className="w-4 h-4" />
              2. One Day Before Template
            </div>
            <p className="text-xs text-gray-500">Triggered automatically 24 hours prior to appointment date.</p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs text-gray-700 leading-relaxed">
              "SmileCare Dental REMINDER: Hi [Patient Name], you have a dental appointment scheduled tomorrow ([Date]) at [Time] with [Doctor]. Please arrive 10 minutes early."
            </div>
            <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
              Channels: WhatsApp + SMS
            </span>
          </div>

          {/* Template 3 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Clock className="w-4 h-4" />
              3. On The Day Template
            </div>
            <p className="text-xs text-gray-500">Triggered automatically on the morning of scheduled visit.</p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs text-gray-700 leading-relaxed">
              "SmileCare Dental TODAY'S VISIT: Hi [Patient Name], this is a reminder for your appointment TODAY at [Time] with [Doctor]. We look forward to seeing you!"
            </div>
            <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
              Channels: WhatsApp + SMS
            </span>
          </div>
        </div>
      )}

      {/* DISPATCH REMINDER MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" /> Dispatch Appointment Reminder
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Patient: <strong className="text-gray-800">{selectedAppointment.name}</strong> ({selectedAppointment.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Channel Selection Toggle */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Select Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode("whatsapp")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === "whatsapp"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("sms")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === "sms"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> SMS
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("both")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === "both"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Both (WA + SMS)
                </button>
              </div>
            </div>

            {/* Message Body Editor */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Message Preview / Customization</label>
              <textarea
                rows="4"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              {selectedAppointment.whatsapp_link && modalMode === "whatsapp" && (
                <a
                  href={selectedAppointment.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open WhatsApp Web
                </a>
              )}

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispatchReminder}
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Reminder Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
