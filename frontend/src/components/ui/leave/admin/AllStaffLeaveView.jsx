"use client";

import { BarChart3, UserCheck, ShieldAlert, BadgeInfo } from "lucide-react";

export default function AllStaffLeaveView({ requests, allBalances }) {
  // Count total leaves by status
  const approvedLeaves = requests.filter((r) => r.status === "Approved");
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

  // Group approved leaves by department
  const clinicalLeaves = approvedLeaves.filter((r) => r.role === "doctor");
  const labLeaves = approvedLeaves.filter((r) => r.role === "labtechnician");
  const deskLeaves = approvedLeaves.filter((r) => r.role === "receptionist" || r.role === "accountant");

  const renderStaffRow = (leaf) => (
    <div key={leaf.id} className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center text-xs">
      <div>
        <h5 className="font-bold text-gray-900">{leaf.staffName}</h5>
        <p className="text-[10px] text-gray-400 font-semibold">{leaf.type} • {leaf.days} days</p>
      </div>
      <div className="text-right">
        <span className="text-[10px] text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 block">
          {leaf.startDate} to {leaf.endDate}
        </span>
        {leaf.onCallDoctor && (
          <span className="text-[9px] text-primary font-bold mt-0.5 block">
            On-Call: {leaf.onCallDoctor.split(" ")[1] || leaf.onCallDoctor}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Approved Leaves</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{approvedLeaves.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Awaiting Review</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rejected Requests</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Grouped Department Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Clinical Department */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Clinical Dept</h4>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              {clinicalLeaves.length} Approved
            </span>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {clinicalLeaves.map(renderStaffRow)}
            {clinicalLeaves.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-6">No approved clinical leaves.</p>
            )}
          </div>
        </div>

        {/* Lab Department */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Lab Dept</h4>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
              {labLeaves.length} Approved
            </span>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {labLeaves.map(renderStaffRow)}
            {labLeaves.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-6">No approved lab leaves.</p>
            )}
          </div>
        </div>

        {/* Front Desk & Admin */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Front Desk & Admin</h4>
            <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
              {deskLeaves.length} Approved
            </span>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {deskLeaves.map(renderStaffRow)}
            {deskLeaves.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-6">No approved desk leaves.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
