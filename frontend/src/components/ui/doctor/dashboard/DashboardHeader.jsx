"use client";

import { useState, useEffect } from "react";

export default function DashboardHeader() {
  const [doctorName, setDoctorName] = useState("Dr. Anoop Nair");
  const [specialtyText, setSpecialtyText] = useState("Dentist & Endodontic Specialist");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const name = user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`;
          setDoctorName(name);

          if (user.specialties && user.specialties.length > 0) {
            setSpecialtyText(`${user.specialties.join(" & ")} Specialist`);
          } else {
            setSpecialtyText("Dental Specialist");
          }
        } catch (e) {
          console.error("Failed to parse staff user profile:", e);
        }
      }
    }
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex justify-between items-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{doctorName}'s Workdesk</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">{specialtyText} • SmileCare Clinic</p>
      </div>
      <div className="flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse self-center"></span>
        <span className="text-xs font-bold text-success uppercase tracking-wider bg-success/10 px-2.5 py-1 rounded">Live Clinic Sessions</span>
      </div>
    </div>
  );
}
