"use client";

import React, { useState, useEffect } from "react";
import { getLabOrders } from "@/services/api";
import { Search, Filter, Microscope } from "lucide-react";

export default function LabOrdersView() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const data = await getLabOrders();
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch lab orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.patient_name && o.patient_name.toLowerCase().includes(q)) ||
        (o.dentist_name && o.dentist_name.toLowerCase().includes(q))
      );
    }
    
    setFilteredOrders(result);
  }, [searchQuery, statusFilter, orders]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 animate-scale-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-primary" />
            Lab Orders Overview
          </h2>
          <p className="text-[11px] text-gray-550 mt-1 font-medium">Monitor all outbound lab fabrications and diagnostic orders.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search orders..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-150">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/80 text-gray-550 border-b border-gray-150 uppercase tracking-wider text-[10px] font-black">
              <th className="px-5 py-4">Order ID</th>
              <th className="px-5 py-4">Patient & Doctor</th>
              <th className="px-5 py-4">Prosthetic / Test</th>
              <th className="px-5 py-4">Vendor Lab</th>
              <th className="px-5 py-4">Due Date</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[11px] font-black text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                      {order.id}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">{order.patient_name || "N/A"}</p>
                    <p className="text-[10px] text-gray-500 font-semibold">{order.dentist_name || "N/A"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-800">{order.prosthetic_type || order.test_type || "N/A"}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Type: {order.order_category || "Standard"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] font-semibold text-gray-700">
                      {order.lab_name || "Internal"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[11px] font-semibold text-gray-600">
                    {order.due_date || "N/A"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded tracking-wider ${
                      order.status === "Completed" || order.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      order.status === "Flagged" || order.status === "flagged" ? "bg-danger/10 text-danger" :
                      order.status === "Pending" ? "bg-warning/10 text-warning" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {order.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-xs text-gray-500 font-medium italic bg-gray-50/30">
                  No lab orders match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
