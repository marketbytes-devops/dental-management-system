"use client";

import { useState } from "react";
import BillingOverview from "@/components/ui/patients/billing/billingOverview";
import OutstandingBanner from "@/components/ui/patients/billing/outstandingBanner";
import MyInvoiceList from "@/components/ui/patients/billing/myInvoiceList";
import InvoiceDetailCard from "@/components/ui/patients/billing/invoiceDetailCard";
import PaymentModal from "@/components/ui/patients/billing/paymentModal";
import { myInvoices as initialInvoices } from "@/components/ui/patients/mockData";

export default function PatientBillingPage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payTarget, setPayTarget] = useState(null);

  // Derived stats
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.gross, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.gross - inv.insurancePaid, 0);
  const outstanding = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.patientDue, 0);

  const handlePaymentSuccess = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "Paid" } : inv))
    );
    setPayTarget(null);
    alert("Payment received! Thank you. Your invoice status is now updated to Paid.");
  };

  const handlePayBannerClick = () => {
    const pending = invoices.find((inv) => inv.status === "Pending");
    if (pending) {
      setPayTarget(pending);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billing & Payments</h1>
        </div>
      </div>

      {/* Outstanding Banner */}
      <OutstandingBanner amount={outstanding} onPayClick={handlePayBannerClick} />

      {/* Overview stats */}
      <BillingOverview
        totalBilled={totalBilled}
        totalPaid={totalPaid}
        outstanding={outstanding}
      />

      {/* Main Invoice List Table */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <MyInvoiceList
          invoices={invoices}
          onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          onPayInvoice={(inv) => setPayTarget(inv)}
        />
      </div>

      {/* Detail Overlay Modal */}
      {selectedInvoice && (
        <InvoiceDetailCard
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Payment Processing Modal */}
      {payTarget && (
        <PaymentModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
