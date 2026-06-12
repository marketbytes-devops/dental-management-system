"use client";

export default function TodaysAppointmentBanner({ appointment, onSelect }) {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:border-primary/40 cursor-pointer transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group">
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
          <span className="flex items-center gap-1">📅 {appointment.date}</span>
          <span className="flex items-center gap-1">🕐 {appointment.time}</span>
        </div>
      </div>
      <button
        onClick={() => onSelect(appointment)}
        className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl group-hover:bg-primary/95 transition-colors self-start sm:self-center"
      >
        Select & Check-In
      </button>
    </div>
  );
}
