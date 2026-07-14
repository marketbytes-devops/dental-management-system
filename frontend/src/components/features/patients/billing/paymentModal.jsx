import { useState } from "react";

export default function PaymentModal({ invoice, onClose, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi | card | emi | netbank
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  if (!invoice) return null;

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(invoice.id);
    }, 1500); // simulate 1.5s gateway latency
  };

  const getTaxedTotal = () => {
    return Math.round(invoice.patientDue * 1.18);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-gray-150 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Make a Payment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pay online securely for invoice {invoice.id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {/* Tab Links */}
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 gap-1">
          {[
            { id: "upi", label: "UPI" },
            { id: "card", label: "Card" },
            { id: "emi", label: "EMI" },
            { id: "netbank", label: "NetBanking" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => !isProcessing && setPaymentMethod(tab.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all ${
                paymentMethod === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Amount Box */}
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Due (incl. GST)</span>
          <span className="text-2xl font-extrabold text-primary">₹{getTaxedTotal().toLocaleString("en-IN")}</span>
        </div>

        {/* Form area based on Tab selection */}
        <form onSubmit={handlePay} className="space-y-4 text-xs sm:text-sm text-gray-600">
          {paymentMethod === "upi" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <span className="text-5xl mb-2">📱</span>
                <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">Scan QR Code</span>
                <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg mt-3 flex items-center justify-center font-bold text-gray-300">
                  [ MOCK QR ]
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 block">Or enter UPI ID</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="rahul@okhdfcbank"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-gray-800"
                />
              </div>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4321 8765 9012 3456"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-gray-850"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-gray-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength="3"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="***"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-gray-850"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "emi" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-gray-700 block">Choose your EMI Plan</span>
              <div className="space-y-2">
                {[
                  { months: 3, amount: Math.round(getTaxedTotal() / 3), rate: "0% Interest" },
                  { months: 6, amount: Math.round(getTaxedTotal() / 6), rate: "0% Interest" },
                  { months: 12, amount: Math.round(getTaxedTotal() / 12 * 1.05), rate: "5% Interest" },
                ].map((plan) => (
                  <label
                    key={plan.months}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <input type="radio" name="emi_plan" required className="accent-primary" />
                      <span className="font-bold text-gray-800 text-xs sm:text-sm">{plan.months} Months EMI</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-gray-900 block text-xs sm:text-sm">₹{plan.amount}/mo</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{plan.rate}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === "netbank" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-700 block">Select your Bank</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-semibold text-gray-700 bg-white">
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>State Bank of India</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
