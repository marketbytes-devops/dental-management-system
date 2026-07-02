"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDoctor } from "@/app/doctor/layout";
import DashboardHeader from "@/components/ui/doctor/dashboard/DashboardHeader";
import KpiCards from "@/components/ui/doctor/dashboard/KpiCards";
import { Share2, ArrowRight } from "lucide-react";

export default function DoctorDashboardPage() {
  const {
    patients,
    activePatientToken,
    queue,
    labOrders,
    activePatient,
    hasUrgentInQueue,
    referrals = [],
    currentDoctorName
  } = useDoctor();

  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Check if any required profile details are missing
          const isIncomplete = !user.dob || !user.phone || !user.address || !user.licence_id || !user.chair_setup || !user.board;
          setIsProfileIncomplete(isIncomplete);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const isDoctorMe = (docName) => {
    if (!docName || !currentDoctorName) return false;
    const name1 = docName.toLowerCase().replace("dr.", "").trim();
    const name2 = currentDoctorName.toLowerCase().replace("dr.", "").trim();
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    return words1.some(w => words2.includes(w)) || name1.includes(name2) || name2.includes(name1);
  };

  // Metrics
  const totalWaiting = queue.filter(q => q.status === "Waiting").length;
  const totalAlerts = Object.values(patients).filter(p => p.medicalAlerts.length > 0).length;
  const activeLabCount = labOrders.filter(l => l.status !== "Delivered").length;

  const incomingPending = referrals.filter(
    (r) => r.targetDoctor && isDoctorMe(r.targetDoctor) && r.status === "Pending"
  );
  const outgoingAll = referrals.filter(
    (r) => r.referredBy && isDoctorMe(r.referredBy)
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <DashboardHeader />

      {/* Profile Incomplete Notification Banner */}
      {isProfileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <span>
              <strong>Profile Incomplete:</strong> Please update your profile details (Date of Birth, Phone, Address) and professional credentials (License ID, Chair Setup, Board) to complete your clinic account setup.
            </span>
          </div>
          <Link 
            href="/doctor/profile"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 text-center hover:scale-102"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards
        activePatientName={activePatient?.name}
        activePatientToken={activePatientToken}
        totalWaiting={totalWaiting}
        totalAlerts={totalAlerts}
        activeLabCount={activeLabCount}
        hasUrgentInQueue={hasUrgentInQueue}
      />

      {/* Referrals Tracker Widget */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs p-6 space-y-4 text-left">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Share2 className="w-4.5 h-4.5 text-primary" /> Incoming Referrals ({incomingPending.length})
            </h3>
          </div>
          <Link
            href="/doctor/referrals"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all"
          >
            Manage Referrals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {incomingPending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incomingPending.map((ref) => {
                const pt = Object.values(patients).find(p => p.token === ref.patientToken);
                return (
                  <div key={ref.id} className="p-4 bg-gray-50 border border-gray-100 hover:border-primary/20 rounded-2xl flex justify-between items-start gap-4 transition-all">
                    <div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                        {ref.patientToken}
                      </span>
                      <h5 className="text-sm font-bold text-gray-900 mt-1.5">{pt?.name || "Loading Patient..."}</h5>
                      <p className="text-xs text-gray-650 mt-1">Referred by: <strong className="text-gray-800">{ref.referredBy}</strong></p>
                      <p className="text-[11px] text-gray-500 italic mt-1.5">"{ref.reason}"</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded uppercase shrink-0">
                      {ref.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-150 rounded-2xl text-xs text-gray-450 font-semibold bg-gray-50/20">
              No pending inbound consultations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
