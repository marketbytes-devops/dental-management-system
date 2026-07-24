"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDispensingQueue, getLabOrdersForReceptionist, getMyLeaveRequests } from "@/services/api";

const ReceptionistContext = createContext(null);

export function useReceptionist() {
  return useContext(ReceptionistContext);
}

export default function ReceptionistLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [dispenseList, setDispenseList] = useState([]);
  const [labOrdersList, setLabOrdersList] = useState([]);
  const [myLeavesList, setMyLeavesList] = useState([]);
  const [readTabMap, setReadTabMap] = useState({});
  const [readNotifIds, setReadNotifIds] = useState({});

  // Load read tab map & read notifications from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTabMap = localStorage.getItem("receptionist_tab_read_map");
        if (savedTabMap) setReadTabMap(JSON.parse(savedTabMap));

        const savedNotifIds = localStorage.getItem("receptionist_read_notif_ids");
        if (savedNotifIds) setReadNotifIds(JSON.parse(savedNotifIds));
      } catch (e) {
        console.warn("Failed to parse receptionist notification cache:", e);
      }
    }
  }, []);

  // Update readTabMap whenever receptionist visits a tab
  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      setReadTabMap((prev) => {
        const updated = { ...prev, [pathname]: Date.now() };
        try {
          localStorage.setItem("receptionist_tab_read_map", JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
        return updated;
      });
    }
  }, [pathname]);

  // Fetch real-time queues
  const fetchQueues = useCallback(async () => {
    try {
      const [dispenseData, labData, leaveData] = await Promise.allSettled([
        getDispensingQueue(),
        getLabOrdersForReceptionist(),
        getMyLeaveRequests(),
      ]);

      if (dispenseData.status === "fulfilled" && Array.isArray(dispenseData.value)) {
        setDispenseList(dispenseData.value);
      }
      if (labData.status === "fulfilled" && Array.isArray(labData.value)) {
        setLabOrdersList(labData.value);
      }
      if (leaveData.status === "fulfilled" && Array.isArray(leaveData.value)) {
        setMyLeavesList(leaveData.value);
      }
    } catch (err) {
      console.warn("Receptionist queue poll error:", err);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 5000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  // Generate notifications list
  const notifications = [];

  // 1. Pending Dispensations
  dispenseList.forEach((item) => {
    if (item.status === "Pending") {
      const createdTime = item.created_at ? new Date(item.created_at).getTime() : Date.now();
      notifications.push({
        id: `dispense-${item.id}`,
        type: "dispensing",
        title: "New Medicine Prescription",
        message: `Dr. ${item.doctor_name || "Doctor"} prescribed medicines for ${item.patient_name || "Patient"} (${item.patient_token || ""})`,
        link: "/frontdesk/receptionist/dispensing",
        tabHref: "/frontdesk/receptionist/dispensing",
        createdTime,
        timestamp: item.created_at
          ? new Date(item.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : "Just now",
        read: !!readNotifIds[`dispense-${item.id}`],
      });
    }
  });

  // 2. Ready Lab Orders
  const readyStatuses = ["Completed", "completed", "Ready for Pickup", "Dispatched"];
  labOrdersList.forEach((item) => {
    if (readyStatuses.includes(item.status)) {
      const createdTime = item.created_at ? new Date(item.created_at).getTime() : Date.now();
      notifications.push({
        id: `lab-${item.id}`,
        type: "lab_orders",
        title: "Lab Order Ready for Pickup",
        message: `Lab order #${item.id} for ${item.patient_name || "Patient"} is ready for pickup`,
        link: "/frontdesk/receptionist/lab-orders",
        tabHref: "/frontdesk/receptionist/lab-orders",
        createdTime,
        timestamp: item.created_at
          ? new Date(item.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : "Just now",
        read: !!readNotifIds[`lab-${item.id}`],
      });
    }
  });

  // 3. Leave Request Status Notifications (Approved / Rejected)
  myLeavesList.forEach((item) => {
    if (item.status === "Approved" || item.status === "Rejected") {
      const createdTime = item.submitted_at ? new Date(item.submitted_at).getTime() : Date.now();
      notifications.push({
        id: `leave-${item.id}-${item.status}`,
        type: "leave",
        title: `Leave Application ${item.status}`,
        message: `Your ${item.type} request (${item.start_date} to ${item.end_date}) was ${item.status.toLowerCase()} by Admin.`,
        link: "/frontdesk/receptionist/leave",
        tabHref: "/frontdesk/receptionist/leave",
        createdTime,
        timestamp: item.start_date,
        read: !!readNotifIds[`leave-${item.id}-${item.status}`],
      });
    }
  });

  // Sort notifications by createdTime desc
  notifications.sort((a, b) => b.createdTime - a.createdTime);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotifAsRead = (id) => {
    setReadNotifIds((prev) => {
      const updated = { ...prev, [id]: true };
      try {
        localStorage.setItem("receptionist_read_notif_ids", JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const markAllNotifsAsRead = () => {
    setReadNotifIds((prev) => {
      const updated = { ...prev };
      notifications.forEach((n) => {
        updated[n.id] = true;
      });
      try {
        localStorage.setItem("receptionist_read_notif_ids", JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  // Helper to check if a tab has unread red dot
  const hasRedDot = (href) => {
    // If user is currently on this tab, don't show red dot
    if (pathname === href) return false;

    const lastReadTime = readTabMap[href] || 0;

    if (href === "/frontdesk/receptionist/dispensing") {
      return dispenseList.some(
        (item) => item.status === "Pending" && (item.created_at ? new Date(item.created_at).getTime() : Date.now()) > lastReadTime
      );
    }

    if (href === "/frontdesk/receptionist/lab-orders") {
      return labOrdersList.some(
        (item) => readyStatuses.includes(item.status) && (item.created_at ? new Date(item.created_at).getTime() : Date.now()) > lastReadTime
      );
    }

    if (href === "/frontdesk/receptionist/leave") {
      return myLeavesList.some(
        (item) => (item.status === "Approved" || item.status === "Rejected") && (item.submitted_at ? new Date(item.submitted_at).getTime() : Date.now()) > lastReadTime
      );
    }

    return false;
  };

  const contextValue = {
    notifications,
    unreadCount,
    markNotifAsRead,
    markAllNotifsAsRead,
    hasRedDot,
    dispenseList,
    labOrdersList,
  };

  return (
    <AuthGuard allowedRoles={["receptionist"]} type="staff">
      <ReceptionistContext.Provider value={contextValue}>
        <DashboardLayout>{children}</DashboardLayout>
      </ReceptionistContext.Provider>
    </AuthGuard>
  );
}

