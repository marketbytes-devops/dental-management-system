"use client";

import React, { useState, useEffect } from "react";
import { 
  Microscope, 
  Package, 
  Truck,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

import AdminInventory from "@/components/features/admin/inventory";
import LabOrdersView from "./LabOrdersView";
import SuppliersView from "./SuppliersView";
import { getLabOrders, getLabVendors, getLabInventory } from "@/services/api";

export default function AdminLabModuleTabs() {
  const [activeTab, setActiveTab] = useState("menu");
  const [counts, setCounts] = useState({
    pendingOrders: 0,
    activeVendors: 0,
    lowStock: 0
  });

  const fetchCounts = async () => {
    try {
      const [orders, vendors, inventory] = await Promise.all([
        getLabOrders(),
        getLabVendors(),
        getLabInventory()
      ]);
      
      const pending = orders.filter(o => o.status === "Pending Review").length;
      const low = inventory.filter(item => item.quantity <= (item.min_stock || 5)).length;
      
      setCounts({
        pendingOrders: pending,
        activeVendors: vendors.length,
        lowStock: low
      });
    } catch (err) {
      console.error("Failed to load section counts:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const TABS = [
    { id: "orders", label: "Lab Orders", icon: <Microscope className="w-4 h-4" /> },
    { id: "inventory", label: "Inventory & Restock", icon: <Package className="w-4 h-4" /> },
    { id: "suppliers", label: "Suppliers", icon: <Truck className="w-4 h-4" /> }
  ];

  if (activeTab === "menu") {
    return (
      <div className="space-y-6">
        {/* Header section matching project theme */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm text-left">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Lab Module
          </h1>
          <p className="text-xs text-gray-550 mt-1 font-medium">Choose a section to manage.</p>
        </div>

        {/* Dynamic Card Grid (Light theme) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-scale-up">
          
          {/* Lab Orders Card */}
          <div 
            onClick={() => setActiveTab("orders")}
            className="bg-white border border-gray-150 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between h-56 text-left group"
          >
            <div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:bg-indigo-100">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">Lab Orders</h3>
              <p className="text-xs text-gray-550 mt-2 font-medium leading-relaxed">
                Monitor outbound fabrications and diagnostic orders sent to internal and external labs.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-[10px] font-black uppercase tracking-wider">
              <span className="text-yellow-650">
                {counts.pendingOrders} pending review
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Suppliers Card */}
          <div 
            onClick={() => setActiveTab("suppliers")}
            className="bg-white border border-gray-155 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between h-56 text-left group"
          >
            <div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:bg-indigo-100">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">Suppliers</h3>
              <p className="text-xs text-gray-550 mt-2 font-medium leading-relaxed">
                Manage external lab and vendor contacts, emails, and specializations.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-[10px] font-black uppercase tracking-wider">
              <span className="text-gray-400">
                {counts.activeVendors} active labs
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Inventory Card */}
          <div 
            onClick={() => setActiveTab("inventory")}
            className="bg-white border border-gray-155 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between h-56 text-left group"
          >
            <div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:bg-indigo-100">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">Inventory & Restock</h3>
              <p className="text-xs text-gray-550 mt-2 font-medium leading-relaxed">
                Track material stock levels, valuations, and restock thresholds.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-[10px] font-black uppercase tracking-wider">
              <span className="text-red-550">
                {counts.lowStock} below threshold
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in pb-10">
      
      {/* Back to Overview Bar */}
      <div className="bg-gray-50 border-b border-gray-150 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            setActiveTab("menu");
            fetchCounts();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-550 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lab Module Overview
        </button>
      </div>

      {/* Sleek Horizontal Navigation Tab Bar */}
      <div className="bg-gray-50/50 border-b border-gray-150 px-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 text-xs font-black transition-all border-b-2 relative cursor-pointer outline-none shrink-0 flex items-center gap-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Detail Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6 text-left">
        {activeTab === "orders" && <LabOrdersView />}
        {activeTab === "inventory" && (
          <div className="animate-scale-up">
            <AdminInventory />
          </div>
        )}
        {activeTab === "suppliers" && <SuppliersView />}
      </div>
    </div>
  );
}
