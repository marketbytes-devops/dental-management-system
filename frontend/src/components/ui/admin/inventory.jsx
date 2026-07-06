"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingUp, Search, Check, X, Bell, Plus, Truck, CheckCircle } from "lucide-react";
import { 
  getLabInventory, 
  updateInventoryItem, 
  getRestockRequests, 
  updateRestockRequestStatus,
  createInventoryItem
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

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Production Materials",
    supplier: "",
    current_stock: 0,
    minimum_stock_alert: 10,
    unit: "pcs",
    unit_price: 0,
    expiry_date: "",
    batch_number: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        supplier: item.supplier || "Unknown Supplier"
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

  const handleOrderRequest = async (reqId) => {
    try {
      await updateRestockRequestStatus(reqId, { status: "Ordered" });
      triggerToast(`Restock request #${reqId} ordered from supplier.`);
      fetchData();
    } catch (err) {
      console.error("Failed to order request", err);
      triggerToast("Error ordering request.");
    }
  };

  const handleReceiveRequest = async (reqId) => {
    try {
      await updateRestockRequestStatus(reqId, { status: "Fulfilled" });
      triggerToast(`Restock request #${reqId} marked as received and stock updated.`);
      fetchData();
    } catch (err) {
      console.error("Failed to receive request", err);
      triggerToast("Error marking request as received.");
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

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await createInventoryItem(newItem);
      triggerToast("New inventory item added successfully!");
      setIsAddModalOpen(false);
      setNewItem({
        name: "",
        category: "Production Materials",
        supplier: "",
        current_stock: 0,
        minimum_stock_alert: 10,
        unit: "pcs",
        unit_price: 0,
        expiry_date: "",
        batch_number: ""
      });
      fetchData();
    } catch (err) {
      console.error("Failed to add item:", err);
      triggerToast("Error adding new item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI calculations
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = inventory.filter((item) => item.status === "Out of Stock").length;
  const totalValuation = inventory.reduce((acc, item) => acc + item.quantity * item.price, 0);

  const activeRequests = restockRequests.filter(r => r.status === "Pending" || r.status === "Ordered");

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Inventory & Restocking</h1>
          <p className="text-sm text-gray-500 mt-1">Manage clinical and lab inventory, monitor valuations, and approve lab tech restock requests.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
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

      {activeRequests.length > 0 && (
        <div className="bg-white border border-warning/30 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 bg-warning/10 border-b border-warning/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-bold text-gray-900">Active Restock Requests</h3>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full text-warning border border-warning/20">
              {activeRequests.length} Active
            </span>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Requested Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/40">
                    <td className="px-4 py-3 font-bold">#{req.id}</td>
                    <td className="px-4 py-3 font-semibold">
                      {req.item_id === null ? <span className="mr-1 text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase font-bold">New</span> : ""}
                      {req.item_name}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">+{req.requested_quantity} units</td>
                    <td className="px-4 py-3">
                      {req.status === "Pending" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning uppercase">Pending</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 uppercase">Ordered</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {req.status === "Pending" ? (
                        <>
                          <button 
                            onClick={() => handleOrderRequest(req.id)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Approve & Order from Supplier"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.id)}
                            className="p-1.5 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleReceiveRequest(req.id)}
                          className="px-2 py-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors flex items-center justify-center ml-auto gap-1 text-[11px] font-bold uppercase"
                          title="Mark as Received & Update Stock"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Received
                        </button>
                      )}
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
              <option value="Production Materials">Production Materials</option>
              <option value="Clinical Supplies">Clinical Supplies</option>
              <option value="Clinical Pharmacy">Clinical Pharmacy</option>
              <option value="General">General</option>
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
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {item.name}
                      <span className="block text-[10px] text-gray-400 font-normal mt-0.5">{item.supplier}</span>
                    </td>
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

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Add New Inventory Item</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-item-form" onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-700">Item Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newItem.name}
                      onChange={e => setNewItem({...newItem, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="e.g., Dental Composite Resin"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Category *</label>
                    <select 
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="Production Materials">Production Materials</option>
                      <option value="Clinical Supplies">Clinical Supplies</option>
                      <option value="Clinical Pharmacy">Clinical Pharmacy</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Supplier</label>
                    <input 
                      type="text" 
                      value={newItem.supplier}
                      onChange={e => setNewItem({...newItem, supplier: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="e.g., Global Dental Suppliers"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Initial Stock *</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      value={newItem.current_stock}
                      onChange={e => setNewItem({...newItem, current_stock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Min. Stock Alert *</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      value={newItem.minimum_stock_alert}
                      onChange={e => setNewItem({...newItem, minimum_stock_alert: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Unit *</label>
                    <select 
                      value={newItem.unit}
                      onChange={e => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="boxes">Boxes</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="g">Grams (g)</option>
                      <option value="kits">Kits</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Unit Price (₹) *</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      required
                      value={newItem.unit_price}
                      onChange={e => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Batch Number</label>
                    <input 
                      type="text" 
                      value={newItem.batch_number}
                      onChange={e => setNewItem({...newItem, batch_number: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Expiry Date</label>
                    <input 
                      type="date" 
                      value={newItem.expiry_date}
                      onChange={e => setNewItem({...newItem, expiry_date: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="add-item-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Item
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
