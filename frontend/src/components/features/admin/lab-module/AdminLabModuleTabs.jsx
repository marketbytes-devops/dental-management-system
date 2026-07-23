"use client";

import React, { useState } from "react";
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
  const [activeTab, setActiveTab] = useState("orders");

  const TABS = [
    { id: "orders", label: "Lab Orders", icon: <Microscope className="w-4 h-4" /> },
    { id: "pricing", label: "Fee & Pricing Catalog", icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
    { id: "inventory", label: "Inventory & Restock", icon: <Package className="w-4 h-4" /> },
    { id: "suppliers", label: "Suppliers", icon: <Truck className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in pb-10">
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

      {/* Main clinical sheet single-column body equivalent */}
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
