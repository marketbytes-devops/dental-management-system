"use client";

import { useEffect, useState } from "react";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import { getDoctorPerformance } from "@/services/api";
import PerformanceKPIs from "@/components/features/doctor/performance/PerformanceKPIs";
import ProcedureYield from "@/components/features/doctor/performance/ProcedureYield";
import RecentReviews from "@/components/features/doctor/performance/RecentReviews";
import PatientVolumeTrend from "@/components/features/doctor/performance/PatientVolumeTrend";
import AppointmentStatusBreakdown from "@/components/features/doctor/performance/AppointmentStatusBreakdown";
import { Loader2 } from "lucide-react";

export default function DoctorPerformancePage() {
  const { currentDoctorName } = useDoctor();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!currentDoctorName) return;
    
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDoctorPerformance(currentDoctorName, period);
        if (isMounted) {
          setData(res);
        }
      } catch (error) {
        console.error("Failed to load doctor performance:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [currentDoctorName, period]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-gray-500">Aggregating performance analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Clinical Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics, clinical contributions, and patient satisfaction insights.</p>
        </div>
        <div>
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="this_month">This Month</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Analytics KPIs */}
      <PerformanceKPIs kpis={data.kpis} />

      {/* Advanced Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientVolumeTrend data={data.volumeTrend} />
        <AppointmentStatusBreakdown data={data.statusBreakdown} />
      </div>

      {/* Breakdown & Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProcedureYield yieldStats={data.procedureYield} period={data.kpis.period} />
        </div>
        <div>
          <RecentReviews reviews={data.recentReviews} />
        </div>
      </div>
    </div>
  );
}
