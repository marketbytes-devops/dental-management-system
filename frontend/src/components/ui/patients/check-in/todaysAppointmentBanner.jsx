"use client";
import { Calendar, Clock } from "lucide-react";

export default function TodaysAppointmentBanner({ appointment, onSelect }) {
  // Parse time
  const apptDateStr = `${appointment.date} ${appointment.time}`;
  const apptTimeObj = new Date(apptDateStr);
  const now = new Date();
  
  const diffMs = apptTimeObj - now;
  const diffMins = Math.floor(diffMs / 60000);
  
  // The check-in option becomes available exactly 30 minutes before
  const isWindowOpen = diffMins <= 30;

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary px-2.5 py-1 rounded-md bg-primary/5">
            {appointment.id}
          </span>
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
            Confirmed Today
          </span>
        </div>
        <h4 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
          {appointment.treatment}
        </h4>
        <p className="text-sm text-gray-500">With {appointment.doctor}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {appointment.date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appointment.time}</span>
        </div>
      </div>
      
      {isWindowOpen ? (
        <button
          onClick={() => onSelect(appointment)}
          className="px-5 py-2 bg-primary/5 border border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white hover:border-primary shadow-sm self-start sm:self-center cursor-pointer transition-colors"
        >
          Select & Check-In
        </button>
      ) : (
        <div className="text-center self-start sm:self-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Too Early</p>
          <p className="text-[10px] text-gray-500 font-medium">Opens 30 mins before</p>
        </div>
      )}
    </div>
  );
}
