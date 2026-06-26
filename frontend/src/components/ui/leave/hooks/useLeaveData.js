"use client";

import { useState, useEffect } from "react";
import {
  getMyLeaveRequests,
  getMyLeaveBalances,
  getAllLeaveRequests,
  getAllLeaveBalances,
  applyLeave as apiApplyLeave,
  updateLeaveStatus,
  deleteLeaveRequest,
  resetLeaves,
} from "@/services/api";

export default function useLeaveData(userId, role, staffName) {
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState({});
  const [allBalances, setAllBalances] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchLeaveData = async () => {
    try {
      // 1. Fetch my requests
      const myReqsData = await getMyLeaveRequests();
      
      // Map backend fields to frontend expected format
      const mappedMyRequests = myReqsData.map(r => ({
        id: `LV-${r.id}`,
        dbId: r.id,
        userId: `USER-${r.user_id}`,
        staffName: r.staff_name,
        role: r.role,
        type: r.type,
        startDate: r.start_date,
        endDate: r.end_date,
        days: r.days,
        reason: r.reason,
        status: r.status,
        submittedAt: new Date(r.submitted_at).toLocaleString(),
        onCallDoctor: r.on_call_doctor || ""
      }));

      // 2. Fetch my balances
      const balData = await getMyLeaveBalances();

      setRequests(mappedMyRequests);
      setBalances(balData);

      // 3. If admin / manager, fetch all requests and all balances
      if (role === "admin" || role === "manager") {
        const allReqsData = await getAllLeaveRequests();
        const mappedAllRequests = allReqsData.map(r => ({
          id: `LV-${r.id}`,
          dbId: r.id,
          userId: `USER-${r.user_id}`,
          staffName: r.staff_name,
          role: r.role,
          type: r.type,
          startDate: r.start_date,
          endDate: r.end_date,
          days: r.days,
          reason: r.reason,
          status: r.status,
          submittedAt: new Date(r.submitted_at).toLocaleString(),
          onCallDoctor: r.on_call_doctor || ""
        }));
        setRequests(mappedAllRequests);

        const allBalData = await getAllLeaveBalances();
        setAllBalances(allBalData);
      }
      
      setIsLoaded(true);
    } catch (err) {
      console.error("Error fetching leave data from backend:", err);
      setIsLoaded(true); // Stop loading state even on error to fallback gracefully
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [userId, role]);

  const applyLeave = async (type, startDate, endDate, reason, onCallDoctor = "") => {
    try {
      const data = await apiApplyLeave({ type, startDate, endDate, reason, onCallDoctor });
      await fetchLeaveData();
      return { success: true, days: data.days };
    } catch (err) {
      return { success: false, error: err.message || "Failed to apply leave." };
    }
  };

  const approveLeave = async (id) => {
    const req = requests.find(r => r.id === id);
    const dbId = req ? req.dbId : id;
    try {
      await updateLeaveStatus(dbId, { status: "Approved" });
      await fetchLeaveData();
    } catch (err) {
      console.error("Error approving leave:", err);
    }
  };

  const rejectLeave = async (id) => {
    const req = requests.find(r => r.id === id);
    const dbId = req ? req.dbId : id;
    try {
      await updateLeaveStatus(dbId, { status: "Rejected" });
      await fetchLeaveData();
    } catch (err) {
      console.error("Error rejecting leave:", err);
    }
  };

  const cancelLeave = async (id) => {
    const req = requests.find(r => r.id === id);
    const dbId = req ? req.dbId : id;
    try {
      await deleteLeaveRequest(dbId);
      await fetchLeaveData();
    } catch (err) {
      console.error("Error cancelling leave:", err);
    }
  };

  const resetData = async () => {
    try {
      await resetLeaves();
      await fetchLeaveData();
    } catch (err) {
      console.error("Error resetting data:", err);
    }
  };

  const myBalances = balances && Object.keys(balances).length > 0 ? balances : {
    "Annual Leave": { used: 0, total: 18 },
    "Sick Leave": { used: 0, total: 10 },
    "Casual Leave": { used: 0, total: 8 }
  };

  return {
    requests,
    balances: myBalances,
    allBalances,
    isLoaded,
    applyLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    resetData
  };
}
