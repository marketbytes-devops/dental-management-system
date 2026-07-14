"use client";

import { CheckSquare, ThumbsUp, ThumbsDown, Inbox, AlertTriangle } from "lucide-react";

export default function LeaveApprovalQueue({ requests, onApprove, onReject }) {
  const pendingRequests = requests.filter((r) => r.status === "Pending");

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

  const getRoleLabel = (role) => {
    switch (role) {
      case "doctor":
        return "Clinical Doctor";
      case "labtechnician":
        return "Lab Technician";
      case "receptionist":
        return "Receptionist Desk";
      case "accountant":
        return "Accountant Finance";
      default:
        return "Staff Member";
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-905 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <CheckSquare className="w-4.5 h-4.5 text-primary" /> Leave Approval Queue ({pendingRequests.length})
      </h3>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {pendingRequests.map((req) => (
          <div
            key={req.id}
            className="p-5 rounded-xl border border-warning/20 bg-warning/5 space-y-3.5 text-left border-l-4 border-l-warning shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-150">
                    {req.staffName} ({getRoleLabel(req.role)})
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getCategoryBadge(req.type)}`}>
                    {req.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{req.id}</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mt-2.5">
                  📅 {req.startDate} to {req.endDate}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                  Duration: {req.days} {req.days === 1 ? "day" : "days"}
                </p>
                {req.onCallDoctor && (
                  <p className="text-[10px] text-primary font-bold mt-0.5 flex items-center gap-1">
                    <span>🏥</span> Arrangements: On-Call Coverage by {req.onCallDoctor}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-stretch gap-2 shrink-0">
                <button
                  onClick={() => onApprove(req.id)}
                  className="px-3.5 py-1.5 bg-success text-white font-bold rounded-lg text-xs hover:bg-success/90 transition-all flex items-center justify-center gap-1 cursor-pointer outline-none shadow-sm shadow-success/10"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => onReject(req.id)}
                  className="px-3.5 py-1.5 bg-danger text-white font-bold rounded-lg text-xs hover:bg-danger/90 transition-all flex items-center justify-center gap-1 cursor-pointer outline-none shadow-sm shadow-danger/10"
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>

            <div className="bg-white/95 p-3 rounded-lg border border-gray-150 text-xs text-gray-750 italic leading-relaxed">
              Reason: "{req.reason}"
            </div>
          </div>
        ))}

        {pendingRequests.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl">
            <Inbox className="w-8 h-8 text-gray-400 mb-2" />
            <h4 className="text-sm font-bold text-gray-900">Queue is Clear</h4>
            <p className="text-xs text-gray-505 max-w-xs mt-0.5">
              There are no pending staff leave applications awaiting your review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
