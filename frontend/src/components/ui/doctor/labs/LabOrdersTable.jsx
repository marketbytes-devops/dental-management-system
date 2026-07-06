"use client";

import { useState } from "react";
import LabOrderForm from "../workspace/LabOrderForm";

export default function LabOrdersTable({
  labOrders = [],
  patients = {},
  activeLabCount,
  onMarkLabDelivered,
  onSubmitLabOrder,
  viewingPatientToken,
  newlyAddedIds = [],
  setNewlyAddedIds
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Milling & Restorative Lab Trackings</h3>
            <p className="text-xs text-gray-505 font-semibold mt-0.5">Status of custom crown, bridge, and aligner fabrications</p>
          </div>
          <span className="text-xs font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-full">
            {activeLabCount} Active Orders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Fabrication Item</th>
                <th className="px-6 py-4">Lab Partner</th>
                <th className="px-6 py-4">ETA Status</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labOrders.map((order) => {
                const pt = patients[order.patientToken];
                return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (setNewlyAddedIds) {
                        setNewlyAddedIds(prev => prev.filter(id => id !== order.id));
                      }
                    }}
                  >
                    <td className="px-6 py-4 text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      {order.id}
                      {newlyAddedIds.includes(order.id) && (
                        <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="New Lab Update" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-955 block">{pt ? pt.name : "Walk-in Patient"}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Token: {order.patientToken}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-700">🦷 {order.item}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-505">{order.labName}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">{order.eta}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        order.status === "Delivered"
                          ? "bg-success/15 text-success border-success/20"
                          : order.status === "Ready / Shipped"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.resultDocumentUrl && (
                          <a href={order.resultDocumentUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer">
                            View Report
                          </a>
                        )}
                        {order.status !== "Delivered" ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onMarkLabDelivered(order.id); }}
                            className="px-2.5 py-1.5 bg-success/10 hover:bg-success/15 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Receive Order
                          </button>
                        ) : (
                          <span className="text-xs text-success font-semibold flex items-center justify-end gap-1">
                            <span>✓</span> Received
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {onSubmitLabOrder && viewingPatientToken && (
        <LabOrderForm onSubmitLabOrder={onSubmitLabOrder} />
      )}
      
      {onSubmitLabOrder && !viewingPatientToken && (
        <div className="bg-white border border-gray-150 rounded-xl p-5">
           <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
             <span>🔬</span> Lab Work Request
           </h4>
           <p className="text-xs text-gray-400 italic py-2">Select a patient under Clinical Workspace to dispatch lab order cases.</p>
        </div>
      )}
    </div>
  );
}
