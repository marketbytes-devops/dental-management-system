"use client";

import { useState, useEffect } from "react";

export default function LabDashboard() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    setAnimate(true);
  }, []);

  // Mock statistics data
  const stats = [
    { name: "Total Orders", value: 142, icon: "📋", change: "+12% this wk", color: "border-primary/30 text-primary bg-primary/5" },
    { name: "Pending Cases", value: 18, icon: "⌛", change: "Requires review", color: "border-warning/30 text-warning bg-warning/5" },
    { name: "In Progress", value: 34, icon: "⚙️", change: "On schedule", color: "border-purple-500/30 text-purple-600 bg-purple-50" },
    { name: "QC Pending", value: 8, icon: "✅", change: "Inspection ready", color: "border-amber-500/30 text-amber-600 bg-amber-50" },
    { name: "Ready Dispatch", value: 12, icon: "🚚", change: "Awaiting courier", color: "border-info/30 text-secondary bg-secondary/5" },
    { name: "Completed Cases", value: 70, icon: "🎉", change: "Delivered", color: "border-success/30 text-success bg-success/5" }
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

  // Monthly Revenue (mock 6 months data)
  const monthlyRevenue = [
    { month: "Jan", revenue: 120 },
    { month: "Feb", revenue: 150 },
    { month: "Mar", revenue: 190 },
    { month: "Apr", revenue: 220 },
    { month: "May", revenue: 280 },
    { month: "Jun", revenue: 310 }
  ];

  // Case Status Overview (Donut chart data)
  const caseStatuses = [
    { status: "Completed", count: 70, percent: 49, color: "#22C55E" },
    { status: "In Progress", count: 34, percent: 24, color: "#A855F7" },
    { status: "Pending Review", count: 18, percent: 13, color: "#F59E0B" },
    { status: "Ready Dispatch", count: 12, percent: 9, color: "#14B8A6" },
    { status: "QC Pending", count: 8, percent: 5, color: "#EAB308" }
  ];

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
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${stat.color}`}>
                {stat.icon}
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

        {/* Monthly Revenue - SVG Area/Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Monthly Revenue</h3>
            <p className="text-xs text-gray-400 mt-0.5">Revenue generated in ₹ thousands</p>
          </div>

          <div className="h-48 pt-6 relative">
            {/* SVG Area Chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="#F1F5F9" strokeWidth="0.3" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#F1F5F9" strokeWidth="0.3" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#F1F5F9" strokeWidth="0.3" />
              
              {/* Fill Area path */}
              <path
                d={animate ? "M 0 35 L 20 31 L 40 27 L 60 23 L 80 16 L 100 12 L 100 40 L 0 40 Z" : "M 0 40 L 20 40 L 40 40 L 60 40 L 80 40 L 100 40 L 100 40 L 0 40 Z"}
                fill="url(#revGrad)"
                style={{ transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />

              {/* Stroke path */}
              <path
                d={animate ? "M 0 35 L 20 31 L 40 27 L 60 23 L 80 16 L 100 12" : "M 0 40 L 20 40 L 40 40 L 60 40 L 80 40 L 100 40"}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{ transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />

              {/* Circular nodes on path */}
              {animate && (
                <>
                  <circle cx="0" cy="35" r="1" fill="#fff" stroke="var(--color-primary)" strokeWidth="0.5" className="animate-pulse" />
                  <circle cx="20" cy="31" r="1" fill="#fff" stroke="var(--color-primary)" strokeWidth="0.5" />
                  <circle cx="40" cy="27" r="1" fill="#fff" stroke="var(--color-primary)" strokeWidth="0.5" />
                  <circle cx="60" cy="23" r="1" fill="#fff" stroke="var(--color-primary)" strokeWidth="0.5" />
                  <circle cx="80" cy="16" r="1" fill="#fff" stroke="var(--color-primary)" strokeWidth="0.5" />
                  <circle cx="100" cy="12" r="1" fill="#fff" stroke="var(--color-primary)" strokeWidth="0.5" />
                </>
              )}
            </svg>

            {/* Labels below */}
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
              {monthlyRevenue.map((item) => (
                <span key={item.month}>{item.month}</span>
              ))}
            </div>
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

      {/* Technician Performance & Capacity List */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">Technician Capacity & Performance</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monitoring current active cases and completed orders per technician</p>
        </div>

        <div className="mt-6 space-y-4">
          {technicianPerformance.map((tech, i) => (
            <div key={tech.name} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner">
                  {tech.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{tech.name}</h4>
                  <p className="text-xs text-gray-400">Senior Dental Technician</p>
                </div>
              </div>

              {/* Progress/Performance metrics */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 font-semibold">Active Load</span>
                  <span className="text-gray-800 font-bold">{tech.load}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                  <div 
                    style={{ 
                      width: animate ? `${tech.load}%` : "0%",
                      transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      transitionDelay: `${i * 150}ms`
                    }}
                    className={`h-full rounded-full ${
                      tech.load > 80 ? "bg-gradient-to-r from-danger to-danger/90" : 
                      tech.load > 50 ? "bg-gradient-to-r from-warning to-warning/90" : 
                      "bg-gradient-to-r from-success to-success/90"
                    }`}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-6 justify-end text-right min-w-[150px]">
                <div>
                  <p className="text-[10px] text-gray-450 uppercase font-black tracking-wider">Completed Cases</p>
                  <p className="text-sm font-black text-gray-800 mt-0.5">{tech.completed}</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    tech.load > 80 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                  }`}>
                    {tech.load > 80 ? "Full Capacity" : "Available"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
