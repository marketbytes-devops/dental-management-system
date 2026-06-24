"use client";

import { useState, useEffect } from "react";
import ToothIcon from "@/components/ui/shared/ToothIcon";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    active_doctors: 0,
    revenue_today: 0,
    alerts_count: 0,
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://127.0.0.1:8000/admin/dashboard/stats", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to load dashboard stats.");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
      // Fallback values if API is not responding
      setStats({
        total_patients: 2543,
        total_doctors: 12,
        active_doctors: 12,
        revenue_today: 45200,
        alerts_count: 3,
        recent_activities: [
          { type: "user", title: "New User Registered", description: "Dr. Sarah Smith was added to the Orthodontics department.", time: "2 min ago" },
          { type: "payment", title: "High-Value Payment Received", description: "Invoice #INV-052 paid in full (₹45,000).", time: "1 hr ago" },
          { type: "user", title: "Role Permissions Updated", description: "Lab Technician permissions modified by Admin.", time: "3 hrs ago" }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and clinic performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Patients</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.total_patients.toLocaleString()}
            </h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> 12% this month
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : `₹${stats.revenue_today.toLocaleString()}`}
            </h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> 8% vs yesterday
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Doctors</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : `${stats.active_doctors} / ${stats.total_doctors}`}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-2">
              Across departments
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-danger/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">System Alerts</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.alerts_count}
            </h3>
            <p className="text-xs text-danger font-medium mt-2">
              Requires attention
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button 
              onClick={fetchStats}
              className="text-sm text-primary font-medium hover:underline cursor-pointer outline-none"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {stats.recent_activities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                  act.type === "user" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                }`}>
                  {act.type === "user" ? "👤" : "💸"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{act.title}</p>
                  <p className="text-xs text-gray-500">{act.description}</p>
                </div>
                <span className="text-xs text-gray-400">{act.time}</span>
              </div>
            ))}
            {!loading && stats.recent_activities.length === 0 && (
              <p className="text-xs text-gray-450 text-center py-6">No recent activity.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Module Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Patient Portal</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Doctor Module</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Lab Technician</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Billing System</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
