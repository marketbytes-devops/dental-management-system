"use client";

import { useState, useEffect, useRef } from "react";
import { Coins, CreditCard, Receipt, Truck } from "lucide-react";
import { getLabOrders } from "@/services/api";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

// Status lifecycle from dispatch.jsx: "Ready / Shipped", "Completed", "Delivered"
const DISPATCHED_STATUSES = ["Ready / Shipped", "Completed", "Delivered"];

function mapOrderToInvoice(o) {
  const invId = `INV-2026-${o.id.replace(/-/g, "")}`;

  let rate = 5000;
  let label = "Dental Prosthetic Fabrication";
  const typeUpper = (o.prosthetic_type || "").toUpperCase();
  if (typeUpper.includes("CROWN")) {
    rate = 3500;
    label = `${o.prosthetic_type} (${o.material || "Zirconia"})`;
  } else if (typeUpper.includes("BRIDGE")) {
    rate = 7200;
    label = `${o.prosthetic_type} (${o.material || "E-Max"})`;
  } else if (typeUpper.includes("IMPLANT")) {
    rate = 5500;
    label = `${o.prosthetic_type} (${o.material || "Screw-Retained"})`;
  } else if (typeUpper.includes("DENTURE")) {
    rate = 11500;
    label = `${o.prosthetic_type} (${o.material || "Acrylic"})`;
  }

  const items = [
    { name: label, qty: 1, rate },
    { name: "Laboratory Setup Fee", qty: 1, rate: 1000 },
  ];
  const amount = rate + 1000;

  let invStatus = "Unpaid";
  if (o.status === "Completed" || o.status === "Delivered") {
    invStatus = "Paid";
  } else if (o.status === "Rejected") {
    invStatus = "Overdue";
  } else if (DISPATCHED_STATUSES.includes(o.status)) {
    invStatus = "Dispatched";
  }

  return {
    id: invId,
    caseId: o.id,
    patient: o.patient_name || "Walk-in Patient",
    dentist: o.dentist_name || "Dr. Anoop Nair",
    clinic: "SmileCare Dental Clinic",
    amount,
    status: invStatus,
    orderStatus: o.status,
    date: o.due_date || "2026-06-15",
    items,
    dispatched: DISPATCHED_STATUSES.includes(o.status),
  };
}

const TABS = [
  { key: "all", label: "All Invoices" },
  { key: "pending", label: "⏳ Pending" },
  { key: "dispatched", label: "📦 Dispatched" },
];

