"use client";

import { useState, useEffect } from "react";

const INITIAL_REPORT_RUNS = [
  { id: "REP-2026-004", name: "May 2026 Monthly Production Summary", type: "Production", date: "2026-06-01", format: "PDF", size: "1.4 MB" },
  { id: "REP-2026-003", name: "Q1 Material Cost & Utilization Report", type: "Material", date: "2026-04-01", format: "Excel", size: "2.8 MB" },
  { id: "REP-2026-002", name: "QC Rejection and Remake Analysis", type: "QC & Remakes", date: "2026-03-15", format: "PDF", size: "850 KB" },
  { id: "REP-2026-001", name: "Dentist Clinic Order Volume - Year 2025", type: "Clinics", date: "2026-01-05", format: "PDF", size: "4.2 MB" }
];

export default function LabReports() {
  const [animate, setAnimate] = useState(false);
  const [reportType, setReportType] = useState("Production Efficiency");
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [reportRuns, setReportRuns] = useState(INITIAL_REPORT_RUNS);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [activeChartTab, setActiveChartTab] = useState("Revenue"); // Revenue, Orders, Efficiency, Technician, QC

  useEffect(() => {
    setAnimate(true);
  }, []);

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleGenerateReport = (e) => {
    e.preventDefault();
    const newReport = {
      id: `REP-2026-00${reportRuns.length + 1}`,
      name: `${timeRange} ${reportType} Report (Generated)`,
      type: reportType,
      date: "2026-06-10",
      format: "PDF",
      size: "1.2 MB"
    };
    setReportRuns(prev => [newReport, ...prev]);
    triggerToast(`Report "${newReport.name}" generated successfully!`);
  };

  const handleExport = (format) => {
    triggerToast(`Exporting current dashboard view to ${format} format...`);
  };

  // Mock data for the 5 required charts
  const revenueGrowthData = [
    { label: "Jan", val: 120 }, { label: "Feb", val: 145 }, { label: "Mar", val: 190 }, 
    { label: "Apr", val: 210 }, { label: "May", val: 285 }, { label: "Jun", val: 340 }
  ];

  const monthlyOrdersData = [
    { label: "Jan", val: 80 }, { label: "Feb", val: 95 }, { label: "Mar", val: 120 }, 
    { label: "Apr", val: 110 }, { label: "May", val: 155 }, { label: "Jun", val: 172 }
  ];

  const efficiencyData = [
    { label: "CAD", val: 96 }, { label: "Milling", val: 92 }, { label: "Printing", val: 95 }, 
    { label: "Finishing", val: 89 }, { label: "QC", val: 99 }
  ];

  const techPerformanceData = [
    { label: "Alen Joseph", val: 94 }, { label: "Sneha Nair", val: 88 }, 
    { label: "Rahul Sharma", val: 82 }, { label: "Elizabeth Rose", val: 78 }
  ];

  const qcPassRateData = [
    { label: "Week 1", val: 97.8 }, { label: "Week 2", val: 98.2 }, 
    { label: "Week 3", val: 98.9 }, { label: "Week 4", val: 99.1 }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Review critical business performance logs, quality checkpoints, and export files.</p>
        </div>

        {/* Export options */}
        <div className="flex gap-2">
          {["PDF", "Excel", "CSV"].map((format) => (
            <button 
              key={format}
              onClick={() => handleExport(format)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition-all text-xs font-bold rounded-xl cursor-pointer shadow-sm"
            >
              📥 Export {format}
            </button>
          ))}
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Fabrications</p>
          <h3 className="text-2xl font-black text-gray-900">1,420 Units</h3>
          <p className="text-xs text-success font-semibold mt-1">Year to Date (YTD)</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg Lead Time</p>
          <h3 className="text-2xl font-black text-gray-900">2.4 Days</h3>
          <p className="text-xs text-primary font-semibold mt-1">-0.3 days from Q1</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">QC Pass Rate</p>
          <h3 className="text-2xl font-black text-gray-900">98.6%</h3>
          <p className="text-xs text-success font-semibold mt-1">Target threshold: 98%</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Remake Ratio</p>
          <h3 className="text-2xl font-black text-gray-900">1.4%</h3>
          <p className="text-xs text-danger font-semibold mt-1">Low remake occurrence</p>
        </div>
      </div>

      {/* Customize Form */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Run Database Report</h3>
            <p className="text-xs text-gray-400 mt-0.5">Filter the records below and download compiled exports</p>
          </div>

          <form onSubmit={handleGenerateReport} className="flex flex-wrap gap-4 items-center justify-end w-full lg:w-auto">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Report Category</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-750 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-44"
              >
                <option value="Production Efficiency">Production Efficiency</option>
                <option value="Revenue Growth">Revenue Growth</option>
                <option value="Monthly Orders">Monthly Orders</option>
                <option value="Technician Performance">Technician Performance</option>
                <option value="QC Pass Rate">QC Pass Rate</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time Frame</label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-750 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-44"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 90 Days">Last 90 Days</option>
                <option value="Year to Date">Year to Date (2026)</option>
              </select>
            </div>

            <button 
              type="submit"
              className="px-5 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs hover:bg-primary/95 transition-colors cursor-pointer shadow-sm shadow-primary/30 mt-4.5"
            >
              📊 Generate File
            </button>
          </form>
        </div>
      </div>

      {/* Analytics Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: 5 Chart views Selector & Display (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[400px]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Interactive Analytics</h3>
              <p className="text-xs text-gray-400 mt-0.5">Toggle parameters to inspect trends</p>
            </div>
            
            {/* Tabs for required charts */}
            <div className="flex flex-wrap gap-1">
              {["Revenue", "Orders", "Efficiency", "Technician", "QC"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveChartTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                    activeChartTab === tab ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart Display area */}
          <div className="flex-1 pt-6 relative h-52">
            
            {/* 1. Revenue Growth Area Chart */}
            {activeChartTab === "Revenue" && (
              <div className="h-full flex flex-col justify-between">
                <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M 0 35 L 20 31 L 40 25 L 60 22 L 80 15 L 100 10" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                  <path d="M 0 35 L 20 31 L 40 25 L 60 22 L 80 15 L 100 10 L 100 40 L 0 40 Z" fill="rgba(14,165,233,0.15)" />
                </svg>
                <div className="flex justify-between text-[9px] font-bold text-gray-400 px-1 border-t border-gray-50 pt-2">
                  {revenueGrowthData.map(d => <span key={d.label}>{d.label}</span>)}
                </div>
              </div>
            )}

            {/* 2. Monthly Orders Column Chart */}
            {activeChartTab === "Orders" && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-end justify-between px-4 h-32">
                  {monthlyOrdersData.map(d => {
                    const pct = (d.val / 180) * 100;
                    return (
                      <div key={d.label} className="flex flex-col items-center gap-1.5 w-full">
                        <div style={{ height: `${pct}%` }} className="w-6 bg-purple-500 rounded-md transition-all duration-1000"></div>
                        <span className="text-[9px] font-bold text-gray-400">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Production Efficiency Bar Chart */}
            {activeChartTab === "Efficiency" && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-end justify-between px-6 h-32">
                  {efficiencyData.map(d => {
                    const pct = d.val;
                    return (
                      <div key={d.label} className="flex flex-col items-center gap-1.5 w-full">
                        <div style={{ height: `${pct}%` }} className="w-7 bg-success rounded-md transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-white">
                          {d.val}%
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Technician Performance Horizontal Bar */}
            {activeChartTab === "Technician" && (
              <div className="h-full flex flex-col justify-center space-y-3 px-2">
                {techPerformanceData.map(d => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span className="w-24 font-bold text-gray-700 truncate">{d.label}</span>
                    <div className="flex-1 mx-4 bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                      <div style={{ width: `${d.val}%` }} className="bg-primary h-full rounded-full"></div>
                    </div>
                    <span className="font-extrabold text-gray-900 w-8 text-right">{d.val}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* 5. QC Pass Rate Line Chart */}
            {activeChartTab === "QC" && (
              <div className="h-full flex flex-col justify-between">
                <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M 10 25 L 40 22 L 70 12 L 100 8" fill="none" stroke="#22C55E" strokeWidth="2" />
                  <circle cx="10" cy="25" r="1.5" fill="#fff" stroke="#22C55E" strokeWidth="1" />
                  <circle cx="40" cy="22" r="1.5" fill="#fff" stroke="#22C55E" strokeWidth="1" />
                  <circle cx="70" cy="12" r="1.5" fill="#fff" stroke="#22C55E" strokeWidth="1" />
                  <circle cx="100" cy="8" r="1.5" fill="#fff" stroke="#22C55E" strokeWidth="1" />
                </svg>
                <div className="flex justify-between text-[9px] font-bold text-gray-400 px-4 border-t border-gray-55 pt-2">
                  {qcPassRateData.map(d => <span key={d.label}>{d.label}</span>)}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right: Archive ledger (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between overflow-x-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Reports Directory</h3>
              <p className="text-xs text-gray-400 mt-0.5">Quick search and export tools</p>
            </div>

            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-right">Get File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {reportRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-gray-800 truncate max-w-[130px]">{r.name}</td>
                    <td className="px-3 py-2.5 text-gray-500 font-semibold">{r.type}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button 
                        onClick={() => triggerToast(`Downloaded ${r.name} (${r.format})`)}
                        className="px-2 py-0.5 text-[9px] font-bold text-primary bg-primary/5 hover:bg-primary hover:text-white rounded transition-colors cursor-pointer border border-primary/10"
                      >
                        {r.format} ({r.size})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
