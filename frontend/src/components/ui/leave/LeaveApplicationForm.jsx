"use client";

import { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { getDoctors } from "@/services/api";

export default function LeaveApplicationForm({
  balances,
  requiresOnCall,
  onApply,
  errorMsg,
  setErrorMsg,
  successMsg,
  setSuccessMsg,
  staffName = "",
  requests = []
}) {
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const getTodayDateString = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateString();
  const [reason, setReason] = useState("");
  const [onCallDoctor, setOnCallDoctor] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await getDoctors();
        setDoctorsList(data || []);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    fetchDocs();
  }, []);

  // Filter eligible doctors:
  // 1. Exclude self
  // 2. Exclude doctors on leave during this duration
  const getEligibleDoctors = () => {
    if (!startDate || !endDate) {
      return doctorsList.filter(doc => {
        const docNameClean = doc.name.toLowerCase().replace("dr.", "").trim();
        const currentClean = staffName ? staffName.toLowerCase().replace("dr.", "").trim() : "";
        return docNameClean !== currentClean;
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return doctorsList.filter(doc => {
      // 1. Exclude self
      const docNameClean = doc.name.toLowerCase().replace("dr.", "").trim();
      const currentClean = staffName ? staffName.toLowerCase().replace("dr.", "").trim() : "";
      if (docNameClean === currentClean) return false;

      // 2. Exclude doctors on leave during this duration
      const isOnLeave = requests.some(req => {
        if (req.status !== "Approved") return false;
        
        const reqDocClean = req.staffName || req.staff_name || "";
        const reqDocCleanLower = reqDocClean.toLowerCase().replace("dr.", "").trim();
        if (reqDocCleanLower !== docNameClean) return false;

        const reqStart = new Date(req.start_date);
        const reqEnd = new Date(req.end_date);

        return (start <= reqEnd && end >= reqStart);
      });

      return !isOnLeave;
    });
  };

  const eligibleDoctors = getEligibleDoctors();

  useEffect(() => {
    if (eligibleDoctors.length > 0) {
      const isStillEligible = eligibleDoctors.some(d => d.name === onCallDoctor);
      if (!isStillEligible) {
        setOnCallDoctor(eligibleDoctors[0].name);
      }
    } else {
      setOnCallDoctor("");
    }
  }, [startDate, endDate, doctorsList, requests, staffName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!startDate || !endDate || !reason.trim()) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setErrorMsg("Leave start date cannot be in the past.");
      return;
    }

    if (end < start) {
      setErrorMsg("End Date cannot be before Start Date.");
      return;
    }

    // Calculate duration
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Balance check
    const balance = balances[leaveType];
    if (balance) {
      const available = balance.total - balance.used;
      if (diffDays > available) {
        setErrorMsg(`Insufficient balance. You requested ${diffDays} days, but only have ${available} days available for ${leaveType}.`);
        return;
      }
    }

    // Submit
    const result = await onApply(
      leaveType,
      startDate,
      endDate,
      reason.trim(),
      requiresOnCall ? onCallDoctor : ""
    );

    if (result && result.success) {
      setStartDate("");
      setEndDate("");
      setReason("");
      setSuccessMsg(`Leave request submitted successfully (${diffDays} days). Status: Pending approval.`);
    } else {
      setErrorMsg(result?.error || "Failed to submit request.");
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-905 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Plus className="w-4.5 h-4.5 text-primary" /> Apply for Leave
      </h3>

      {errorMsg && (
        <div className="p-3.5 bg-danger/10 text-danger border border-danger/15 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-success/10 text-success border border-success/15 rounded-xl text-xs font-semibold flex items-center gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Leave Category Selector */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Leave Category</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            {Object.keys(balances).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Start Date</label>
            <input
              type="date"
              value={startDate}
              min={todayStr}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-805 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || todayStr}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-805 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Doctor-Specific Check: On-Call Coverage Selector */}
        {requiresOnCall && (
          <div className="space-y-1 animate-fade-in">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Arranged On-Call Coverage Doctor</label>
            <select
              value={onCallDoctor}
              onChange={(e) => setOnCallDoctor(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              disabled={eligibleDoctors.length === 0}
            >
              {eligibleDoctors.length > 0 ? (
                eligibleDoctors.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} ({doc.specialty})
                  </option>
                ))
              ) : (
                <option value="">No coverage doctors available</option>
              )}
            </select>
          </div>
        )}

        {/* Reason Textarea */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Reason for Leave</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide brief details about this leave request..."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer outline-none"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
