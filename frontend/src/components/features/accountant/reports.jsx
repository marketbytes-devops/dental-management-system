"use client";

import { useState, useEffect } from "react";
import { getAnalyticsSummary, getAnalyticsReports } from "@/services/api";

export default function AccountantReports() {
  const [summaryData, setSummaryData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pnl"); // "pnl" | "clinical" | "costs" | "archive"
  const [exportMessage, setExportMessage] = useState("");

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [sumRes, repRes] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsReports()
      ]);
      setSummaryData(sumRes || {});
      setReportsData(repRes || {});
      setError("");
    } catch (err) {
      console.error("Failed to load financial reports:", err);
      setError("Failed to connect to financial analytics service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  // CSV Generator for Archive Download
  const handleDownloadCSV = (filename, rows) => {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [keys.join(","), ...rows.map(r => keys.map(k => `"${r[k]}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportMessage(`Generated and downloaded ${filename}.csv`);
    setTimeout(() => setExportMessage(""), 4000);
  };

  const summary = summaryData?.summary || { totalRevenue: 0, totalExpenses: 0, profit: 0, outstandingDues: 0 };
  const chartData = summaryData?.chartData || [];
  const apptStats = reportsData?.appointments || { total: 0, completed: 0, cancelled: 0, missed: 0, completion_rate: 0 };
  const docPerf = reportsData?.doctorPerformance || [];
  const treatmentBreakdown = reportsData?.treatmentBreakdown || [];
  const labStats = reportsData?.labOrders || { total: 0, completed: 0, statusBreakdown: [] };
  const expenseBreakdown = reportsData?.expenseBreakdown || [];

  // Max value calculation for bar visualizers
  const maxRevenue = Math.max(...chartData.map(c => Math.max(c.Revenue, c.Expenses)), 1000);
  const maxTreatmentCount = Math.max(...treatmentBreakdown.map(t => t.count), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Financial & Operating Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Audit profit/loss statements, clinician performance, operational cost centers, and tax ledgers.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner w-fit">
          <button
            onClick={() => setActiveTab("pnl")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "pnl" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            P&L Overview
          </button>
          <button
            onClick={() => setActiveTab("clinical")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "clinical" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Clinical Analytics
          </button>
          <button
            onClick={() => setActiveTab("costs")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "costs" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Cost Centers
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "archive" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Report Archive
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">{exportMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-sm flex items-center space-x-2">
          <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-100/40 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Gross Revenue</span>
          <h3 className="text-3xl font-black text-emerald-950 mt-3">₹{summary.totalRevenue.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Realized payments collected</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/40 border border-rose-100/40 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Expenses</span>
          <h3 className="text-3xl font-black text-rose-950 mt-3">₹{summary.totalExpenses.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-rose-600 font-semibold mt-1">Overheads + Disbursed Payroll</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100/40 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Net Operating Profit</span>
          <h3 className={`text-3xl font-black mt-3 ${summary.profit >= 0 ? "text-indigo-950" : "text-rose-600"}`}>
            ₹{summary.profit.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            {summary.totalRevenue > 0 ? `${((summary.profit / summary.totalRevenue) * 100).toFixed(1)}% Profit Margin` : "Operating Balance"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-100/40 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Outstanding Receivables</span>
          <h3 className="text-3xl font-black text-amber-950 mt-3">₹{summary.outstandingDues.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-amber-600 font-semibold mt-1">Unbilled / Pending dues</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-44 bg-gray-100 animate-pulse rounded-3xl"></div>
          <div className="h-64 bg-gray-100 animate-pulse rounded-3xl"></div>
        </div>
      ) : (
        <>
          {activeTab === "pnl" && (
            /* ====================================================
               P&L OVERVIEW TAB
               ==================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 6-Month Trend Visualizer */}
              <div className="lg:col-span-8 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">6-Month Revenue vs Expenses Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Historical cash flow comparison across recent operational months.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>{item.name}</span>
                        <span className="font-mono text-gray-500">
                          Rev: ₹{item.Revenue.toLocaleString("en-IN")} | Exp: ₹{item.Expenses.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${Math.min(100, (item.Revenue / maxRevenue) * 100)}%` }} 
                          className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                          title={`Revenue: ₹${item.Revenue}`}
                        />
                        <div 
                          style={{ width: `${Math.min(100, (item.Expenses / maxRevenue) * 100)}%` }} 
                          className="bg-rose-400 h-full rounded-r-full transition-all duration-500 opacity-80"
                          title={`Expenses: ₹${item.Expenses}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center space-x-6 text-xs font-semibold text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" />
                    <span>Realized Revenue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-rose-400 rounded-full inline-block" />
                    <span>Total Expenses</span>
                  </div>
                </div>
              </div>

              {/* Key Ratios & Quick Summary */}
              <div className="lg:col-span-4 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Key Financial Ratios</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Clinical performance indicators.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
                    <span className="text-xs text-indigo-600 font-bold uppercase block">Appointment Completion Rate</span>
                    <span className="text-2xl font-black text-indigo-950 block mt-1">{apptStats.completion_rate}%</span>
                    <span className="text-[11px] text-indigo-500 font-medium block mt-0.5">{apptStats.completed} of {apptStats.total} appointments completed</span>
                  </div>

                  <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
                    <span className="text-xs text-emerald-600 font-bold uppercase block">Lab Order Fulfillment Rate</span>
                    <span className="text-2xl font-black text-emerald-950 block mt-1">
                      {labStats.total > 0 ? `${((labStats.completed / labStats.total) * 100).toFixed(1)}%` : "N/A"}
                    </span>
                    <span className="text-[11px] text-emerald-500 font-medium block mt-0.5">{labStats.completed} of {labStats.total} orders completed</span>
                  </div>

                  <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl">
                    <span className="text-xs text-amber-600 font-bold uppercase block">Patient Attendance</span>
                    <span className="text-2xl font-black text-amber-950 block mt-1">
                      {apptStats.total > 0 ? `${(((apptStats.total - apptStats.missed - apptStats.cancelled) / apptStats.total) * 100).toFixed(1)}%` : "100%"}
                    </span>
                    <span className="text-[11px] text-amber-500 font-medium block mt-0.5">{apptStats.cancelled} cancelled, {apptStats.missed} missed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clinical" && (
            /* ====================================================
               CLINICAL ANALYTICS TAB
               ==================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Doctor Performance */}
              <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Clinician Completed Case Volume</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Total vs completed appointments per doctor.</p>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4 text-center">Total Cases</th>
                        <th className="py-3 px-4 text-center">Completed</th>
                        <th className="py-3 px-4 text-right">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {docPerf.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-gray-400">No doctor data recorded.</td></tr>
                      ) : (
                        docPerf.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50/30">
                            <td className="py-3.5 px-4 font-semibold text-gray-900">{d.name}</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-600">{d.total}</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">{d.completed}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-600">{d.completion_rate}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Treatment Popularity */}
              <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Procedure & Treatment Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Most performed dental treatments in clinic history.</p>
                </div>

                <div className="space-y-4">
                  {treatmentBreakdown.map((t, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-800">
                        <span>{t.name}</span>
                        <span className="font-mono text-gray-500">{t.count} visits</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${(t.count / maxTreatmentCount) * 100}%` }}
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "costs" && (
            /* ====================================================
               COST CENTERS TAB
               ==================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Expense Category Breakdown */}
              <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Operational Expense Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Breakdown of clinic overheads by category.</p>
                </div>

                <div className="space-y-4">
                  {expenseBreakdown.length === 0 ? (
                    <p className="text-xs text-gray-400">No expense records found.</p>
                  ) : (
                    expenseBreakdown.map((exp, idx) => {
                      const pct = summary.totalExpenses > 0 ? ((exp.amount / summary.totalExpenses) * 100).toFixed(1) : 0;
                      return (
                        <div key={idx} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{exp.category}</span>
                            <span className="text-[11px] text-gray-400 block mt-0.5">{pct}% of total expenses</span>
                          </div>
                          <span className="text-base font-black text-rose-600 font-mono">₹{exp.amount.toLocaleString("en-IN")}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Lab Order Pipeline Status */}
              <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">External Lab Vendor Pipeline</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Status breakdown of all active prosthetic and pathology lab orders.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {labStats.statusBreakdown.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{item.status}</span>
                      <span className="text-xl font-black text-slate-800 block mt-1 font-mono">{item.count} orders</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "archive" && (
            /* ====================================================
               REPORT ARCHIVE TAB (EXPORTS)
               ==================================================== */
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Financial Document & Tax Ledger Archive</h3>
                <p className="text-xs text-gray-400 mt-0.5">Download real audit statement CSVs generated directly from live clinic database ledgers.</p>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-4">Document Title</th>
                      <th className="py-4 px-4">Report Type</th>
                      <th className="py-4 px-4">Period / Scope</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    <tr className="hover:bg-gray-50/30">
                      <td className="py-4 px-4 font-semibold text-gray-900">Clinic Profit & Loss Statement</td>
                      <td className="py-4 px-4 text-xs text-gray-500 font-medium">Income / P&L</td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-450">Current YTD</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDownloadCSV("Income_Statement_P&L", [
                            { Category: "Total Revenue", Amount: summary.totalRevenue },
                            { Category: "Total Expenses", Amount: summary.totalExpenses },
                            { Category: "Net Profit", Amount: summary.profit },
                            { Category: "Outstanding Dues", Amount: summary.outstandingDues }
                          ])}
                          className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
                        >
                          Export CSV
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50/30">
                      <td className="py-4 px-4 font-semibold text-gray-900">Operational Expenses Ledger Audit</td>
                      <td className="py-4 px-4 text-xs text-gray-500 font-medium">Cost Audit</td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-450">All Vouchers</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDownloadCSV("Operational_Expenses_Audit", expenseBreakdown.map(e => ({ Category: e.category, Amount: e.amount })))}
                          className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
                        >
                          Export CSV
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50/30">
                      <td className="py-4 px-4 font-semibold text-gray-900">Clinician Performance & Case Volume Report</td>
                      <td className="py-4 px-4 text-xs text-gray-500 font-medium">Performance Audit</td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-450">All Dentists</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDownloadCSV("Clinician_Performance_Report", docPerf.map(d => ({ Doctor: d.name, TotalCases: d.total, CompletedCases: d.completed, CompletionRate: `${d.completion_rate}%` })))}
                          className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
                        >
                          Export CSV
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50/30">
                      <td className="py-4 px-4 font-semibold text-gray-900">Lab Vendor Pipeline & Rework Audit</td>
                      <td className="py-4 px-4 text-xs text-gray-500 font-medium">Vendor Audit</td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-450">Active Orders</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDownloadCSV("Lab_Vendor_Pipeline_Report", labStats.statusBreakdown.map(l => ({ Status: l.status, OrderCount: l.count })))}
                          className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
                        >
                          Export CSV
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
