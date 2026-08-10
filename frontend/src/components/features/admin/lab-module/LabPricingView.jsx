"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, DollarSign, Tag, ShieldCheck, Percent, Layers, Building2, TrendingUp, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { getAdminLabPricing, saveAdminLabPricing, deleteAdminLabPricing, getAdminLabFinancialReport, getLabVendors } from "@/services/api";

export default function LabPricingView() {
  const [activeSubTab, setActiveSubTab] = useState("contract_pricing");

  // Contract Pricing State
  const [rules, setRules] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [restorationType, setRestorationType] = useState("Crown");
  const [material, setMaterial] = useState("Zirconia");
  const [supplierCost, setSupplierCost] = useState("");
  const [patientCharge, setPatientCharge] = useState("");

  // Financial Report State
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pricingData, vendorData] = await Promise.all([
        getAdminLabPricing(),
        getLabVendors()
      ]);
      setRules(pricingData || []);
      setVendors(vendorData || []);
      if (vendorData && vendorData.length > 0 && !vendorId) {
        setVendorId(vendorData[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load contract pricing", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialReport = async () => {
    setReportLoading(true);
    try {
      const data = await getAdminLabFinancialReport();
      setReport(data);
    } catch (err) {
      console.error("Failed to fetch financial report", err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSubTab === "financial_report") {
      fetchFinancialReport();
    }
  }, [activeSubTab]);

  const openModal = (rule = null) => {
    setEditingRule(rule);
    if (rule) {
      setVendorId(rule.vendor_id?.toString() || "");
      setRestorationType(rule.restoration_type || "Crown");
      setMaterial(rule.material || "Zirconia");
      setSupplierCost(rule.supplier_cost?.toString() || "");
      setPatientCharge(rule.patient_charge?.toString() || "");
    } else {
      if (vendors.length > 0) setVendorId(vendors[0].id.toString());
      setRestorationType("Crown");
      setMaterial("Zirconia");
      setSupplierCost("");
      setPatientCharge("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    if (!vendorId || !supplierCost || !patientCharge) {
      alert("Please fill in Vendor, Supplier Cost, and Patient Charge.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vendor_id: parseInt(vendorId),
        restoration_type: restorationType,
        material: material || "All Materials",
        supplier_cost: parseFloat(supplierCost) || 0.0,
        patient_charge: parseFloat(patientCharge) || 0.0
      };

      await saveAdminLabPricing(payload);
      closeModal();
      fetchData();
    } catch (err) {
      console.error("Failed to save pricing rule", err);
      alert(err?.response?.data?.detail || "Failed to save contract pricing rule.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm("Are you sure you want to deactivate this contract pricing rule?")) return;
    try {
      await deleteAdminLabPricing(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete rule", err);
    }
  };

  const sCost = parseFloat(supplierCost) || 0.0;
  const pCharge = parseFloat(patientCharge) || 0.0;
  const calcGrossProfit = pCharge - sCost;
  const calcMargin = pCharge > 0 ? ((calcGrossProfit / pCharge) * 100.0).toFixed(1) : 0.0;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Contract Pricing & Financial Reports
          </h2>
          <p className="text-xs text-gray-500 mt-1">Configure supplier costs, patient charges, and track gross profit for external lab restorations.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveSubTab("contract_pricing")}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "contract_pricing"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Contract Pricing Rules
          </button>
          <button
            onClick={() => setActiveSubTab("financial_report")}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "financial_report"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Financial Reports & Margins
          </button>
        </div>
      </div>

      {/* ── TAB 1: CONTRACT PRICING RULES ── */}
      {activeSubTab === "contract_pricing" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Configured External Lab Pricing Catalog</h3>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Pricing Rule
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-150 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-gray-500">Loading contract pricing rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-150 shadow-xs space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-base font-bold text-gray-800">No Pricing Rules Configured</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No contract pricing rules exist yet. Lab orders will be blocked from sending to external labs until pricing rules are added.
              </p>
              <button
                onClick={() => openModal()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none"
              >
                Configure First Rule
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-150 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">External Lab Vendor</th>
                      <th className="py-3.5 px-4">Restoration Type</th>
                      <th className="py-3.5 px-4">Material</th>
                      <th className="py-3.5 px-4 text-rose-600">Supplier Cost (Clinic Pays)</th>
                      <th className="py-3.5 px-4 text-sky-600">Patient Charge (Patient Bills)</th>
                      <th className="py-3.5 px-4 text-emerald-600">Gross Profit</th>
                      <th className="py-3.5 px-4 text-emerald-700">Margin %</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-black text-gray-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                          {rule.vendor_name || `Vendor #${rule.vendor_id}`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">{rule.restoration_type}</td>
                        <td className="py-3.5 px-4 text-gray-600 font-medium">{rule.material || "All Materials"}</td>
                        <td className="py-3.5 px-4 font-black text-rose-600">₹{(rule.supplier_cost || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-black text-sky-600">₹{(rule.patient_charge || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-black text-emerald-600">₹{(rule.gross_profit || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">{rule.margin_percentage}%</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(rule)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Rule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FINANCIAL REPORTS & MARGINS ── */}
      {activeSubTab === "financial_report" && (
        <div className="space-y-6 animate-fade-in">
          {reportLoading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-150 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-gray-500">Calculating financial metrics...</p>
            </div>
          ) : report ? (
            <>
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Processed Orders</span>
                  <h3 className="text-2xl font-black text-gray-900">{report.total_orders}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">External lab cases</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Total Supplier Cost</span>
                  <h3 className="text-2xl font-black text-rose-600">₹{(report.total_supplier_cost || 0).toLocaleString()}</h3>
                  <p className="text-[11px] text-rose-700/80 font-medium">Clinic lab expenses</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider block">Total Patient Billing</span>
                  <h3 className="text-2xl font-black text-sky-600">₹{(report.total_patient_billing || 0).toLocaleString()}</h3>
                  <p className="text-[11px] text-sky-700/80 font-medium">Patient revenue generated</p>
                </div>

                <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Net Gross Profit ({report.profit_margin_percentage}%)</span>
                  <h3 className="text-2xl font-black text-emerald-700">₹{(report.total_gross_profit || 0).toLocaleString()}</h3>
                  <p className="text-[11px] text-emerald-800 font-medium">Patient Charge − Supplier Cost</p>
                </div>
              </div>

              {/* Breakdown by Vendor */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Financial Performance by External Laboratory
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Vendor Name</th>
                        <th className="py-2.5 px-3">Case Count</th>
                        <th className="py-2.5 px-3 text-rose-600">Supplier Cost</th>
                        <th className="py-2.5 px-3 text-sky-600">Patient Billing</th>
                        <th className="py-2.5 px-3 text-emerald-600">Gross Profit</th>
                        <th className="py-2.5 px-3 text-emerald-700">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                      {(report.breakdown_by_vendor || []).map((v, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-extrabold text-gray-900">{v.vendor_name}</td>
                          <td className="py-2.5 px-3">{v.count}</td>
                          <td className="py-2.5 px-3 text-rose-600 font-extrabold">₹{(v.supplier_cost || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-sky-600 font-extrabold">₹{(v.patient_billing || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-emerald-600 font-black">₹{(v.gross_profit || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-black">{v.profit_margin}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── MODAL: ADD / EDIT CONTRACT PRICING RULE ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 font-sans text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-emerald-50/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Contract Pricing Config</span>
                <h3 className="text-lg font-black text-gray-900 mt-1">{editingRule ? "Edit Pricing Rule" : "Add New Pricing Rule"}</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full font-bold">✕</button>
            </div>

            <form onSubmit={handleSavePricing} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">External Lab Vendor</label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Restoration Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crown, Bridge, Veneer, PFM"
                  value={restorationType}
                  onChange={(e) => setRestorationType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Material (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Zirconia, E-max, PFM, All Materials"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1">Supplier Cost (Clinic Pays)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1500"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-black text-rose-600 focus:ring-2 focus:ring-rose-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sky-600 mb-1">Patient Charge (Patient Bills)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 4500"
                    value={patientCharge}
                    onChange={(e) => setPatientCharge(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-sky-200 rounded-xl text-xs font-black text-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Automatic Gross Profit Preview */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Calculated Gross Profit</span>
                  <p className="text-sm font-black text-emerald-700">₹{calcGrossProfit.toLocaleString()} ({calcMargin}% Margin)</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl border-none cursor-pointer">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl border-none cursor-pointer shadow-md disabled:opacity-50">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
