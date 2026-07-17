"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, 
  Plus, 
  Star, 
  Phone, 
  MapPin, 
  MoreVertical, 
  X, 
  Loader2, 
  Trash2, 
  Mail,
  User
} from "lucide-react";
import { getLabVendors, createLabVendor, deleteLabVendor } from "@/services/api";

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("Dental Lab");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tat, setTat] = useState("5");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await getLabVendors();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to fetch suppliers from backend.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAddModal = () => {
    setName("");
    setType("Dental Lab");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setTat("5");
    setAddress("");
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      triggerToast("Supplier name and email are required.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        contact_person: contactPerson || "Supplier Contact",
        phone,
        email,
        average_tat_days: parseInt(tat) || 5,
        pricing_list: {
          address,
          type
        }
      };

      await createLabVendor(payload);
      triggerToast(`Supplier "${name}" added successfully.`);
      setIsAddModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.detail || "Failed to add supplier.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id, supplierName) => {
    if (!confirm(`Are you sure you want to remove supplier "${supplierName}"?`)) return;
    try {
      await deleteLabVendor(id);
      triggerToast(`Supplier "${supplierName}" removed successfully.`);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to remove supplier.", "error");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 animate-scale-up relative">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 bg-white border-gray-100">
          <span className={`w-3 h-3 rounded-full ${toast.type === "error" ? "bg-danger animate-pulse" : "bg-success animate-pulse"}`}></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Supplier Network
          </h2>
          <p className="text-[11px] text-gray-555 mt-1 font-medium">Manage external labs, milling centers, and material vendors.</p>
        </div>
        
        <button 
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-bold">Loading suppliers...</span>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-250 rounded-2xl bg-gray-55/10">
          <p className="text-sm text-gray-500 font-bold">No suppliers added to network yet.</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add New Supplier" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="p-4 border border-gray-150 rounded-xl hover:shadow-md transition-all bg-gray-50/30 relative group">
              
              {/* Type and Dropdown */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                  {supplier.pricing_list?.type || "Dental Lab"}
                </span>
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdownId(activeDropdownId === supplier.id ? null : supplier.id)}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeDropdownId === supplier.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveDropdownId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-150 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          onClick={() => {
                            setActiveDropdownId(null);
                            handleDeleteSupplier(supplier.id, supplier.name);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Name */}
              <h3 className="text-sm font-bold text-gray-900 truncate pr-6" title={supplier.name}>
                {supplier.name}
              </h3>
              
              {/* Info fields */}
              <div className="mt-4 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="font-semibold truncate">{supplier.contact_person || "Contact Person"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="font-medium truncate">{supplier.email || "No Email"}</span>
                </div>
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium">{supplier.phone}</span>
                  </div>
                )}
                {supplier.pricing_list?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium truncate" title={supplier.pricing_list.address}>
                      {supplier.pricing_list.address}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer rating & TAT */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold">
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-700">{supplier.rating || 5.0}</span>
                </div>
                <span className="text-gray-400">
                  TAT: {supplier.average_tat_days} days
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add New Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 font-sans text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" /> Add New Supplier Partner
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit}>
              <div className="p-5 space-y-4 max-h-[450px] overflow-y-auto">
                
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Dental Laboratories"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-800 bg-white"
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Supplier Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-850 bg-white cursor-pointer"
                  >
                    <option value="Dental Lab">Dental Lab</option>
                    <option value="CAD/CAM Milling">CAD/CAM Milling</option>
                    <option value="Diagnostic Center">Diagnostic Center</option>
                    <option value="Material Vendor">Material Vendor</option>
                  </select>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-800 bg-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 40 2345 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-800 bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. orders@apexdental.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-800 bg-white"
                  />
                </div>

                {/* Turnaround Time */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Average TAT (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={tat}
                    onChange={(e) => setTat(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-800 bg-white"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Address / Location</label>
                  <textarea
                    rows="2.5"
                    placeholder="e.g. Banjara Hills, Hyderabad"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs text-gray-855 resize-none placeholder:text-gray-400 bg-white"
                  ></textarea>
                </div>

              </div>

              {/* Actions */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Supplier"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
