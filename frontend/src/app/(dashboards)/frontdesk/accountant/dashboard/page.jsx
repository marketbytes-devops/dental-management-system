"use client";
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AccountantDashboard() {
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalExpenses: 0, profit: 0, outstandingDues: 0 },
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd use a proper configured axios instance.
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('http://localhost:8000/billing/analytics/summary');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
        // Fallback dummy data if backend is unreachable
        setData({
          summary: { totalRevenue: 125000, totalExpenses: 45000, profit: 80000, outstandingDues: 15000 },
          chartData: [
            { name: 'Jan', Revenue: 4000, Expenses: 2400, Profit: 1600 },
            { name: 'Feb', Revenue: 3000, Expenses: 1398, Profit: 1602 },
            { name: 'Mar', Revenue: 2000, Expenses: 9800, Profit: -7800 },
            { name: 'Apr', Revenue: 2780, Expenses: 3908, Profit: -1128 },
            { name: 'May', Revenue: 1890, Expenses: 4800, Profit: -2910 },
            { name: 'Jun', Revenue: 2390, Expenses: 3800, Profit: -1410 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading financial data...</div>;
  }

  const { summary, chartData } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-500 mt-1">Real-time metrics for revenue, expenses, and profitability.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${summary.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${summary.totalExpenses.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Net Profit</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${summary.profit.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Outstanding Dues</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${summary.outstandingDues.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue vs Expenses (Last 6 Months)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Profit Trend</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Profit']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Profit" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
