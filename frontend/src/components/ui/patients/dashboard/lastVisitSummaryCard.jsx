"use client";
import { Calendar } from "lucide-react";

export default function LastVisitSummaryCard({ lastVisit, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-purple-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Visit Summary</p>
        {lastVisit ? (
          <>
            <h3 className="text-xl font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
              {lastVisit.treatment}
            </h3>
            <p className="text-xs text-purple-600 font-medium mt-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> {lastVisit.date} with {lastVisit.doctor}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900">No History</h3>
            <p className="text-xs text-purple-600 font-medium mt-2">
              No recent visits found
            </p>
          </>
        )}
      </div>
    </div>
  );
}
