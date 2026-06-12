"use client";

import { useState } from "react";
import { Bell, Calendar, Pill, CreditCard, Check, Trash2, Eye } from "lucide-react";

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: "appointment", title: "Appointment Confirmed", message: "Your upcoming Root Canal procedure with Dr. Anoop Nair is confirmed for June 15, 2026 at 10:30 AM.", date: "Today", read: false },
    { id: 2, type: "prescription", title: "New Prescription Issued", message: "Dr. Anoop Nair issued a prescription for Amoxicillin 500mg. Please check your medical records.", date: "May 12, 2026", read: true },
    { id: 3, type: "billing", title: "Invoice Paid", message: "Invoice #INV-089 (₹450) for Scaling & Polishing has been paid successfully.", date: "May 12, 2026", read: true },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case "appointment":
        return <Calendar className="w-5 h-5" />;
      case "prescription":
        return <Pill className="w-5 h-5" />;
      case "billing":
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "appointment":
        return "bg-primary/10 text-primary border-primary/10";
      case "prescription":
        return "bg-warning/10 text-warning border-warning/10";
      case "billing":
        return "bg-success/10 text-success border-success/10";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-505 mt-1">
            Keep track of your appointments status, medical alerts, billing updates, and receipts.
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={markAllRead}
              className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer outline-none"
            >
              <Eye className="w-4 h-4" /> Mark all as read
            </button>
            <button
              onClick={clearAll}
              className="bg-white text-danger border border-danger/10 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-danger/5 transition-all flex items-center gap-1.5 cursor-pointer outline-none"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:border-gray-200 flex items-start justify-between gap-4 ${
              !notif.read ? "border-primary/20 bg-primary/5/10" : "border-gray-100"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${getIconBg(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <p className="text-xs text-gray-550 leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-gray-400 font-semibold block pt-1">{notif.date}</span>
              </div>
            </div>

            {!notif.read && (
              <button
                onClick={() => markAsRead(notif.id)}
                className="p-1.5 text-gray-450 hover:text-success hover:bg-success/5 transition-all rounded-lg flex items-center justify-center cursor-pointer outline-none"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center bg-white border border-gray-100 rounded-2xl py-16 text-gray-450 space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl">
              📭
            </div>
            <p className="font-bold">All caught up!</p>
            <p className="text-xs text-gray-400">You don't have any notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
