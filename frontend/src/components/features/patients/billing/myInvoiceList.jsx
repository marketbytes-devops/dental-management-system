export default function MyInvoiceList({ invoices = [], onSelectInvoice, onPayInvoice }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Invoices & Statements</h3>
      </div>

      <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Treatment</th>
                <th className="p-4 text-right">Gross Amount</th>
                <th className="p-4 text-right">Insurance Paid</th>
                <th className="p-4 text-right">Net Due</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-950">{inv.id}</td>
                  <td className="p-4 whitespace-nowrap">{inv.date}</td>
                  <td className="p-4 font-semibold text-gray-900">{inv.treatment}</td>
                  <td className="p-4 text-right">₹{inv.gross.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-right text-success-800">₹{inv.insurancePaid.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-right font-extrabold text-gray-900">₹{inv.patientDue.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${inv.status === "Paid"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                        }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </button>
                    {inv.status !== "Paid" && (
                      <button
                        onClick={() => onPayInvoice(inv)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
