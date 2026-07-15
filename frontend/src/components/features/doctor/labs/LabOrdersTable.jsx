"use client";

import { useState } from "react";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import LabOrderForm from "../workspace/LabOrderForm";
import { updateLabOrderStatus } from "@/services/api";
import { validateLabOrderFields } from "@/services/labValidation";

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
  const { handleUpdateLabOrder, fetchLabOrders } = useDoctor();
  const [editingOrder, setEditingOrder] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const validateOrderFields = (order) => {
    return validateLabOrderFields(order);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Milling, Restorative & Pathology Lab Trackings</h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Clinic dashboard for external lab partners</p>
          </div>
          <span className="text-xs font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-full">
            {activeLabCount} Active Cases
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Lab Partner</th>
                <th className="px-6 py-4">Missing Fields</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labOrders.map((order) => {
                const pt = patients[order.patientToken || order.patient_token];
                const isProsthetic = order.order_category === "Prosthetic" || order.orderCategory === "Prosthetic";
                const missingFields = validateOrderFields(order);
                const isEditable = ["Submitted", "submitted", "Confirmed", "confirmed", "Ordered", "ordered", "Flagged", "flagged", "Pending", "Pending Review", "Pending Doctor Review", "Pending Doctor Confirmation"].includes(order.status);
                
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
                    <td className="px-6 py-4 text-xs font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {order.id}
                        {newlyAddedIds.includes(order.id) && (
                          <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="New Lab Update" />
                        )}
                        {order.is_rework && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-danger/10 text-danger border border-danger/10 uppercase tracking-wider shrink-0">
                            Rework
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-900 block">{pt ? pt.name : order.patient_name || "Walk-in Patient"}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Token: {order.patientToken || order.patient_token}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {isProsthetic ? "🦷 Prosthetics" : "🩸 Pathology"}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                      {isProsthetic 
                        ? `${order.fabrication_type || order.prostheticType || order.item || "Prosthetic"} (Tooth #${order.tooth_number || order.tooth || "N/A"})`
                        : `${order.test_type || "Lab Diagnostic Test"}`
                      }
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {order.lab_name || order.labName || order.external_lab_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {missingFields.length > 0 ? (
                        <span className="text-warning font-bold flex flex-wrap gap-1" title={`Missing: ${missingFields.join(", ")}`}>
                          ⚠️ {missingFields.length} fields missing
                        </span>
                      ) : (
                        <span className="text-success font-bold">✓ Ready</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        ["Delivered", "completed", "Completed", "Order Received", "Received from Lab"].includes(order.status)
                          ? "bg-success/15 text-success border-success/20"
                          : ["Ready", "shipped", "Ready / Shipped", "Doctor Accepted", "Confirmed"].includes(order.status)
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }`}>
                        {["Pending Doctor Review", "Pending Doctor Confirmation"].includes(order.status)
                          ? "Pending Doctor Confirmation"
                          : ["Confirmed", "Doctor Accepted"].includes(order.status)
                          ? "Doctor Accepted"
                          : ["Sent to Lab", "Order Sent to Lab"].includes(order.status)
                          ? "Order Sent to Lab"
                          : ["Received from Lab", "Order Received"].includes(order.status)
                          ? "Order Received"
                          : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {["Pending Doctor Review", "Pending Doctor Confirmation"].includes(order.status) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setReviewingOrder(order); }}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                            Review &amp; Confirm
                          </button>
                        )}
                        {isEditable && !["Pending Doctor Review", "Pending Doctor Confirmation"].includes(order.status) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        {order.status !== "Delivered" && order.status !== "Completed" && !["Pending Doctor Review", "Pending Doctor Confirmation"].includes(order.status) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onMarkLabDelivered(order.id); }}
                            className="px-2.5 py-1.5 bg-success/10 hover:bg-success/15 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Delivered
                          </button>
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

      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up p-6">
            <button 
              onClick={() => setEditingOrder(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-2xl"
            >
              ×
            </button>
            <LabOrderForm 
              initialOrder={editingOrder} 
              onCancel={() => setEditingOrder(null)}
              onSubmitLabOrder={async (updatedPayload) => {
                await handleUpdateLabOrder(editingOrder.id, updatedPayload);
                setEditingOrder(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Review & Confirm Modal (for Pending Doctor Review orders) */}
      {reviewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Pending Your Confirmation</p>
                <h3 className="text-sm font-extrabold text-gray-900 mt-0.5">{reviewingOrder.id} — {reviewingOrder.patient_name || "Patient"}</h3>
              </div>
              <button onClick={() => setReviewingOrder(null)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <p className="text-xs text-gray-500 leading-relaxed">
                The lab technician wants to send this case to an external lab. Please review the order specifications below and confirm.
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {reviewingOrder.order_category === "Prosthetic" || reviewingOrder.orderCategory === "Prosthetic" ? (
                  <>
                    <div><p className="text-gray-400 font-medium">Prosthetic Type</p><p className="font-bold text-gray-800 mt-0.5">{reviewingOrder.prosthetic_type || reviewingOrder.prostheticType || "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Material</p><p className="font-bold text-gray-800 mt-0.5">{reviewingOrder.material || "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Tooth / Quadrant</p><p className="font-bold text-gray-800 mt-0.5">{reviewingOrder.tooth_number || reviewingOrder.toothQuadrant ? `#${reviewingOrder.tooth_number || reviewingOrder.toothQuadrant}` : "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Shade</p><p className="font-bold text-amber-800 mt-0.5">{reviewingOrder.shade || "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Due Date</p><p className="font-bold text-red-600 mt-0.5">{reviewingOrder.due_date || reviewingOrder.dueDate || "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Priority</p><p className="font-bold text-gray-800 mt-0.5">{reviewingOrder.priority || "—"}</p></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-gray-400 font-medium">Test Type</p><p className="font-bold text-gray-800 mt-0.5">{reviewingOrder.test_type || "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Sample Type</p><p className="font-bold text-gray-800 mt-0.5">{reviewingOrder.sample_type || "—"}</p></div>
                    <div className="col-span-2"><p className="text-gray-400 font-medium">Reason for Test</p><p className="font-bold text-gray-700 mt-0.5">{reviewingOrder.reason_for_test || "—"}</p></div>
                    <div><p className="text-gray-400 font-medium">Due Date</p><p className="font-bold text-red-600 mt-0.5">{reviewingOrder.due_date || reviewingOrder.dueDate || "—"}</p></div>
                  </>
                )}
                {reviewingOrder.notes && (
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-400 font-medium">Notes</p>
                    <p className="text-gray-600 italic mt-0.5">&ldquo;{reviewingOrder.notes}&rdquo;</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setEditingOrder(reviewingOrder); setReviewingOrder(null); }}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Edit Specs First
                </button>
                <button
                  disabled={confirmLoading}
                  onClick={async () => {
                    setConfirmLoading(true);
                    try {
                      await updateLabOrderStatus(reviewingOrder.id, { status: "Doctor Accepted" });
                      if (fetchLabOrders) fetchLabOrders();
                      setReviewingOrder(null);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setConfirmLoading(false);
                    }
                  }}
                  className="flex-[2] py-2.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {confirmLoading ? "Confirming…" : "✓ Confirm & Send to Lab"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
