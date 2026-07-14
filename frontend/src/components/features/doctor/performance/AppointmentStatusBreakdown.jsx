"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = {
  "Completed": "#10b981", // Success green
  "Cancelled": "#ef4444", // Danger red
  "Waiting": "#f59e0b", // Warning yellow
  "Confirmed": "#3b82f6", // Blue
  "In Chair": "#8b5cf6", // Purple
};

export default function AppointmentStatusBreakdown({ data }) {
  if (!data) return null;

  // Add colors to data
  const chartData = data.map(item => ({
    ...item,
    color: COLORS[item.name] || "#9ca3af" // Default gray
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-xs">
          <p className="font-bold text-gray-900 mb-1">{data.name}</p>
          <p className="text-gray-600">Count: <span className="font-bold" style={{ color: data.color }}>{data.value}</span></p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center text-xs text-gray-600 font-medium">
            <span 
              className="w-2.5 h-2.5 rounded-full mr-1.5" 
              style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <PieChartIcon className="w-4.5 h-4.5 text-primary" /> Status Breakdown
          </h3>
        </div>
        
        {data.length > 0 ? (
          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 h-[220px]">
            <h4 className="text-sm font-bold text-gray-700">No Status Data</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              No appointments found in the selected period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
