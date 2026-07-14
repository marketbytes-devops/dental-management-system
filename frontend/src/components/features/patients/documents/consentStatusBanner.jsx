import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function ConsentStatusBanner({ pendingCount = 0, onActionClick }) {
  if (pendingCount === 0) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success-800" />
          <div>
            <h4 className="text-sm font-bold text-success-800">All Consents Signed</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              You are ready for your upcoming dental procedures.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-warning-800" />
        <div>
          <h4 className="text-sm font-bold text-warning-800">
            Action Required: {pendingCount} Consent Form{pendingCount > 1 ? "s" : ""} Pending
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Please review and sign these forms digitally before your appointment to avoid delays.
          </p>
        </div>
      </div>
      <button
        onClick={onActionClick}
        className="px-4 py-2 bg-white border border-warning/30 text-warning-950 font-bold text-xs rounded-xl hover:bg-warning hover:border-warning transition-colors shadow-sm self-stretch sm:self-auto text-center cursor-pointer"
      >
        Sign Now
      </button>
    </div>
  );
}
