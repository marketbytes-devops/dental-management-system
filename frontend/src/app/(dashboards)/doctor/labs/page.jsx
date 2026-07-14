"use client";

import { useState, useEffect, useRef } from "react";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import LabOrdersTable from "@/components/features/doctor/labs/LabOrdersTable";

export default function DoctorLabsPage() {
  const {
    labOrders,
    patients,
    handleMarkLabDelivered,
    handleSubmitLabOrder,
    viewingPatientToken,
    notifications = [],
    markAsRead,
    markAsUnread
  } = useDoctor();

  const [newlyAddedIds, setNewlyAddedIds] = useState([]);
  const newlyAddedIdsRef = useRef([]);

  useEffect(() => {
    newlyAddedIdsRef.current = newlyAddedIds;
  }, [newlyAddedIds]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const pageNotifications = notifications.filter(
        n => n.status === "unread" && n.link === "/doctor/labs"
      );
      if (pageNotifications.length > 0) {
        const itemIds = pageNotifications.map(n => n.itemId);
        setNewlyAddedIds(itemIds);
        pageNotifications.forEach(n => markAsRead(n.id));
      }
    }

    const reminderTimer = setTimeout(() => {
      const remainingUnread = newlyAddedIdsRef.current;
      if (remainingUnread.length > 0) {
        remainingUnread.forEach(itemId => markAsUnread(itemId));
      }
    }, 15000);

    return () => {
      clearTimeout(reminderTimer);
      const remainingUnread = newlyAddedIdsRef.current;
      if (remainingUnread.length > 0) {
        remainingUnread.forEach(itemId => markAsUnread(itemId));
      }
    };
  }, []);

  const activeLabCount = labOrders.filter(l => l.status !== "Delivered").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restorative Lab Workings</h1>
        <p className="text-sm text-gray-500 mt-1">Track shade fittings, zirconia millings, and denture fabrications.</p>
      </div>

      <LabOrdersTable
        labOrders={labOrders}
        patients={patients}
        activeLabCount={activeLabCount}
        onMarkLabDelivered={handleMarkLabDelivered}
        onSubmitLabOrder={handleSubmitLabOrder}
        viewingPatientToken={viewingPatientToken}
        newlyAddedIds={newlyAddedIds}
        setNewlyAddedIds={setNewlyAddedIds}
      />
    </div>
  );
}
