"use client";

import { Clock, Trash2, Inbox } from "lucide-react";

export default function LeaveList({ userId, requests, onCancel }) {
  const myRequests = requests.filter((r) => r.userId === userId);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "bg-success/10 text-success";
      case "Rejected":
        return "bg-danger/10 text-danger";
      case "Cancelled":
        return "bg-gray-100 text-gray-400";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  const getCategoryBadge = (type) => {
    switch (type) {
      case "Annual Leave":
        return "bg-primary/10 text-primary border border-primary/10";
      case "Sick Leave":
        return "bg-danger/10 text-danger border border-danger/10";
      case "Casual Leave":
        return "bg-warning/10 text-warning border border-warning/10";
      case "CME Leave":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-905 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Clock className="w-4.5 h-4.5 text-primary" /> Application History
      </h3>

      <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
        {myRequests.map((req) => {
          const isPending = req.status === "Pending";

          return (
            <div
              key={req.id}
              className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/20 space-y-3 transition-all text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getCategoryBadge(req.type)}`}>
                      {req.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{req.id}</span>
                    <span className="text-[10px] text-gray-400">submitted: {req.submittedAt}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 mt-2">
                    📅 {req.startDate} to {req.endDate}
                  </h4>
                  <p className="text-[10px] text-gray-450 font-bold mt-0.5">
                    Duration: {req.days} {req.days === 1 ? "day" : "days"}
                  </p>
                  {req.onCallDoctor && (
                    <p className="text-[10px] text-primary font-bold mt-0.5">
                      🏥 On-Call Coverage: {req.onCallDoctor}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 mt-1 sm:mt-0">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-gray-150 text-xs text-gray-655 italic">
                "{req.reason}"
              </div>

              {/* Cancel Request Action */}
              {(isPending || req.status === "Approved") && (
                <div className="flex justify-end border-t border-gray-100/60 pt-2">
                  <button
                    onClick={() => onCancel(req.id)}
                    className="text-danger hover:text-danger/90 font-bold text-[10px] flex items-center gap-1 cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel Leave
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {myRequests.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl">
            <Inbox className="w-8 h-8 text-gray-400 mb-2" />
            <h4 className="text-sm font-bold text-gray-900">No Leave Requests</h4>
            <p className="text-xs text-gray-505 max-w-xs mt-0.5">
              You have not submitted any leave applications yet. Use the form to submit one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
