"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from "lucide-react";

export default function LeaveCalendar({ requests }) {
  // June 2026 holds the current workspace session time
  const [currentYear] = useState(2026);
  const [currentMonth] = useState(5); // June is index 5 in JS Date

  const daysInMonth = 30; // June has 30 days
  const monthName = "June 2026";

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Fetch approved requests
  const approvedRequests = requests.filter((r) => r.status === "Approved");

  const getLeavesForDay = (dayNum) => {
    const checkDate = new Date(currentYear, currentMonth, dayNum);
    checkDate.setHours(0, 0, 0, 0);

    return approvedRequests.filter((req) => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const getShortName = (name) => {
    const clean = name.replace("Dr.", "").trim();
    return clean.split(" ")[0];
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "doctor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "labtechnician":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "receptionist":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "accountant":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h3 className="text-sm font-bold text-gray-905 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon className="w-4.5 h-4.5 text-primary" /> Clinic Attendance Calendar
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            {monthName}
          </span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
        {weekdays.map((day) => (
          <div key={day} className="py-2 bg-gray-50/50 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days grid */}
      <div className="grid grid-cols-7 gap-2 min-h-[350px]">
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dayLeaves = getLeavesForDay(dayNum);

          return (
            <div
              key={dayNum}
              className="bg-white border border-gray-100 hover:border-gray-300 rounded-xl p-2.5 flex flex-col justify-between transition-all min-h-[85px] relative"
            >
              {/* Day number */}
              <span className="text-xs font-bold text-gray-500 self-end">
                {dayNum}
              </span>

              {/* Leave lists */}
              <div className="space-y-1 mt-1.5 overflow-y-auto max-h-[65px] w-full">
                {dayLeaves.map((leaf) => {
                  const isDoctor = leaf.role === "doctor";
                  if (isDoctor) {
                    return (
                      <div key={leaf.id} className="space-y-0.5">
                        {/* Doctor on leave in Red */}
                        <div
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-705 border-red-200 truncate text-left flex items-center gap-0.5"
                          title={`${leaf.staffName} on leave: "${leaf.reason}"`}
                        >
                          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                          <span className="truncate">{getShortName(leaf.staffName)} (Off)</span>
                        </div>
                        {/* Replacement cover in Green */}
                        {leaf.onCallDoctor && (
                          <div
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-green-50 text-green-705 border-green-200 truncate text-left flex items-center gap-0.5"
                            title={`Arranged On-Call Coverage: ${leaf.onCallDoctor}`}
                          >
                            <span className="w-1 h-1 rounded-full bg-green-500 shrink-0 animate-pulse"></span>
                            <span className="truncate">{getShortName(leaf.onCallDoctor)} (Sub)</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Other staff leaves
                  return (
                    <div
                      key={leaf.id}
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded border truncate text-left flex items-center gap-0.5 ${getRoleColor(
                        leaf.role
                      )}`}
                      title={`${leaf.staffName} on ${leaf.type}: "${leaf.reason}"`}
                    >
                      <User className="w-2 h-2 shrink-0" />
                      <span>{getShortName(leaf.staffName)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 text-[10px] font-bold text-gray-500 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-50 border border-red-200 rounded flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-red-500"></span>
          </span>
          <span>Doctor On Leave (Off)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-green-50 border border-green-200 rounded flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-green-500"></span>
          </span>
          <span>Replacement Doctor (Sub)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-purple-100 border border-purple-200 rounded" />
          <span>Lab Tech Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-orange-100 border border-orange-200 rounded" />
          <span>Receptionist Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-200 rounded" />
          <span>Accountant Leave</span>
        </div>
      </div>
    </div>
  );
}
