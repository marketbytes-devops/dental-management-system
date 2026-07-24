"use client";

import React, { useState, useEffect } from "react";
import { Pill, CheckCircle2, Clock, Search, User, Stethoscope } from "lucide-react";
import { getDispensingQueue, updateDispenseStatus } from "@/services/api";

export default function MedicinesToDispensePage() {
  const [dispenseList, setDispenseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await getDispensingQueue();
      setDispenseList(data);
    } catch (err) {
      console.warn("Failed to fetch dispensing queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleMarkDispensed = async (id) => {
    setUpdatingId(id);
    try {
      await updateDispenseStatus(id, "Dispensed");
      setDispenseList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "Dispensed", dispensed_at: new Date().toISOString() } : item
        )
      );
    } catch (err) {
      console.error("Failed to mark as dispensed:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredList = dispenseList
    .filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.patient_name?.toLowerCase().includes(q) ||
        item.patient_token?.toLowerCase().includes(q) ||
        item.doctor_name?.toLowerCase().includes(q) ||
        (item.medications || []).some((m) =>
          (m.medicine || m.name || "").toLowerCase().includes(q)
        )
      );
    })
    // Sort: Pending always before Dispensed
    .sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      return 0;
    });

  const pendingCount = dispenseList.filter((i) => i.status === "Pending").length;
  const dispensedCount = dispenseList.filter((i) => i.status === "Dispensed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Medicines to Dispense</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Real-time pharmacy dispensing queue triggered directly by doctor diagnosis & prescriptions.
              </p>
            </div>
          </div>
        </div>


      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Entries</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{dispenseList.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Dispense</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completed / Dispensed</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{dispensedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient name, token, doctor or medicine..."
          className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-400">Loading dispensing queue...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Pill className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No dispensing entries found</p>
            <p className="text-[11px] text-gray-400">
              When doctors save diagnostic records with prescriptions, they will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-5">Patient Name</th>
                  <th className="py-3.5 px-5">Time / Date</th>
                  <th className="py-3.5 px-5">Prescribing Doctor</th>
                  <th className="py-3.5 px-5">Medications</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredList.map((item) => {
                  const isDispensed = item.status === "Dispensed";
                  const createdTime = item.created_at
                    ? new Date(item.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—";

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.patient_name || "Patient"}</p>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {item.patient_token}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-semibold text-gray-600 whitespace-nowrap">
                        {createdTime}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{item.doctor_name || "Doctor"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 max-w-xs">
                        {item.medications && item.medications.length > 0 ? (
                          <div className="space-y-1">
                            {item.medications.map((med, idx) => (
                              <div key={idx} className="text-[11px] font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                <span className="font-bold text-gray-900">{med.medicine || med.name}</span>
                                {med.schedule && <span className="text-gray-500 ml-1">({med.schedule})</span>}
                                {med.timing && <span className="text-gray-500 ml-1">• {med.timing}</span>}
                                {med.duration && <span className="text-gray-500 ml-1">• {med.duration}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No specific meds prescribed</span>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        {isDispensed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Dispensed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                            <Clock className="w-3 h-3 animate-pulse" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {isDispensed ? (
                          <span className="text-[11px] font-semibold text-gray-400">Completed</span>
                        ) : (
                          <button
                            onClick={() => handleMarkDispensed(item.id)}
                            disabled={updatingId === item.id}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all border-none cursor-pointer disabled:opacity-50"
                          >
                            {updatingId === item.id ? "Updating..." : "Mark Dispensed"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
