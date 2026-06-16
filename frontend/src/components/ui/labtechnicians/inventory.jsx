"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Layers, Send, Search, CheckCircle } from "lucide-react";

const INITIAL_INVENTORY = [
  { code: "MAT-ZIR-101", name: "Zirconia Blanks (Ultra-Translucent)", category: "Lab Materials", quantity: 18, unit: "Blocks", status: "In Stock" },
  { code: "MAT-EMX-204", name: "E-Max Lithium Disilicate Ingots", category: "Lab Materials", quantity: 3, unit: "Ingots", status: "Low Stock" },
  { code: "SUP-IMP-301", name: "Titanium Implant Bases (Multi-Unit)", category: "Lab Materials", quantity: 25, unit: "Units", status: "In Stock" },
  { code: "SUP-GLV-002", name: "Nitrile Gloves (Powder-Free)", category: "Clinical Supplies", quantity: 0, unit: "Boxes", status: "Out of Stock" },
  { code: "MAT-ACR-402", name: "High-Impact Acrylic Resin Liquid", category: "Lab Materials", quantity: 7, unit: "Liters", status: "In Stock" },
  { code: "SUP-ALG-501", name: "Alginate Impression Material", category: "Clinical Supplies", quantity: 4, unit: "Packs", status: "Low Stock" },
  { code: "EQP-BUR-602", name: "CAD/CAM Diamond Milling Burs (0.6mm)", category: "Lab Materials", quantity: 12, unit: "Burs", status: "In Stock" }
];

const INITIAL_REQUESTS = [
  { id: "REQ-001", material: "E-Max Lithium Disilicate Ingots", quantity: 15, date: "2026-06-12", status: "Pending Approval", target: "Accountant" },
  { id: "REQ-002", material: "Nitrile Gloves (Powder-Free)", quantity: 10, date: "2026-06-08", status: "Approved & Dispatched", target: "Accountant" }
];

export default function LabInventory() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState("");
  const [requestQuantity, setRequestQuantity] = useState(5);

  const [toast, setToast] = useState({ show: false, message: "" });

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "In Stock":
        return "bg-success/10 text-success border-success/20";
      case "Low Stock":
        return "bg-warning/10 text-warning border-warning/20";
      case "Out of Stock":
      default:
        return "bg-danger/10 text-danger border-danger/20";
    }
  };

  const getRequestStatusStyle = (status) => {
    switch (status) {
      case "Pending Approval":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Approved & Dispatched":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-750 border-gray-200";
    }
  };

  const openRequestModal = (code) => {
    setSelectedMaterialCode(code);
    setRequestQuantity(5);
    setIsModalOpen(true);
  };

  const submitMaterialRequest = (e) => {
    e.preventDefault();
    const material = inventory.find((item) => item.code === selectedMaterialCode);
    if (!material) return;

    const newRequest = {
      id: `REQ-00${requests.length + 1}`,
      material: material.name,
      quantity: Number(requestQuantity),
      date: new Date().toISOString().split("T")[0],
      status: "Pending Approval",
      target: "Accountant"
    };

    setRequests([newRequest, ...requests]);
    setIsModalOpen(false);
    triggerToast(`Material request for ${material.name} sent to the Accountant.`);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Material Stock</h1>
        <p className="text-sm text-gray-500 mt-1">View current quantities of prosthetic fabrication materials and request restocking/billing from the Accountant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory View List */}
        <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="text-base font-extrabold text-gray-900">Material Stock Levels</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 w-full sm:w-48">
                <Search className="text-gray-400 mr-2 w-3.5 h-3.5" />
                <input 
                  type="text" 
                  placeholder="Search materials..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full text-gray-800"
                />
              </div>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none text-gray-700"
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Stock Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                      No materials match the filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.code} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-gray-900">{item.code}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{item.name}</td>
                      <td className="px-4 py-3.5 font-extrabold text-gray-900">
                        {item.quantity} <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button 
                          onClick={() => openRequestModal(item.code)}
                          className="px-2 py-1 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-lg transition-all cursor-pointer border border-primary/10"
                        >
                          Request Item
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests Logs */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Requisition History</h3>
            <p className="text-xs text-gray-400 mt-0.5">Requests forwarded to the Accountant</p>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-xl p-3.5 space-y-2 hover:bg-gray-50/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase">{req.id}</span>
                    <h4 className="text-xs font-bold text-gray-800 mt-0.5 leading-snug">{req.material}</h4>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${getRequestStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold pt-1.5 border-t border-gray-100/50">
                  <span>Qty: <strong className="text-gray-700 font-black">{req.quantity}</strong></span>
                  <span>Date: {req.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-extrabold text-gray-900">Request Material</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitMaterialRequest} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Selected Material Code</label>
                <input 
                  type="text" 
                  value={selectedMaterialCode} 
                  readOnly 
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none text-gray-500 cursor-not-allowed font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Requested Quantity</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  value={requestQuantity} 
                  onChange={(e) => setRequestQuantity(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-gray-800 font-bold"
                />
              </div>

              <p className="text-[10px] text-gray-450 leading-relaxed">
                * Note: Submitting this requisition notifies the **Accountant** for purchase approval and billing ledger registration.
              </p>

              <div className="flex gap-3 pt-4 border-t border-gray-100 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-750 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/95 transition-colors shadow-sm shadow-primary/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
