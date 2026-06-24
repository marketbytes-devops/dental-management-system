"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Hourglass, Settings, CheckSquare, Truck, CheckCircle } from "lucide-react";

export default function LabDashboard() {
  const [animate, setAnimate] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://localhost:8000/lab/orders", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch lab orders for dashboard:", err);
    }
  };

  useEffect(() => {
    setAnimate(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalCases = orders.length;
  const pendingCases = orders.filter(o => o.status === "Pending").length;
  const inProgressCases = orders.filter(o => o.status === "Accepted" || o.status === "In Progress").length;
  const qcPendingCases = orders.filter(o => o.status === "QC Pending").length;
  const readyDispatchCases = orders.filter(o => o.status === "Ready / Shipped").length;
  const completedCases = orders.filter(o => o.status === "Completed" || o.status === "Delivered").length;

  const stats = [
    { name: "Total Orders", value: totalCases, icon: ClipboardList, change: "Active in database", color: "border-primary/30 text-primary bg-primary/5" },
    { name: "Pending Cases", value: pendingCases, icon: Hourglass, change: "Requires review", color: "border-warning/30 text-warning bg-warning/5" },
    { name: "In Progress", value: inProgressCases, icon: Settings, change: "On schedule", color: "border-purple-500/30 text-purple-650 bg-purple-50" },
    { name: "QC Pending", value: qcPendingCases, icon: CheckSquare, change: "Inspection ready", color: "border-amber-500/30 text-amber-600 bg-amber-50" },
    { name: "Ready Dispatch", value: readyDispatchCases, icon: Truck, change: "Awaiting courier", color: "border-info/30 text-secondary bg-secondary/5" },
    { name: "Completed Cases", value: completedCases, icon: CheckCircle, change: "Delivered", color: "border-success/30 text-success bg-success/5" }
  ];

  // Daily Production chart (mock 7 days data)
  const dailyProduction = [
    { day: "Mon", value: 12 },
    { day: "Tue", value: 19 },
    { day: "Wed", value: 15 },
    { day: "Thu", value: 24 },
    { day: "Fri", value: 22 },
    { day: "Sat", value: 10 },
    { day: "Sun", value: 4 }
  ];

  // Case Priority Breakdown
  const urgentCount = orders.filter(o => o.priority === "Urgent").length;
  const highCount = orders.filter(o => o.priority === "High").length;
  const mediumCount = orders.filter(o => o.priority === "Medium").length;
  const lowCount = orders.filter(o => o.priority === "Low").length;

  const casePriority = [
    { priority: "Urgent", count: urgentCount, color: "bg-danger" },
    { priority: "High", count: highCount, color: "bg-warning" },
    { priority: "Medium", count: mediumCount, color: "bg-primary" },
    { priority: "Low", count: lowCount, color: "bg-gray-400" }
  ];

  const totalCountForPct = totalCases || 1;
  const completedPct = Math.round((completedCases / totalCountForPct) * 100);
  const inProgressPct = Math.round((inProgressCases / totalCountForPct) * 100);
  const pendingPct = Math.round((pendingCases / totalCountForPct) * 100);
  const readyPct = Math.round((readyDispatchCases / totalCountForPct) * 100);
  const qcPct = Math.round((qcPendingCases / totalCountForPct) * 100);

  const caseStatuses = [
    { status: "Completed", count: completedCases, percent: completedPct, color: "#22C55E" },
    { status: "In Progress", count: inProgressCases, percent: inProgressPct, color: "#A855F7" },
    { status: "Pending Review", count: pendingCases, percent: pendingPct, color: "#F59E0B" },
    { status: "Ready Dispatch", count: readyDispatchCases, percent: readyPct, color: "#14B8A6" },
    { status: "QC Pending", count: qcPendingCases, percent: qcPct, color: "#EAB308" }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Technician Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time fabrication tracking, analytics, and technician capacity management.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.name}
            style={{ transitionDelay: `${i * 75}ms` }}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-150 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-500 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400 font-bold truncate uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
            </div>

            <div className="mt-2 text-[10px] font-bold text-gray-500 flex items-center gap-1 border-t border-gray-100 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Production - SVG Column Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Daily Production</h3>
            <p className="text-xs text-gray-400 mt-0.5">Units fabricated in the last 7 days</p>
          </div>

          <div className="h-48 flex items-end justify-between px-2 pt-6 pb-2">
            {dailyProduction.map((item, i) => {
              const maxVal = Math.max(...dailyProduction.map(d => d.value));
              const percent = (item.value / maxVal) * 100;
              return (
                <div key={item.day} className="flex flex-col items-center gap-2 w-full">
                  <div className="relative w-7 bg-gray-50 rounded-lg h-36 flex items-end overflow-hidden group border border-gray-100">
                    <div 
                      style={{ 
                        height: animate ? `${percent}%` : "0%",
                        transition: "height 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        transitionDelay: `${i * 100}ms`
                      }}
                      className="w-full bg-gradient-to-t from-primary/90 to-primary rounded-md group-hover:opacity-85"
                    >
                      <span className="absolute top-2 left-0 right-0 text-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.value}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Priority Breakdown - Horizontal Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Case Priority Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of active cases by urgency</p>
          </div>

          <div className="h-48 flex flex-col justify-center space-y-4 pt-4">
            {casePriority.map((item, i) => {
              const maxVal = Math.max(...casePriority.map(p => p.count));
              const percent = (item.count / (maxVal || 1)) * 100;
              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600 font-medium">{item.priority}</span>
                    <span className="text-gray-900 font-extrabold">{item.count} Cases</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                    <div 
                      style={{ 
                        width: animate ? `${percent}%` : "0%",
                        transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        transitionDelay: `${i * 100}ms`
                      }}
                      className={`${item.color} h-full rounded-full`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Status Overview - SVG Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Case Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of active cases</p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />

                {/* Segments - stacked dashes */}
                {totalCases > 0 ? (
                  <>
                    {/* Green Segment (Completed) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#22C55E" strokeWidth="3.2" 
                      strokeDasharray={animate ? `${completedPct} ${100 - completedPct}` : "0 100"}
                      strokeDashoffset="0"
                      style={{ transition: "stroke-dasharray 1.2s ease-out" }}
                    />

                    {/* Purple Segment (In Progress) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#A855F7" strokeWidth="3.2" 
                      strokeDasharray={animate ? `${inProgressPct} ${100 - inProgressPct}` : "0 100"}
                      strokeDashoffset={`-${completedPct}`}
                      style={{ transition: "stroke-dasharray 1.2s ease-out 0.2s" }}
                    />

                    {/* Amber Segment (Pending Review) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.2" 
                      strokeDasharray={animate ? `${pendingPct} ${100 - pendingPct}` : "0 100"}
                      strokeDashoffset={`-${completedPct + inProgressPct}`}
                      style={{ transition: "stroke-dasharray 1.2s ease-out 0.4s" }}
                    />

                    {/* Teal Segment (Ready Dispatch) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#14B8A6" strokeWidth="3.2" 
                      strokeDasharray={animate ? `${readyPct} ${100 - readyPct}` : "0 100"}
                      strokeDashoffset={`-${completedPct + inProgressPct + pendingPct}`}
                      style={{ transition: "stroke-dasharray 1.2s ease-out 0.6s" }}
                    />

                    {/* Yellow Segment (QC Pending) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#EAB308" strokeWidth="3.2" 
                      strokeDasharray={animate ? `${qcPct} ${100 - qcPct}` : "0 100"}
                      strokeDashoffset={`-${completedPct + inProgressPct + pendingPct + readyPct}`}
                      style={{ transition: "stroke-dasharray 1.2s ease-out 0.8s" }}
                    />
                  </>
                ) : (
                  /* Gray default ring if no orders */
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#CBD5E1" strokeWidth="3.2" />
                )}
              </svg>
              {/* Inner Circle Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-gray-900">{totalCases}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5">
              {caseStatuses.map((c) => (
                <div key={c.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                    <span className="text-gray-500 font-semibold truncate max-w-[80px]">{c.status}</span>
                  </div>
                  <span className="font-bold text-gray-800">{c.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

  // Technician Performance (horizontal bars)
  const technicianPerformance = [
    { name: "Alen Joseph", completed: 28, load: 85, avatar: "AJ" },
    { name: "Sneha Nair", completed: 22, load: 70, avatar: "SN" },
    { name: "Rahul Sharma", completed: 14, load: 45, avatar: "RS" },
    { name: "Elizabeth Rose", completed: 6, load: 20, avatar: "ER" }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Technician Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time fabrication tracking, analytics, and technician capacity management.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.name}
            style={{ transitionDelay: `${i * 75}ms` }}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-150 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-500 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400 font-bold truncate uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
            </div>

            <div className="mt-2 text-[10px] font-bold text-gray-500 flex items-center gap-1 border-t border-gray-100 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Production - SVG Column Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Daily Production</h3>
            <p className="text-xs text-gray-400 mt-0.5">Units fabricated in the last 7 days</p>
          </div>

          <div className="h-48 flex items-end justify-between px-2 pt-6 pb-2">
            {dailyProduction.map((item, i) => {
              const maxVal = Math.max(...dailyProduction.map(d => d.value));
              const percent = (item.value / maxVal) * 100;
              return (
                <div key={item.day} className="flex flex-col items-center gap-2 w-full">
                  <div className="relative w-7 bg-gray-50 rounded-lg h-36 flex items-end overflow-hidden group border border-gray-100">
                    <div 
                      style={{ 
                        height: animate ? `${percent}%` : "0%",
                        transition: "height 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        transitionDelay: `${i * 100}ms`
                      }}
                      className="w-full bg-gradient-to-t from-primary/90 to-primary rounded-md group-hover:opacity-85"
                    >
                      <span className="absolute top-2 left-0 right-0 text-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.value}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Priority Breakdown - Horizontal Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Case Priority Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of active cases by urgency</p>
          </div>

          <div className="h-48 flex flex-col justify-center space-y-4 pt-4">
            {casePriority.map((item, i) => {
              const maxVal = Math.max(...casePriority.map(p => p.count));
              const percent = (item.count / maxVal) * 100;
              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600 font-medium">{item.priority}</span>
                    <span className="text-gray-900 font-extrabold">{item.count} Cases</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                    <div 
                      style={{ 
                        width: animate ? `${percent}%` : "0%",
                        transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        transitionDelay: `${i * 100}ms`
                      }}
                      className={`${item.color} h-full rounded-full`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Status Overview - SVG Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Case Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of active cases</p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />

                {/* Segments - stacked dashes */}
                {/* Green Segment (Completed: 49%) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#22C55E" strokeWidth="3.2" 
                  strokeDasharray={animate ? "49 51" : "0 100"}
                  strokeDashoffset="0"
                  style={{ transition: "stroke-dasharray 1.2s ease-out" }}
                />

                {/* Purple Segment (In Progress: 24%) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#A855F7" strokeWidth="3.2" 
                  strokeDasharray={animate ? "24 76" : "0 100"}
                  strokeDashoffset="-49"
                  style={{ transition: "stroke-dasharray 1.2s ease-out 0.2s" }}
                />

                {/* Amber Segment (Pending Review: 13%) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.2" 
                  strokeDasharray={animate ? "13 87" : "0 100"}
                  strokeDashoffset="-73"
                  style={{ transition: "stroke-dasharray 1.2s ease-out 0.4s" }}
                />

                {/* Teal Segment (Ready Dispatch: 9%) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#14B8A6" strokeWidth="3.2" 
                  strokeDasharray={animate ? "9 91" : "0 100"}
                  strokeDashoffset="-86"
                  style={{ transition: "stroke-dasharray 1.2s ease-out 0.6s" }}
                />

                {/* Yellow Segment (QC Pending: 5%) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#EAB308" strokeWidth="3.2" 
                  strokeDasharray={animate ? "5 95" : "0 100"}
                  strokeDashoffset="-95"
                  style={{ transition: "stroke-dasharray 1.2s ease-out 0.8s" }}
                />
              </svg>
              {/* Inner Circle Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-gray-900">142</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5">
              {caseStatuses.map((c) => (
                <div key={c.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                    <span className="text-gray-500 font-semibold truncate max-w-[80px]">{c.status}</span>
                  </div>
                  <span className="font-bold text-gray-800">{c.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
