"use client";

import PerformanceKPIs from "@/components/ui/doctor/performance/PerformanceKPIs";
import ProcedureYield from "@/components/ui/doctor/performance/ProcedureYield";
import RecentReviews from "@/components/ui/doctor/performance/RecentReviews";

export default function DoctorPerformancePage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Clinical Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Analytics, clinical contributions, and patient satisfaction insights.</p>
      </div>

      {/* Analytics KPIs */}
      <PerformanceKPIs />

      {/* Breakdown & Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProcedureYield />
        </div>
        <div>
          <RecentReviews />
        </div>
      </div>
    </div>
  );
}
