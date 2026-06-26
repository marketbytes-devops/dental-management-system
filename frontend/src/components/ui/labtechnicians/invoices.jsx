"use client";

import { useState, useEffect } from "react";
import { Coins, CreditCard, Receipt } from "lucide-react";

export default function LabInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvId, setSelectedInvId] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  const fetchInvoices = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://localhost:8000/lab/orders", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map(o => {
          const suffix = o.id.split("-")[2] || "000";
          const invId = `INV-2026-${suffix}`;
          
          let rate = 5000;
          let label = "Dental Prosthetic Fabrication";
          const typeUpper = (o.prosthetic_type || "").toUpperCase();
          if (typeUpper.includes("CROWN")) {
            rate = 3500;
            label = `${o.prosthetic_type} (${o.material || 'Zirconia'})`;
          } else if (typeUpper.includes("BRIDGE")) {
            rate = 7200;
            label = `${o.prosthetic_type} (${o.material || 'E-Max'})`;
          } else if (typeUpper.includes("IMPLANT")) {
            rate = 5500;
            label = `${o.prosthetic_type} (${o.material || 'Screw-Retained'})`;
          } else if (typeUpper.includes("DENTURE")) {
            rate = 11500;
            label = `${o.prosthetic_type} (${o.material || 'Acrylic'})`;
          }
          
          const items = [
            { name: label, qty: 1, rate: rate },
            { name: "Laboratory Setup Fee", qty: 1, rate: 1000 }
          ];
          const amount = rate + 1000;
          
          let invStatus = "Unpaid";
          if (o.status === "Completed" || o.status === "Delivered") {
            invStatus = "Paid";
          } else if (o.status === "Rejected") {
            invStatus = "Overdue";
          }
          
          return {
            id: invId,
            caseId: o.id,
            patient: o.patient_name || "Walk-in Patient",
            dentist: o.dentist_name || "Dr. Anoop Nair",
            clinic: "SmileCare Dental Clinic",
            amount: amount,
            status: invStatus,
            date: o.due_date || "2026-06-15",
            items: items
          };
        });
        setInvoices(mapped);
        if (mapped.length > 0) {
          setSelectedInvId(prev => {
            if (mapped.some(inv => inv.id === prev)) return prev;
            return mapped[0].id;
          });
        }
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

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const currentInvoice = invoices.find(inv => inv.id === selectedInvId) || invoices[0] || {
    id: "N/A",
    caseId: "N/A",
    patient: "No Invoice Available",
    dentist: "N/A",
    clinic: "N/A",
    amount: 0,
    status: "N/A",
    date: "N/A",
    items: []
  };

  // Stats calculation
  const totalRevenue = invoices.reduce((acc, inv) => inv.status === "Paid" ? acc + inv.amount : acc, 0);
  const pendingPayments = invoices.reduce((acc, inv) => inv.status !== "Paid" ? acc + inv.amount : acc, 0);
  const paidCount = invoices.filter(inv => inv.status === "Paid").length;

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid": return "bg-success/10 text-success border-success/20";
      case "Unpaid": return "bg-warning/10 text-warning border-warning/20";
      case "Overdue":
      default: return "bg-danger/10 text-danger border-danger/20";
    }
  };

  const handleDownloadPDF = () => {
    triggerToast(`Invoice ${currentInvoice.id} downloaded successfully as PDF.`);
  };

  const handleSendInvoice = () => {
    triggerToast(`Invoice ${currentInvoice.id} sent successfully to the Accountant.`);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">Generate dental lab billing statements, track clinic dues, and export financial summaries.</p>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pending Payments</p>
            <h3 className="text-2xl font-black text-gray-900">₹{pendingPayments.toLocaleString()}</h3>
            <p className="text-xs text-warning font-semibold mt-1">Outstanding clinic balances</p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Billing Invoices</p>
            <h3 className="text-2xl font-black text-gray-900">{invoices.length}</h3>
            <p className="text-xs text-gray-450 mt-1">Active billing cases</p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Invoices list (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between overflow-x-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Billing Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Summary of outstanding and cleared invoices</p>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Patient & Dentist</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
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
                    <td className="px-4 py-3 font-bold text-gray-900">{inv.id}</td>
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
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedInvId(inv.id)}
                          className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Printable Invoice Mockup Card (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 font-sans">Statement Preview</h3>
              <p className="text-xs text-gray-400 mt-0.5">High-fidelity printable invoice template</p>
            </div>

            {/* Printable Frame */}
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4 text-xs shadow-inner">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-gray-900">SmileCare Dental Lab</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">12th Floor, Metro Plaza, Bangalore</p>
                </div>
                <div className="text-right">
                  <h4 className="font-extrabold text-primary text-sm">{currentInvoice.id}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Date: {currentInvoice.date}</p>
                </div>
              </div>

              <div className="h-px bg-gray-200"></div>

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

              <div className="h-px bg-gray-200"></div>

              {/* Total amount */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Grand Total:</span>
                <span className="text-base font-black text-gray-900">₹{currentInvoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-100 bg-white">
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-sm shadow-primary/35 hover:bg-primary/90 transition-colors cursor-pointer"
            >
              📥 Download PDF
            </button>
            <button 
              onClick={handleSendInvoice}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-750 font-extrabold rounded-xl text-xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ✉️ Send to Accountant
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
