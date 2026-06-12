export default function InvoiceDetailCard({ invoice, onClose }) {
  if (!invoice) return null;

  const gstAmount = Math.round(invoice.patientDue * 0.18);
  const totalDueWithTax = invoice.patientDue + gstAmount;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-gray-150 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">{invoice.id} · Issued {invoice.date}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Breakdown details */}
        <div className="space-y-4 text-xs sm:text-sm text-gray-600">
          <div className="bg-gray-50 p-4 rounded-xl space-y-2.5 font-medium border border-gray-100">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Treatment Procedure</span>
            <p className="text-base font-extrabold text-gray-900">{invoice.treatment}</p>
          </div>

          <div className="space-y-3 font-semibold text-gray-750">
            <div className="flex justify-between">
              <span>Gross Fee / Base Price</span>
              <span>₹{invoice.gross.toLocaleString("en-IN")}</span>
            </div>
            
            <div className="flex justify-between text-success-800">
              <span>Insurance Coverage Offset</span>
              <span>- ₹{invoice.insurancePaid.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between pt-3 border-t border-dashed border-gray-200 text-gray-500">
              <span>Patient Share (Co-Pay)</span>
              <span>₹{invoice.patientDue.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>GST Tax (18%)</span>
              <span>₹{gstAmount.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-extrabold text-gray-950">
              <span>Total Payable Amount</span>
              <span>₹{totalDueWithTax.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors text-center shadow-sm"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
}
