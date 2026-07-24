"use client";

import {
  User,
  Clock,
  Hash,
  FileText,
  CheckCircle2,
  XCircle,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  Confirmed: {
    label: "Upcoming",
    description: "Your appointment is confirmed",
    badge: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    icon: CalendarDays,
    dateBg: "bg-success/10",
    dateText: "text-success",
  },

  Pending: {
    label: "Pending",
    description: "Waiting for confirmation",
    badge: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    icon: AlertCircle,
    dateBg: "bg-warning/10",
    dateText: "text-warning",
  },

  Completed: {
    label: "Completed",
    description: "Appointment completed successfully",
    badge: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
    icon: CheckCircle2,
    dateBg: "bg-blue-100",
    dateText: "text-blue-500",
  },

  Cancelled: {
    label: "Cancelled",
    description: "This appointment was cancelled",
    badge: "bg-danger/10 text-danger border-danger/20",
    dot: "bg-danger",
    icon: XCircle,
    dateBg: "bg-danger/5",
    dateText: "text-danger",
  },
};

export default function AppointmentCard({
  appointment,
  onReschedule,
  onCancel,
}) {
  const {
    id,
    date,
    time,
    doctor,
    treatment,
    status,
    notes,
  } = appointment;

  const config =
    STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  const StatusIcon = config.icon;

  const isUpcoming =
    status === "Confirmed" || status === "Pending";

  const isCompleted = status === "Completed";
  const isCancelled = status === "Cancelled";

  const dateObj = new Date(date);

  const day = dateObj.getDate();

  const month = dateObj.toLocaleDateString("en-IN", {
    month: "short",
  });

  const year = dateObj.getFullYear();

  return (
    <div
      className={`
        relative bg-white rounded-2xl border p-5
        flex gap-5 items-start
        transition-all duration-200
        ${isCompleted
          ? "border-gray-100 opacity-75"
          : isCancelled
            ? "border-danger/10 bg-gray-50/50 opacity-70"
            : "border-gray-100 hover:border-primary/25 hover:shadow-md"
        }
      `}
    >
      {/* Status Indicator */}
      <div
        className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${config.dot}`}
      />

      {/* Date Badge */}
      <div
        className={`
          flex-shrink-0
          w-16 h-16
          rounded-xl
          flex flex-col
          items-center
          justify-center
          ${config.dateBg}
        `}
      >
        <span
          className={`
            text-[11px]
            font-bold
            uppercase
            tracking-wider
            ${config.dateText}
          `}
        >
          {month}
        </span>

        <span
          className={`
            text-2xl
            font-extrabold
            leading-none
            ${config.dateText}
          `}
        >
          {day}
        </span>

        <span
          className={`
            text-[10px]
            ${config.dateText}
            opacity-70
          `}
        >
          {year}
        </span>
      </div>

      {/* Main Details */}
      <div className="flex-1 min-w-0">
        {/* Treatment + Status */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4
            className={`
              text-sm
              font-bold
              truncate
              ${isCancelled || isCompleted
                ? "text-gray-500"
                : "text-gray-900"
              }
            `}
          >
            {treatment}
          </h4>

          {/* Status Badge */}
          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              text-[11px]
              font-semibold
              px-2
              py-0.5
              rounded-full
              border
              ${config.badge}
            `}
          >
            <span
              className={`
                w-1.5
                h-1.5
                rounded-full
                ${config.dot}
              `}
            />

            {config.label}
          </span>
        </div>

        {/* Status Description */}
        <p
          className={`
            text-[11px]
            mb-3
            ${isCancelled
              ? "text-danger/70"
              : isCompleted
                ? "text-gray-400"
                : "text-gray-500"
            }
          `}
        >
          {config.description}
        </p>

        {/* Doctor */}
        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />

          <span className="font-medium text-gray-700">
            {doctor}
          </span>
        </p>

        {/* Time + Appointment ID */}
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />

          <span>{time}</span>

          <span className="mx-2 text-gray-300">
            |
          </span>

          <Hash className="w-3.5 h-3.5" />

          <span className="font-medium text-gray-600">
            {id}
          </span>
        </p>

        {/* Notes */}
        {notes && (
          <p
            className="
              mt-2
              text-xs
              text-gray-400
              italic
              truncate
              flex
              items-center
              gap-1.5
            "
          >
            <FileText className="w-3 h-3" />

            {notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {isUpcoming && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() =>
              onReschedule?.(appointment)
            }
            className="
              px-3
              py-1.5
              text-xs
              font-semibold
              bg-primary/5
              border
              border-primary/20
              text-primary
              rounded-xl
              hover:bg-primary
              hover:text-white
              hover:border-primary
              transition-colors
            "
          >
            Reschedule
          </button>

          <button
            onClick={() =>
              onCancel?.(appointment)
            }
            className="
              px-3
              py-1.5
              text-xs
              font-semibold
              border
              border-danger/20
              text-danger
              rounded-xl
              hover:bg-danger
              hover:text-white
              transition-colors
            "
          >
            Cancel
          </button>
        </div>
      )}

      {/* Completed Icon */}
      {isCompleted && (
        <div
          className="
            flex-shrink-0
            w-9
            h-9
            rounded-full
            bg-success/10
            flex
            items-center
            justify-center
            text-success
          "
          title="Appointment completed"
        >
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}

      {/* Cancelled Icon */}
      {isCancelled && (
        <div
          className="
            flex-shrink-0
            w-9
            h-9
            rounded-full
            bg-danger/10
            flex
            items-center
            justify-center
            text-danger
          "
          title="Appointment cancelled"
        >
          <XCircle className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}