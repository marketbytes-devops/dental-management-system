"use client";

import { useState, useEffect } from "react";

export default function ReceptionistDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://localhost:8000/auth/doctors", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to load doctors.");
      const data = await response.json();

      // Map backend users to the receptionist UI format
      const mappedDoctors = data.map((doc) => {
        return {
          id: doc.id,
          name: doc.name,
          specialty: doc.specialty,
          dept: doc.specialty || "Clinical",
          status: doc.status === "On Duty" ? "Available" : 
                  doc.status === "On Break" ? "On Break" : "Absent",
          slots: doc.status !== "Off Duty" ? ["09:30 AM", "10:30 AM", "01:30 PM", "03:00 PM"] : []
        };
      });
      
      setDoctors(mappedDoctors);
    } catch (err) {
      console.error("Error loading receptionist doctors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchDoctors();
    }, 0);
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch(`http://localhost:8000/auth/doctors/${id}/status`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to cycle status.");
      const updated = await response.json();
      
      setDoctors(prev => prev.map(d => {
        if (d.id === id) {
          const nextStatus = updated.status === "On Duty" ? "Available" : 
                             updated.status === "On Break" ? "On Break" : "Absent";
          return { 
            ...d, 
            status: nextStatus,
            slots: updated.status === "Off Duty" ? [] : ["09:30 AM", "10:30 AM", "01:30 PM", "03:00 PM"]
          };
        }
        return d;
      }));
    } catch (err) {
      console.error("Error cycling doctor status:", err);
    }
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
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Today&apos;s Schedule Slots</h4>
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
