"use client";

import { useState, useEffect } from "react";
import useLeavePermissions from "./hooks/useLeavePermissions";
import useLeaveData from "./hooks/useLeaveData";
import LeaveApplicationForm from "./LeaveApplicationForm";
import LeaveList from "./LeaveList";
import LeaveCalendar from "./LeaveCalendar";
import LeaveApprovalQueue from "./admin/LeaveApprovalQueue";
import AllStaffLeaveView from "./admin/AllStaffLeaveView";
import {
  Calendar,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,

  AlertCircle
} from "lucide-react";

// Helper to derive staff profile from role
const getStaffProfile = (role) => {
  switch (role) {
    case "doctor":
      return { userId: "DR-101", staffName: "Dr. Anoop Nair" };
    case "labtechnician":
      return { userId: "LT-1002", staffName: "Alen Joseph" };
    case "receptionist":
      return { userId: "FD-101", staffName: "Jane Doe" };
    case "accountant":
      return { userId: "FD-102", staffName: "Bob Smith" };
    default:
      return { userId: "STAFF-001", staffName: "Clinic Staff Member" };
  }
};

export default function LeaveManagement({ role = "doctor" }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing staff_user", e);
        }
      }
    }
  }, []);

  const profile = getStaffProfile(role);
  const userId = currentUser ? `USER-${currentUser.id}` : profile.userId;
  const staffName = currentUser ? currentUser.name : profile.staffName;

  // Load Permissions
  const permissions = useLeavePermissions(role);

  // Load centralized leave request and balance hook
  const {
    requests,
    balances,
    allBalances,
    isLoaded,
    applyLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    resetData
  } = useLeaveData(userId, role, staffName);

  // Navigation & Simulation State
  const [activeTab, setActiveTab] = useState(role === "admin" ? "manager" : "dashboard"); // dashboard | calendar | manager
  const [simulateManager, setSimulateManager] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleApply = (type, startDate, endDate, reason, onCallDoctor) => {
    return applyLeave(type, startDate, endDate, reason, onCallDoctor);
  };

  // Determine manager privileges (either true role or simulated toggle)
  const isManagerMode = permissions.canApprove || simulateManager;

  if (!isLoaded) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 font-semibold flex items-center justify-center gap-2">
        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        Loading Leave Workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Leave Workspace
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Apply for leave time off, check balances, and coordinate with clinic-wide schedules.
          </p>
        </div>

        {role === "admin" && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Profile Info */}
            <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-left text-xs">
              <p className="font-bold text-gray-900">{staffName}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{permissions.label} • {userId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-150 gap-2">
        {permissions.canApply && (
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer outline-none ${activeTab === "dashboard"
                ? "border-primary text-primary"
                : "border-transparent text-gray-505 hover:text-gray-900"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" /> My Dashboard
          </button>
        )}
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer outline-none ${activeTab === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-gray-505 hover:text-gray-900"
            }`}
        >
          <Calendar className="w-4 h-4" /> Month Schedule
        </button>

        {isManagerMode && (
          <button
            onClick={() => setActiveTab("manager")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer outline-none ${activeTab === "manager"
                ? "border-primary text-primary"
                : "border-transparent text-gray-505 hover:text-gray-900"
              }`}
          >
            <ShieldCheck className="w-4 h-4" /> Manager Hub
            {requests.filter(r => r.status === "Pending").length > 0 && (
              <span className="bg-danger text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {requests.filter(r => r.status === "Pending").length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* leave balance cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(balances).map(([type, bal]) => {
                const remaining = bal.total - bal.used;
                const pctUsed = Math.min(100, Math.round((bal.used / bal.total) * 100));

                const getCardStyle = () => {
                  switch (type) {
                    case "Annual Leave":
                      return { text: "text-primary", bar: "bg-primary", bg: "bg-primary/5" };
                    case "Sick Leave":
                      return { text: "text-danger", bar: "bg-danger", bg: "bg-danger/5" };
                    case "Casual Leave":
                      return { text: "text-warning", bar: "bg-warning", bg: "bg-warning/5" };
                    case "CME Leave":
                      return { text: "text-purple-600", bar: "bg-purple-600", bg: "bg-purple-50" };
                    default:
                      return { text: "text-gray-600", bar: "bg-gray-600", bg: "bg-gray-50" };
                  }
                };

                const style = getCardStyle();

                return (
                  <div key={type} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                        {type}
                      </span>
                      <div className="flex items-baseline mt-3 gap-1">
                        <span className="text-2xl font-black text-gray-900">{remaining}</span>
                        <span className="text-xs text-gray-400 font-bold">/ {bal.total} days left</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${style.bar}`} style={{ width: `${pctUsed}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                        <span>{bal.used} taken</span>
                        <span>{pctUsed}% utilized</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split Apply & History lists */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <LeaveApplicationForm
                  balances={balances}
                  requiresOnCall={permissions.requiresOnCall}
                  onApply={handleApply}
                  errorMsg={errorMsg}
                  setErrorMsg={setErrorMsg}
                  successMsg={successMsg}
                  setSuccessMsg={setSuccessMsg}
                  staffName={staffName}
                  requests={requests}
                />
              </div>
              <div className="lg:col-span-7">
                <LeaveList
                  userId={userId}
                  requests={requests}
                  onCancel={cancelLeave}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <LeaveCalendar requests={requests} />
        )}

        {activeTab === "manager" && isManagerMode && (
          <div className="space-y-6 animate-fade-in">
            {successMsg && (
              <div className="p-3.5 bg-success/10 text-success border border-success/15 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Top Full-Width Stats Cards for Admin Manager Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Approved Leaves</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">
                    {requests.filter((r) => r.status === "Approved").length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-warning animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Awaiting Review</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">
                    {requests.filter((r) => r.status === "Pending").length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rejected Requests</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">
                    {requests.filter((r) => r.status === "Rejected").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <LeaveApprovalQueue
                  requests={requests}
                  onApprove={approveLeave}
                  onReject={rejectLeave}
                />
              </div>
              <div className="lg:col-span-5">
                <AllStaffLeaveView
                  requests={requests}
                  allBalances={allBalances}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
