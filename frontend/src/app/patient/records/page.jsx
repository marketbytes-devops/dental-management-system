"use client";

import { useState, useEffect } from "react";
import { 
  Heart, 
  FileSignature, 
  Check, 
  X, 
  Calendar, 
  Activity, 
  ChevronDown, 
  Coins, 
  Loader2, 
  AlertCircle,
  Paperclip,
  CheckCircle,
  Clock,
  ExternalLink,
  Map,
  FileDown
} from "lucide-react";
import PrescriptionCard from "@/components/ui/patients/records/prescriptionCard";
import ActivePrescriptions from "@/components/ui/patients/records/activePrescriptions";
import ReferralCard from "@/components/ui/patients/records/referralCard";
import ConsentFormViewer from "@/components/ui/patients/documents/consentFormViewer";
import { getPatientTreatmentPlan, getPendingConsents, getPatientPrescriptions, getPatientReferrals } from "@/services/api";


export default function PatientRecordsPage() {
  const [activeTab, setActiveTab] = useState("treatment-plans"); // treatment-plans | active-rx | all-rx | referrals

  // Treatment Plans State
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [activeConsentDoc, setActiveConsentDoc] = useState(null);

  // Prescriptions & Referrals State
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  const patientToken = typeof window !== "undefined" ? localStorage.getItem("patient_token") : null;

  const fetchPlans = async () => {
    if (!patientToken) {
      setPlansLoading(false);
      setPlansError("Patient token not found. Please log in.");
      return;
    }
    setPlansLoading(true);
    setPlansError("");
    try {
      const data = await getPatientTreatmentPlan(patientToken);
      setPlans(data);
    } catch (err) {
      console.error(err);
      setPlansError(err.message || "Connection error. Could not load treatment plans.");
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const data = await getPatientPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const fetchReferrals = async () => {
    setReferralsLoading(true);
    try {
      const data = await getPatientReferrals();
      setReferrals(data);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setReferralsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "treatment-plans") {
      fetchPlans();
    } else if (activeTab === "active-rx" || activeTab === "all-rx") {
      fetchPrescriptions();
    } else if (activeTab === "referrals") {
      fetchReferrals();
    }
  }, [activeTab, patientToken]);

  // Initiate signing workflow
  const triggerSignConsent = async (consentId) => {
    if (!consentId) return;
    try {
      // Fetch consent form details
      const pendingList = await getPendingConsents();
      const found = pendingList.find(c => c.id === consentId);
      if (found) {
        setActiveConsentDoc(found);
      } else {
        alert("Consent request is not in PENDING state or was already signed.");
      }
    } catch (err) {
      console.error("Error launching consent signer:", err);
    }
  };

  const handleSignComplete = (docId) => {
    setActiveConsentDoc(null);
    fetchPlans();
    alert("Consent form signed successfully!");
  };

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

  // Formats DB medications structure to PrescriptionCard expectation
  const formattedPrescriptions = prescriptions.flatMap((rxObj) => {
    const dateStr = rxObj.created_at 
      ? new Date(rxObj.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "Recent";
    
    // Deem active if created within the past 7 days
    const isRecent = rxObj.created_at 
      ? (new Date() - new Date(rxObj.created_at)) < (7 * 24 * 60 * 60 * 1000)
      : true;

    return (rxObj.medications || []).map((med, idx) => ({
      id: `${rxObj.id}-${idx}`,
      active: isRecent,
      drug: med.medicine,
      date: dateStr,
      dosage: `${med.schedule} - ${med.timing} for ${med.duration}`,
      doctor: rxObj.doctor_name
    }));
  });

  // Formats DB referrals structure to ReferralCard expectation
  const formattedReferrals = referrals.map((ref) => ({
    id: ref.id,
    date: ref.date,
    specialistName: ref.target_doctor || "Specialist",
    specialty: ref.speciality || "Specialty",
    clinicName: ref.external_facility || "Internal Department",
    reason: ref.reason,
    referredBy: ref.referred_by,
    status: ref.status,
    consultationNotes: ref.my_consultation_notes || "",
    medications: ref.my_medications || []
  }));

  const activePlan = plans.find(p => p.status === "Active");
  const pastPlans = plans.filter(p => p.status !== "Active");

  const renderTabContent = () => {
    switch (activeTab) {
      case "treatment-plans":
        if (plansLoading) {
          return (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm font-semibold text-gray-500">Retrieving treatment plans...</span>
            </div>
          );
        }

        if (plansError) {
          return (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{plansError}</span>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6 text-left">
            {/* Active Treatment Plan */}
            {activePlan ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-black text-gray-900">Current Treatment Plan</h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Plan
                  </span>
                </div>

                {/* Progress Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Treatment Progress</span>
                    <p className="text-sm font-mono font-bold text-slate-800 tracking-wider">
                      {getProgressBar(activePlan.steps)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Duration</span>
                    <p className="text-sm font-bold text-slate-700 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> {activePlan.estimated_duration || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Expected Completion</span>
                    <p className="text-sm font-bold text-slate-700 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" /> {activePlan.expected_completion || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Grid Diagnoses & Objectives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Diagnoses List */}
                  {activePlan.diagnoses && activePlan.diagnoses.length > 0 && (
                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Diagnosed Dental Conditions</h4>
                      <div className="space-y-1.5 text-xs text-gray-700 font-semibold">
                        {activePlan.diagnoses.map((diag, i) => (
                          <div key={i} className="bg-slate-50 p-2 rounded-xl border border-slate-100">• {diag}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objectives Checklist */}
                  {activePlan.treatment_objectives && activePlan.treatment_objectives.length > 0 && (
                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Map className="w-3.5 h-3.5 text-primary" /> Treatment Objectives (Goals)
                      </h4>
                      <div className="space-y-1.5 text-xs text-gray-700 font-bold">
                        {activePlan.treatment_objectives.map((goal, i) => (
                          <div key={i} className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-success" /> {goal}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visit linkage & Attachments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Linked Next Visit */}
                  {activePlan.next_visit_date && (
                    <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl space-y-2">
                      <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Next Linked Visit
                      </span>
                      <p className="text-xs font-bold text-gray-800">
                        📅 {new Date(activePlan.next_visit_date).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="text-[11px] font-bold bg-white text-sky-850 px-2.5 py-1 rounded-lg border border-sky-100 inline-block">
                        Planned Procedure: {activePlan.next_visit_procedure}
                      </span>
                    </div>
                  )}

                  {/* Attachments Library */}
                  {activePlan.attachments && activePlan.attachments.length > 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Paperclip className="w-4 h-4 text-gray-400" /> Clinic Attachments & Reports ({activePlan.attachments.length})
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {activePlan.attachments.map((file, i) => (
                          <a 
                            key={i}
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert("Viewing mock attachment..."); }}
                            className="p-2 bg-white rounded-lg border border-gray-150 text-[11px] font-bold text-gray-650 hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <span>📎 {file.name}</span>
                            <span className="text-[9px] uppercase bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-black">{file.type}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan Phases */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Plan Phases & Clinical Timeline</h4>
                  <div className="space-y-4">
                    {(() => {
                      const activePlanPhases = activePlan
                        ? Array.from(new Set(activePlan.steps.filter(s => s.status !== "Cancelled").map(s => s.phase)))
                        : [];
                      return activePlanPhases.map((phaseName) => {
                        const phaseSteps = activePlan.steps.filter(s => s.phase === phaseName && s.status !== "Cancelled");
                        if (phaseSteps.length === 0) return null;
                        return (
                          <div key={phaseName} className="space-y-2.5">
                          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{phaseName}</span>
                          </div>

                          <div className="space-y-2.5">
                            {phaseSteps.map((step) => (
                              <div key={step.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 border border-gray-150 p-4 rounded-2xl gap-4 hover:shadow-sm transition-all duration-300">
                                <div className="space-y-1 text-left">
                                  <div className="font-bold text-gray-800 text-sm">{step.title}</div>
                                  {step.details && <p className="text-xs text-gray-500">{step.details}</p>}
                                  {step.notes && (
                                    <p className="text-[11px] text-primary italic font-medium bg-white px-2 py-1 rounded border border-gray-100 mt-1.5">
                                      📝 Notes: {step.notes}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-100">
                                      Est. Cost: ₹{step.cost.toLocaleString()}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                      step.status === "Completed" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                      step.status === "In Progress" ? "bg-sky-50 border-sky-100 text-sky-700" :
                                      "bg-gray-50 border-gray-200 text-gray-505"
                                    }`}>
                                      Status: {step.status}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-stretch md:self-center justify-end">
                                  {step.requires_consent ? (
                                    step.consent_status === "Given" ? (
                                      <a
                                        href={`http://localhost:8000/patient/consents/${step.consent_id}/pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-emerald-100/50 transition-colors"
                                      >
                                        🟢 Signed <FileDown className="w-3.5 h-3.5" />
                                      </a>
                                    ) : (
                                      <button
                                        onClick={() => triggerSignConsent(step.consent_id)}
                                        className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-250 hover:bg-amber-100/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all animate-pulse cursor-pointer"
                                      >
                                        🟡 Awaiting Consent <FileSignature className="w-3.5 h-3.5" />
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">No special consent required</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-400 font-semibold shadow-sm">
                No active treatment plan found. Please consult your dental provider.
              </div>
            )}

            {/* Past Plans History */}
            {pastPlans.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-md font-bold text-gray-900 uppercase tracking-wider">Completed / Inactive Plans</h3>
                <div className="space-y-3">
                  {pastPlans.map((plan) => (
                    <details key={plan.id} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                      <summary className="p-4 font-bold text-gray-700 cursor-pointer list-none flex justify-between items-center select-none group-open:bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            plan.status === "Completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-150 text-gray-505"
                          }`}>
                            {plan.status}
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            Plan Formulated: {new Date(plan.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="p-5 border-t border-gray-100 space-y-4 text-xs">
                        <div>
                          <span className="font-bold text-gray-400 text-[10px] uppercase">Current Conditions:</span>
                          <p className="font-medium text-gray-650 mt-1 whitespace-pre-line leading-relaxed">{plan.current_conditions}</p>
                        </div>
                        <div className="space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                          <span className="font-bold text-gray-400 text-[10px] uppercase block mb-1">Procedures:</span>
                          {plan.steps.map((s) => (
                            <div key={s.id} className="flex justify-between items-center text-[11px] font-medium text-gray-650">
                              <span>• {s.title} {s.details && `(${s.details})`}</span>
                              <span className="font-bold text-gray-800">₹{s.cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "active-rx":
        if (prescriptionsLoading) {
          return (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm font-semibold text-gray-500">Loading active prescriptions...</span>
            </div>
          );
        }
        return <ActivePrescriptions prescriptions={formattedPrescriptions} />;

      case "all-rx":
        if (prescriptionsLoading) {
          return (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm font-semibold text-gray-500">Loading prescription history...</span>
            </div>
          );
        }
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Prescription History</h3>
            {formattedPrescriptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {formattedPrescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm py-8">
                No prescription history records found.
              </div>
            )}
          </div>
        );

      case "referrals":
        if (referralsLoading) {
          return (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm font-semibold text-gray-500">Loading referrals...</span>
            </div>
          );
        }
        return (
          <div className="space-y-6 text-left">
            <h3 className="text-lg font-bold text-gray-900">Referral Letters</h3>
            {formattedReferrals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formattedReferrals.map((ref) => (
                  <ReferralCard key={ref.id} referral={ref} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm">
                No active medical referral letters issued.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Medical Records</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-6">
        {[
          { id: "treatment-plans", label: "Treatment Plans" },
          { id: "active-rx", label: "Active Prescriptions" },
          { id: "all-rx", label: "Prescription History" },
          { id: "referrals", label: "Referral Letters" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">{renderTabContent()}</div>

      {/* Signing overlay */}
      {activeConsentDoc && (
        <ConsentFormViewer
          doc={activeConsentDoc}
          onClose={() => setActiveConsentDoc(null)}
          onSignComplete={handleSignComplete}
        />
      )}
    </div>
  );
}
