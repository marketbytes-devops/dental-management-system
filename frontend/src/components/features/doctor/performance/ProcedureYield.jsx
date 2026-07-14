"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Activity } from "lucide-react";

const periodLabels = {
  "this_month": "This Month",
  "last_30_days": "Last 30 Days",
  "this_year": "This Year",
  "all": "All Time"
};

export default function ProcedureYield({ yieldStats, period }) {
  if (!yieldStats) return null;

  // Format data for recharts
  const chartData = yieldStats.map(stat => ({
    name: stat.name.substring(0, 15) + (stat.name.length > 15 ? "..." : ""),
    revenue: stat.revenue,
    cases: stat.count,
    fullName: stat.name
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-xs">
          <p className="font-bold text-gray-900 mb-1">{data.fullName}</p>
          <p className="text-gray-600">Revenue: <span className="font-bold text-success">₹{data.revenue.toLocaleString()}</span></p>
          <p className="text-gray-600">Cases Completed: <span className="font-bold">{data.cases}</span></p>
        </div>
      );
    }
    return null;
  };

  const periodLabel = periodLabels[period] || "All Time";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[400px]">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-gray-900">Procedure Breakdown & Yield</h3>
          <span className="text-xs text-gray-400 font-semibold">{periodLabel}</span>
        </div>
        
        {yieldStats.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                <Bar 
                  yAxisId="left"
                  dataKey="revenue" 
                  fill="#0ea5e9" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 h-[280px]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-3">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-bold text-gray-700">No Procedures Billed Yet</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              Complete treatments in the clinical workspace to see your procedure yield metrics.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5 mt-6 flex justify-between items-center text-xs text-gray-500 font-semibold">
        <span>Core Focus: {yieldStats.length > 0 ? (yieldStats[0]?.name || "N/A") : "N/A"}</span>
      </div>
    </div>
  );
}
