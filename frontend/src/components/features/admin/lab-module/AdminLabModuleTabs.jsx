"use client";

import React, { useState, useEffect } from "react";
import { 
  Microscope, 
  Package, 
  Truck,
  DollarSign
} from "lucide-react";

import AdminInventory from "@/components/features/admin/inventory";
import LabOrdersView from "./LabOrdersView";
import SuppliersView from "./SuppliersView";
import LabPricingView from "./LabPricingView";

export default function AdminLabModuleTabs() {
  const [activeTab, setActiveTab] = useState("menu");
  const [counts, setCounts] = useState({
    pendingOrders: 0,
    activeVendors: 0,
    lowStock: 0
  });

  const TABS = [
    { id: "orders", label: "Lab Orders", icon: <Microscope className="w-4 h-4" /> },
    { id: "pricing", label: "Fee & Pricing Catalog", icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
    { id: "inventory", label: "Inventory & Restock", icon: <Package className="w-4 h-4" /> },
    { id: "suppliers", label: "Suppliers", icon: <Truck className="w-4 h-4" /> }
  ];

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



      {/* Detail Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6 text-left">
        {activeTab === "orders" && <LabOrdersView />}
        {activeTab === "pricing" && <LabPricingView />}
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
