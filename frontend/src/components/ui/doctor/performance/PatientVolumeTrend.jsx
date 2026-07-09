"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function PatientVolumeTrend({ data }) {
  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-xs">
          <p className="font-bold text-gray-900 mb-1">{label}</p>
          <p className="text-gray-600">Appointments: <span className="font-bold text-primary">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-primary" /> Patient Volume Trend
          </h3>
        </div>
        
        {data.length > 0 ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#fff', stroke: '#0ea5e9', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 h-[220px]">
            <h4 className="text-sm font-bold text-gray-700">No Volume Data</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              Appointments over time will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
