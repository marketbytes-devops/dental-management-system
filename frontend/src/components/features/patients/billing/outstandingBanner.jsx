import { CreditCard } from "lucide-react";

export default function OutstandingBanner({ amount = 0, onPayClick }) {
  if (amount <= 0) return null;

  return (
    <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-danger" />
        <div>
          <h4 className="text-sm font-bold text-danger">Outstanding Payment Due</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            You have an unpaid balance of ₹{amount.toLocaleString("en-IN")} for recent dental treatments.
          </p>
        </div>
      </div>
      <button
        onClick={onPayClick}
        className="px-4 py-2 bg-white border border-danger/30 text-danger text-xs font-semibold rounded-xl hover:bg-danger hover:text-white hover:border-danger transition-colors shadow-sm self-stretch sm:self-auto text-center cursor-pointer"
      >
        Pay Outstanding Bill
      </button>
    </div>
  );
}
