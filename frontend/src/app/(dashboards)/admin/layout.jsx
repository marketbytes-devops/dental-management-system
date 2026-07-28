"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllLeaveRequests, getLabInventory, getRestockRequests } from "@/services/api";

const AdminContext = createContext(null);

export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [readTabMap, setReadTabMap] = useState({});
  const [readNotifIds, setReadNotifIds] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTabMap = localStorage.getItem("admin_tab_read_map");
        if (savedTabMap) setReadTabMap(JSON.parse(savedTabMap));

        const savedNotifIds = localStorage.getItem("admin_read_notif_ids");
        if (savedNotifIds) setReadNotifIds(JSON.parse(savedNotifIds));
      } catch (e) {
        console.warn("Failed to parse admin notification cache:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      setReadTabMap((prev) => {
        const updated = { ...prev, [pathname]: Date.now() };
        try {
          localStorage.setItem("admin_tab_read_map", JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
        return updated;
      });
    }
  }, [pathname]);

  const fetchAdminData = useCallback(async () => {
    try {
      const [leaveRes, invRes, restockRes] = await Promise.allSettled([
        getAllLeaveRequests(),
        getLabInventory(),
        getRestockRequests(),
      ]);

      if (leaveRes.status === "fulfilled" && Array.isArray(leaveRes.value)) {
        setLeaveRequests(leaveRes.value);
      }
      if (invRes.status === "fulfilled" && Array.isArray(invRes.value)) {
        setInventoryItems(invRes.value);
      }
      if (restockRes.status === "fulfilled" && Array.isArray(restockRes.value)) {
        setRestockRequests(restockRes.value);
      }
    } catch (err) {
      console.warn("Admin data poll error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  const notifications = [];

  // 1. Pending Leave Requests
  leaveRequests.forEach((item) => {
    if (item.status === "Pending") {
      const createdTime = item.submitted_at ? new Date(item.submitted_at).getTime() : Date.now();
      notifications.push({
        id: `admin-leave-${item.id}`,
        type: "leave_request",
        title: "New Leave Request",
        message: `${item.staff_name || "Staff"} (${item.role || "staff"}) requested ${item.days} day(s) ${item.type} (${item.start_date} to ${item.end_date}).`,
        link: "/admin/leave",
        tabHref: "/admin/leave",
        createdTime,
        timestamp: item.start_date,
        read: !!readNotifIds[`admin-leave-${item.id}`],
      });
    }
  });

  // 2. Pending Restock Requests
  restockRequests.forEach((item) => {
    if (item.status === "Pending") {
      const createdTime = item.created_at ? new Date(item.created_at).getTime() : Date.now();
      notifications.push({
        id: `admin-restock-${item.id}`,
        type: "restock_request",
        title: "Restock Requested",
        message: `Restock request for ${item.item_name} (Qty: ${item.requested_quantity}) is pending approval.`,
        link: "/admin/lab-module?tab=inventory",
        tabHref: "/admin/lab-module",
        createdTime,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Just now",
        read: !!readNotifIds[`admin-restock-${item.id}`],
      });
    }
  });

  // 3. Low Stock Inventory Warnings
  inventoryItems.forEach((item) => {
    if (item.current_stock <= (item.minimum_stock_alert ?? 10)) {
      notifications.push({
        id: `admin-lowstock-${item.id}`,
        type: "low_stock",
        title: "Low Stock Warning",
        message: `${item.name} stock level is low (${item.current_stock} ${item.unit || "units"} remaining, Min alert: ${item.minimum_stock_alert}).`,
        link: "/admin/lab-module?tab=inventory",
        tabHref: "/admin/lab-module",
        createdTime: Date.now(),
        timestamp: "Alert",
        read: !!readNotifIds[`admin-lowstock-${item.id}`],
      });
    }
  });

  notifications.sort((a, b) => b.createdTime - a.createdTime);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotifAsRead = (id) => {
    setReadNotifIds((prev) => {
      const updated = { ...prev, [id]: true };
      try {
        localStorage.setItem("admin_read_notif_ids", JSON.stringify(updated));
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
        localStorage.setItem("admin_read_notif_ids", JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const hasRedDot = (href) => {
    if (pathname === href) return false;

    const lastReadTime = readTabMap[href] || 0;

    if (href === "/admin/leave") {
      return leaveRequests.some(
        (item) => item.status === "Pending" && (item.submitted_at ? new Date(item.submitted_at).getTime() : Date.now()) > lastReadTime
      );
    }

    if (href === "/admin/lab-module") {
      const hasPendingRestock = restockRequests.some(
        (item) => item.status === "Pending" && (item.created_at ? new Date(item.created_at).getTime() : Date.now()) > lastReadTime
      );
      const hasLowStock = inventoryItems.some((item) => item.current_stock <= (item.minimum_stock_alert ?? 10));
      return hasPendingRestock || hasLowStock;
    }

    return false;
  };

  const contextValue = {
    notifications,
    unreadCount,
    markNotifAsRead,
    markAllNotifsAsRead,
    hasRedDot,
    leaveRequests,
    inventoryItems,
    restockRequests,
  };

  return (
    <AuthGuard allowedRoles={["admin"]} type="staff">
      <AdminContext.Provider value={contextValue}>
        <DashboardLayout>{children}</DashboardLayout>
      </AdminContext.Provider>
    </AuthGuard>
  );
}

