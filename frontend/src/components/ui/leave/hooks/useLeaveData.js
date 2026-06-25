"use client";

import { useState, useEffect } from "react";

export default function useLeaveData(userId, role, staffName) {
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState({});
  const [allBalances, setAllBalances] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;

  const fetchLeaveData = async () => {
    if (!token) return;
    try {
      // 1. Fetch my requests
      const myReqsRes = await fetch("http://localhost:8000/leave/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!myReqsRes.ok) throw new Error("Failed to fetch my leave requests");
      const myReqsData = await myReqsRes.json();
      
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
      const balRes = await fetch("http://localhost:8000/leave/balances", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!balRes.ok) throw new Error("Failed to fetch leave balances");
      const balData = await balRes.json();

      setRequests(mappedMyRequests);
      setBalances(balData);

      // 3. If admin / manager, fetch all requests and all balances
      if (role === "admin" || role === "manager") {
        const allReqsRes = await fetch("http://localhost:8000/leave/requests", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (allReqsRes.ok) {
          const allReqsData = await allReqsRes.json();
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
        }

        const allBalRes = await fetch("http://localhost:8000/leave/balances/all", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (allBalRes.ok) {
          const allBalData = await allBalRes.json();
          setAllBalances(allBalData);
        }
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
      const response = await fetch("http://localhost:8000/leave/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type, startDate, endDate, reason, onCallDoctor })
      });
      if (response.ok) {
        const data = await response.json();
        await fetchLeaveData();
        return { success: true, days: data.days };
      } else {
        const errData = await response.json();
        return { success: false, error: errData.detail || "Failed to apply leave." };
      }
    } catch (err) {
      return { success: false, error: "Network error occurred." };
    }
  };

  const approveLeave = async (id) => {
    const req = requests.find(r => r.id === id);
    const dbId = req ? req.dbId : id;
    try {
      const response = await fetch(`http://localhost:8000/leave/requests/${dbId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Approved" })
      });
      if (response.ok) {
        await fetchLeaveData();
      }
    } catch (err) {
      console.error("Error approving leave:", err);
    }
  };

  const rejectLeave = async (id) => {
    const req = requests.find(r => r.id === id);
    const dbId = req ? req.dbId : id;
    try {
      const response = await fetch(`http://localhost:8000/leave/requests/${dbId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Rejected" })
      });
      if (response.ok) {
        await fetchLeaveData();
      }
    } catch (err) {
      console.error("Error rejecting leave:", err);
    }
  };

  const cancelLeave = async (id) => {
    const req = requests.find(r => r.id === id);
    const dbId = req ? req.dbId : id;
    try {
      const response = await fetch(`http://localhost:8000/leave/requests/${dbId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchLeaveData();
      }
    } catch (err) {
      console.error("Error cancelling leave:", err);
    }
  };

  const resetData = async () => {
    try {
      const response = await fetch("http://localhost:8000/leave/reset", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchLeaveData();
      }
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
