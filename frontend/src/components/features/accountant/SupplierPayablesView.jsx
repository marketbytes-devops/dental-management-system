"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Building2, CheckCircle2, Clock, Plus, Filter, Loader2, ShieldCheck, FileText, Calendar } from "lucide-react";
import { getSupplierPayables, createSupplierPayable, paySupplierPayable } from "@/services/api";

export default function SupplierPayablesView() {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierTypeFilter, setSupplierTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    supplier_name: "",
    supplier_type: "External Lab",
    invoice_number: "",
    supplier_cost: "",
    due_date: "",
    lab_case_id: ""
  });

  // Payment Modal State
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    payment_reference: "",
    payment_date: new Date().toISOString().split("T")[0]
  });

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const data = await getSupplierPayables(supplierTypeFilter, statusFilter);
      setPayables(data || []);
    } catch (err) {
      console.error("Failed to load supplier payables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, [supplierTypeFilter, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.supplier_name || !createForm.supplier_cost) {
      alert("Please fill in Supplier Name and Supplier Cost.");
      return;
    }
    setLoading(true);
    try {
      await createSupplierPayable({
        ...createForm,
        supplier_cost: parseFloat(createForm.supplier_cost) || 0.0
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        supplier_name: "",
        supplier_type: "External Lab",
        invoice_number: "",
        supplier_cost: "",
        due_date: "",
        lab_case_id: ""
      });
      fetchPayables();
    } catch (err) {
      console.error("Failed to create supplier payable", err);
      alert("Error creating supplier payable.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (payable) => {
    setSelectedPayable(payable);
    setPayForm({
      payment_reference: `PAY-REF-${Date.now().toString().slice(-6)}`,
      payment_date: new Date().toISOString().split("T")[0]
    });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayable || !payForm.payment_reference) {
      alert("Please enter a payment reference.");
      return;
    }
    setLoading(true);
    try {
      await paySupplierPayable(selectedPayable.id, payForm);
      setIsPayModalOpen(false);
      setSelectedPayable(null);
      fetchPayables();
    } catch (err) {
      console.error("Failed to record payment", err);
      alert("Error recording supplier payment.");
    } finally {
      setLoading(false);
    }
  };

  const totalPending = payables.filter(p => p.status === "Pending").reduce((acc, p) => acc + (p.supplier_cost || 0), 0);
  const totalPaid = payables.filter(p => p.status === "Paid").reduce((acc, p) => acc + (p.supplier_cost || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header & Stat Cards */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            Financial Management Module
          </span>
          <h2 className="text-xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Supplier Payables Terminal
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage external lab invoices, medicine suppliers, and vendor payment processing separately from patient billing.</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer border-none flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Supplier Invoice / Payable
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Recorded Payables</span>
          <h3 className="text-2xl font-black text-gray-900">{payables.length}</h3>
          <p className="text-xs text-gray-500 font-semibold">External labs & vendors</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-150 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Payables</span>
          <h3 className="text-2xl font-black text-amber-600">₹{totalPending.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-amber-700/80 font-semibold">{payables.filter(p => p.status === "Pending").length} invoices awaiting payment</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Disbursed / Paid</span>
          <h3 className="text-2xl font-black text-emerald-700">₹{totalPaid.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-emerald-700/80 font-semibold">{payables.filter(p => p.status === "Paid").length} completed disbursements</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Payables Ledger</h3>

          <div className="flex items-center gap-2">
            <select
              value={supplierTypeFilter}
              onChange={(e) => setSupplierTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="">All Supplier Types</option>
              <option value="External Lab">External Lab</option>
              <option value="Medicine">Medicine Supplier</option>
              <option value="Other Vendor">Other Vendors</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="">All Payment Statuses</option>
              <option value="Pending">Pending Payment</option>
              <option value="Paid">Paid / Settled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs font-semibold text-gray-500">Loading payables ledger...</p>
          </div>
        ) : payables.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-xs font-semibold text-gray-400">
            No supplier payables match your selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-150 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Supplier Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Case ID</th>
                  <th className="py-3 px-3 text-rose-600">Supplier Cost</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Payment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                {payables.map((p) => {
                  const isPaid = p.status === "Paid";
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-gray-900">{p.supplier_name}</td>
                      <td className="py-3 px-3 text-indigo-700 font-bold">{p.supplier_type}</td>
                      <td className="py-3 px-3 font-mono text-gray-600">{p.invoice_number || "N/A"}</td>
                      <td className="py-3 px-3 font-bold text-gray-700">{p.lab_case_id ? `#${p.lab_case_id}` : "—"}</td>
                      <td className="py-3 px-3 font-black text-rose-600">₹{(p.supplier_cost || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-gray-500">{p.due_date || "Standard Terms"}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isPaid ? `Paid (${p.payment_reference || 'Settled'})` : 'Pending Payment'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handleOpenPayModal(p)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-bold">Paid on {p.payment_date || "Record"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE SUPPLIER PAYABLE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 font-sans text-left">
            <div className="p-6 border-b border-gray-100 bg-indigo-50/60 flex justify-between items-center">
              <h3 className="text-base font-black text-gray-900">Add Supplier Payable / Invoice</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dental Laboratories or Meds Supply Co."
                  value={createForm.supplier_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Supplier Category / Type</label>
                <select
                  value={createForm.supplier_type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, supplier_type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none bg-white"
                >
                  <option value="External Lab">External Dental Lab</option>
                  <option value="Medicine">Medicine / Pharma Supplier</option>
                  <option value="Other Vendor">Other Equipment Vendor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9901"
                    value={createForm.invoice_number}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-rose-700 font-bold mb-1">Supplier Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1500"
                    value={createForm.supplier_cost}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, supplier_cost: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-rose-200 rounded-xl outline-none text-rose-700 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Lab Case ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CASE-2026-631"
                    value={createForm.lab_case_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, lab_case_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer border-none">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-extrabold cursor-pointer border-none shadow-md">Save Payable</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MARK SUPPLIER PAYABLE PAID */}
      {isPayModalOpen && selectedPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 font-sans text-left">
            <div className="p-5 border-b border-gray-100 bg-emerald-50/60 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800">Record Disbursement</span>
                <h3 className="text-sm font-black text-gray-900 mt-0.5">Disburse Supplier Payment</h3>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">✕</button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-5 space-y-3.5 text-xs font-semibold">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <p className="text-gray-500 font-bold">Supplier: <span className="text-gray-900 font-black">{selectedPayable.supplier_name}</span></p>
                <p className="text-rose-700 font-bold">Amount to Pay: <span className="text-rose-700 font-black text-sm">₹{(selectedPayable.supplier_cost || 0).toLocaleString("en-IN")}</span></p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Payment Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-987456321 or CHQ-458"
                  value={payForm.payment_reference}
                  onChange={(e) => setPayForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer border-none">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-black cursor-pointer border-none shadow-md">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
