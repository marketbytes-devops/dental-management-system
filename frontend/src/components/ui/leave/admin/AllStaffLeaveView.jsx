"use client";

export default function AllStaffLeaveView({ requests }) {
  const approvedLeaves = requests.filter((r) => r.status === "Approved");

  // Group approved leaves by department
  const clinicalLeaves = approvedLeaves.filter((r) => r.role === "doctor");
  const labLeaves = approvedLeaves.filter((r) => r.role === "labtechnician");
  const deskLeaves = approvedLeaves.filter((r) => r.role === "receptionist" || r.role === "accountant");

  const renderStaffRow = (leaf) => (
    <div key={leaf.id} className="p-3.5 bg-white border border-gray-100 rounded-xl flex justify-between items-center text-xs shadow-sm hover:border-gray-200 transition-all">
      <div>
        <h5 className="font-bold text-gray-900">{leaf.staffName}</h5>
        <p className="text-[10px] text-gray-400 font-semibold">{leaf.type} • {leaf.days} days</p>
      </div>
      <div className="text-right">
        <span className="text-[10px] text-gray-700 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 block font-medium">
          {leaf.startDate} to {leaf.endDate}
        </span>
        {leaf.onCallDoctor && (
          <span className="text-[9px] text-primary font-bold mt-1 block">
            On-Call: {leaf.onCallDoctor.split(" ")[1] || leaf.onCallDoctor}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 text-left">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        📅 Approved Leaves by Department
      </h3>
      
      {/* Grouped Department Lists - Stacked vertically for a clean, spacious side panel */}
      <div className="space-y-4">
        {/* Clinical Department */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-gray-105 flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Clinical Dept</h4>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
              {clinicalLeaves.length} Approved
            </span>
          </div>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-0.5">
            {clinicalLeaves.map(renderStaffRow)}
            {clinicalLeaves.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">No approved clinical leaves.</p>
            )}
          </div>
        </div>

        {/* Lab Department */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-gray-105 flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Lab Dept</h4>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
              {labLeaves.length} Approved
            </span>
          </div>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-0.5">
            {labLeaves.map(renderStaffRow)}
            {labLeaves.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">No approved lab leaves.</p>
            )}
          </div>
        </div>

        {/* Front Desk & Admin */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-gray-105 flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Front Desk & Admin</h4>
            <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md">
              {deskLeaves.length} Approved
            </span>
          </div>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-0.5">
            {deskLeaves.map(renderStaffRow)}
            {deskLeaves.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">No approved desk leaves.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
