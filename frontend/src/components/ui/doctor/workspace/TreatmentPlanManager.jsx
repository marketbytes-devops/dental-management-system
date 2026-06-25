"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  Loader2, 
  ExternalLink, 
  Calendar, 
  Clock,
  CheckCircle2,
  FileSignature
} from "lucide-react";

export default function TreatmentPlanManager({ patientToken }) {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem("staff_jwt_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const fetchPlans = async () => {
    if (!patientToken) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/treatment-plan/patient/${encodeURIComponent(patientToken)}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      console.error("Error loading plans on summary card:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [patientToken]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-xs font-semibold text-gray-500">Syncing Treatment Plan Summary...</span>
      </div>
    );
  }

  const activePlan = plans.find(p => p.status === "Active");

  // Helper to compute progress bar
  const getProgressBar = (steps) => {
    if (!steps || steps.length === 0) return "□□□□□□□□□□ 0%";
    const completed = steps.filter(s => s.status === "Completed").length;
    const progress = Math.round((completed / steps.length) * 100);
    const filledCount = Math.round(progress / 10);
    const emptyCount = 10 - filledCount;
    const bar = "■".repeat(filledCount) + "□".repeat(emptyCount);
    return `${bar} ${progress}%`;
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4 text-left">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Patient Treatment Plan
          </h4>
        </div>
        {activePlan ? (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
            Active
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
            No Active Plan
          </span>
        )}
      </div>

      {activePlan ? (
        <div className="space-y-3.5 text-xs text-gray-600">
          {/* Progress Tracker */}
          <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Overall Progress</span>
              <span className="font-mono font-bold text-gray-800 text-[11px] mt-0.5 block">
                {getProgressBar(activePlan.steps)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Duration</span>
              <span className="font-bold text-gray-700">{activePlan.estimated_duration || "N/A"}</span>
            </div>
          </div>

          {/* Next Visit Linkage */}
          {activePlan.next_visit_date && (
            <div className="p-2.5 bg-sky-50/50 border border-sky-100 rounded-xl space-y-1">
              <span className="text-[10px] font-black text-sky-800 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Next Linked Visit
              </span>
              <div className="text-xs font-semibold text-gray-700 flex justify-between">
                <span>📅 {new Date(activePlan.next_visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="font-bold text-sky-800">{activePlan.next_visit_procedure}</span>
              </div>
            </div>
          )}

          {/* Active Consent Checklist */}
          {activePlan.steps.some(s => s.requires_consent) && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Informed Consent Tracker</span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {activePlan.steps.filter(s => s.requires_consent).map((step) => (
                  <div key={step.id} className="flex justify-between items-center text-[10px] bg-gray-50 p-1.5 rounded border border-gray-100 font-medium">
                    <span className="truncate w-3/4">{step.title}</span>
                    {step.consent_status === "Given" ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                        🟢 Signed
                      </span>
                    ) : step.consent_status === "Pending" ? (
                      <span className="font-bold text-amber-700 flex items-center gap-0.5">
                        🟡 Awaiting
                      </span>
                    ) : (
                      <span className="font-bold text-rose-700 flex items-center gap-0.5">
                        🔴 Rejected
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic py-2">
          No current treatment plan has been formulated for this patient. Click below to draft a customized clinical plan.
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => router.push(`/doctor/treatment-plan/${encodeURIComponent(patientToken)}`)}
        className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-black text-gray-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        {activePlan ? "Open Detailed Treatment Plan" : "Draft New Treatment Plan"}
      </button>
    </div>
  );
}
