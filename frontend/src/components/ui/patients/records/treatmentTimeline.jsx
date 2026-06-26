export default function TreatmentTimeline({ appointments = [] }) {
  const completedVisits = appointments.filter((a) => a.status === "Completed");

  if (completedVisits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No past treatment sessions found in your history timeline.
      </div>
    );
  }

  return (
    <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 ml-3 py-2">
      {completedVisits.map((appt) => (
        <div key={appt.id} className="relative">
          {/* Node dot icon */}
          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
          
          <div className="bg-gray-50/50 hover:bg-gray-50 transition-colors p-4 border border-gray-100 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {appt.date} · {appt.time}
              </span>
              <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full self-start">
                {appt.id}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-gray-900">{appt.treatment}</h4>
            <p className="text-sm text-gray-600 mt-1 font-medium">Attended by {appt.doctor}</p>
            {appt.notes && (
              <div className="mt-3 text-xs bg-white text-gray-550 border border-gray-100 p-2.5 rounded-xl">
                <span className="font-bold text-gray-700 block mb-0.5">Clinical Note:</span>
                {appt.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
