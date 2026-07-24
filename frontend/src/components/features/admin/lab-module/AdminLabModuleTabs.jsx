"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Microscope, 
  Package, 
  Truck,
  DollarSign
} from "lucide-react";

import { useAdmin } from "@/app/(dashboards)/admin/layout";
import AdminInventory from "@/components/features/admin/inventory";
import LabOrdersView from "./LabOrdersView";
import SuppliersView from "./SuppliersView";
import LabPricingView from "./LabPricingView";

export default function AdminLabModuleTabs() {
  const searchParams = useSearchParams();
  const urlTab = searchParams ? searchParams.get("tab") : null;

  const [activeTab, setActiveTab] = useState(urlTab || "orders");

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  let adminContext = null;
  try {
    adminContext = useAdmin();
  } catch (e) {
    // not in admin context
  }

  const hasInventoryDot =
    (adminContext?.inventoryItems || []).some((item) => item.current_stock <= (item.minimum_stock_alert ?? 10)) ||
    (adminContext?.restockRequests || []).some((item) => item.status === "Pending");

  const TABS = [
    { id: "orders", label: "Lab Orders", icon: Microscope },
    { id: "pricing", label: "Fee & Pricing Catalog", icon: DollarSign },
    { id: "inventory", label: "Inventory & Restock", icon: Package },
    { id: "suppliers", label: "Suppliers & Vendors", icon: Truck }
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in pb-10">
      
      {/* Navigation Tab Header Bar */}
      <div className="bg-gray-50/80 border-b border-gray-150 px-6 pt-3 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-t-xl relative ${
                  isActive
                    ? "border-primary text-primary bg-white shadow-xs"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === "inventory" && hasInventoryDot && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-sm animate-pulse shrink-0 ml-1" title="Needs Attention: Low Stock / Restock Request" />
                )}
              </button>
            );
          })}
        </div>
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
