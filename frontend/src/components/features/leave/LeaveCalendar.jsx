"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from "lucide-react";

export default function LeaveCalendar({ requests = [] }) {
  // Default to current date / workspace date
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Jan)

  // Total days in current selected month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Starting day of week (0 = Sunday, 1 = Monday ...)
  // We align grid to Mon-Sun (0=Mon ... 6=Sun)
  const rawFirstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startDayOffset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Approved requests across all staff and modules
  const approvedRequests = (requests || []).filter((r) => r.status === "Approved");

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
    if (!name) return "Staff";
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
      {/* Calendar Header with Dynamic Month Navigation Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="w-4.5 h-4.5 text-primary" /> Month Schedule & Attendance Calendar
          </h3>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Interactive clinic schedule. View approved staff leaves across all departments.</p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-gray-800 px-3 min-w-[110px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
        {/* Leading Empty Cells for Day Offset */}
        {Array.from({ length: startDayOffset }).map((_, idx) => (
          <div key={`empty-${idx}`} className="bg-gray-50/20 border border-gray-100/50 rounded-xl min-h-[85px]" />
        ))}

        {/* Dynamic Days in Selected Month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dayLeaves = getLeavesForDay(dayNum);
          const isToday =
            new Date().getDate() === dayNum &&
            new Date().getMonth() === currentMonth &&
            new Date().getFullYear() === currentYear;

          return (
            <div
              key={dayNum}
              className={`border rounded-xl p-2.5 flex flex-col justify-between transition-all min-h-[85px] relative ${
                isToday
                  ? "bg-blue-50/40 border-primary/40 ring-2 ring-primary/20"
                  : "bg-white border-gray-100 hover:border-gray-300"
              }`}
            >
              {/* Day number */}
              <div className="flex justify-between items-center w-full">
                {isToday ? (
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                    Today
                  </span>
                ) : <span />}
                <span className={`text-xs font-extrabold ${isToday ? "text-primary font-black" : "text-gray-500"}`}>
                  {dayNum}
                </span>
              </div>

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
