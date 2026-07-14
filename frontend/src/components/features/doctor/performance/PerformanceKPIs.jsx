"use client";

import { Users, Hourglass, CreditCard, Star } from "lucide-react";

export default function PerformanceKPIs({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {/* Card 1: Patients treated */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div>
          <p className="text-xs font-semibold text-gray-550 uppercase tracking-wider mb-1">Patients Treated</p>
          <h3 className="text-2xl font-bold text-gray-900">{kpis.patientsTreated}</h3>
          <p className="text-xs text-gray-450 font-semibold mt-2 flex items-center gap-1">
            Completed Appointments
          </p>
        </div>
        <span className="bg-primary/10 p-2.5 rounded-xl text-primary shrink-0 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </span>
      </div>

      {/* Card 2: Avg treatment time */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/20 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div>
          <p className="text-xs font-semibold text-gray-550 uppercase tracking-wider mb-1">Avg Chair Time</p>
          <h3 className="text-2xl font-bold text-gray-900">45m</h3>
          <p className="text-xs text-gray-450 font-semibold mt-2 flex items-center gap-1">
            Estimated Average
          </p>
        </div>
        <span className="bg-secondary/10 p-2.5 rounded-xl text-secondary shrink-0 flex items-center justify-center">
          <Hourglass className="w-6 h-6" />
        </span>
      </div>

      {/* Card 3: Revenue Contribution */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-success/20 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div>
          <p className="text-xs font-semibold text-gray-550 uppercase tracking-wider mb-1">Practice Billing</p>
          <h3 className="text-2xl font-bold text-gray-900">₹{kpis.revenueGenerated?.toLocaleString("en-IN") || 0}</h3>
          <p className="text-xs text-gray-450 font-semibold mt-2 flex items-center gap-1">
            Total Yield
          </p>
        </div>
        <span className="bg-success/10 p-2.5 rounded-xl text-success shrink-0 flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </span>
      </div>

      {/* Card 4: Satisfaction */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/20 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div>
          <p className="text-xs font-semibold text-gray-550 uppercase tracking-wider mb-1">Clinic Rating</p>
          <h3 className="text-2xl font-bold text-gray-900">{kpis.averageRating}</h3>
          <p className="text-xs text-gray-550 font-semibold mt-2">
            Based on {kpis.totalReviews} reviews
          </p>
        </div>
        <span className="bg-warning/10 p-2.5 rounded-xl text-warning shrink-0 flex items-center justify-center">
          <Star className="w-6 h-6" fill="currentColor" />
        </span>
      </div>
    </div>
  );
}
