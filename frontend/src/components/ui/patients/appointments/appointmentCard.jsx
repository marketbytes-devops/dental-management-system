"use client";

const STATUS_STYLES = {
  Confirmed: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-primary/10 text-primary",
  Cancelled: "bg-danger/10 text-danger",
};

const STATUS_DOT = {
  Confirmed: "bg-success",
  Pending: "bg-warning",
  Completed: "bg-primary",
  Cancelled: "bg-danger",
};

export default function AppointmentCard({ appointment, onReschedule, onCancel }) {
  const { id, date, time, doctor, treatment, status, notes } = appointment;

  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-IN", { month: "short" });
  const year = dateObj.getFullYear();

  const isPast = status === "Completed" || status === "Cancelled";
  const isConfirmed = status === "Confirmed";
  const isPending = status === "Pending";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-5 items-start transition-all hover:shadow-md group ${isPast ? "border-gray-100 opacity-80" : "border-gray-100 hover:border-primary/25"
        }`}
    >
      {/* Date Badge */}
      <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${isPast ? "bg-gray-100" : "bg-primary/10"
        }`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${isPast ? "text-gray-400" : "text-primary"}`}>
          {month}
        </span>
        <span className={`text-2xl font-extrabold leading-none ${isPast ? "text-gray-500" : "text-primary"}`}>
          {day}
        </span>
        <span className={`text-[10px] ${isPast ? "text-gray-400" : "text-primary/70"}`}>
          {year}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="text-sm font-bold text-gray-900 truncate">{treatment}</h4>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-gray-400"}`} />
            {status}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-1">
          👨‍⚕️ <span className="font-medium text-gray-700">{doctor}</span>
        </p>
        <p className="text-xs text-gray-500">
          🕐 {time}
          <span className="mx-2 text-gray-300">|</span>
          🆔 <span className="font-medium text-gray-600">{id}</span>
        </p>
        {notes && (
          <p className="mt-2 text-xs text-gray-400 italic truncate">📝 {notes}</p>
        )}
      </div>

      {/* Actions */}
      {!isPast && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          {(isConfirmed || isPending) && (
            <button
              onClick={() => onReschedule?.(appointment)}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-primary/30 hover:text-primary transition-colors"
            >
              Reschedule
            </button>
          )}
          {(isConfirmed || isPending) && (
            <button
              onClick={() => onCancel?.(appointment)}
              className="px-3 py-1.5 text-xs font-semibold border border-danger/20 text-danger rounded-xl hover:bg-danger/5 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Completed check mark */}
      {status === "Completed" && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success text-sm">
          ✓
        </div>
      )}
    </div>
  );
}
