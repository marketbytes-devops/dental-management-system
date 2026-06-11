"use client";

import { useState } from "react";

export default function ReceptionistDoctors() {
  const [doctors, setDoctors] = useState([
    { id: 1, name: "Dr. Anoop Nair", specialty: "General Dentist", dept: "Conservative", status: "Available", slots: ["09:30 AM", "10:30 AM", "11:30 AM (Sneha)", "12:00 PM (Rahul)", "03:00 PM"] },
    { id: 2, name: "Dr. Priya Varma", specialty: "Orthodontist", dept: "Orthodontics", status: "In Treatment", slots: ["10:00 AM", "11:00 AM", "12:45 PM (Maria)", "02:00 PM (Aby)", "04:30 PM"] },
    { id: 3, name: "Dr. Sarah Smith", specialty: "Endodontist", dept: "Root Canal Center", status: "On Break", slots: ["09:00 AM", "11:00 AM", "02:30 PM", "03:30 PM"] },
    { id: 4, name: "Dr. James Kurt", specialty: "Oral Surgeon", dept: "Surgery", status: "Absent", slots: [] },
  ]);

  const handleToggleStatus = (id) => {
    const statuses = ["Available", "In Treatment", "On Break", "Absent"];
    setDoctors(prev => prev.map(d => {
      if (d.id === id) {
        const nextIndex = (statuses.indexOf(d.status) + 1) % statuses.length;
        return { ...d, status: statuses[nextIndex] };
      }
      return d;
    }));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Doctor Schedules</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor doctor clinical status and check daily slot books.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map(d => (
          <div key={d.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900">{d.name}</h3>
                <p className="text-xs text-primary font-bold">{d.specialty} • {d.dept}</p>
              </div>
              <button
                onClick={() => handleToggleStatus(d.id)}
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  d.status === "Available" ? "bg-success/10 text-success border border-success/20" :
                  d.status === "In Treatment" ? "bg-primary/10 text-primary border border-primary/20" :
                  d.status === "On Break" ? "bg-warning/10 text-warning border border-warning/20" :
                  "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {d.status}
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Schedule Slots</h4>
              {d.slots.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No schedules for today (Absent/Off).</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {d.slots.map((s, idx) => {
                    const isBooked = s.includes("(");
                    return (
                      <span
                        key={idx}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                          isBooked 
                            ? "bg-primary/5 text-primary border-primary/20 font-semibold"
                            : "bg-gray-50 text-gray-500 border-gray-150"
                        }`}
                      >
                        {s}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
