"use client";

import { useState, useEffect } from "react";
import { Bell, HelpCircle, Sparkles } from "lucide-react";

export default function PatientNavbar() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [patientName, setPatientName] = useState("Patient");
  const [patientId, setPatientId] = useState("PT-XXXXX");

  useEffect(() => {
    const name = localStorage.getItem("patient_name");
    const token = localStorage.getItem("patient_token");
    setTimeout(() => {
      if (name) {
        setPatientName(name.split(" ")[0]);
      }
      if (token) {
        setPatientId(token);
      }
    }, 0);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("patient_jwt_token");
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_name");
    localStorage.removeItem("patient_phone");
    localStorage.removeItem("patient_email");
    window.location.href = "/login?role=patient";
  };

  const avatarChar = patientName ? patientName.charAt(0).toUpperCase() : "P";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      {/* Greeting */}
      <div>
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          {greeting}, {patientName} <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        </p>
        <p className="text-xs text-gray-500">Patient ID: {patientId}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
        </button>

        {/* Help */}
        <button
          className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Avatar + logout */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {avatarChar}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
