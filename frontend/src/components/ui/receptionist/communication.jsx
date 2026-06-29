"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Send,
  MessageSquare,
  Mail,
  Phone,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Users,
  ChevronDown,
} from "lucide-react";
import { getAllPatients, getCommunications, sendCommunication } from "@/services/api";

// Message templates keyed by template name
const TEMPLATES = {
  "Booking Confirmation": (patientName, doctorName, date, time) =>
    `Dear ${patientName || "Patient"}, your appointment with ${doctorName || "the doctor"} is confirmed for ${date || "the scheduled date"} at ${time || "the scheduled time"}. Please arrive 10 minutes early. - SmileCare Dental`,
  "Appointment Reminder": (patientName, doctorName, date, time) =>
    `Hi ${patientName || "there"}, this is a friendly reminder about your appointment with ${doctorName || "the doctor"} on ${date || "your scheduled date"} at ${time || "your scheduled time"}. See you soon! - SmileCare Dental`,
  "Feedback Request": (patientName) =>
    `Dear ${patientName || "Patient"}, thank you for visiting SmileCare Dental. We'd love to hear your feedback! Please rate your experience at our clinic. - SmileCare`,
  "Billing Receipt": (patientName) =>
    `Dear ${patientName || "Patient"}, your billing receipt from SmileCare Dental has been generated. Please contact us if you have any questions. - SmileCare`,
  "Follow-up Care": (patientName) =>
    `Dear ${patientName || "Patient"}, we hope you are recovering well after your recent visit to SmileCare. Please follow the post-treatment instructions provided. Contact us if you have concerns. - SmileCare`,
  "OTP Verification": (patientName) =>
    `Dear ${patientName || "Patient"}, your SmileCare check-in OTP has been sent. Please check with the front desk for your verification code. - SmileCare`,
};

const CHANNEL_ICONS = {
  WhatsApp: <MessageSquare className="w-3.5 h-3.5" />,
  SMS: <Phone className="w-3.5 h-3.5" />,
  Email: <Mail className="w-3.5 h-3.5" />,
};

const CHANNEL_COLORS = {
  WhatsApp: "text-emerald-600 bg-emerald-50",
  SMS: "text-blue-600 bg-blue-50",
  Email: "text-violet-600 bg-violet-50",
};

const STATUS_COLORS = {
  Sent: "bg-blue-50 text-blue-600",
  Delivered: "bg-green-50 text-green-600",
  Opened: "bg-purple-50 text-purple-650",
  Failed: "bg-red-50 text-red-600",
};

