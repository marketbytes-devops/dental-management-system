"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getDoctors, updateDoctorStatus } from "@/services/api";
import { parseDoctorSpecialties } from "@/utils/specialtyUtils";


const STATUS_MAP = {
  "Available": { key: "available", label: "Available", accent: "bg-green-500", avatar: "bg-green-50 text-green-800", pill: "bg-green-50 text-green-800 border-green-300" },
  "In Treatment": { key: "treatment", label: "In treatment", accent: "bg-blue-500", avatar: "bg-blue-50 text-blue-800", pill: "bg-blue-50 text-blue-800 border-blue-300" },
  "On Break": { key: "break", label: "On break", accent: "bg-amber-500", avatar: "bg-amber-50 text-amber-800", pill: "bg-amber-50 text-amber-800 border-amber-300" },
  "Off Duty": { key: "off", label: "Off duty", accent: "bg-red-400", avatar: "bg-red-50 text-red-800", pill: "bg-red-50 text-red-800 border-red-300" },
};

const FILTERS = [
  { key: "all", label: "All doctors" },
  { key: "available", label: "Available" },
  { key: "treatment", label: "In treatment" },
  { key: "break", label: "On break" },
  { key: "off", label: "Off duty" },
];

const STATS = [
  { key: "all", label: "Total", numCls: "text-gray-900" },
  { key: "available", label: "Available", numCls: "text-green-800" },
  { key: "treatment", label: "In treatment", numCls: "text-blue-800" },
  { key: "break", label: "On break", numCls: "text-amber-800" },
  { key: "off", label: "Off duty", numCls: "text-red-700" },
];

function initials(name) {
  return name.replace("Dr. ", "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ReceptionistDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleToggleStatus = async (id) => {
    try {
      const updated = await updateDoctorStatus(id);
      setDoctors(prev => prev.map(d => d.id === id
        ? { ...d, status: updated.status, slots: updated.status === "Off Duty" ? [] : d.slots }
        : d
      ));
      fetchDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const count = (key) => key === "all"
    ? doctors.length
    : doctors.filter(d => STATUS_MAP[d.status]?.key === key).length;

  const filtered = activeFilter === "all"
    ? doctors
    : doctors.filter(d => STATUS_MAP[d.status]?.key === activeFilter);

  const activePillCls = {
    all: "bg-gray-100 text-gray-800 border-gray-300",
    available: "bg-green-50 text-green-800 border-green-300",
    treatment: "bg-blue-50 text-blue-800 border-blue-300",
    break: "bg-amber-50 text-amber-800 border-amber-300",
    off: "bg-red-50 text-red-800 border-red-300",
  };

  return (
    <div className="space-y-5 pb-10">

      {/* Header + stats */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Doctor schedules</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor clinical status and today's slot bookings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATS.map(s => (
            <div key={s.key} className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[64px]">
              <p className={`text-xl font-medium ${s.numCls}`}>{count(s.key)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium border transition-colors
              ${activeFilter === f.key
                ? activePillCls[f.key]
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {f.label}
            <span className="bg-black/8 rounded-full px-1.5 py-0.5 text-[10px]">{count(f.key)}</span>
          </button>
        ))}
      </div>

      {/* Doctor grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(d => {
          const s = STATUS_MAP[d.status] || STATUS_MAP["Off Duty"];
          const slots = d.slots || [];
          const bookedSlots = slots.filter(x => x.includes("("));
          const bookedCount = bookedSlots.length;

          return (
            <div key={d.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">

              {/* Accent bar */}
              <div className={`h-0.5 ${s.accent}`} />

              <div className="p-4 space-y-3">
                {/* Card head */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-content:center text-xs font-medium flex-shrink-0 ${s.avatar}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {initials(d.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{d.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{parseDoctorSpecialties(d).join(" · ")} · {d.dept || d.operatory}</p>
                      {d.shift && (
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {typeof d.shift === 'object' && d.shift[new Date().toLocaleDateString('en-US', { weekday: 'long' })]
                            ? d.shift[new Date().toLocaleDateString('en-US', { weekday: 'long' })].is_off 
                                ? "Off Duty Today" 
                                : `${d.shift[new Date().toLocaleDateString('en-US', { weekday: 'long' })].start} - ${d.shift[new Date().toLocaleDateString('en-US', { weekday: 'long' })].end}`
                            : typeof d.shift === 'string' ? d.shift : "09:00 AM - 05:00 PM"}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-opacity hover:opacity-75 ${s.pill}`}
                  >
                    {s.label}
                  </button>
                </div>

                <hr className="border-gray-100" />

                {/* Slots */}
                <div>
                  <p className="text-[11px] text-gray-600 uppercase tracking-wide mb-2">Booked Patients</p>
                  {bookedSlots.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No patients booked today.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {bookedSlots.map((sl, i) => {
                        const timePart = sl.split("(")[0].trim();
                        const patientPart = sl.split("-")[1]?.replace(")", "").trim() || "Patient";
                        return (
                          <div key={i} className="flex justify-between items-center bg-blue-50/50 text-blue-800 border border-blue-100 px-3 py-1.5 rounded-lg">
                            <span className="text-[11px] font-bold font-mono">{timePart}</span>
                            <span className="text-[11px] font-medium truncate max-w-[140px]">{patientPart}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Card footer */}
              {slots.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between text-[11px] text-gray-600">
                  <span>{slots.length} slots today</span>
                  <span>{bookedCount} booked</span>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-gray-400 py-10 italic">
            No doctors with this status right now.
          </p>
        )}
      </div>
    </div>
  );
}