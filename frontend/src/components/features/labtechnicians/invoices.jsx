"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Coins,
  CreditCard,
  Receipt,
  Truck,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Printer,
  FileText
} from "lucide-react";
import { getLabOrders, sendLabBillingRequest } from "@/services/api";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

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
    date: o.created_at ? o.created_at.split("T")[0] : "2026-06-10",
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
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [allInvoices, setAllInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvId, setSelectedInvId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
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
    const interval = setInterval(fetchInvoices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const pendingInvoices = useMemo(() => {
    return allInvoices.filter(
      (inv) => inv.status === "Unpaid" || inv.status === "Overdue"
    );
  }, [allInvoices]);

  const filteredByTab = useMemo(() => {
    return activeTab === "dispatched"
      ? allInvoices.filter((inv) => inv.dispatched)
      : activeTab === "pending"
        ? pendingInvoices
        : allInvoices;
  }, [activeTab, allInvoices, pendingInvoices]);

  const invoices = useMemo(() => {
    return filteredByTab.filter((inv) => {
      const matchesSearch =
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.dentist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clinic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        inv.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [filteredByTab, searchQuery, statusFilter]);

  // Auto-select first matching invoice when list changes
  useEffect(() => {
    if (invoices.length > 0 && !invoices.some((inv) => inv.id === selectedInvId)) {
      setSelectedInvId(invoices[0].id);
    }
  }, [activeTab, searchQuery, statusFilter]);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const currentInvoice = allInvoices.find((inv) => inv.id === selectedInvId) ||
    invoices[0] ||
    allInvoices[0] || {
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
  const outstandingAmount = allInvoices.reduce(
    (acc, inv) =>
      inv.status === "Unpaid" || inv.status === "Overdue" ? acc + inv.amount : acc,
    0
  );
  const pendingCount = pendingInvoices.length;
  const paidCount = allInvoices.filter((inv) => inv.status === "Paid").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle className="w-3.5 h-3.5" /> Paid
          </span>
        );
      case "Dispatched":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Truck className="w-3.5 h-3.5" /> Dispatched
          </span>
        );
      case "Unpaid":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3.5 h-3.5" /> Unpaid
          </span>
        );
      case "Overdue":
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            <AlertCircle className="w-3.5 h-3.5" /> Overdue
          </span>
        );
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

      setDownloadedIds((prev) => new Set([...prev, currentInvoice.id]));
      triggerToast(`Invoice ${currentInvoice.id} downloaded successfully.`, "success");

      setInvoiceModalOpen(false);

      if (currentInvoice.status !== "Paid") {
        setTimeout(() => {
          setSendModal({
            show: true,
            invoiceId: currentInvoice.id,
            invoiceName: `${currentInvoice.patient} — ${currentInvoice.dentist}`,
          });
        }, 800);
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
    <div className="space-y-6 pb-12 text-gray-800">
      {/* Send Modal */}
      {sendModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-5 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 text-xl">🎉</div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Invoice Ready!</h4>
                <p className="text-xs text-slate-400 mt-0.5">{sendModal.invoiceId}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Would you like to instantly dispatch this statement to the <span className="font-semibold text-slate-900">Accountant</span>?
            </p>
            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <span className="font-bold text-slate-400 block mb-1">RECIPIENT & DETAILS</span>
              {sendModal.invoiceName}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSendInvoice(sendModal.invoiceId)}
                className="flex-1 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/95 transition-all active:scale-95 cursor-pointer"
              >
                Yes, Send Now
              </button>
              <button
                onClick={() => setSendModal({ show: false, invoiceId: "", invoiceName: "" })}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-extrabold rounded-xl text-xs hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-slate-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${toast.type === "error" ? "bg-rose-500" : "bg-emerald-500"}`} />
          <span className="text-sm font-semibold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of lab orders, clinical outstanding balances, statement previews, and direct exports.
          </p>
        </div>
      </div>

      {/* Modern Stats Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <h3 className="text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</h3>
            <span className="text-[11px] text-emerald-600 font-bold block">From {paidCount} paid jobs</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Outstanding Due</span>
            <h3 className="text-2xl font-black text-rose-600">₹{outstandingAmount.toLocaleString()}</h3>
            <span className="text-[11px] text-amber-600 font-semibold block">{pendingCount} pending payment statements</span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3.5 rounded-2xl shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dispatched Jobs</span>
            <h3 className="text-2xl font-black text-blue-600">{dispatchedInvoices.length}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block">Ready or shipped statements</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">All Statements</span>
            <h3 className="text-2xl font-black text-slate-900">{allInvoices.length}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block">Total registered records</span>
          </div>
          <div className="bg-slate-100 text-slate-500 p-3.5 rounded-2xl shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main interactive segment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Side: Search & Ledger List */}
        <div className="lg:col-span-12 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Billing Ledger</h3>
              <p className="text-xs text-slate-400">Search, filter and inspect clinic dues records</p>
            </div>

            {/* Tab selector */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${activeTab === tab.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {tab.key === "all" ? "All" : tab.key === "pending" ? `Pending (${pendingCount})` : `Dispatched (${dispatchedInvoices.length})`}
                </button>
              ))}
            </div>
          </div >

          {/* Search, Filter controls */}
          < div className="grid grid-cols-1 sm:grid-cols-12 gap-3" >
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by ID, patient, dentist or clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="dispatched">Dispatched</option>
              </select>
            </div>
          </div >

          {/* Ledger Table */}
          {
            invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                <FileText className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="text-sm font-black text-slate-700">No matching invoices</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  We couldn't find any invoices matching your search parameters or filter tab.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Invoice ID</th>
                      <th className="pb-3 px-3">Client & Patient</th>
                      <th className="pb-3 px-3">Due Date</th>
                      <th className="pb-3 px-3">Amount</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/80">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => {
                          setSelectedInvId(inv.id);
                          setInvoiceModalOpen(true);
                        }}
                        className={`group hover:bg-slate-50/60 transition-all cursor-pointer ${selectedInvId === inv.id ? "bg-primary/5" : ""
                          }`}
                      >
                        <td className="py-4 px-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                              {inv.id}
                            </span>
                            {downloadedIds.has(inv.id) && (
                              <span className="w-max px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[8px] font-black rounded uppercase tracking-wider">
                                ✓ Downloaded
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <div>
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">{inv.patient}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5 font-medium">{inv.dentist} • {inv.clinic}</p>
                          </div>
                        </td>
                        <td className="py-4 px-3 font-semibold text-slate-500 text-xs">{inv.date}</td>
                        <td className="py-4 px-3 font-black text-slate-900 text-xs sm:text-sm">₹{inv.amount.toLocaleString()}</td>
                        <td className="py-4 px-3">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-4 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await sendLabBillingRequest({
                                    patient_token: inv.caseId || "PT-WALKIN",
                                    doctor_name: inv.dentist || "Lab Technician",
                                    amount: inv.amount,
                                    notes: `Lab Invoice ${inv.id} (${inv.items.map(i => i.name).join(', ')})`,
                                    procedures: inv.items.map(i => ({ procedure_id: 1, name: i.name, rate: i.rate }))
                                  });
                                  triggerToast(`Invoice ${inv.id} sent to Accountant!`, "success");
                                } catch (err) {
                                  console.error(err);
                                  triggerToast("Failed to send invoice to accountant.", "error");
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Send charge to Accountant module"
                            >
                              <Send className="w-3 h-3" /> Send to Accountant
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvId(inv.id);
                                setInvoiceModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${selectedInvId === inv.id
                                ? "bg-primary text-white border-primary"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700"
                                }`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div >

      </div >
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="flex justify-between items-center border-b p-6">
              <div>
                <h2 className="text-xl font-bold">
                  Invoice Details
                </h2>
                <p className="text-sm text-gray-500">
                  {currentInvoice.id}
                </p>
              </div>

              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="text-2xl hover:text-red-500"
              >
                ✕
              </button>
            </div>

            {/* Invoice */}
            <div className="p-6">

              <div
                ref={invoicePreviewRef}
                className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-5 text-xs shadow-inner select-none transition-all duration-200"
              >
                {/* Paste this */}

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      SmileCare Dental Lab
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1">
                      12th Floor, Metro Plaza, Bangalore
                    </p>
                    <p className="text-[9px] text-slate-400">
                      contact@smilecarelab.com
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black tracking-widest rounded-md uppercase border border-primary/20 block w-max ml-auto mb-1">
                      LAB STATEMENT
                    </span>

                    <h4 className="font-extrabold text-primary text-sm sm:text-base">
                      {currentInvoice.id}
                    </h4>

                    <p className="text-[10px] text-slate-450 mt-1">
                      Issued: {currentInvoice.date}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-150/80" />

                <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                  <div className="space-y-1">
                    <span className="font-bold uppercase text-slate-400 text-[9px] tracking-wider block">
                      Billed To
                    </span>

                    <p className="font-extrabold text-slate-950">
                      {currentInvoice.dentist}
                    </p>

                    <p className="text-[10px] leading-relaxed text-slate-500">
                      {currentInvoice.clinic}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold uppercase text-slate-400 text-[9px] tracking-wider block">
                      Case Description
                    </span>

                    <p className="font-extrabold text-slate-950">
                      {currentInvoice.patient}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      Case Ref: {currentInvoice.caseId}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-12 font-bold text-slate-400 border-b border-slate-100 pb-1.5 text-[9px] uppercase tracking-wider">
                    <span className="col-span-8">Work Description</span>
                    <span className="col-span-1 text-center">Qty</span>
                    <span className="col-span-3 text-right">Total Price</span>
                  </div>

                  {currentInvoice.items.length === 0 ? (
                    <p className="text-center text-slate-400 py-3">
                      No work items found
                    </p>
                  ) : (
                    currentInvoice.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 text-slate-700 py-1 items-center font-medium"
                      >
                        <span className="col-span-8 font-semibold text-slate-800">
                          {item.name}
                        </span>

                        <span className="col-span-1 text-center font-bold text-slate-950">
                          {item.qty}
                        </span>

                        <span className="col-span-3 text-right font-bold text-slate-950">
                          ₹{item.rate.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="h-px bg-slate-150/80" />

                <div className="flex justify-between items-center pt-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Payment Status:
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${currentInvoice.status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                        : currentInvoice.status === "Dispatched"
                          ? "bg-blue-50 text-blue-700 border-blue-200/50"
                          : "bg-amber-50 text-amber-700 border-amber-200/50"
                        }`}
                    >
                      {currentInvoice.status}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">
                      Grand Total
                    </span>

                    <span className="text-lg font-black text-slate-900">
                      ₹{currentInvoice.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t p-6 flex justify-end gap-3">

              <button
                onClick={handleDownloadPDF}
                className="px-5 py-3 bg-primary text-white rounded-xl"
              >
                Download PDF
              </button>

              <button
                onClick={() => handleSendInvoice(currentInvoice.id)}
                className="px-5 py-3 border rounded-xl"
              >
                Dispatch
              </button>

            </div>
          </div>
        </div>
      )
      }
    </div >
  );
}
