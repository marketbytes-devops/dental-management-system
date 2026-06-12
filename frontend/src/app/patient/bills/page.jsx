"use client";

import { useState } from "react";
import { CreditCard, Landmark, Check, ShieldCheck, Receipt, DollarSign, Wallet } from "lucide-react";

export default function PatientBillsPage() {
  const [invoices, setInvoices] = useState([
    { id: "INV-094", date: "2026-06-15", treatment: "Root Canal", gross: 8000, insurancePaid: 5600, patientDue: 2400, status: "Pending" },
    { id: "INV-089", date: "2026-05-12", treatment: "Scaling & Polishing", gross: 1500, insurancePaid: 1050, patientDue: 450, status: "Paid" },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const pendingInvoices = invoices.filter(i => i.status === "Pending");
  const outstandingBalance = pendingInvoices.reduce((sum, i) => sum + i.patientDue, 0);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentSuccess(false);
    setPaying(false);
  };

  const closePaymentModal = () => {
    setSelectedInvoice(null);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setPaying(true);

    // Simulate Payment Gateway Delay
    setTimeout(() => {
      setInvoices(prev => 
        prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: "Paid" } : inv)
      );
      setPaying(false);
      setPaymentSuccess(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Billing & Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your invoices, check insurance coverage co-pay details, and pay outstanding balances securely.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-danger/5 rounded-bl-full pointer-events-none" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Outstanding Balance</p>
            <h3 className={`text-2xl font-bold ${outstandingBalance > 0 ? "text-danger" : "text-success"}`}>
              ₹{outstandingBalance.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {pendingInvoices.length} invoice(s) outstanding
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-success/5 rounded-bl-full pointer-events-none" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Insurance Co-Pay</p>
            <h3 className="text-2xl font-bold text-gray-900">70%</h3>
            <p className="text-xs text-secondary font-medium mt-2">
              Provided by Star Health
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payments Made</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹{(invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.patientDue, 0)).toLocaleString()}
            </h3>
            <p className="text-xs text-success font-medium mt-2">
              All receipts up to date
            </p>
          </div>
        </div>

      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-905">Invoice History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-650 border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-6">Invoice ID</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Procedure</th>
                <th className="py-3 px-6 text-right">Gross (₹)</th>
                <th className="py-3 px-6 text-right">Insurance Paid (₹)</th>
                <th className="py-3 px-6 text-right">Patient Due (₹)</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="py-4 px-6 font-bold text-primary">{inv.id}</td>
                  <td className="py-4 px-6">{inv.date}</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">{inv.treatment}</td>
                  <td className="py-4 px-6 text-right">₹{inv.gross.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right text-secondary">₹{inv.insurancePaid.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">₹{inv.patientDue.toLocaleString()}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inv.status === "Paid" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {inv.status === "Pending" ? (
                      <button 
                        onClick={() => openPaymentModal(inv)}
                        className="px-3 py-1 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg shadow-sm shadow-primary/20 cursor-pointer outline-none"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <button 
                        onClick={() => alert(`Receipt for ${inv.id} downloaded.`)}
                        className="px-3 py-1 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer outline-none"
                      >
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Modal Popup Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150 relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Secure Checkout</h3>
                <p className="text-xs text-gray-500">Invoice: {selectedInvoice.id}</p>
              </div>
              <button 
                onClick={closePaymentModal}
                disabled={paying}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            {paymentSuccess ? (
              /* Success screen */
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-success/10 text-success border border-success/20 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-gray-950">Payment Successful!</h4>
                  <p className="text-xs text-gray-500">Transaction ID: TXN-38291048</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-left text-gray-600 space-y-1.5 max-w-xs mx-auto">
                  <div className="flex justify-between">
                    <span>Paid Amount:</span>
                    <span className="font-bold text-gray-900">₹{selectedInvoice.patientDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="font-bold uppercase text-gray-900">{paymentMethod}</span>
                  </div>
                </div>
                <button 
                  onClick={closePaymentModal}
                  className="w-full bg-success text-white py-2 rounded-xl text-sm font-semibold hover:bg-success/90 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Payment form */
              <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                
                {/* Due billing statement */}
                <div className="bg-danger/5 border border-danger/10 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-danger" />
                    <div>
                      <span className="text-xs text-gray-500 block">Total Due</span>
                      <span className="text-xs font-bold text-gray-800">{selectedInvoice.treatment}</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-danger">₹{selectedInvoice.patientDue.toLocaleString()}</span>
                </div>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === "card" ? "border-primary bg-primary/5 text-primary" : "border-gray-150 text-gray-600 bg-white"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Credit/Debit Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === "upi" ? "border-primary bg-primary/5 text-primary" : "border-gray-150 text-gray-600 bg-white"
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    UPI / QR Code
                  </button>
                </div>

                {/* Form fields */}
                {paymentMethod === "card" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">CARDHOLDER NAME</label>
                      <input type="text" defaultValue="Rahul Kumar" required className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">CARD NUMBER</label>
                      <input type="text" placeholder="XXXX XXXX XXXX XXXX" required className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">EXPIRY DATE</label>
                        <input type="text" placeholder="MM/YY" required className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">CVV CODE</label>
                        <input type="password" placeholder="***" maxLength="3" required className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">UPI VIRTUAL PRIVATE ADDRESS</label>
                      <input type="text" placeholder="rahul@okaxis" required className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none" />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">A collect request will be sent to your UPI app.</p>
                  </div>
                )}

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide pt-2">
                  <ShieldCheck className="w-4 h-4 text-success" /> 256-bit SSL secure encryption
                </div>

                {/* Pay button */}
                <button
                  type="submit"
                  disabled={paying}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${
                    paying 
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                      : "bg-success text-white hover:bg-success/90 shadow-sm shadow-success/30"
                  }`}
                >
                  {paying ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                      Processing Transaction...
                    </>
                  ) : (
                    <>Pay Securely ₹{selectedInvoice.patientDue.toLocaleString()}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
