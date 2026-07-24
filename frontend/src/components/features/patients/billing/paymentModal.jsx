import { useState, useEffect } from "react";
import { createPaymentOrder, verifyPayment } from "@/services/api";

export default function PaymentModal({ invoice, onClose, onPaymentSuccess }) {
  const [paymentState, setPaymentState] = useState("loading"); // loading | verifying | success | error | idle
  const [errorMessage, setErrorMessage] = useState("");

  const loadAndOpenRazorpay = async () => {
    setPaymentState("loading");
    setErrorMessage("");

    try {
      // Step 1: Create order on backend → get Razorpay order details
      // Note: We use invoice.id (which maps to appointment ID) and the patientDue amount
      const order = await createPaymentOrder(invoice.id, invoice.patientDue);

      // Step 2: Dynamically load the Razorpay checkout script
      await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(script);
      });

      // Step 3: Open the Razorpay payment popup
      const patientName =
        typeof window !== "undefined"
          ? localStorage.getItem("patient_name") || "Patient"
          : "Patient";

      const options = {
        key: order.key_id,
        amount: order.amount, // already in paise
        currency: order.currency,
        name: "SmileCare Dental Clinic",
        description: `Invoice Payment for ${invoice.invoiceNo || `INV-${invoice.id}`}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: patientName,
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => {
            setPaymentState("idle");
          },
        },
        handler: async (response) => {
          try {
            setPaymentState("verifying");
            // Step 4: Verify payment signature on the backend
            await verifyPayment({
              appointment_id: invoice.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaymentState("success");
            setTimeout(() => {
              onPaymentSuccess(invoice.id);
            }, 1000);
          } catch (err) {
            setPaymentState("error");
            setErrorMessage(err.message || "Payment verification failed.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setPaymentState("error");
        setErrorMessage(response.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setPaymentState("error");
      setErrorMessage(err.message || "Could not initialize payment. Please try again.");
    }
  };

  useEffect(() => {
    if (invoice) {
      loadAndOpenRazorpay();
    }
  }, [invoice]);

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 p-8 space-y-6 text-center animate-fade-in">
        {/* Close Button (only show if not actively loading or verifying) */}
        {paymentState !== "loading" && paymentState !== "verifying" && (
          <div className="flex justify-end -mr-4 -mt-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        )}

        {paymentState === "loading" && (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Opening payment method....</h3>
              <p className="text-xs text-gray-500 mt-1">Please wait while we initialize your secure transaction.</p>
            </div>
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 mt-2">
              <span className="text-xs font-semibold text-gray-500">Amount Due: </span>
              <span className="text-sm font-bold text-gray-900">₹{invoice.patientDue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {paymentState === "verifying" && (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-success/20 border-t-success rounded-full animate-spin"></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Verifying Payment...</h3>
              <p className="text-xs text-gray-500 mt-1">Securing your payment confirmation. Do not close this page.</p>
            </div>
          </div>
        )}

        {paymentState === "success" && (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center text-3xl animate-bounce">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-bold text-success-800">Payment Successful!</h3>
              <p className="text-xs text-gray-500 mt-1">Thank you. Your invoice status is being updated...</p>
            </div>
          </div>
        )}

        {paymentState === "idle" && (
          <div className="py-6 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl">
              ℹ
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payment Cancelled</h3>
              <p className="text-xs text-gray-500 mt-1">You closed the secure payment popup before completion.</p>
            </div>
            <div className="flex gap-3 w-full mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-250 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={loadAndOpenRazorpay}
                className="flex-1 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-colors shadow-sm"
              >
                Retry Payment
              </button>
            </div>
          </div>
        )}

        {paymentState === "error" && (
          <div className="py-6 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center text-3xl">
              ⚠
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payment Failed</h3>
              <p className="text-xs text-red-500 font-semibold mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-3 w-full mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-250 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={loadAndOpenRazorpay}
                className="flex-1 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-colors shadow-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
