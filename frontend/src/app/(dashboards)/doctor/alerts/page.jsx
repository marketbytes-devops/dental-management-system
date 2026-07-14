"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import AlertsTracker from "@/components/features/doctor/alerts/AlertsTracker";

export default function DoctorAlertsPage() {
  const router = useRouter();
  const {
    patients,
    activePatient,
    activePatientToken,
    handleAddAlert,
    setViewingPatientToken,
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
        n => n.status === "unread" && n.link === "/doctor/alerts"
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

  const handleFocusProfile = (token) => {
    setNewlyAddedIds(prev => prev.filter(id => id !== token));
    setViewingPatientToken(token);
    router.push("/doctor/workspace");
  };

  const emergencyPatients = Object.fromEntries(
    Object.entries(patients).filter(([_, p]) => p.isEmergency)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Safety Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor high-risk patient conditions and manage safety contraindications.</p>
      </div>

      <AlertsTracker
        patients={emergencyPatients}
        activePatient={activePatient}
        activePatientToken={activePatientToken}
        onAddAlert={handleAddAlert}
        onFocusProfile={handleFocusProfile}
        newlyAddedIds={newlyAddedIds}
        setNewlyAddedIds={setNewlyAddedIds}
      />
    </div>
  );
}
