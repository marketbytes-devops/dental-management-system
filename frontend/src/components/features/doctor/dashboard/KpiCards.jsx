"use client";

import Link from "next/link";

export default function KpiCards({
  activePatientName,
  activePatientToken,
  totalWaiting,
  totalAlerts,
  hasUrgentInQueue,
  activePatientHref = "/doctor/workspace"
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card 1: Active Patient */}
      {activePatientToken ? (
        <Link
          href={activePatientHref}
          className="text-left block w-full rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-primary/30 bg-white transition-all relative overflow-hidden group cursor-pointer outline-none"
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 bg-primary/5"></div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Chair Patient</p>
          <h3 className="text-xl font-black mt-1.5 truncate text-gray-900">
            {activePatientName || "Chair Empty"}
          </h3>
          <p className="text-xs mt-3 font-semibold text-primary flex items-center gap-1.5">
            {activePatientToken} • Open Clinical Sheet <span>→</span>
          </p>
        </Link>
      ) : (
        <div
          className="text-left block w-full rounded-2xl p-5 shadow-sm border border-gray-100 bg-white relative overflow-hidden outline-none select-none opacity-80"
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 bg-gray-50/50"></div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Chair Patient</p>
          <h3 className="text-xl font-black mt-1.5 truncate text-gray-400">
            Chair Empty
          </h3>
          <p className="text-xs mt-3 font-semibold text-gray-400 flex items-center gap-1.5">
            No Active Consultation
          </p>
        </div>
      )}

      {/* Card 2: Live Queue */}
      <Link
        href="/doctor/queue"
        className={`text-left block w-full rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden group cursor-pointer outline-none bg-white border-gray-100 hover:border-secondary/30 ${hasUrgentInQueue ? "ring-2 ring-danger/55 animate-pulse" : ""
          }`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 bg-secondary/5"></div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Waiting Room Queue</p>
        <h3 className="text-2xl font-black mt-1.5 text-gray-900">
          {totalWaiting} Patients
        </h3>
        <p className="text-xs mt-3 font-semibold text-secondary">
          Est. Wait Time: {totalWaiting * 15} mins {hasUrgentInQueue && "• 🚨 Urgent Case!"}
        </p>
      </Link>

      {/* Card 3: Medical Alerts */}
      <Link
        href="/doctor/alerts"
        className="text-left block w-full rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden group cursor-pointer outline-none bg-white border-gray-100 hover:border-danger/30"
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 bg-danger/5"></div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Medical Alert Cases</p>
        <h3 className="text-2xl font-black mt-1.5 text-gray-900">
          {totalAlerts} Active
        </h3>
        <p className="text-xs mt-3 font-semibold text-danger">
          Safety alert warnings
        </p>
      </Link>
    </div>
  );
}
