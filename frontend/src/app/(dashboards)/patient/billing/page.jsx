"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BillingOverview from "@/components/features/patients/billing/billingOverview";
import OutstandingBanner from "@/components/features/patients/billing/outstandingBanner";
import MyInvoiceList from "@/components/features/patients/billing/myInvoiceList";
import InvoiceDetailCard from "@/components/features/patients/billing/invoiceDetailCard";
import PaymentModal from "@/components/features/patients/billing/paymentModal";
import { getMyPatientLedger } from "@/services/api";

export default function PatientBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [activeTab, setActiveTab] = useState("bills"); // "bills" | "consultations"
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ledgerStats, setLedgerStats] = useState({
    totalBilled: 0,
    totalPaid: 0,
    outstanding: 0,
  });
  const [patientDetails, setPatientDetails] = useState(null);

  const loadBillingData = async () => {
    try {
      const ledger = await getMyPatientLedger();
      
      setLedgerStats({
        totalBilled: ledger.total_charges || 0,
        totalPaid: ledger.total_paid || 0,
        outstanding: ledger.outstanding_balance || 0,
      });
      
      setPatientDetails({
        name: ledger.patient_name || "",
        phone: ledger.patient_phone || "",
        token: ledger.patient_token || "",
      });
      
      const mappedInvoices = (ledger.stacked_items || []).map((item) => {
        const isPaid = item.status === "Paid";
        return {
          id: item.id,
          invoiceNo: item.id.toUpperCase(),
          treatment: item.title || "Treatment Fee",
          doctor: item.doctor_name || "Clinic Staff",
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : "-",
          status: isPaid ? "Paid" : "Pending",
          gross: item.amount,
          insurancePaid: 0,
          patientDue: isPaid ? 0 : item.amount,
        };
      });
      
      setInvoices(mappedInvoices);
      
      const mappedConsultations = (ledger.consultations || []).map((item) => {
        return {
          id: item.id,
          invoiceNo: item.invoiceNo,
          treatment: item.title,
          doctor: item.doctor_name,
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : "-",
          status: item.status,
          gross: item.amount,
          insurancePaid: 0,
          patientDue: 0,
          paymentMethod: item.payment_method
        };
      });
      setConsultations(mappedConsultations);
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

  const handlePaymentSuccess = (invoiceId) => {
    // Reload the entire ledger to get updated balances
    loadBillingData();
    setPayTarget(null);
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
      <OutstandingBanner amount={ledgerStats.outstanding} onPayClick={handlePayBannerClick} />

      {/* Overview stats */}
      <BillingOverview
        totalBilled={ledgerStats.totalBilled}
        totalPaid={ledgerStats.totalPaid}
        outstanding={ledgerStats.outstanding}
      />

      {/* Main Invoice List Table */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex space-x-2 mb-6 p-1 bg-gray-50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("bills")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === "bills" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Treatment Bills
          </button>
          <button
            onClick={() => setActiveTab("consultations")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === "consultations" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Consultation Charges
          </button>
        </div>
        
        <MyInvoiceList
          invoices={activeTab === "bills" ? invoices : consultations}
          activeTab={activeTab}
          patientDetails={patientDetails}
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
