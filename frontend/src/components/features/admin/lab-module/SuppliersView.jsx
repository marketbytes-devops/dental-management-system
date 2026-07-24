"use client";

import React, { useState, useEffect } from "react";
import { Truck, Plus, Star, Phone, Mail, Clock, Trash2, Edit2, Loader2, X } from "lucide-react";
import client from "@/services/api";

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tatDays, setTatDays] = useState("5");

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await client.get("/lab/vendors");
      setSuppliers(res.data);
    } catch (err) {
      console.error("Failed to fetch lab suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openModal = (supplier = null) => {
    setCurrentSupplier(supplier);
    if (supplier) {
      setName(supplier.name || "");
      setContactPerson(supplier.contact_person || "");
      setPhone(supplier.phone || "");
      setEmail(supplier.email || "");
      setTatDays(supplier.average_tat_days ? supplier.average_tat_days.toString() : "5");
    } else {
      setName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setTatDays("5");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSupplier(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        contact_person: contactPerson,
        phone,
        email,
        average_tat_days: parseInt(tatDays) || 5,
        pricing_list: currentSupplier?.pricing_list || {}
      };

      if (currentSupplier) {
        await client.put(`/lab/vendors/${currentSupplier.id}`, payload);
      } else {
        await client.post("/lab/vendors", payload);
      }
      closeModal();
      fetchSuppliers();
    } catch (err) {
      console.error("Failed to save supplier", err);
      alert("Failed to save supplier. Ensure vendor name is unique.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this supplier?")) return;
    try {
      await client.delete(`/lab/vendors/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error("Failed to delete supplier", err);
      alert("Failed to delete supplier");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 animate-scale-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Supplier Network Directory
          </h2>
          <p className="text-[11px] text-gray-550 mt-1 font-medium">Manage external labs, milling centers, and pathology partners.</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-12 flex justify-center text-indigo-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-10 text-center text-gray-500 font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No suppliers configured. Click "Add New Supplier" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="p-4 border border-gray-150 rounded-xl hover:shadow-md transition-shadow bg-gray-50/30 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                    Dental Lab Partner
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openModal(supplier)} 
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(supplier.id)} 
                      className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-gray-900 truncate" title={supplier.name}>
                  {supplier.name}
                </h3>
                {supplier.contact_person && (
                  <p className="text-[11px] text-gray-500 font-medium">Contact: {supplier.contact_person}</p>
                )}
                
                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium truncate">{supplier.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">Avg Turnaround: {supplier.average_tat_days || 5} Days</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-700">{supplier.rating || 5.0}</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider bg-emerald-100 text-emerald-700">
                  Active Supplier
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="text-base font-black flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-300" />
                {currentSupplier ? "Edit Supplier Details" : "Add New Supplier"}
              </h3>
              <button onClick={closeModal} className="text-indigo-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Supplier / Lab Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Dental Laboratories"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 40 2345 6789"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@lab.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Average Turnaround (Days)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="30"
                  value={tatDays}
                  onChange={(e) => setTatDays(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-gray-800"
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
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                >
                  {currentSupplier ? "Update Supplier" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
