"use client";

import { useState } from "react";

export default function ReceptionistCommunication() {
  const [logs, setLogs] = useState([
    { id: 1, recipient: "Sneha Joseph", channel: "WhatsApp", template: "Booking Confirmation", sentAt: "10:30 AM", status: "Delivered" },
    { id: 2, recipient: "Rahul Kumar", channel: "SMS", template: "Appointment Reminder", sentAt: "09:15 AM", status: "Delivered" },
    { id: 3, recipient: "Meera Pillai", channel: "Email", template: "Feedback Request", sentAt: "Yesterday", status: "Opened" },
  ]);

  const [message, setMessage] = useState({
    recipient: "",
    channel: "WhatsApp",
    template: "Booking Confirmation"
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.recipient) {
      alert("Please enter a recipient name.");
      return;
    }
    const newLog = {
      id: Date.now(),
      recipient: message.recipient,
      channel: message.channel,
      template: message.template,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Sent"
    };
    setLogs(prev => [newLog, ...prev]);
    setMessage({ recipient: "", channel: "WhatsApp", template: "Booking Confirmation" });
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Communication</h1>
        <p className="text-sm text-gray-500 mt-1">Send SMS, Email, and WhatsApp updates to dental patients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Send message panel */}
        <form onSubmit={handleSend} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Broadcast Alert</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
            <input
              type="text"
              placeholder="e.g. Sneha Joseph"
              value={message.recipient}
              onChange={(e) => setMessage(prev => ({ ...prev, recipient: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Channel</label>
              <select
                value={message.channel}
                onChange={(e) => setMessage(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Template</label>
              <select
                value={message.template}
                onChange={(e) => setMessage(prev => ({ ...prev, template: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="Booking Confirmation">Confirmation</option>
                <option value="Appointment Reminder">Reminder</option>
                <option value="Feedback Request">Feedback</option>
                <option value="Billing Receipt">Receipt Alert</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Send Notification
          </button>
        </form>

        {/* Message Log */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Communication Logs</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Recipient</th>
                  <th className="py-3 px-2">Channel</th>
                  <th className="py-3 px-2">Template Used</th>
                  <th className="py-3 px-2">Sent Time</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{log.recipient}</td>
                    <td className="py-3.5 px-2 font-medium text-xs text-primary">{log.channel}</td>
                    <td className="py-3.5 px-2 text-xs text-gray-650">{log.template}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-405">{log.sentAt}</td>
                    <td className="py-3.5 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        log.status === "Delivered" || log.status === "Opened" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
