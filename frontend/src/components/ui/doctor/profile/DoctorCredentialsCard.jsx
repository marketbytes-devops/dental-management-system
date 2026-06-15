"use client";

import { Award } from "lucide-react";

export default function DoctorCredentialsCard({ credentials }) {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Clinical Credentials</h4>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
          Active Practitioner
        </span>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <span className="block text-xs font-medium text-gray-400">Specialization</span>
          <span className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-primary shrink-0" />
            {credentials.specialty}
          </span>
        </div>
        
        <div>
          <span className="block text-xs font-medium text-gray-400">Department</span>
          <span className="font-semibold text-gray-800 mt-0.5">{credentials.department}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-gray-400">Licence ID</span>
            <span className="font-semibold text-gray-800 mt-0.5">{credentials.licenceId}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-400">Chair Setup</span>
            <span className="font-semibold text-primary mt-0.5">{credentials.chairSetup}</span>
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-gray-400">Registration Board</span>
          <span className="font-semibold text-gray-800 mt-0.5">{credentials.board}</span>
        </div>
      </div>
    </div>
  );
}
