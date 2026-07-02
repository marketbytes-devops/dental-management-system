"use client";

import { useState } from "react";

export default function ProcedureYield() {
  const [procedureStats] = useState([]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-gray-900">Procedure Breakdown & Yield</h3>
          <span className="text-xs text-gray-400 font-semibold">This Month</span>
        </div>
        
        {procedureStats.length > 0 ? (
          <div className="space-y-4">
            {procedureStats.map((stat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-750">{stat.name} ({stat.count} cases)</span>
                  <span className="text-gray-900 font-bold">{stat.revenue} • {stat.percentage}%</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-450 font-semibold text-xs border border-dashed border-gray-150 rounded-xl">
            No clinical procedures performed yet.
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5 mt-6 flex justify-between items-center text-xs text-gray-500 font-semibold">
        <span>Core Focus: N/A</span>
        <span className="text-primary hover:underline cursor-pointer">Export full performance log</span>
      </div>
    </div>
  );
}
