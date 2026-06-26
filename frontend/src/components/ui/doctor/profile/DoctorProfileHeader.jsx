"use client";

import { Stethoscope } from "lucide-react";

export default function DoctorProfileHeader({ doctor }) {
  return (
    <div className="bg-gradient-to-r from-primary to-sky-400 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8" />
      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-bold border-4 border-white/20 shadow-lg select-none">
          {doctor.name?.replace("Dr. ", "").charAt(0) || "D"}
        </div>
        <div className="text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-2xl font-bold">{doctor.name}</h2>
            <span className="self-center px-3 py-1 bg-white/20 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
              ID: {doctor.id}
            </span>
          </div>
          <p className="text-sm text-white/80">
            {doctor.registrationMode} • Member since {doctor.memberSince}
          </p>
        </div>
      </div>
    </div>
  );
}
