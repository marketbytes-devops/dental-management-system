"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, DollarSign, Tag, ShieldCheck, Percent, Layers } from "lucide-react";
import client from "@/services/api";

export default function LabPricingView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Form State
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Prosthetic");
  const [materialTier, setMaterialTier] = useState("Standard");
  const [vendorCost, setVendorCost] = useState("");
  const [clinicMarkupPct, setClinicMarkupPct] = useState("50");
  const [patientPrice, setPatientPrice] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("24");
  const [isActive, setIsActive] = useState(true);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await client.get("/lab/pricing-catalog");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch lab pricing catalog", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openModal = (item = null) => {
    setCurrentItem(item);
    if (item) {
      setItemName(item.item_name || "");
      setCategory(item.category || "Prosthetic");
      setMaterialTier(item.material_tier || "Standard");
      setVendorCost(item.vendor_cost ? item.vendor_cost.toString() : "0");
      setClinicMarkupPct(item.clinic_markup_pct ? item.clinic_markup_pct.toString() : "50");
      setPatientPrice(item.patient_price ? item.patient_price.toString() : "0");
      setWarrantyMonths(item.warranty_months ? item.warranty_months.toString() : "12");
      setIsActive(item.is_active !== false);
    } else {
      setItemName("");
      setCategory("Prosthetic");
      setMaterialTier("Standard");
      setVendorCost("");
      setClinicMarkupPct("50");
      setPatientPrice("");
      setWarrantyMonths("24");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  // Auto calculate patient price when vendor cost or markup changes
  const handleVendorCostChange = (val) => {
    setVendorCost(val);
    const cost = parseFloat(val) || 0;
    const markup = parseFloat(clinicMarkupPct) || 0;
    setPatientPrice((cost * (1 + markup / 100)).toFixed(2));
  };

  const handleMarkupChange = (val) => {
    setClinicMarkupPct(val);
    const cost = parseFloat(vendorCost) || 0;
    const markup = parseFloat(val) || 0;
    setPatientPrice((cost * (1 + markup / 100)).toFixed(2));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        item_name: itemName,
        category,
        material_tier: materialTier,
        vendor_cost: parseFloat(vendorCost) || 0.0,
        clinic_markup_pct: parseFloat(clinicMarkupPct) || 0.0,
        patient_price: parseFloat(patientPrice) || 0.0,
        warranty_months: parseInt(warrantyMonths) || 0,
        is_active: isActive
      };

      if (currentItem) {
        await client.put(`/lab/pricing-catalog/${currentItem.id}`, payload);
      } else {
        await client.post("/lab/pricing-catalog", payload);
      }
      closeModal();
      fetchCatalog();
    } catch (err) {
      console.error("Failed to save lab pricing item", err);
      alert("Failed to save lab pricing item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this pricing item?")) return;
    try {
      await client.delete(`/lab/pricing-catalog/${id}`);
      fetchCatalog();
    } catch (err) {
      console.error("Failed to delete pricing item", err);
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case "Elite":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Premium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-primary/20 text-primary rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </span>
            <h2 className="text-xl font-black">Admin Lab Module Fee Architecture</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure internal lab vendor costs, clinic profit markups, and patient billing tariffs.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Lab Pricing Item
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Catalog Items</div>
            <div className="text-2xl font-black text-gray-900">{items.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Avg Clinic Markup</div>
            <div className="text-2xl font-black text-emerald-600">
              {items.length > 0
                ? Math.round(items.reduce((acc, curr) => acc + (curr.clinic_markup_pct || 0), 0) / items.length) + "%"
                : "50%"}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Max Warranty Covered</div>
            <div className="text-2xl font-black text-amber-700">
              {items.length > 0 ? Math.max(...items.map((i) => i.warranty_months || 0)) + " Mo" : "60 Mo"}
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[11px] tracking-wider border-b border-gray-150">
                <tr>
                  <th className="p-4">Item & Category</th>
                  <th className="p-4">Material Tier</th>
                  <th className="p-4 text-right">Vendor Base Cost (₹)</th>
                  <th className="p-4 text-center">Clinic Markup (%)</th>
                  <th className="p-4 text-right">Patient Charge (₹)</th>
                  <th className="p-4 text-center">Warranty</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 font-semibold">
                      No lab pricing items configured yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.item_name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3 text-gray-400" />
                          {item.category}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getTierBadge(item.material_tier)}`}>
                          {item.material_tier}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-700">₹{(item.vendor_cost || 0).toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-emerald-600">+{item.clinic_markup_pct}%</td>
                      <td className="p-4 text-right font-black text-primary text-base">₹{(item.patient_price || 0).toLocaleString()}</td>
                      <td className="p-4 text-center font-semibold text-gray-600 text-xs">
                        {item.warranty_months ? `${item.warranty_months} Mos` : "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-base font-black flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                {currentItem ? "Edit Lab Pricing Item" : "Add Lab Pricing Item"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white cursor-pointer text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lab Item Name</label>
                <input
                  required
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Full Zirconia Crown"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
                  >
                    <option value="Prosthetic">Prosthetic</option>
                    <option value="Orthodontic">Orthodontic</option>
                    <option value="Surgical">Surgical</option>
                    <option value="Pathology">Pathology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Material Tier</label>
                  <select
                    value={materialTier}
                    onChange={(e) => setMaterialTier(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendor Base Cost (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={vendorCost}
                    onChange={(e) => handleVendorCostChange(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Clinic Markup (%)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={clinicMarkupPct}
                    onChange={(e) => handleMarkupChange(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-150 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-blue-700">Calculated Patient Fee</div>
                  <div className="text-lg font-black text-primary">₹{(parseFloat(patientPrice) || 0).toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-500 italic">Auto-calculated margin</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Warranty Guarantee (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-gray-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 font-bold text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 shadow-sm transition-all cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