export default function LabInvoices() {
  const [allInvoices, setAllInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvId, setSelectedInvId] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  // Track which invoices have been downloaded this session
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  // Post-download confirmation modal
  const [sendModal, setSendModal] = useState({ show: false, invoiceId: "", invoiceName: "" });
  const invoicePreviewRef = useRef(null);

  const fetchInvoices = async () => {
    try {
      const data = await getLabOrders();
      const mapped = data.map(mapOrderToInvoice);
      setAllInvoices(mapped);
      if (mapped.length > 0) {
        setSelectedInvId((prev) => {
          if (mapped.some((inv) => inv.id === prev)) return prev;
          return mapped[0].id;
        });
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 5000);
    return () => clearInterval(interval);
  }, []);

  // Derived list based on active tab
  const pendingInvoices = allInvoices.filter(
    (inv) => inv.status === "Unpaid" || inv.status === "Overdue"
  );
  const invoices =
    activeTab === "dispatched"
      ? allInvoices.filter((inv) => inv.dispatched)
      : activeTab === "pending"
      ? pendingInvoices
      : allInvoices;

  // Auto-select first of current tab
  useEffect(() => {
    if (invoices.length > 0 && !invoices.some((inv) => inv.id === selectedInvId)) {
      setSelectedInvId(invoices[0].id);
    }
  }, [activeTab, invoices]);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const currentInvoice = invoices.find((inv) => inv.id === selectedInvId) ||
    invoices[0] || {
      id: "N/A",
      caseId: "N/A",
      patient: "No Invoice Available",
      dentist: "N/A",
      clinic: "N/A",
      amount: 0,
      status: "N/A",
      date: "N/A",
      items: [],
    };

  // Stats across ALL invoices
  const dispatchedInvoices = allInvoices.filter((inv) => inv.dispatched);
  const totalRevenue = allInvoices.reduce(
    (acc, inv) => (inv.status === "Paid" ? acc + inv.amount : acc),
    0
  );
  // Outstanding = Unpaid + Overdue across ALL invoices
  const outstandingAmount = allInvoices.reduce(
    (acc, inv) =>
      inv.status === "Unpaid" || inv.status === "Overdue" ? acc + inv.amount : acc,
    0
  );
  const pendingCount = pendingInvoices?.length ?? 0;
  const paidCount = allInvoices.filter((inv) => inv.status === "Paid").length;

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success/10 text-success border-success/20";
      case "Dispatched":
        return "bg-primary/10 text-primary border-primary/20";
      case "Unpaid":
        return "bg-warning/10 text-warning border-warning/20";
      case "Overdue":
      default:
        return "bg-danger/10 text-danger border-danger/20";
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoicePreviewRef.current || isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const dataUrl = await toPng(invoicePreviewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth - 20;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(dataUrl, "PNG", 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
      pdf.save(`${currentInvoice.id}.pdf`);

      // ── Post-download logic ──────────────────────────────────────
      // 1. Mark this invoice as downloaded in local session state
      setDownloadedIds((prev) => new Set([...prev, currentInvoice.id]));

      // 2. Show success toast
      triggerToast(`Invoice ${currentInvoice.id} downloaded successfully.`, "success");

      // 3. Prompt to send to accountant (only for non-paid invoices)
      if (currentInvoice.status !== "Paid") {
        setTimeout(() => {
          setSendModal({
            show: true,
            invoiceId: currentInvoice.id,
            invoiceName: `${currentInvoice.patient} — ${currentInvoice.dentist}`,
          });
        }, 800); // slight delay so toast is visible first
      }
    } catch (err) {
      console.error(err);
      triggerToast("PDF generation failed.", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendInvoice = (invoiceId) => {
    const id = invoiceId || currentInvoice.id;
    setSendModal({ show: false, invoiceId: "", invoiceName: "" });
    triggerToast(`Invoice ${id} sent successfully to the Accountant.`, "success");
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Post-download Send Modal */}
      {sendModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center shrink-0 text-xl">✅</span>
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm">PDF Downloaded!</h4>
                <p className="text-xs text-gray-400 mt-0.5">Invoice {sendModal.invoiceId}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Would you like to send this invoice to the <span className="font-bold text-gray-900">Accountant</span> for processing?
            </p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              📋 {sendModal.invoiceName}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSendInvoice(sendModal.invoiceId)}
                className="flex-1 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-sm shadow-primary/35 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                ✉️ Yes, Send Now
              </button>
              <button
                onClick={() => setSendModal({ show: false, invoiceId: "", invoiceName: "" })}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-extrabold rounded-xl text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className={`w-3 h-3 rounded-full animate-pulse ${toast.type === "error" ? "bg-danger" : "bg-success"}`} />
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate dental lab billing statements, track clinic dues, and export financial summaries.
        </p>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Revenue (Paid)</p>
            <h3 className="text-2xl font-black text-gray-900">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-success font-semibold mt-1">From {paidCount} completed fabrications</p>
          </div>
          <span className="bg-success/10 p-3 rounded-xl text-success flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Outstanding Amount</p>
            <h3 className="text-2xl font-black text-gray-900">₹{outstandingAmount.toLocaleString()}</h3>
            <p className="text-xs text-warning font-semibold mt-1">{pendingCount} unpaid / overdue invoices</p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dispatched Orders</p>
            <h3 className="text-2xl font-black text-gray-900">{dispatchedInvoices.length}</h3>
            <p className="text-xs text-primary font-semibold mt-1">Ready / shipped cases</p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">All Invoices</p>
            <h3 className="text-2xl font-black text-gray-900">{allInvoices.length}</h3>
            <p className="text-xs text-gray-450 mt-1">Total billing cases</p>
          </div>
          <span className="bg-gray-100 p-3 rounded-xl text-gray-500 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-warning text-white text-[9px] rounded-full font-black">
                {pendingCount}
              </span>
            )}
            {tab.key === "dispatched" && dispatchedInvoices.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-white text-[9px] rounded-full font-black">
                {dispatchedInvoices.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left: Invoices list */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between overflow-x-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {activeTab === "dispatched"
                  ? "Dispatched Bills"
                  : activeTab === "pending"
                  ? "Pending Invoices"
                  : "Billing Ledger"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeTab === "dispatched"
                  ? "Invoices for orders marked Ready / Shipped, Completed, or Delivered"
                  : activeTab === "pending"
                  ? "Unpaid and overdue invoices requiring follow-up"
                  : "Summary of all outstanding and cleared invoices"}
              </p>
            </div>

            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">
                  {activeTab === "dispatched"
                    ? "No dispatched orders yet"
                    : activeTab === "pending"
                    ? "No pending invoices — all clear! ✅"
                    : "No invoices found"}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {activeTab === "dispatched"
                    ? "Orders will appear here once marked as Ready / Shipped or Delivered"
                    : activeTab === "pending"
                    ? "All invoices have been settled"
                    : "Lab orders will appear here once created"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Invoice ID</th>
                    <th className="px-4 py-3">Patient & Dentist</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    {activeTab === "dispatched" && (
                      <th className="px-4 py-3">Order Status</th>
                    )}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvId(inv.id)}
                      className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${
                        selectedInvId === inv.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          {inv.id}
                          {downloadedIds.has(inv.id) && (
                            <span className="px-1.5 py-0.5 bg-success/10 text-success border border-success/20 text-[8px] font-black rounded uppercase tracking-wider">
                              ✓ Downloaded
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-655">
                        <div>
                          <p className="font-semibold text-gray-800">{inv.patient}</p>
                          <p className="text-[10px] text-gray-400">{inv.dentist}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-500">{inv.date}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">₹{inv.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      {activeTab === "dispatched" && (
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-primary/5 text-primary border-primary/10">
                            {inv.orderStatus}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedInvId(inv.id)}
                          className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Printable Invoice Preview */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 font-sans">Statement Preview</h3>
              <p className="text-xs text-gray-400 mt-0.5">High-fidelity printable invoice template</p>
            </div>

            {/* Printable Frame */}
            <div ref={invoicePreviewRef} className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 text-xs shadow-inner">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-gray-900">SmileCare Dental Lab</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">12th Floor, Metro Plaza, Bangalore</p>
                </div>
                <div className="text-right">
                  <h4 className="font-extrabold text-primary text-sm">{currentInvoice.id}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Date: {currentInvoice.date}</p>
                  {currentInvoice.dispatched && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[8px] font-black rounded uppercase tracking-wider">
                      📦 Dispatched
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Client coords */}
              <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-600">
                <div>
                  <p className="font-bold uppercase text-gray-400 tracking-wider">Billed To:</p>
                  <p className="font-bold text-gray-800 mt-0.5">{currentInvoice.dentist}</p>
                  <p className="mt-0.5">{currentInvoice.clinic}</p>
                </div>
                <div>
                  <p className="font-bold uppercase text-gray-400 tracking-wider">Patient Case:</p>
                  <p className="font-bold text-gray-800 mt-0.5">{currentInvoice.patient}</p>
                  <p className="mt-0.5">Case Reference: {currentInvoice.caseId}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-12 font-bold text-gray-450 border-b border-gray-200 pb-1 text-[9px] uppercase tracking-wider">
                  <span className="col-span-8">Restoration Work Item</span>
                  <span className="col-span-1 text-center">Qty</span>
                  <span className="col-span-3 text-right">Price</span>
                </div>
                {currentInvoice.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-gray-700 py-1">
                    <span className="col-span-8 font-semibold">{item.name}</span>
                    <span className="col-span-1 text-center font-bold">{item.qty}</span>
                    <span className="col-span-3 text-right font-bold">₹{item.rate.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-200" />

              {/* Total + Status */}
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Grand Total:</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusColor(currentInvoice.status)}`}>
                    {currentInvoice.status}
                  </span>
                </div>
                <span className="text-base font-black text-gray-900">₹{currentInvoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-100 bg-white">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-sm shadow-primary/35 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? "⏳ Generating..." : downloadedIds.has(currentInvoice.id) ? "📥 Re-download PDF" : "📥 Download PDF"}
            </button>
            <button
              onClick={() => handleSendInvoice(currentInvoice.id)}
              className={`flex-1 py-2.5 font-extrabold rounded-xl text-xs transition-colors cursor-pointer border ${
                downloadedIds.has(currentInvoice.id) && currentInvoice.status !== "Paid"
                  ? "bg-success text-white border-success shadow-sm shadow-success/35 hover:bg-success/90 animate-pulse"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {downloadedIds.has(currentInvoice.id) && currentInvoice.status !== "Paid"
                ? "✉️ Send to Accountant ↗"
                : "✉️ Send to Accountant"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
