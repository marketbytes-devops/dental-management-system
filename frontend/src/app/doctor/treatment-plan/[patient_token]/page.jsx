"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  FileText, 
  Loader2, 
  Calendar, 
  Activity, 
  Paperclip,
  CheckCircle,
  HelpCircle,
  FileDown,
  Archive,
  BookOpen,
  Map,
  Clock
} from "lucide-react";
import { useDoctor } from "@/app/doctor/layout";
import ToothChart from "@/components/ui/doctor/workspace/ToothChart";
import SmileCareChart from "@/components/ui/doctor/workspace/smilecare/SmileCareChart";
import { 
  getPatientByToken,
  getPatientTreatmentPlan, 
  updateTreatmentPlan, 
  createTreatmentPlan, 
  createTreatmentPlanStep, 
  updateTreatmentPlanStep,
  downloadConsentPdf
} from "@/services/api";

const SPECIALTY_CONFIGS = {
  "Endodontics": {
    diagnoses: [
      "Irreversible Pulpitis",
      "Reversible Pulpitis",
      "Pulpal Necrosis",
      "Acute Apical Periodontitis",
      "Chronic Apical Periodontitis",
      "Dental Caries (Deep)"
    ],
    goals: [
      "Resolve throbbing pain",
      "Obturate root canals",
      "Disinfect root canal system",
      "Save natural tooth structure",
      "Prepare tooth for permanent crown"
    ],
    phases: [
      "Phase 1: Diagnostic & Anesthesia",
      "Phase 2: Access & Pulpectomy",
      "Phase 3: Canal Instrumentation",
      "Phase 4: Obturation & Sealing",
      "Phase 5: Core Buildup",
      "Phase 6: Post-op Recall"
    ]
  },
  "Orthodontics": {
    diagnoses: [
      "Class I Malocclusion",
      "Class II Division 1 Malocclusion",
      "Class II Division 2 Malocclusion",
      "Class III Malocclusion",
      "Severe upper crowding",
      "Severe lower crowding",
      "Deep bite",
      "Open bite",
      "Anterior crossbite"
    ],
    goals: [
      "Align upper arch",
      "Align lower arch",
      "Correct deep bite / open bite",
      "Close extraction spaces",
      "Improve facial profile",
      "Establish stable occlusion"
    ],
    phases: [
      "Phase 1: Initial Records & Spacers",
      "Phase 2: Bracket Bonding",
      "Phase 3: Alignment & Leveling",
      "Phase 4: Space Closure / Bite Correction",
      "Phase 5: Finishing & Detailing",
      "Phase 6: Debonding & Retention"
    ]
  },
  "Oral Surgery": {
    diagnoses: [
      "Impacted mandibular third molar",
      "Impacted maxillary third molar",
      "Grade III tooth mobility",
      "Non-restorable dental caries",
      "Radicular cyst",
      "Periapical abscess"
    ],
    goals: [
      "Surgical extraction of tooth",
      "Atraumatic simple extraction",
      "Enucleation of cyst",
      "Manage acute infection",
      "Ridge preservation grafting"
    ],
    phases: [
      "Phase 1: Local Anesthesia & Sedation",
      "Phase 2: Surgical Incision & Bone Access",
      "Phase 3: Tooth Sectioning & Extraction",
      "Phase 4: Curettage & Irrigation",
      "Phase 5: Suturing & Hemostasis",
      "Phase 6: Post-op Follow-up"
    ]
  },
  "Periodontics": {
    diagnoses: [
      "Gingivitis",
      "Chronic Periodontitis",
      "Aggressive Periodontitis",
      "Localized bone loss",
      "Gingival recession",
      "Localized plaque accumulation"
    ],
    goals: [
      "Reduce pocket depths",
      "Arrest alveolar bone loss",
      "Eliminate subgingival calculus",
      "Improve gingival attachment",
      "Instruct patient in home care"
    ],
    phases: [
      "Phase 1: Scaling & Root Planing (SRP)",
      "Phase 2: Re-evaluation (4-6 weeks)",
      "Phase 3: Periodontal Flap Surgery",
      "Phase 4: Bone / Tissue Grafting",
      "Phase 5: Periodontal Maintenance",
      "Phase 6: Long-term Recall"
    ]
  },
  "Prosthodontics": {
    diagnoses: [
      "Edentulous arch",
      "Partially edentulous arch",
      "Fractured clinical crown",
      "Severely worn dentition",
      "Failed existing restoration"
    ],
    goals: [
      "Fabricate crown / bridge",
      "Fabricate complete denture",
      "Fabricate partial denture",
      "Restore vertical dimension",
      "Provide implant-supported prosthesis"
    ],
    phases: [
      "Phase 1: Tooth Preparation & Temps",
      "Phase 2: Final Impressions",
      "Phase 3: Bite Registration",
      "Phase 4: Framework Try-in",
      "Phase 5: Prosthesis Delivery / Cementation",
      "Phase 6: Occlusal Adjustments"
    ]
  },
  "General Dentistry": {
    diagnoses: [
      "Class I Malocclusion",
      "Gingivitis",
      "Chronic Periodontitis",
      "Dental Caries",
      "Deep bite",
      "Missing first molar"
    ],
    goals: [
      "Align teeth",
      "Improve oral hygiene",
      "Resolve inflammation",
      "Restore missing tooth"
    ],
    phases: [
      "Phase 1: Initial records",
      "Phase 2: Scaling",
      "Phase 3: Extractions",
      "Phase 4: Bonding",
      "Phase 5: Monthly Adjustments",
      "Phase 6: Retention"
    ]
  }
};