export default function ReceptionistCommunication() {
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [channel, setChannel] = useState("WhatsApp");
  const [template, setTemplate] = useState("Booking Confirmation");
  const [customMessage, setCustomMessage] = useState("");
  const [useCustomMessage, setUseCustomMessage] = useState(false);

  // Filter for logs
  const [logFilter, setLogFilter] = useState("All");

  // Fetch all patients for the patient search
  const fetchPatients = useCallback(async () => {
    try {
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  }, []);

  // Fetch communication logs from backend
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const data = await getCommunications();
      setLogs(data);
    } catch (err) {
      console.error("Error fetching communication logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchLogs();
  }, [fetchPatients, fetchLogs]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Patient search filtering
  const filteredPatients =
    searchQuery.trim() === ""
      ? []
      : patients.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phone.includes(searchQuery) ||
            p.token.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setSearchQuery(`${p.name} (${p.token})`);
    setShowDropdown(false);
    // Auto-preview the template message with patient name
    setCustomMessage(
      TEMPLATES[template]?.(p.name, "", "", "") || ""
    );
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setSearchQuery("");
    setCustomMessage("");
    setShowDropdown(false);
  };

  // Update preview when template changes
  const handleTemplateChange = (t) => {
    setTemplate(t);
    if (selectedPatient) {
      setCustomMessage(TEMPLATES[t]?.(selectedPatient.name, "", "", "") || "");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast("Please select a registered patient.", "error");
      return;
    }

    setIsSending(true);
    try {
      const messageBody = useCustomMessage
        ? customMessage
        : TEMPLATES[template]?.(selectedPatient.name, "", "", "") || "";

      const payload = {
        patient_id: selectedPatient.id,
        recipient_name: selectedPatient.name,
        recipient_phone: selectedPatient.phone,
        recipient_email: selectedPatient.email,
        channel,
        template,
        message_body: messageBody,
        sent_by: "Receptionist",
      };

      await sendCommunication(payload);

      showToast(
        `${channel} notification sent to ${selectedPatient.name} successfully!`,
        "success"
      );

      // Reset form
      clearPatient();
      setChannel("WhatsApp");
      setTemplate("Booking Confirmation");
      setUseCustomMessage(false);

      // Refresh logs
      fetchLogs();
    } catch (err) {
      showToast(err.message || "An error occurred.", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Filtered logs
  const displayedLogs =
    logFilter === "All" ? logs : logs.filter((l) => l.channel === logFilter);

  const formatTime = (isoString) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const previewMessage =
    selectedPatient && !useCustomMessage
      ? TEMPLATES[template]?.(selectedPatient.name, "", "", "") || ""
      : customMessage;

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Patient Communication
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Send SMS, Email, and WhatsApp notifications to registered dental
            patients.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-600">{patients.length}</span>{" "}
          registered patients
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Send Message Panel ── */}
        <form
          onSubmit={handleSend}
          className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Send Notification
          </h3>

          {/* Patient Search */}
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Search Patient *
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (selectedPatient) setSelectedPatient(null);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
              {selectedPatient && (
                <button
                  type="button"
                  onClick={clearPatient}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-44 overflow-y-auto mt-1 divide-y divide-gray-50">
                {filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="p-3 text-xs text-gray-700 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{p.name}</span>
                      <span className="text-gray-400 ml-1.5 font-mono">
                        {p.token}
                      </span>
                    </div>
                    <span className="text-gray-400">{p.phone}</span>
                  </div>
                ))}
              </div>
            )}
            {showDropdown &&
              searchQuery.trim() !== "" &&
              filteredPatients.length === 0 &&
              !selectedPatient && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow p-3 text-xs text-gray-400 text-center mt-1">
                  No patients found. Register them first.
                </div>
              )}
          </div>

          {/* Selected patient pill */}
          {selectedPatient && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-black shrink-0">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {selectedPatient.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {selectedPatient.phone} · {selectedPatient.email}
                </p>
              </div>
              <CheckCircle className="w-4 h-4 text-primary ml-auto shrink-0" />
            </div>
          )}

          {/* Channel + Template */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Template
              </label>
              <select
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                {Object.keys(TEMPLATES).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Preview / Custom */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Message Preview
              </label>
              <button
                type="button"
                onClick={() => setUseCustomMessage(!useCustomMessage)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                  useCustomMessage
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {useCustomMessage ? "Custom ✓" : "Edit"}
              </button>
            </div>
            <textarea
              value={previewMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              readOnly={!useCustomMessage}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none text-gray-700 resize-none leading-relaxed ${
                useCustomMessage
                  ? "border-primary/30 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  : "border-gray-100 bg-gray-50 text-gray-500 cursor-default"
              }`}
              placeholder={
                selectedPatient
                  ? "Select a template to preview..."
                  : "Select a patient first to preview the message..."
              }
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !selectedPatient}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-1"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send Notification
              </>
            )}
          </button>
        </form>

        {/* ── Communication Logs Panel ── */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Communication Logs
              {logs.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full">
                  {logs.length}
                </span>
              )}
            </h3>

            <div className="flex items-center gap-2">
              {/* Channel filter tabs */}
              <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
                {["All", "WhatsApp", "SMS", "Email"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLogFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      logFilter === f
                        ? "bg-white text-primary shadow-sm border border-gray-100"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors border border-gray-100"
                title="Refresh logs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingLogs ? (
              <p className="text-center py-12 text-xs text-gray-400 animate-pulse">
                Loading communication logs...
              </p>
            ) : displayedLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-400">
                  No communication logs yet
                </p>
                <p className="text-xs text-gray-400">
                  {logFilter !== "All"
                    ? `No ${logFilter} messages sent yet.`
                    : "Send your first notification to a patient."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Recipient</th>
                    <th className="py-3 px-2">Channel</th>
                    <th className="py-3 px-2">Template</th>
                    <th className="py-3 px-2">Contact</th>
                    <th className="py-3 px-2">Sent</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-gray-900 text-xs">
                          {log.recipient_name}
                        </div>
                        {log.sent_by && (
                          <div className="text-[10px] text-gray-400">
                            by {log.sent_by}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            CHANNEL_COLORS[log.channel] ||
                            "text-gray-500 bg-gray-50"
                          }`}
                        >
                          {CHANNEL_ICONS[log.channel]}
                          {log.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-gray-600 max-w-[130px]">
                        <span className="truncate block" title={log.template}>
                          {log.template}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-[10px] text-gray-400 font-mono">
                        {log.channel === "Email"
                          ? log.recipient_email || "—"
                          : log.recipient_phone || "—"}
                      </td>
                      <td className="py-3.5 px-2 text-[11px] text-gray-400 whitespace-nowrap">
                        {formatTime(log.sent_at)}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            STATUS_COLORS[log.status] ||
                            "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {log.status}
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
    </div>
  );
}
