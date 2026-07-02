"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingUp, Search, Check, X, Bell } from "lucide-react";
import { 
  getLabInventory, 
  updateInventoryItem, 
  getRestockRequests, 
  updateRestockRequestStatus 
} from "@/services/api";

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [toast, setToast] = useState({ show: false, message: "" });
  const [isLoading, setIsLoading] = useState(true);

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const invData = await getLabInventory();
      
      // Map API data to UI structure
      const mappedInv = invData.map(item => ({
        id: item.id,
        code: `MAT-${item.id.toString().padStart(4, '0')}`,
        name: item.name,
        category: item.category,
        quantity: item.current_stock,
        minLevel: item.minimum_stock_alert,
        unit: item.unit,
        price: item.unit_price,
        status: item.current_stock === 0 ? "Out of Stock" : (item.current_stock <= item.minimum_stock_alert ? "Low Stock" : "In Stock"),
        supplier: "Global Dental Supplies"
      }));
      setInventory(mappedInv);

      const reqData = await getRestockRequests();
      setRestockRequests(reqData);

    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
      triggerToast("Error loading data from the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...inventory];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
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

  const handleApproveRequest = async (reqId) => {
    try {
      await updateRestockRequestStatus(reqId, { status: "Fulfilled" });
      triggerToast(`Restock request #${reqId} approved and stock updated.`);
      fetchData(); // Refresh data to show new stock
    } catch (err) {
      console.error("Failed to approve request", err);
      triggerToast("Error approving request.");
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      await updateRestockRequestStatus(reqId, { status: "Rejected" });
      triggerToast(`Restock request #${reqId} rejected.`);
      fetchData();
    } catch (err) {
      console.error("Failed to reject request", err);
      triggerToast("Error rejecting request.");
    }
  };

  // KPI calculations
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = inventory.filter((item) => item.status === "Out of Stock").length;
  const totalValuation = inventory.reduce((acc, item) => acc + item.quantity * item.price, 0);

  const pendingRequests = restockRequests.filter(r => r.status === "Pending");

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

  return (
    <div className="space-y-6 pb-10">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Inventory & Restocking</h1>
        <p className="text-sm text-gray-500 mt-1">Manage clinical and lab inventory, monitor valuations, and approve lab tech restock requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Stock Items</p>
            <h3 className="text-2xl font-black text-gray-900">{totalItems}</h3>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-gray-900 text-warning">{lowStockCount}</h3>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Out of Stock</p>
            <h3 className="text-2xl font-black text-gray-900 text-danger">{outOfStockCount}</h3>
          </div>
          <span className="bg-danger/10 p-3 rounded-xl text-danger flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Asset Value</p>
            <h3 className="text-2xl font-black text-gray-900">₹{totalValuation.toLocaleString()}</h3>
          </div>
          <span className="bg-success/10 p-3 rounded-xl text-success flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </span>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-white border border-warning/30 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 bg-warning/10 border-b border-warning/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-bold text-gray-900">Pending Restock Requests</h3>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full text-warning border border-warning/20">
              {pendingRequests.length} Requires Approval
            </span>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Requested Qty</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/40">
                    <td className="px-4 py-3 font-bold">#{req.id}</td>
                    <td className="px-4 py-3 font-semibold">
                      {req.item_id === null ? <span className="mr-1 text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase font-bold">New</span> : ""}
                      {req.item_name}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">+{req.requested_quantity} units</td>
                    <td className="px-4 py-3 text-gray-500">{req.notes || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => handleApproveRequest(req.id)}
                        className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                        title="Approve & Restock"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(req.id)}
                        className="p-1.5 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
                        title="Reject Request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96 flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-gray-400 mr-2.5 w-4 h-4 shrink-0" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
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

        <div className="overflow-x-auto border border-gray-100 rounded-xl mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Valuation</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">Loading inventory data...</td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">No matching inventory items found.</td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{item.code}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
