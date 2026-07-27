"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getLabOrders } from "@/services/api";
import { Search, Filter, Microscope, Folder, FolderOpen, ChevronDown, ChevronUp, User } from "lucide-react";

export default function LabOrdersView() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedPatient, setExpandedPatient] = useState(null);

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
        (o.id && String(o.id).toLowerCase().includes(q)) ||
        (o.patient_name && o.patient_name.toLowerCase().includes(q)) ||
        (o.patient_token && o.patient_token.toLowerCase().includes(q)) ||
        (o.dentist_name && o.dentist_name.toLowerCase().includes(q))
      );
    }
    
    setFilteredOrders(result);
  }, [searchQuery, statusFilter, orders]);

  // Group lab orders by Patient Name
  const patientGroups = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const key = o.patient_name || "Unknown Patient";
      if (!map[key]) {
        map[key] = {
          patient_name: o.patient_name || "Unknown Patient",
          patient_token: o.patient_token || "",
          dentist_name: o.dentist_name || "",
          orders: [],
          readyCount: 0,
          pendingCount: 0,
        };
      }
      map[key].orders.push(o);
      const isReady = ["Completed", "completed", "Ready for Pickup", "Dispatched"].includes(o.status);
      if (isReady) map[key].readyCount += 1;
      else map[key].pendingCount += 1;
    });
    return Object.values(map);
  }, [filteredOrders]);

  const togglePatient = (patientName) => {
    setExpandedPatient(expandedPatient === patientName ? null : patientName);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 animate-scale-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-primary" />
            Lab Orders Overview
          </h2>
          <p className="text-[11px] text-gray-550 mt-1 font-medium">Grouped by Patient Folders. Monitor all outbound lab fabrications and diagnostic orders.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by patient, token, doctor..."
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

      {/* Patient Folders List */}
      <div className="space-y-4">
        {patientGroups.length > 0 ? (
          patientGroups.map((group) => {
            const isExpanded = expandedPatient === group.patient_name;
            const hasAttention = group.readyCount > 0 || group.pendingCount > 0;

            return (
              <div
                key={group.patient_name}
                className="border border-teal-200 rounded-2xl overflow-hidden bg-white shadow-xs transition-all hover:border-teal-300"
              >
                {/* Folder Header */}
                <button
                  type="button"
                  onClick={() => togglePatient(group.patient_name)}
                  className="w-full p-4 bg-gray-50/80 hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
                      {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-gray-900">{group.patient_name}</h3>
                        {hasAttention && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm animate-pulse shrink-0" title="Needs Attention" />
                        )}
                        {group.patient_token && (
                          <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                            {group.patient_token}
                          </span>
                        )}
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {group.orders.length} Order{group.orders.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        {group.dentist_name && <span>Doctor: <strong>{group.dentist_name}</strong></span>}
                        {group.readyCount > 0 && (
                          <span className="text-emerald-700 font-bold">• {group.readyCount} Ready for Pickup</span>
                        )}
                        {group.pendingCount > 0 && (
                          <span className="text-amber-600 font-bold">• {group.pendingCount} In Progress / Pending</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Patient Orders Accordion Content */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-white border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <th className="py-3 px-5">Order ID</th>
                          <th className="py-3 px-5">Prescribing Doctor</th>
                          <th className="py-3 px-5">Prosthetic / Test Details</th>
                          <th className="py-3 px-5">Category</th>
                          <th className="py-3 px-5">Vendor Lab</th>
                          <th className="py-3 px-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {group.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-5 font-black text-gray-700">
                              <span className="bg-gray-100 px-2.5 py-1 rounded-md text-[11px]">
                                #{order.id}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-bold text-gray-900">
                              {order.dentist_name || group.dentist_name || "N/A"}
                            </td>
                            <td className="py-3.5 px-5">
                              <p className="font-bold text-gray-800">{order.prosthetic_type || order.test_type || "N/A"}</p>
                              {order.material && (
                                <p className="text-[10px] text-gray-500">Material: {order.material} {order.shade ? `(Shade: ${order.shade})` : ""}</p>
                              )}
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-gray-600">
                              {order.order_category || "Standard"}
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-gray-700">
                              {order.lab_name || "Internal Lab"}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded tracking-wider ${
                                order.status === "Completed" || order.status === "completed" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                order.status === "Flagged" || order.status === "flagged" ? "bg-danger/10 text-danger border border-danger/20" :
                                order.status === "Pending" ? "bg-warning/10 text-warning border border-warning/20" :
                                "bg-teal-50 text-teal-700 border border-teal-200"
                              }`}>
                                {order.status || "Unknown"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-gray-500 font-medium italic bg-gray-50/40 rounded-2xl border border-dashed border-gray-200">
            No lab orders match your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
