"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Layers, TrendingUp, Search, PlusCircle, RotateCcw } from "lucide-react";

const INITIAL_INVENTORY = [
  { code: "MAT-ZIR-101", name: "Zirconia Blanks (Ultra-Translucent)", category: "Lab Materials", quantity: 18, minLevel: 5, unit: "Blocks", price: 2500, status: "In Stock", supplier: "DentalCeram India", lastRestocked: "2026-06-01" },
  { code: "MAT-EMX-204", name: "E-Max Lithium Disilicate Ingots", category: "Lab Materials", quantity: 3, minLevel: 10, unit: "Ingots", price: 1800, status: "Low Stock", supplier: "Ivoclar Vivadent", lastRestocked: "2026-05-15" },
  { code: "SUP-IMP-301", name: "Titanium Implant Bases (Multi-Unit)", category: "Lab Materials", quantity: 25, minLevel: 8, unit: "Units", price: 4200, status: "In Stock", supplier: "Straumann India", lastRestocked: "2026-06-10" },
  { code: "SUP-GLV-002", name: "Nitrile Gloves (Powder-Free)", category: "Clinical Supplies", quantity: 0, minLevel: 15, unit: "Boxes", price: 450, status: "Out of Stock", supplier: "SafeTouch Med", lastRestocked: "2026-04-12" },
  { code: "MAT-ACR-402", name: "High-Impact Acrylic Resin Liquid", category: "Lab Materials", quantity: 7, minLevel: 6, unit: "Liters", price: 3200, status: "In Stock", supplier: "Bredent Dental", lastRestocked: "2026-06-03" },
  { code: "SUP-ALG-501", name: "Alginate Impression Material", category: "Clinical Supplies", quantity: 4, minLevel: 12, unit: "Packs", price: 800, status: "Low Stock", supplier: "Kerr Dental", lastRestocked: "2026-05-20" },
  { code: "EQP-BUR-602", name: "CAD/CAM Diamond Milling Burs (0.6mm)", category: "Lab Materials", quantity: 12, minLevel: 4, unit: "Burs", price: 1500, status: "In Stock", supplier: "Roland DG", lastRestocked: "2026-06-08" },
  { code: "SUP-ANL-705", name: "Analog Dental Plaster (Type IV)", category: "Lab Materials", quantity: 45, minLevel: 20, unit: "kg", price: 120, status: "In Stock", supplier: "Prestige Dental", lastRestocked: "2026-06-05" }
];

export default function AdminInventory() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [filteredInventory, setFilteredInventory] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [toast, setToast] = useState({ show: false, message: "" });
  const [restockItemCode, setRestockItemCode] = useState("");
  const [restockAmount, setRestockAmount] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  useEffect(() => {
    let result = [...inventory];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "All") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredInventory(result);
  }, [inventory, searchQuery, categoryFilter, statusFilter]);

  // KPI calculations
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = inventory.filter((item) => item.status === "Out of Stock").length;
  const totalValuation = inventory.reduce((acc, item) => acc + item.quantity * item.price, 0);

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

  const handleRestockClick = (code) => {
    setRestockItemCode(code);
    setRestockAmount(10);
    setIsModalOpen(true);
  };

  const submitRestock = (e) => {
    e.preventDefault();
    setInventory((prev) =>
      prev.map((item) => {
        if (item.code === restockItemCode) {
          const newQty = item.quantity + Number(restockAmount);
          let newStatus = "In Stock";
          if (newQty === 0) newStatus = "Out of Stock";
          else if (newQty <= item.minLevel) newStatus = "Low Stock";

          return {
            ...item,
            quantity: newQty,
            status: newStatus,
            lastRestocked: new Date().toISOString().split("T")[0]
          };
        }
        return item;
      })
    );
    setIsModalOpen(false);
    triggerToast(`Successfully restocked item ${restockItemCode} with ${restockAmount} units.`);
  };

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
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor clinical supplies, laboratory materials stock levels, track valuations, and issue replenishment requests.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Stock Items</p>
            <h3 className="text-2xl font-black text-gray-900">{totalItems}</h3>
            <p className="text-xs text-gray-450 mt-1">Unique catalog materials</p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-gray-900 text-warning">{lowStockCount}</h3>
            <p className="text-xs text-warning font-semibold mt-1">Awaiting replenishment</p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Out of Stock</p>
            <h3 className="text-2xl font-black text-gray-900 text-danger">{outOfStockCount}</h3>
            <p className="text-xs text-danger font-semibold mt-1">Requires immediate order</p>
          </div>
          <span className="bg-danger/10 p-3 rounded-xl text-danger flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Asset Value</p>
            <h3 className="text-2xl font-black text-gray-900">₹{totalValuation.toLocaleString()}</h3>
            <p className="text-xs text-success font-semibold mt-1">Based on unit costs</p>
          </div>
          <span className="bg-success/10 p-3 rounded-xl text-success flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96 flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-gray-400 mr-2.5 w-4 h-4 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by code, material, supplier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-400 text-gray-800"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
            >
              <option value="All">All Categories</option>
              <option value="Lab Materials">Lab Materials</option>
              <option value="Clinical Supplies">Clinical Supplies</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Stock Ledger Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Material Code</th>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Valuation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{item.code}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{item.category}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {item.quantity} <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                      <span className="block text-[9px] text-gray-400 font-semibold mt-0.5">Min: {item.minLevel}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">₹{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">₹{(item.quantity * item.price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.supplier}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleRestockClick(item.code)}
                        className="px-2 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-extrabold text-gray-900">Restock Material</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitRestock} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Material Code</label>
                <input 
                  type="text" 
                  value={restockItemCode} 
                  readOnly 
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none text-gray-500 cursor-not-allowed font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Restock Amount (Units)</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  value={restockAmount} 
                  onChange={(e) => setRestockAmount(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-gray-800 font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/95 transition-colors shadow-sm shadow-primary/30"
                >
                  Apply Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
