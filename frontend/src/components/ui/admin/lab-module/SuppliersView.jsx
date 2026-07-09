"use client";

import React, { useState } from "react";
import { Truck, Plus, Star, Phone, MapPin, MoreVertical } from "lucide-react";

export default function SuppliersView() {
  // Mock data for Suppliers since backend API is pending
  const [suppliers] = useState([
    {
      id: "SUP-001",
      name: "Apex Dental Laboratories",
      type: "Dental Lab",
      contact: "+91 40 2345 6789",
      email: "orders@apexdental.com",
      address: "Banjara Hills, Hyderabad",
      rating: 4.8,
      status: "Active"
    },
    {
      id: "SUP-002",
      name: "Precision Milling Centre",
      type: "CAD/CAM Milling",
      contact: "+91 40 6678 9012",
      email: "support@precisionmilling.in",
      address: "HITEC City, Madhapur",
      rating: 4.5,
      status: "Active"
    },
    {
      id: "SUP-003",
      name: "City Path Labs",
      type: "Diagnostic Center",
      contact: "+91 40 4456 7890",
      email: "reports@citypath.com",
      address: "Punjagutta, Hyderabad",
      rating: 4.9,
      status: "Active"
    },
    {
      id: "SUP-004",
      name: "BioDent Implants Corp",
      type: "Material Vendor",
      contact: "+91 80 1234 5678",
      email: "sales@biodent.com",
      address: "Whitefield, Bangalore",
      rating: 4.2,
      status: "Inactive"
    }
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 animate-scale-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Supplier Network
          </h2>
          <p className="text-[11px] text-gray-550 mt-1 font-medium">Manage external labs, milling centers, and material vendors.</p>
        </div>
        
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="p-4 border border-gray-150 rounded-xl hover:shadow-md transition-shadow bg-gray-50/30">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                {supplier.type}
              </span>
              <button className="text-gray-400 hover:text-gray-700 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-sm font-bold text-gray-900 truncate" title={supplier.name}>
              {supplier.name}
            </h3>
            
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium">{supplier.contact}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium truncate">{supplier.address}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-bold text-yellow-700">{supplier.rating}</span>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                supplier.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
              }`}>
                {supplier.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