export default function DoctorTreatmentPlanPage() {
  const params = useParams();
  const router = useRouter();
  const patientToken = params.patient_token;
  const { enrichPatientTimeline, viewingPatient, handleToggleToothState } = useDoctor() || {};

  const [doctorSpecialty, setDoctorSpecialty] = useState("General Dentistry");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const spec = user.specialties && user.specialties.length > 0 ? user.specialties[0] : "General Dentistry";
          setDoctorSpecialty(spec);
        } catch (e) {}
      }
    }
  }, []);

  const specConfig = SPECIALTY_CONFIGS[doctorSpecialty] || SPECIALTY_CONFIGS["General Dentistry"];
  const PHASES = specConfig.phases;
  const PRESET_DIAGNOSES = specConfig.diagnoses;
  const PRESET_GOALS = specConfig.goals;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  
  // Plan Editor Fields
  const [conditions, setConditions] = useState("");
  const [diagnoses, setDiagnoses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [duration, setDuration] = useState("12 months");
  const [completion, setCompletion] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [nextVisitProc, setNextVisitProc] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [steps, setSteps] = useState([]);

  // Auto calculate future date for expected completion
  const calculateFutureDate = (val) => {
    if (!val) return "";
    const match = val.match(/(\d+)\s*(month|week|day|year)s?/i);
    if (!match) return "";
    
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    const date = new Date();
    if (unit.startsWith("month")) {
      date.setMonth(date.getMonth() + num);
    } else if (unit.startsWith("year")) {
      date.setFullYear(date.getFullYear() + num);
    } else if (unit.startsWith("week")) {
      date.setDate(date.getDate() + num * 7);
    } else if (unit.startsWith("day")) {
      date.setDate(date.getDate() + num);
    }
    
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const handleDurationChange = (val) => {
    setDuration(val);
    const computed = calculateFutureDate(val);
    if (computed) {
      setCompletion(computed);
    }
  };

  const handleViewConsentPdf = async (consentId) => {
    try {
      const blobData = await downloadConsentPdf(consentId);
      const blob = new Blob([blobData], { type: "application/pdf" });
      const viewUrl = window.URL.createObjectURL(blob);
      window.open(viewUrl, "_blank");
    } catch (err) {
      console.error("Failed to load signed PDF:", err);
      alert("Failed to load signed PDF form. Please try again.");
    }
  };

  // Form Builders
  const [diagInput, setDiagInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [attachInputName, setAttachInputName] = useState("");
  const [attachInputType, setAttachInputType] = useState("X-Ray");

  // Step Addition Field
  const [newStep, setNewStep] = useState({
    title: "",
    details: "",
    notes: "",
    cost: 0,
    requires_consent: false,
    phase: PHASES[0],
    sequence: 1
  });

  useEffect(() => {
    if (PHASES && PHASES.length > 0) {
      setNewStep(prev => ({ ...prev, phase: PHASES[0] }));
    }
  }, [doctorSpecialty]);

  const loadData = async () => {
    if (!patientToken) return;
    setLoading(true);
    try {
      // 1. Fetch patient
      const patData = await getPatientByToken(patientToken);
      setPatient(patData);

      // 2. Fetch plans
      const planData = await getPatientTreatmentPlan(patientToken);
      setPlans(planData);
      
      // Find Draft or Active plan
      const draftOrActive = planData.find(p => p.status === "Active") || planData.find(p => p.status === "Draft");
      if (draftOrActive) {
        setActivePlan(draftOrActive);
        setConditions(draftOrActive.current_conditions || "");
        setDiagnoses(draftOrActive.diagnoses || []);
        setGoals(draftOrActive.treatment_objectives || []);
        setDuration(draftOrActive.estimated_duration || "12 months");
        setCompletion(draftOrActive.expected_completion || "");
        setNextVisitDate(draftOrActive.next_visit_date || "");
        setNextVisitProc(draftOrActive.next_visit_procedure || "");
        setAttachments(draftOrActive.attachments || []);
        setSteps(draftOrActive.steps || []);
      } else {
        setActivePlan(null);
        setConditions("");
        setDiagnoses([]);
        setGoals([]);
        setDuration("12 months");
        setCompletion("");
        setNextVisitDate("");
        setNextVisitProc("");
        setAttachments([]);
        setSteps([]);
      }
    } catch (err) {
      console.error("Error loading patient treatment details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientToken]);

  // Saves Draft or Updates current plan details
  const handleSavePlan = async (statusType = "Draft") => {
    const payload = {
      patient_token: patientToken,
      current_conditions: conditions || "No current conditions specified.",
      diagnoses,
      treatment_objectives: goals,
      estimated_duration: duration,
      expected_completion: completion,
      next_visit_date: nextVisitDate,
      next_visit_procedure: nextVisitProc,
      attachments,
      status: statusType
    };

    try {
      if (activePlan) {
        // Update existing plan
        await updateTreatmentPlan(activePlan.id, payload);
      } else {
        // Create new plan
        await createTreatmentPlan({
          ...payload,
          steps: steps.map((s, idx) => ({ ...s, sequence: idx + 1 }))
        });
      }

      alert(`Plan successfully saved as ${statusType}!`);
      loadData();
      
      if (enrichPatientTimeline) {
        enrichPatientTimeline(patientToken);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to save treatment plan.");
    }
  };

  // Add Step dynamically
  const handleAddStep = async () => {
    if (!newStep.title.trim()) return;

    if (activePlan) {
      // Append step to active plan in DB
      try {
        await createTreatmentPlanStep(activePlan.id, newStep);
        setNewStep({
          title: "",
          details: "",
          notes: "",
          cost: 0,
          requires_consent: false,
          phase: PHASES[0],
          sequence: steps.length + 1
        });
        loadData();
        
        if (enrichPatientTimeline) {
          enrichPatientTimeline(patientToken);
        }
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || "Failed to append step.");
      }
    } else {
      // Local addition for a new draft plan
      setSteps([...steps, {
        ...newStep,
        id: Date.now(), // temporary local ID
        consent_status: newStep.requires_consent ? "Pending" : "Not Required",
        status: "Planned"
      }]);
      setNewStep({
        title: "",
        details: "",
        notes: "",
        cost: 0,
        requires_consent: false,
        phase: PHASES[0],
        sequence: steps.length + 2
      });
    }
  };

  // Remove Step (Local / DB)
  const handleRemoveStep = async (stepId) => {
    if (activePlan) {
      try {
        await updateTreatmentPlanStep(stepId, { status: "Cancelled" });
        loadData();
        
        if (enrichPatientTimeline) {
          enrichPatientTimeline(patientToken);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setSteps(steps.filter(s => s.id !== stepId));
    }
  };

  // Update step status in table
  const handleStepStatusChange = async (stepId, statusVal) => {
    try {
      await updateTreatmentPlanStep(stepId, { status: statusVal });
      loadData();
      
      if (enrichPatientTimeline) {
        enrichPatientTimeline(patientToken);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStepNotesChange = async (stepId, notesVal) => {
    try {
      await updateTreatmentPlanStep(stepId, { notes: notesVal });
      loadData();
      
      if (enrichPatientTimeline) {
        enrichPatientTimeline(patientToken);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Utility list helpers
  const toggleDiagnosis = (diag) => {
    if (diagnoses.includes(diag)) {
      setDiagnoses(diagnoses.filter(d => d !== diag));
    } else {
      setDiagnoses([...diagnoses, diag]);
    }
  };

  const toggleGoal = (goal) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const addAttachment = () => {
    if (!attachInputName.trim()) return;
    const newAttach = {
      name: attachInputName.trim(),
      type: attachInputType,
      url: `/static/mock_files/${Date.now()}.jpg`
    };
    setAttachments([...attachments, newAttach]);
    setAttachInputName("");
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading Detailed Clinical Plan...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-left">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-150">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/doctor/workspace")}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Treatment Plan Workspace</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Formulate dental procedures, track objectives, next visits, and patient signatures.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activePlan && activePlan.status === "Active" ? (
            <>
              <button
                onClick={() => handleSavePlan("Archived")}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Archive className="w-4 h-4" /> Archive Plan
              </button>
              <button
                onClick={() => handleSavePlan("Active")}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-primary/10"
              >
                <Check className="w-4 h-4" /> Update Plan
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSavePlan("Draft")}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSavePlan("Active")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-50"
              >
                <CheckCircle className="w-4 h-4" /> Finalize & Activate Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Patient Banner */}
      {patient && (
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Patient Name</span>
            <p className="text-sm font-bold text-gray-800 mt-1">{patient.name}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Patient ID / Token</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">{patient.token}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Gender / Age</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">
              {patient.gender} / {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} yrs` : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Phone Contact</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">{patient.phone}</p>
          </div>
        </div>
      )}

      {/* SmileCare 3D Dental Charting Panel */}
      <SmileCareChart 
        patientToken={patientToken} 
        mode="endo" 
      />

      {/* Main Forms Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: DIAGNOSIS & OBJECTIVES */}
        <div className="space-y-6">
          {/* Current Conditions */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-gray-850 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" /> Current Condition Findings
            </h3>
            <textarea
              rows={3}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Document summary dental findings..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Diagnoses List */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-850 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" /> Dental Diagnoses
            </h3>
            
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DIAGNOSES.map((diag) => (
                <button
                  key={diag}
                  type="button"
                  onClick={() => toggleDiagnosis(diag)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    diagnoses.includes(diag)
                      ? "bg-primary border-primary text-white"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {diag}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom diagnosis"
                value={diagInput}
                onChange={(e) => setDiagInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => {
                  if (diagInput.trim() && !diagnoses.includes(diagInput.trim())) {
                    setDiagnoses([...diagnoses, diagInput.trim()]);
                    setDiagInput("");
                  }
                }}
                className="px-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Selected Diagnoses */}
            {diagnoses.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Selected List ({diagnoses.length})</span>
                <div className="space-y-1">
                  {diagnoses.map((diag, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">
                      <span>• {diag}</span>
                      <button 
                        onClick={() => setDiagnoses(diagnoses.filter(d => d !== diag))}
                        className="text-rose-500 hover:bg-rose-50 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Treatment Objectives / Goals */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-850 uppercase tracking-wider flex items-center gap-1.5">
              <Map className="w-4 h-4 text-primary" /> Treatment Objectives (Goals)
            </h3>
            
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    goals.includes(goal)
                      ? "bg-primary border-primary text-white"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom objective"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => {
                  if (goalInput.trim() && !goals.includes(goalInput.trim())) {
                    setGoals([...goals, goalInput.trim()]);
                    setGoalInput("");
                  }
                }}
                className="px-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Selected Goals */}
            {goals.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Goals Checklist ({goals.length})</span>
                <div className="space-y-1">
                  {goals.map((goal, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5 text-success" /> {goal}
                      </span>
                      <button 
                        onClick={() => setGoals(goals.filter(g => g !== goal))}
                        className="text-rose-500 hover:bg-rose-50 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN/MAIN CONTENT: DURATION, EXPECTED COMPLETION, VISITS, ATTACHMENTS, PHASES TABLE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Plan Meta / Scheduling Details */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-850 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Plan Timeline & Scheduling Linkage
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">Estimated Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 18 months"
                  value={duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600 block mb-1">Expected Completion</label>
                <input
                  type="text"
                  placeholder="e.g. March 2028"
                  value={completion}
                  onChange={(e) => setCompletion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600 block mb-1">Next Visit Date</label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600 block mb-1">Next Visit Planned Procedure</label>
                <input
                  type="text"
                  placeholder="e.g. Archwire Replacement"
                  value={nextVisitProc}
                  onChange={(e) => setNextVisitProc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>



          {/* Procedures and Phases Table */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-850 uppercase tracking-wider">
              Treatment Phases & Steps Timeline
            </h3>

            {/* Loop through each phase */}
            <div className="space-y-4">
              {PHASES.map((phaseName) => {
                const phaseSteps = steps.filter(s => s.phase === phaseName && s.status !== "Cancelled");
                return (
                  <div key={phaseName} className="space-y-2">
                    <div className="bg-slate-100/70 p-2 rounded-lg border border-slate-150">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{phaseName}</span>
                      {phaseSteps.length === 0 && (
                        <span className="text-[10px] text-gray-400 italic ml-2">(No steps planned)</span>
                      )}
                    </div>

                    {phaseSteps.length > 0 && (
                      <div className="overflow-x-auto border border-gray-100 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500">
                              <th className="p-2.5">Seq</th>
                              <th className="p-2.5">Procedure</th>
                              <th className="p-2.5">Notes</th>
                              <th className="p-2.5">Consent</th>
                              <th className="p-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {phaseSteps.map((step) => (
                              <tr key={step.id || step.sequence} className="hover:bg-gray-50/20">
                                <td className="p-2.5 font-bold text-gray-400">{step.sequence}</td>
                                <td className="p-2.5">
                                  <div className="font-bold text-gray-800">{step.title}</div>
                                  {step.details && <div className="text-[10px] text-gray-400 mt-0.5">{step.details}</div>}
                                </td>
                                <td className="p-2.5">
                                  <textarea
                                    rows={1}
                                    defaultValue={step.notes || ""}
                                    onBlur={(e) => handleStepNotesChange(step.id, e.target.value)}
                                    placeholder="Add clinical observation..."
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none"
                                  />
                                </td>
                                <td className="p-2.5">
                                  {step.requires_consent ? (
                                    step.consent_status === "Given" ? (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 w-max">
                                          🟢 Signed
                                        </span>
                                        {step.consent_id && (
                                          <button
                                            type="button"
                                            onClick={() => handleViewConsentPdf(step.consent_id)}
                                            className="text-[10px] font-black text-primary hover:underline flex items-center gap-0.5 w-max bg-transparent border-none cursor-pointer outline-none p-0"
                                          >
                                            📄 View Form
                                          </button>
                                        )}
                                      </div>
                                    ) : step.consent_status === "Pending" ? (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1 w-max animate-pulse">
                                        🟡 Awaiting
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1 w-max">
                                        🔴 Rejected
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[10px] text-gray-400">None</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right">
                                  <select
                                    value={step.status}
                                    onChange={(e) => handleStepStatusChange(step.id, e.target.value)}
                                    className="px-1 py-0.5 text-[10px] font-bold border rounded-md"
                                  >
                                    <option value="Planned">Planned</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Deferred">Deferred</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Step Builder Card */}
            <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3 pt-4">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">Add Step / Procedure</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Procedure Title (e.g. Lower Archwire)"
                  value={newStep.title}
                  onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Details"
                  value={newStep.details}
                  onChange={(e) => setNewStep({ ...newStep, details: e.target.value })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                />
                <select
                  value={newStep.phase}
                  onChange={(e) => setNewStep({ ...newStep, phase: e.target.value })}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 focus:outline-none"
                >
                  {PHASES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-650 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newStep.requires_consent}
                    onChange={(e) => setNewStep({ ...newStep, requires_consent: e.target.checked })}
                  />
                  Requires Patient Consent
                </label>
                <button
                  type="button"
                  onClick={handleAddStep}
                  disabled={!newStep.title.trim()}
                  className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-colors cursor-pointer text-xs"
                >
                  Append Phase Step
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
