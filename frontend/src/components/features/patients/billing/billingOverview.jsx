import { Check, AlertTriangle } from "lucide-react";

export default function BillingOverview({ totalBilled = 0, totalPaid = 0, outstanding = 0 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Billed */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-full pointer-events-none" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Billed</span>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{totalBilled.toLocaleString("en-IN")}</h3>
        <p className="text-xs text-gray-500 mt-1.5 font-medium">All treatments combined</p>
      </div>

      {/* Total Paid */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-bl-full pointer-events-none" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Paid</span>
        <h3 className="text-2xl font-bold text-success-800 mt-2">₹{totalPaid.toLocaleString("en-IN")}</h3>
        <p className="text-xs text-success font-medium mt-1.5 flex items-center gap-1">
          <span><Check className="w-3 h-3" /></span> Payments processed
        </p>
      </div>

      {/* Outstanding Balance */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-danger/5 rounded-bl-full pointer-events-none" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Outstanding Due</span>
        <h3 className={`text-2xl font-bold mt-2 ${outstanding > 0 ? "text-danger" : "text-gray-900"}`}>
          ₹{outstanding.toLocaleString("en-IN")}
        </h3>
        <p className={`text-xs mt-1.5 font-medium flex items-center gap-1.5 ${outstanding > 0 ? "text-danger" : "text-gray-500"}`}>
          {outstanding > 0 ? <><AlertTriangle className="w-3 h-3" /> Requires immediate payment</> : "No pending due"}
        </p>
      </div>
    </div>
  );
}
