"use client";

import Link from "next/link";

export default function CheckInConfirmation({ appointment }) {
  const queueNo = Math.floor(Math.random() * 8) + 3;
  const waitTime = queueNo * 10;

  return (
    <div className="text-center space-y-6 max-w-md mx-auto py-4">
      <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center text-3xl mx-auto border border-success/20 animate-bounce">
        ✓
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900 font-display">Check-In Successful!</h3>
        <p className="text-sm text-gray-500">
          You are checked in for your appointment. Please see the details and wait estimation below.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-left space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Appointment</span>
          <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-0.5 rounded-full">Checked-In</span>
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-900">{appointment?.treatment || "Consultation"}</h4>
          <p className="text-sm text-gray-600">With {appointment?.doctor || "Doctor"}</p>
        </div>
        <div className="flex justify-between text-xs text-gray-500 border-t border-gray-150 pt-3">
          <span>📅 {appointment?.date || "Today"}</span>
          <span>Time: {appointment?.time || "Scheduled"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Queue Position</p>
          <p className="text-3xl font-extrabold text-primary">#{queueNo}</p>
          <p className="text-[10px] text-gray-500 mt-1">In line for consultation</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Est. Wait Time</p>
          <p className="text-3xl font-extrabold text-secondary">~{waitTime}m</p>
          <p className="text-[10px] text-gray-500 mt-1">Subject to changes</p>
        </div>
      </div>

      <div className="text-left bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-2">
        <h5 className="text-sm font-semibold text-primary">Please wait in the reception lounge:</h5>
        <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
          <li>Take a seat in the main waiting area</li>
          <li>Keep your phone on ringer mode</li>
          <li>The receptionist will call you when the doctor is ready</li>
        </ul>
      </div>

      <div className="pt-4">
        <Link
          href="/patient/dashboard"
          className="inline-block w-full px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary/30 hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
