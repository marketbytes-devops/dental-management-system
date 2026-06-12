"use client";

import { useState } from "react";
import AppointmentCard from "./appointmentCard";

const TABS = ["All", "Upcoming", "Completed", "Cancelled"];

export default function MyAppointmentList({ appointments, onReschedule, onCancel }) {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = appointments.filter((appt) => {
    const matchTab =
      activeTab === "All" ||
      (activeTab === "Upcoming" && (appt.status === "Confirmed" || appt.status === "Pending")) ||
      appt.status === activeTab;

    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      appt.treatment.toLowerCase().includes(q) ||
      appt.doctor.toLowerCase().includes(q) ||
      appt.id.toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  const tabCount = (tab) => {
    if (tab === "All") return appointments.length;
    if (tab === "Upcoming")
      return appointments.filter((a) => a.status === "Confirmed" || a.status === "Pending").length;
    return appointments.filter((a) => a.status === tab).length;
  };

  return (
    <div className="space-y-4">
      {/* Search & Tabs Row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === tab
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {tab}
              <span
                className={`ml-1.5 inline-block px-1.5 rounded-md text-[10px] font-bold ${activeTab === tab ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                  }`}
              >
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by treatment, doctor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-gray-50 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Appointment Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm font-semibold text-gray-700">No appointments found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery ? "Try a different search term." : "No appointments match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onReschedule={onReschedule}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
