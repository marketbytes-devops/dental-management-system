"use client";

import { useState, useEffect } from "react";

const defaultRequests = [
  {
    id: "LV-101",
    userId: "DR-101",
    staffName: "Dr. Anoop Nair",
    role: "doctor",
    type: "Annual Leave",
    startDate: "2026-03-10",
    endDate: "2026-03-15",
    days: 6,
    reason: "Family function / trip",
    status: "Approved",
    submittedAt: "2026-02-25, 10:15 AM",
    onCallDoctor: ""
  },
  {
    id: "LV-102",
    userId: "DR-101",
    staffName: "Dr. Anoop Nair",
    role: "doctor",
    type: "Sick Leave",
    startDate: "2026-06-02",
    endDate: "2026-06-03",
    days: 2,
    reason: "Severe viral fever",
    status: "Approved",
    submittedAt: "2026-06-02, 08:30 AM",
    onCallDoctor: ""
  },
  {
    id: "LV-103",
    userId: "DR-101",
    staffName: "Dr. Anoop Nair",
    role: "doctor",
    type: "Casual Leave",
    startDate: "2026-06-25",
    endDate: "2026-06-25",
    days: 1,
    reason: "Personal urgent bank work",
    status: "Pending",
    submittedAt: "2026-06-15, 11:00 AM",
    onCallDoctor: "Dr. Sarah Jenkins"
  },
  {
    id: "LV-104",
    userId: "LT-1002",
    staffName: "Alen Joseph",
    role: "labtechnician",
    type: "Annual Leave",
    startDate: "2026-05-12",
    endDate: "2026-05-16",
    days: 5,
    reason: "Personal work",
    status: "Approved",
    submittedAt: "2026-05-10, 09:00 AM"
  },
  {
    id: "LV-105",
    userId: "FD-101",
    staffName: "Jane Doe",
    role: "receptionist",
    type: "Annual Leave",
    startDate: "2026-02-20",
    endDate: "2026-02-24",
    days: 5,
    reason: "Out of town travel",
    status: "Approved",
    submittedAt: "2026-02-15, 03:00 PM"
  }
];

const defaultBalances = {
  "DR-101": {
    "Annual Leave": { used: 6, total: 20 },
    "Sick Leave": { used: 2, total: 10 },
    "Casual Leave": { used: 0, total: 8 },
    "CME Leave": { used: 0, total: 7 }
  },
  "LT-1002": {
    "Annual Leave": { used: 5, total: 18 },
    "Sick Leave": { used: 0, total: 10 },
    "Casual Leave": { used: 0, total: 8 }
  },
  "FD-101": {
    "Annual Leave": { used: 5, total: 18 },
    "Sick Leave": { used: 0, total: 10 },
    "Casual Leave": { used: 0, total: 8 }
  },
  "FD-102": {
    "Annual Leave": { used: 0, total: 18 },
    "Sick Leave": { used: 0, total: 10 },
    "Casual Leave": { used: 0, total: 8 }
  }
};

export default function useLeaveData(userId, role, staffName) {
  const reqStorageKey = "smilecare_global_leave_requests";
  const balStorageKey = "smilecare_global_leave_balances";

  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedReqs = localStorage.getItem(reqStorageKey);
    const savedBals = localStorage.getItem(balStorageKey);

    let finalRequests = defaultRequests;
    let finalBalances = defaultBalances;

    if (savedReqs) {
      try {
        finalRequests = JSON.parse(savedReqs);
      } catch (e) {
        console.error("Error parsing requests", e);
      }
    } else {
      localStorage.setItem(reqStorageKey, JSON.stringify(defaultRequests));
    }

    if (savedBals) {
      try {
        finalBalances = JSON.parse(savedBals);
      } catch (e) {
        console.error("Error parsing balances", e);
      }
    } else {
      localStorage.setItem(balStorageKey, JSON.stringify(defaultBalances));
    }

    setRequests(finalRequests);
    setBalances(finalBalances);
    setIsLoaded(true);
  }, []);

  const syncState = (updatedReqs, updatedBals) => {
    setRequests(updatedReqs);
    setBalances(updatedBals);
    localStorage.setItem(reqStorageKey, JSON.stringify(updatedReqs));
    localStorage.setItem(balStorageKey, JSON.stringify(updatedBals));
  };

  const applyLeave = (type, startDate, endDate, reason, onCallDoctor = "") => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newReq = {
      id: `LV-${Math.floor(106 + Math.random() * 890)}`,
      userId,
      staffName,
      role,
      type,
      startDate,
      endDate,
      days: diffDays,
      reason,
      status: "Pending",
      submittedAt: new Date().toLocaleString(),
      onCallDoctor
    };

    const updated = [newReq, ...requests];
    syncState(updated, balances);
    return { success: true, days: diffDays };
  };

  const approveLeave = (id) => {
    const req = requests.find((r) => r.id === id);
    if (!req || req.status !== "Pending") return;

    const updatedBals = { ...balances };
    const uId = req.userId;
    const type = req.type;

    if (updatedBals[uId] && updatedBals[uId][type]) {
      updatedBals[uId][type] = {
        ...updatedBals[uId][type],
        used: Math.min(updatedBals[uId][type].total, updatedBals[uId][type].used + req.days)
      };
    }

    const updatedReqs = requests.map((r) => (r.id === id ? { ...r, status: "Approved" } : r));
    syncState(updatedReqs, updatedBals);
  };

  const rejectLeave = (id) => {
    const updatedReqs = requests.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r));
    syncState(updatedReqs, balances);
  };

  const cancelLeave = (id) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    let updatedBals = { ...balances };
    // If approved, restore balance
    if (req.status === "Approved") {
      const uId = req.userId;
      const type = req.type;
      if (updatedBals[uId] && updatedBals[uId][type]) {
        updatedBals[uId][type] = {
          ...updatedBals[uId][type],
          used: Math.max(0, updatedBals[uId][type].used - req.days)
        };
      }
    }

    const updatedReqs = requests.filter((r) => r.id !== id);
    syncState(updatedReqs, updatedBals);
  };

  const resetData = () => {
    localStorage.removeItem(reqStorageKey);
    localStorage.removeItem(balStorageKey);
    syncState(defaultRequests, defaultBalances);
  };

  // Get active balances for the current user (fallback to empty object if not loaded yet)
  const myBalances = balances[userId] || {
    "Annual Leave": { used: 0, total: 18 },
    "Sick Leave": { used: 0, total: 10 },
    "Casual Leave": { used: 0, total: 8 }
  };

  return {
    requests,
    balances: myBalances,
    allBalances: balances,
    isLoaded,
    applyLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    resetData
  };
}
