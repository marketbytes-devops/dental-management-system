"use client";

import { useState } from "react";

export default function DoctorPerformancePage() {
  const [procedureStats, setProcedureStats] = useState([
    { name: "Root Canal Treatment", count: 48, percentage: 34, revenue: "₹1,68,000", color: "bg-primary" },
    { name: "Crowns & Bridges", count: 37, percentage: 26, revenue: "₹2,22,000", color: "bg-secondary" },
    { name: "Scaling & Polishing", count: 35, percentage: 24, revenue: "₹42,000", color: "bg-success" },
    { name: "Simple Extractions", count: 16, percentage: 11, revenue: "₹24,000", color: "bg-warning" },
    { name: "Surgical Extractions / Implants", count: 6, percentage: 5, revenue: "₹90,000", color: "bg-danger" }
  ]);

  const [reviews, setReviews] = useState([
    { id: 1, patient: "Rahul Kumar", rating: "⭐⭐⭐⭐⭐", date: "Today", comment: "Dr. Anoop Nair was extremely patient. Explanations on the Root Canal Treatment procedure were thorough and the treatment was virtually painless." },
    { id: 2, patient: "Karthika Menon", rating: "⭐⭐⭐⭐⭐", date: "Yesterday", comment: "Excellent service! The composite dental restoration matches my natural tooth color perfectly. Highly recommended clinical work." },
    { id: 3, patient: "Jibin Jose", rating: "⭐⭐⭐⭐⭐", date: "08 Jun 2026", comment: "Very professional dentist. The zirconia crown fitting was completed in just 15 minutes and fits very comfortably." },
    { id: 4, patient: "Sneha Joseph", rating: "⭐⭐⭐⭐", date: "05 Jun 2026", comment: "Prompt appointment and neat scaling. Bleeding from gums has completely stopped. Thank you!" }
  ]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Clinical Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Analytics, clinical contributions, and patient satisfaction insights.</p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patients treated */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patients Treated</p>
            <h3 className="text-2xl font-bold text-gray-900">142</h3>
            <p className="text-xs text-success font-semibold mt-2 flex items-center gap-1">
              <span>↑</span> 12% this month
            </p>
          </div>
          <span className="text-2xl bg-primary/10 p-2.5 rounded-xl text-primary shrink-0">👥</span>
        </div>

        {/* Card 2: Avg treatment time */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Chair Time</p>
            <h3 className="text-2xl font-bold text-gray-900">24 mins</h3>
            <p className="text-xs text-success font-semibold mt-2 flex items-center gap-1">
              <span>↓</span> -3 mins vs last month
            </p>
          </div>
          <span className="text-2xl bg-secondary/10 p-2.5 rounded-xl text-secondary shrink-0">⏳</span>
        </div>

        {/* Card 3: Revenue Contribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-success/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Practice Billing</p>
            <h3 className="text-2xl font-bold text-gray-900">₹5,46,000</h3>
            <p className="text-xs text-success font-semibold mt-2 flex items-center gap-1">
              <span>↑</span> 18% vs monthly target
            </p>
          </div>
          <span className="text-2xl bg-success/10 p-2.5 rounded-xl text-success shrink-0">💳</span>
        </div>

        {/* Card 4: Satisfaction */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/20 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Clinic Rating</p>
            <h3 className="text-2xl font-bold text-gray-900">4.92 / 5.0</h3>
            <p className="text-xs text-gray-550 font-semibold mt-2">
              Based on 86 patient reviews
            </p>
          </div>
          <span className="text-2xl bg-warning/10 p-2.5 rounded-xl text-warning shrink-0">⭐</span>
        </div>
      </div>

      {/* Procedure Breakdown and Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Procedure Breakdown */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-gray-900">Procedure Breakdown & Yield</h3>
              <span className="text-xs text-gray-400 font-semibold">This Month</span>
            </div>
            <div className="space-y-4">
              {procedureStats.map((stat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-750">{stat.name} ({stat.count} cases)</span>
                    <span className="text-gray-900 font-bold">{stat.revenue} • {stat.percentage}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-6 flex justify-between items-center text-xs text-gray-500 font-semibold">
            <span>Core Focus: Endodontics & Crowns (60%)</span>
            <span className="text-primary hover:underline cursor-pointer">Export full performance log</span>
          </div>
        </div>

        {/* Recent Patient Reviews */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Patient Reviews</h3>
            <span className="text-xs text-primary font-bold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{rev.patient}</span>
                    <span className="text-[9px] text-gray-400 font-bold">{rev.date}</span>
                  </div>
                  <span className="text-[10px]">{rev.rating}</span>
                </div>
                <p className="text-xs text-gray-650 leading-relaxed font-semibold">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
