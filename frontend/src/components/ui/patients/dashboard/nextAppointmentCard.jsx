import Link from "next/link";

export default function NextAppointmentCard({ appointment }) {
  if (!appointment) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
          📅
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">No upcoming appointments</p>
          <p className="text-xs text-gray-500 mt-0.5">Book a visit to get started</p>
        </div>
        <Link
          href="/patient/appointments"
          className="ml-auto px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          Book Now
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-6 relative overflow-hidden">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-primary uppercase">
              {new Date(appointment.date).toLocaleDateString("en-IN", { month: "short" })}
            </span>
            <span className="text-xl font-bold text-primary leading-none">
              {new Date(appointment.date).getDate()}
            </span>
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Next Appointment
            </p>
            <p className="text-base font-bold text-gray-900">{appointment.treatment}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {appointment.time} · {appointment.doctor}
            </p>
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-success/10 text-success">
              ✓ Confirmed
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link
            href="/patient/check-in"
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors text-center shadow-sm shadow-primary/20"
          >
            Check In
          </Link>
          <Link
            href="/patient/appointments"
            className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Reschedule
          </Link>
        </div>
      </div>
    </div>
  );
}
