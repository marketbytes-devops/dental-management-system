"use client";

export default function InsuranceCard({ insurance }) {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Insurance Details</h4>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
          Active
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="block text-xs font-medium text-gray-400">Provider</span>
          <span className="font-semibold text-gray-800">{insurance.provider}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-gray-400">Policy Number</span>
            <span className="font-semibold text-gray-800">{insurance.policyId}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-400">Coverage</span>
            <span className="font-semibold text-success">{insurance.coverage}% Covered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
