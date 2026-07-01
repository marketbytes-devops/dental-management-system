"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BillingOverview from "@/components/ui/patients/billing/billingOverview";
import OutstandingBanner from "@/components/ui/patients/billing/outstandingBanner";
import MyInvoiceList from "@/components/ui/patients/billing/myInvoiceList";
import InvoiceDetailCard from "@/components/ui/patients/billing/invoiceDetailCard";
import PaymentModal from "@/components/ui/patients/billing/paymentModal";
import { getPatientProfile, getPatientAppointments } from "@/services/api";

export default function PatientBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBillingData = async () => {
    try {
      const profileData = await getPatientProfile();
      const appts = await getPatientAppointments(profileData.id);
      
      const treatmentCosts = {
        "checkup": 500,
        "cleaning": 1000,
        "root canal": 5000,
        "crown": 8000,
        "extraction": 1500,
        "filling": 1200,
        "consultation": 1500
      };
      
      const mappedInvoices = appts.map((appt) => {
        const treatment = (appt.treatment_type || "Consultation").toLowerCase();
        let gross = 1500;
        for (const [key, cost] of Object.entries(treatmentCosts)) {
          if (treatment.includes(key)) {
            gross = cost;
            break;
          }
        }
        const insurancePaid = Math.round(gross * 0.7); // 70% insurance coverage
        const patientDue = gross - insurancePaid;
        const status = appt.status === "Completed" ? "Paid" : "Pending";
        
        return {
          id: appt.id,
          invoiceNo: `INV-${appt.id + 100}`,
          treatment: appt.treatment_type || "General Consultation",
          doctor: appt.doctor_name || "Clinic Dentist",
          date: appt.appointment_date,
          status: status,
          gross: gross,
          insurancePaid: insurancePaid,
          patientDue: status === "Paid" ? 0 : patientDue,
        };
      });
      
      setInvoices(mappedInvoices);
    } catch (err) {
      console.error("Failed to load patient billing:", err);
      setError(err.message || "Failed to load billing history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

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
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "Paid", patientDue: 0 } : inv))
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-4 font-semibold">Loading billing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-red-650 font-bold">{error}</p>
        <button onClick={loadBillingData} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 shadow-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
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
