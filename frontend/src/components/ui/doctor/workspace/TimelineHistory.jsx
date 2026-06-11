"use client";

export default function TimelineHistory({ timeline = [] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">📜 Clinical History Timeline</h4>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {timeline.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">No historical timeline logs found.</p>
        ) : (
          timeline.map((event, idx) => (
            <div key={idx} className="flex gap-3 items-start relative pb-4 last:pb-0">
              {idx !== timeline.length - 1 && (
                <span className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-100"></span>
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-white ${
                event.type === "Prescription" ? "bg-purple-500" :
                event.type === "Procedure" ? "bg-success" :
                event.type === "Lab Order" ? "bg-warning" : "bg-primary"
              }`}>
                {event.type.charAt(0)}
              </div>
              <div className="flex-1 bg-gray-55/50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-gray-400">{event.date}</span>
                  <span className="text-[8px] font-bold text-primary bg-primary/5 px-1 rounded">{event.type}</span>
                </div>
                <p className="text-xs text-gray-700 leading-normal font-semibold">{event.note}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
