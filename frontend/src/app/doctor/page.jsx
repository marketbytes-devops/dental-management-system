"use client";

import { useState, useEffect } from "react";

export default function DoctorDashboardPage() {
  // Master Patient Database (simulated state)
  const [patients, setPatients] = useState({
    "#003": {
      token: "#003",
      name: "Sneha Joseph",
      age: 27,
      gender: "Female",
      phone: "+91 91234 56789",
      procedure: "Scaling & Extraction",
      chiefComplaint: "Mobility in upper molar, general calculus accumulation.",
      medicalAlerts: ["Bleeding disorder (Mild)"],
      teethChart: { 18: "restored" },
      timeline: [
        { date: "09-06-2026", note: "Diagnostic scaling completed. Cavity check on upper jaw.", type: "Procedure" },
        { date: "09-06-2026", note: "Prescribed Chlorhexidine mouthwash and Vitamin K supplements.", type: "Prescription", details: "Mouthwash - Morning/Night - 7 Days" }
      ]
    },
    "#004": {
      token: "#004",
      name: "Rahul Kumar",
      age: 32,
      gender: "Male",
      phone: "+91 98765 43210",
      procedure: "Root Canal Treatment",
      chiefComplaint: "Severe throbbing pain in the upper right back tooth (#16), sensitive to hot & cold.",
      medicalAlerts: ["Hypertension (BP 140/90)", "Clindamycin Sensitivity"],
      teethChart: { 16: "active-treatment", 24: "restored" },
      timeline: [
        { date: "08-06-2026", note: "Diagnostic digital X-ray completed. Deep dentinal caries reaching pulp on #16.", type: "Diagnostic" },
        { date: "08-06-2026", note: "Prescribed Ibuprofen 400mg for pain control.", type: "Prescription", details: "Ibuprofen 400mg - Morning/Night - 3 Days" },
        { date: "09-06-2026", note: "RCT Stage 1 initiated. Pulpectomy completed on #16. Cavity canal disinfected, temporary sealing done.", type: "Procedure" }
      ]
    },
    "#005": {
      token: "#005",
      name: "Rohan Varma",
      age: 28,
      gender: "Male",
      phone: "+91 88776 65544",
      procedure: "Dental Filling",
      chiefComplaint: "Food lodgement and mild sensitivity in lower left molar (#36).",
      medicalAlerts: [],
      teethChart: { 36: "active-treatment" },
      timeline: [
        { date: "09-06-2026", note: "Clinical exam shows Class I caries on #36 occlusal surface. Vitality test positive.", type: "Diagnostic" }
      ]
    },
    "#006": {
      token: "#006",
      name: "Priya Nair",
      age: 34,
      gender: "Female",
      phone: "+91 77665 54433",
      procedure: "Scaling & Polishing",
      chiefComplaint: "Bleeding gums during brushing, yellowish deposits.",
      medicalAlerts: ["Pregnant (2nd Trimester)"],
      teethChart: {},
      timeline: [
        { date: "10-06-2026", note: "Calculus deposits noted in lower anteriors. Recommended complete scaling.", type: "Diagnostic" }
      ]
    },
    "#007": {
      token: "#007",
      name: "Deepak Kurian",
      age: 45,
      gender: "Male",
      phone: "+91 66554 43322",
      procedure: "Crown Fitting",
      chiefComplaint: "Need permanent crown on tooth #46 following root canal therapy.",
      medicalAlerts: ["Penicillin Allergy"],
      teethChart: { 46: "active-treatment" },
      timeline: [
        { date: "01-06-2026", note: "RCT completed. Canal obturation satisfactory.", type: "Procedure" },
        { date: "05-06-2026", note: "Tooth preparation done on #46. Elastomeric impression taken and sent to Elite Lab.", type: "Lab Order" }
      ]
    },
    "#008": {
      token: "#008",
      name: "Meera Pillai",
      age: 62,
      gender: "Female",
      phone: "+91 55443 32211",
      procedure: "Tooth Extraction",
      chiefComplaint: "Pain and mobility in lower right third molar (#48).",
      medicalAlerts: ["Diabetic (Controlled)", "Taking Aspirin 75mg daily"],
      teethChart: { 48: "active-treatment" },
      timeline: [
        { date: "09-06-2026", note: "OPG confirms Grade III mobility and bone loss around root of #48. Extraction advised.", type: "Diagnostic" }
      ]
    }
  });

  // State Management for Flow
  const [viewMode, setViewMode] = useState("dashboard"); // 'dashboard' | 'clinical-sheet'
  const [activeTab, setActiveTab] = useState("live-queue"); // 'live-queue' | 'medical-alerts' | 'pending-lab' (inside dashboard)
  
  const [activePatientToken, setActivePatientToken] = useState("#004"); // currently in the chair
  const [viewingPatientToken, setViewingPatientToken] = useState("#004"); // patient loaded in the clinical sheet view
  const [completedPatientHistory, setCompletedPatientHistory] = useState(["#003"]); // history of treated tokens this session
  
  // Medical Alerts State Variables
  const [newAlertText, setNewAlertText] = useState("");
  const [emergencyAlert, setEmergencyAlert] = useState(null); // holds patient object when emergency popup triggers
  const [hasTriggeredAutoEmergency, setHasTriggeredAutoEmergency] = useState(false);

  // Automatic background trigger: fires 10 seconds after opening the clinical sheet for the first time
  useEffect(() => {
    if (viewMode === "clinical-sheet" && !hasTriggeredAutoEmergency) {
      const timer = setTimeout(() => {
        setHasTriggeredAutoEmergency(true);
        
        setPatients(prevPatients => {
          const lastTokenNum = parseInt(Object.keys(prevPatients).sort().pop().replace("#", "") || "8");
          const newToken = `#${String(lastTokenNum + 1).padStart(3, "0")}`;
          
          if (prevPatients[newToken]) return prevPatients;

          const newPatient = {
            token: newToken,
            name: "Commander Vikram",
            age: 45,
            gender: "Male",
            phone: "+91 99999 88888",
            procedure: "Acute Abscess Drainage",
            chiefComplaint: "Acute severe swelling and unbearable pain in lower jaw, feverish.",
            medicalAlerts: ["Cardiac Pacemaker", "Penicillin Allergy"],
            teethChart: { 46: "active-treatment" },
            timeline: [{ date: "10-06-2026", note: "Emergency check-in. High pain score.", type: "Check-In" }]
          };

          // Update queue and set emergency alert
          setQueue(prevQueue => {
            if (prevQueue.some(q => q.token === newToken)) return prevQueue;
            return [...prevQueue, { token: newToken, time: "03:45 PM", status: "Waiting", priority: "Urgent" }];
          });

          setEmergencyAlert(newPatient);
          showNotification("🚨 URGENT: Emergency patient Vikram checked in at desk!");

          return { ...prevPatients, [newToken]: newPatient };
        });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [viewMode, hasTriggeredAutoEmergency]);

  // Live Queue List
  const [queue, setQueue] = useState([
    { token: "#005", time: "11:30 AM", status: "Waiting", priority: "Routine" },
    { token: "#006", time: "11:55 AM", status: "Waiting", priority: "Routine" },
    { token: "#007", time: "12:10 PM", status: "Waiting", priority: "Routine" },
    { token: "#008", time: "12:30 PM", status: "Waiting", priority: "Routine" }
  ]);

  // Lab Orders
  const [labOrders, setLabOrders] = useState([
    { id: "LAB-701", patientToken: "#007", item: "Zirconia Crown #46", status: "In Production", labName: "Apex Dental Lab", eta: "Tomorrow" },
    { id: "LAB-698", patientToken: "#004", item: "E-Max Overlay #16", status: "Ready / Shipped", labName: "Elite Milling Center", eta: "Today" },
    { id: "LAB-692", patientToken: "#003", item: "Custom Partial Denture", status: "Delivered", labName: "SmileAlign Labs", eta: "Completed" }
  ]);

  // Toast notifications
  const [notification, setNotification] = useState("");

  // Prescription Form Draft State
  const [rxMedicine, setRxMedicine] = useState("Amoxicillin 500mg");
  const [rxMorning, setRxMorning] = useState(true);
  const [rxNoon, setRxNoon] = useState(false);
  const [rxNight, setRxNight] = useState(true);
  const [rxTiming, setRxTiming] = useState("After Food");
  const [rxDurationVal, setRxDurationVal] = useState("5");
  const [rxDurationUnit, setRxDurationUnit] = useState("Days");
  const [rxDraft, setRxDraft] = useState([]); // List of medicines in draft

  // Clinical Diagnosis note draft
  const [diagNoteInput, setDiagNoteInput] = useState("");

  // Lab Order Form Draft
  const [labOrderItem, setLabOrderItem] = useState("Zirconia Crown");
  const [labOrderTooth, setLabOrderTooth] = useState("16");
  const [labOrderShade, setLabOrderShade] = useState("A2");
  const [labOrderName, setLabOrderName] = useState("Apex Dental Lab");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const activePatient = patients[activePatientToken] || null;
  const viewingPatient = patients[viewingPatientToken] || null;

  // State calculations
  const totalWaiting = queue.filter(q => q.status === "Waiting").length;
  const totalAlerts = Object.values(patients).filter(p => p.medicalAlerts.length > 0).length;
  const activeLabCount = labOrders.filter(l => l.status !== "Delivered").length;

  // Master Detail Toggles
  const handleOpenClinicalSheet = (token) => {
    setViewingPatientToken(token);
    setViewMode("clinical-sheet");
  };

  const handleGoBackToDashboard = () => {
    setViewMode("dashboard");
  };

  // Call Next Patient from Queue
  const handleCallNextPatient = () => {
    if (queue.length === 0) {
      showNotification("No patients remaining in the waiting queue.");
      return;
    }

    // Complete current patient and add to completed history stack
    if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
      setCompletedPatientHistory([...completedPatientHistory, activePatientToken]);
    }

    const nextItem = queue[0];
    const updatedQueue = queue.slice(1);
    setQueue(updatedQueue);

    // Call Patient & load clinical sheet
    setActivePatientToken(nextItem.token);
    setViewingPatientToken(nextItem.token);
    setViewMode("clinical-sheet");
    setRxDraft([]);
    setDiagNoteInput("");

    showNotification(`Token ${nextItem.token} called to chair. Clinical sheet loaded.`);
  };

  // Call patient from table
  const handleCallPatient = (token) => {
    const p = patients[token];
    if (!p) return;

    // Remove calling patient from queue
    setQueue(queue.filter(item => item.token !== token));

    if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
      setCompletedPatientHistory([...completedPatientHistory, activePatientToken]);
    }

    setActivePatientToken(token);
    setViewingPatientToken(token);
    setViewMode("clinical-sheet");
    setRxDraft([]);
    setDiagNoteInput("");
    showNotification(`Patient ${p.name} (${token}) is now in the chair.`);
  };

  // View Previous Completed Patient from History
  const handleViewPreviousPatient = () => {
    if (completedPatientHistory.length === 0) {
      showNotification("No previous patient records available in this session.");
      return;
    }

    // Get the last completed patient from stack
    const prevToken = completedPatientHistory[completedPatientHistory.length - 1];
    setViewingPatientToken(prevToken);
    setViewMode("clinical-sheet");
    showNotification(`Viewing previous completed patient: ${patients[prevToken].name}`);
  };

  // Simulate an Emergency Check-in with a 5-second delay
  const simulateEmergencyCheckin = () => {
    setHasTriggeredAutoEmergency(true);
    showNotification("🚨 Simulating emergency check-in... Popup warning will trigger in 5 seconds!");
    
    setTimeout(() => {
      // Generate new token
      const lastTokenNum = parseInt(Object.keys(patients).sort().pop().replace("#", "") || "8");
      const newToken = `#${String(lastTokenNum + 1).padStart(3, "0")}`;

      const newPatient = {
        token: newToken,
        name: "Commander Vikram",
        age: 45,
        gender: "Male",
        phone: "+91 99999 88888",
        procedure: "Acute Abscess Drainage",
        chiefComplaint: "Acute severe swelling and unbearable pain in lower jaw, feverish.",
        medicalAlerts: ["Cardiac Pacemaker", "Penicillin Allergy"],
        teethChart: { 46: "active-treatment" },
        timeline: [{ date: "10-06-2026", note: "Emergency check-in. High pain score.", type: "Check-In" }]
      };

      // Add emergency patient to global records
      setPatients(prev => ({ ...prev, [newToken]: newPatient }));
      // Push to waiting queue with Urgent priority
      setQueue(prev => [...prev, { token: newToken, time: "03:45 PM", status: "Waiting", priority: "Urgent" }]);
      
      // Open the interrupting modal alert popup
      setEmergencyAlert(newPatient);
      showNotification("🚨 URGENT: Emergency patient Vikram checked in at desk!");
    }, 5000);
  };

  const handleSkipPatient = (token) => {
    setQueue(queue.map(q => q.token === token ? { ...q, status: "Skipped" } : q));
    showNotification(`Token ${token} marked as skipped.`);
  };

  const handleRequeuePatient = (token) => {
    setQueue(queue.map(q => q.token === token ? { ...q, status: "Waiting" } : q));
    showNotification(`Token ${token} returned to waiting status.`);
  };

  const handleRemovePatient = (token) => {
    setQueue(queue.filter(q => q.token !== token));
    showNotification(`Token ${token} removed from queue.`);
  };

  // Add Medicine to Draft
  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!rxMedicine) return;

    const timings = [];
    if (rxMorning) timings.push("Morning 🌅");
    if (rxNoon) timings.push("Noon ☀️");
    if (rxNight) timings.push("Night 🌙");

    if (timings.length === 0) {
      showNotification("Please select at least one dosing time (Morning/Noon/Night).");
      return;
    }

    const newItem = {
      id: Math.random(),
      medicine: rxMedicine,
      schedule: timings.join(" + "),
      timing: rxTiming,
      duration: `${rxDurationVal} ${rxDurationUnit}`
    };

    setRxDraft([...rxDraft, newItem]);
    showNotification(`${rxMedicine} added to draft.`);
  };

  const handleRemoveDraftMed = (id) => {
    setRxDraft(rxDraft.filter(m => m.id !== id));
  };

  // Submit Diagnosis Note
  const handleSubmitDiagNote = (e) => {
    e.preventDefault();
    if (!diagNoteInput.trim() || !viewingPatient) return;

    const newTimelineEvent = {
      date: "10-06-2026 (Today)",
      note: diagNoteInput,
      type: "Clinical Note"
    };

    setPatients({
      ...patients,
      [viewingPatientToken]: {
        ...viewingPatient,
        timeline: [newTimelineEvent, ...viewingPatient.timeline]
      }
    });

    setDiagNoteInput("");
    showNotification("Clinical diagnosis note updated.");
  };

  // Submit Prescription
  const handleSavePrescription = () => {
    if (rxDraft.length === 0) {
      showNotification("No medicines added to the prescription.");
      return;
    }

    const rxText = rxDraft.map(m => `${m.medicine} (${m.schedule} - ${m.timing} for ${m.duration})`).join(" | ");

    const newTimelineEvent = {
      date: "10-06-2026 (Today)",
      note: `Rx Prescription issued: ${rxText}`,
      type: "Prescription",
      details: rxDraft
    };

    setPatients({
      ...patients,
      [viewingPatientToken]: {
        ...viewingPatient,
        timeline: [newTimelineEvent, ...viewingPatient.timeline]
      }
    });

    setRxDraft([]);
    showNotification(`Prescription printed & saved for ${viewingPatient.name}.`);
  };

  // Submit Lab Order
  const handleAddLabOrderSubmit = (e) => {
    e.preventDefault();
    if (!viewingPatient) return;

    const newOrder = {
      id: `LAB-${Math.floor(700 + Math.random() * 200)}`,
      patientToken: viewingPatientToken,
      item: `${labOrderItem} (Tooth #${labOrderTooth}, Shade ${labOrderShade})`,
      status: "In Production",
      labName: labOrderName,
      eta: "3 Days"
    };

    setLabOrders([newOrder, ...labOrders]);

    // Add to timeline
    const newTimelineEvent = {
      date: "10-06-2026 (Today)",
      note: `Ordered ${newOrder.item} from ${labOrderName}`,
      type: "Lab Order"
    };

    setPatients({
      ...patients,
      [viewingPatientToken]: {
        ...viewingPatient,
        timeline: [newTimelineEvent, ...viewingPatient.timeline],
        teethChart: { ...viewingPatient.teethChart, [labOrderTooth]: "lab-ordered" }
      }
    });

    showNotification(`Lab order submitted to ${labOrderName}.`);
  };

  // Mark Lab Order Delivered
  const handleMarkLabDelivered = (id) => {
    setLabOrders(labOrders.map(order => {
      if (order.id === id) {
        return { ...order, status: "Delivered", eta: "Completed" };
      }
      return order;
    }));
    showNotification(`Lab Case ${id} marked as Delivered.`);
  };

  // Interactive tooth chart select
  const toggleToothState = (tooth) => {
    if (!viewingPatient) return;
    const currentStatus = viewingPatient.teethChart[tooth];
    let newStatus = "";

    if (!currentStatus) newStatus = "active-treatment";
    else if (currentStatus === "active-treatment") newStatus = "restored";
    else newStatus = "";

    setPatients({
      ...patients,
      [viewingPatientToken]: {
        ...viewingPatient,
        teethChart: {
          ...viewingPatient.teethChart,
          [tooth]: newStatus
        }
      }
    });

    showNotification(`Tooth #${tooth} status updated to ${newStatus || "Healthy"}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
          <span className="text-primary">🦷</span>
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Critical Medical Emergency popup modal (triggered mid-consultation by background events or simulated triggers) */}
      {emergencyAlert && (
        <div className="fixed inset-0 bg-red-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-4 border-danger/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-danger text-white px-6 py-4 flex items-center gap-3">
              <span className="text-3xl animate-pulse">🚨</span>
              <div>
                <h3 className="font-extrabold text-lg uppercase tracking-wider">CRITICAL MEDICAL EMERGENCY</h3>
                <p className="text-[10px] text-red-150 font-bold">New patient checked in with URGENT priority</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Emergency Patient</span>
                <span className="text-sm font-extrabold text-gray-900 block">{emergencyAlert.name}</span>
                <span className="text-xs text-gray-500 font-semibold">{emergencyAlert.gender}, {emergencyAlert.age} yrs • Token {emergencyAlert.token}</span>
              </div>
              <div className="space-y-1.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-semibold">
                <span className="font-black block text-[10px] uppercase text-danger mb-1">Emergency Condition / Alerts</span>
                <p className="font-bold text-gray-800">Procedure: {emergencyAlert.procedure}</p>
                {emergencyAlert.medicalAlerts && emergencyAlert.medicalAlerts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {emergencyAlert.medicalAlerts.map((a, i) => (
                      <span key={i} className="bg-danger/10 px-2 py-0.5 rounded text-[9px] font-black uppercase">{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">An emergency check-in occurred at the front desk. Do you want to pause your current clinical workspace and call this patient to the chair immediately?</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEmergencyAlert(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer outline-none"
              >
                Acknowledge & Continue
              </button>
              <button
                onClick={() => {
                  // Pause current patient, call this emergency patient immediately
                  if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
                    setCompletedPatientHistory([...completedPatientHistory, activePatientToken]);
                  }
                  setActivePatientToken(emergencyAlert.token);
                  setViewingPatientToken(emergencyAlert.token);
                  // Remove this patient from the waiting queue since they are now in the chair
                  setQueue(queue.filter(q => q.token !== emergencyAlert.token));
                  setEmergencyAlert(null);
                  setViewMode("clinical-sheet");
                  setRxDraft([]);
                  setDiagNoteInput("");
                  showNotification(`Emergency patient ${emergencyAlert.name} called to chair.`);
                }}
                className="px-4 py-2 bg-danger text-white text-xs font-extrabold rounded-xl hover:bg-danger/95 transition-all shadow-md shadow-danger/20 cursor-pointer outline-none"
              >
                Consult Him First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Render Header and core cards only when in dashboard mode */}
      {viewMode === "dashboard" && (
        <>
          {/* Welcome Banner */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex justify-between items-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dr. Anoop Nair's Workdesk</h1>
              <p className="text-xs text-gray-500 font-semibold mt-1">Dentist & Endodontic Specialist • SmileCare Clinic</p>
            </div>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse self-center"></span>
              <span className="text-xs font-bold text-success uppercase tracking-wider bg-success/10 px-2.5 py-1 rounded">Live Clinic Sessions</span>
            </div>
          </div>

          {/* 4 Core KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Patient */}
            <button
              onClick={() => handleOpenClinicalSheet(activePatientToken)}
              className="text-left w-full rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-primary/30 bg-white transition-all relative overflow-hidden group cursor-pointer outline-none"
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 bg-primary/5"></div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Chair Patient</p>
              <h3 className="text-xl font-black mt-1.5 truncate text-gray-900">
                {activePatient ? activePatient.name : "Chair Empty"}
              </h3>
              <p className="text-xs mt-3 font-semibold text-primary flex items-center gap-1.5">
                {activePatient ? `${activePatient.token} • Load Clinical Sheet` : "Click to view chair"} <span>→</span>
              </p>
            </button>

            {/* Card 2: Live Queue */}
            <button
              onClick={() => { setViewMode("dashboard"); setActiveTab("live-queue"); }}
              className={`text-left w-full rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden group cursor-pointer outline-none ${
                activeTab === "live-queue"
                  ? "bg-secondary text-white border-secondary shadow-secondary/20"
                  : "bg-white border-gray-100 hover:border-secondary/30"
              }`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 ${activeTab === "live-queue" ? "bg-white/10" : "bg-secondary/5"}`}></div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "live-queue" ? "text-white/80" : "text-gray-400"}`}>Waiting Room Queue</p>
              <h3 className={`text-2xl font-black mt-1.5 ${activeTab === "live-queue" ? "text-white" : "text-gray-900"}`}>
                {totalWaiting} Patients
              </h3>
              <p className={`text-xs mt-3 font-semibold ${activeTab === "live-queue" ? "text-white/95" : "text-secondary"}`}>
                Est. Wait Time: {totalWaiting * 15} mins
              </p>
            </button>

            {/* Card 3: Medical Alerts */}
            <button
              onClick={() => { setViewMode("dashboard"); setActiveTab("medical-alerts"); }}
              className={`text-left w-full rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden group cursor-pointer outline-none ${
                activeTab === "medical-alerts"
                  ? "bg-danger text-white border-danger shadow-danger/20"
                  : "bg-white border-gray-100 hover:border-danger/30"
              }`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 ${activeTab === "medical-alerts" ? "bg-white/10" : "bg-danger/5"}`}></div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "medical-alerts" ? "text-white/80" : "text-gray-400"}`}>Medical Alert Cases</p>
              <h3 className={`text-2xl font-black mt-1.5 ${activeTab === "medical-alerts" ? "text-white" : "text-gray-900"}`}>
                {totalAlerts} Active
              </h3>
              <p className={`text-xs mt-3 font-semibold ${activeTab === "medical-alerts" ? "text-white/95" : "text-danger"}`}>
                Safety alert warnings
              </p>
            </button>

            {/* Card 4: Pending Lab Tests */}
            <button
              onClick={() => { setViewMode("dashboard"); setActiveTab("pending-lab"); }}
              className={`text-left w-full rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden group cursor-pointer outline-none ${
                activeTab === "pending-lab"
                  ? "bg-warning text-white border-warning shadow-warning/20"
                  : "bg-white border-gray-100 hover:border-warning/30"
              }`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 ${activeTab === "pending-lab" ? "bg-white/10" : "bg-warning/5"}`}></div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "pending-lab" ? "text-white/80" : "text-gray-400"}`}>Pending Dental Labs</p>
              <h3 className={`text-2xl font-black mt-1.5 ${activeTab === "pending-lab" ? "text-white" : "text-gray-900"}`}>
                {activeLabCount} Orders
              </h3>
              <p className={`text-xs mt-3 font-semibold ${activeTab === "pending-lab" ? "text-white/95" : "text-warning"}`}>
                Crowns, Bridges, Veneers
              </p>
            </button>
          </div>

          {/* Core Panel Content (Tabs except Clinical Sheet which is full page now) */}
          <div className="transition-all duration-300">
            {/* Workspace 2: Live Queue Room (Full width read-only clinic list) */}
            {activeTab === "live-queue" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit animate-fade-in">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Active Checked-In Patients</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Call patients into dental chair or load history</p>
                  </div>
                  <button
                    onClick={simulateEmergencyCheckin}
                    className="px-3.5 py-2 bg-danger/10 hover:bg-danger/15 text-danger border border-danger/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
                  >
                    🚨 Simulate Emergency
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Token</th>
                        <th className="px-6 py-4">Patient details</th>
                        <th className="px-6 py-4">Check-In Time</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {queue.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-xs text-gray-400 font-semibold">
                            Queue is empty. Waiting room is clear.
                          </td>
                        </tr>
                      ) : (
                        queue.map((item) => {
                          const pt = patients[item.token];
                          if (!pt) return null;
                          const isWaiting = item.status === "Waiting";
                          const isUrgent = item.priority === "Urgent";
                          return (
                            <tr key={item.token} className={`hover:bg-gray-50/50 transition-colors ${isUrgent ? "bg-red-50/[0.02]" : ""}`}>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded">
                                  {item.token}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    {pt.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="text-sm font-bold text-gray-955 block">{pt.name}</span>
                                    <span className="text-[10px] text-gray-400 font-semibold">{pt.gender}, {pt.age} yrs • {pt.procedure}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-500">{item.time}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                  isUrgent ? "bg-danger/10 text-danger border-danger/20" : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                  isWaiting ? "bg-primary/5 text-primary border-primary/20" : "bg-danger/5 text-danger border-danger/20"
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  {isWaiting ? (
                                    <>
                                      <button
                                        onClick={() => handleCallPatient(item.token)}
                                        className="px-3 py-1.5 bg-success/15 hover:bg-success/20 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Call to Chair
                                      </button>
                                      <button
                                        onClick={() => handleSkipPatient(item.token)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-250 text-gray-650 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Skip
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleRequeuePatient(item.token)}
                                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      Recall
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemovePatient(item.token)}
                                    className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg cursor-pointer"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Workspace 3: Medical Alerts Center */}
            {activeTab === "medical-alerts" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-base font-bold text-gray-900">Today's Medical Alert Flag Tracker</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Critical warnings regarding systemic illnesses or drug allergies</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {Object.values(patients).map((p) => {
                      const hasAlerts = p.medicalAlerts.length > 0;
                      return (
                        <div key={p.token} className={`p-5 flex justify-between items-start gap-4 transition-colors ${hasAlerts ? "bg-red-55/[0.01]" : ""}`}>
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                              hasAlerts ? "bg-danger/10 text-danger" : "bg-gray-100 text-gray-400"
                            }`}>
                              {hasAlerts ? "⚠️" : "🏥"}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-955 flex items-center gap-2">
                                {p.name}
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">{p.token}</span>
                              </h4>
                              <p className="text-xs text-gray-500 font-semibold mt-0.5">{p.gender}, {p.age} yrs • {p.procedure}</p>
                              {hasAlerts ? (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                  {p.medicalAlerts.map((alert, idx) => (
                                    <span key={idx} className="bg-red-50 text-danger border border-danger/10 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                                      {alert}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded mt-2.5 inline-block">No Contraindications Found</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenClinicalSheet(p.token)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Focus Profile
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <span>⚠️</span> Add Alert to Patient
                  </h3>
                  {activePatient ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newAlertText.trim()) return;
                        setPatients({
                          ...patients,
                          [activePatientToken]: {
                            ...activePatient,
                            medicalAlerts: [...activePatient.medicalAlerts, newAlertText.trim()]
                          }
                        });
                        setNewAlertText("");
                        showNotification(`Medical alert added to ${activePatient.name}`);
                      }}
                      className="space-y-4"
                    >
                      <div className="p-3 bg-danger/5 rounded-xl border border-danger/10 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-gray-500 font-medium">Target Patient</p>
                          <p className="text-xs font-bold text-gray-900">{activePatient.name}</p>
                        </div>
                        <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded uppercase">{activePatient.token}</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medical Condition / Allergy</label>
                        <input
                          type="text"
                          value={newAlertText}
                          onChange={(e) => setNewAlertText(e.target.value)}
                          placeholder="e.g. Asthma, Penicillin Allergy..."
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs focus:outline-none"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-danger text-white font-bold rounded-xl text-xs hover:bg-danger/95 transition-colors shadow-sm cursor-pointer"
                      >
                        Flag Alert Warning
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-gray-400 italic text-center py-6">No patient is currently active in the dental chair.</p>
                  )}
                </div>
              </div>
            )}

            {/* Workspace 4: Pending Lab Cases */}
            {activeTab === "pending-lab" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Milling & Restorative Lab Trackings</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Status of custom crown, bridge, and aligner fabrications</p>
                  </div>
                  <span className="text-xs font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-full">
                    {activeLabCount} Active Orders
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Patient</th>
                        <th className="px-6 py-4">Fabrication Item</th>
                        <th className="px-6 py-4">Lab Partner</th>
                        <th className="px-6 py-4">ETA Status</th>
                        <th className="px-6 py-4">Order Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {labOrders.map((order) => {
                        const pt = patients[order.patientToken];
                        return (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-gray-900">{order.id}</td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-gray-955 block">{pt ? pt.name : "Walk-in Patient"}</span>
                              <span className="text-[10px] text-gray-400 font-medium">Token: {order.patientToken}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-gray-700">🦷 {order.item}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-gray-505">{order.labName}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600">{order.eta}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                order.status === "Delivered"
                                  ? "bg-success/15 text-success border-success/20"
                                  : order.status === "Ready / Shipped"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-warning/10 text-warning border-warning/20"
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {order.status !== "Delivered" ? (
                                <button
                                  onClick={() => handleMarkLabDelivered(order.id)}
                                  className="px-2.5 py-1.5 bg-success/10 hover:bg-success/15 text-success text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Receive Order
                                </button>
                              ) : (
                                <span className="text-xs text-success font-semibold flex items-center justify-end gap-1">
                                  <span>✓</span> Received
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* View Mode 2: Full-Page Clinical Workspace / Sheet */}
      {viewMode === "clinical-sheet" && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          {/* Header Bar */}
          <div className="bg-primary/5 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBackToDashboard}
                className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
              >
                <span>←</span> Go Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  Clinical Sheet: {viewingPatient?.name}
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded font-bold">
                    Token {viewingPatient?.token}
                  </span>
                </h2>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                  Age: {viewingPatient?.age} • Gender: {viewingPatient?.gender} • Phone: {viewingPatient?.phone}
                </p>
              </div>
            </div>

            {/* Workspace Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={simulateEmergencyCheckin}
                className="px-3.5 py-2 bg-danger/10 hover:bg-danger/15 text-danger border border-danger/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
              >
                🚨 Simulate Emergency (5s Delay)
              </button>
              {completedPatientHistory.length > 0 && (
                <button
                  onClick={handleViewPreviousPatient}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-605 border border-gray-205 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
                >
                  <span>📂</span> View Previous Patient
                </button>
              )}
              <button
                onClick={handleCallNextPatient}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-primary/10 cursor-pointer outline-none"
              >
                <span>📢</span> Call Next Patient
              </button>
            </div>
          </div>

          {/* Viewing historical warning banner */}
          {viewingPatientToken !== activePatientToken && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex justify-between items-center">
              <p className="text-xs text-amber-800 font-bold flex items-center gap-2">
                <span>⚠️</span> Historical Review Mode: You are viewing a completed patient record. Click return to go back to active chair patient.
              </p>
              <button
                onClick={() => setViewingPatientToken(activePatientToken)}
                className="text-xs font-black text-amber-900 underline hover:no-underline cursor-pointer"
              >
                Return to Active Patient ({patients[activePatientToken]?.name})
              </button>
            </div>
          )}

          {/* Persistent Warning Alerts Banner if any */}
          {viewingPatient?.medicalAlerts && viewingPatient.medicalAlerts.length > 0 && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-3">
              <span className="text-lg mt-0.5">⚠️</span>
              <div>
                <span className="text-xs font-black text-danger uppercase tracking-wider block">Critical Safety Alerts</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewingPatient.medicalAlerts.map((alert, idx) => (
                    <span key={idx} className="bg-red-100 text-danger text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-danger/10">
                      {alert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sheet Work Area split */}
          {viewingPatient ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-150">
              
              {/* Left Column (2/3 width) - Charts & prescriptions */}
              <div className="lg:col-span-2 p-6 space-y-6">
                
                {/* Chief complaint overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chief Complaint</span>
                    <p className="text-xs font-semibold text-gray-700 mt-1 leading-normal">{viewingPatient.chiefComplaint}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Planned Procedure</span>
                    <p className="text-xs font-extrabold text-primary mt-1 flex items-center gap-1.5">🦷 {viewingPatient.procedure}</p>
                  </div>
                </div>

                {/* Tooth Chart */}
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/20">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <span>🦷</span> Tooth Chart Mapping
                  </h4>
                  <div className="flex flex-col items-center gap-4 bg-white p-6 border border-gray-100 rounded-xl">
                    {/* Upper row */}
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(tooth => {
                        const state = viewingPatient.teethChart[tooth];
                        return (
                          <button
                            key={tooth}
                            onClick={() => toggleToothState(tooth)}
                            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all cursor-pointer ${
                              state === "active-treatment"
                                ? "bg-red-50 border-danger text-danger font-extrabold shadow-sm"
                                : state === "restored"
                                ? "bg-success/10 border-success text-success"
                                : state === "lab-ordered"
                                ? "bg-warning/10 border-warning text-warning"
                                : "bg-white border-gray-200 text-gray-500 hover:border-primary/50 hover:text-primary"
                            }`}
                          >
                            {tooth}
                            <span className="text-[7px]">
                              {state === "active-treatment" ? "🚨" : state === "restored" ? "👑" : state === "lab-ordered" ? "🔬" : "🦷"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Lower row */}
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(tooth => {
                        const state = viewingPatient.teethChart[tooth];
                        return (
                          <button
                            key={tooth}
                            onClick={() => toggleToothState(tooth)}
                            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all cursor-pointer ${
                              state === "active-treatment"
                                ? "bg-red-50 border-danger text-danger font-extrabold shadow-sm"
                                : state === "restored"
                                ? "bg-success/10 border-success text-success"
                                : state === "lab-ordered"
                                ? "bg-warning/10 border-warning text-warning"
                                : "bg-white border-gray-200 text-gray-500 hover:border-primary/50 hover:text-primary"
                            }`}
                          >
                            {tooth}
                            <span className="text-[7px]">
                              {state === "active-treatment" ? "🚨" : state === "restored" ? "👑" : state === "lab-ordered" ? "🔬" : "🦷"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4 text-[9px] text-gray-500 font-semibold">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-danger"></span> Active Treatment</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success/10 border border-success"></span> Restored / Crown</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning/10 border border-warning"></span> Lab Order Placed</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white border border-gray-200"></span> Healthy Tooth</span>
                  </div>
                </div>

                {/* Prescription Form */}
                <div className="border border-gray-150 rounded-xl p-5 bg-white">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <span>💊</span> Prescribe Medicines
                  </h4>
                  
                  <form onSubmit={handleAddMedicine} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medicine Name</label>
                      <select
                        value={rxMedicine}
                        onChange={(e) => setRxMedicine(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="Amoxicillin 500mg">Amoxicillin 500mg</option>
                        <option value="Paracetamol 650mg">Paracetamol 650mg</option>
                        <option value="Ibuprofen 400mg">Ibuprofen 400mg</option>
                        <option value="Clindamycin 300mg">Clindamycin 300mg</option>
                        <option value="Ketorolac DT 10mg">Ketorolac DT 10mg</option>
                        <option value="Moxikind-CV 625">Moxikind-CV 625</option>
                        <option value="Chlorhexidine Mouthwash">Chlorhexidine Mouthwash</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Timings</label>
                      <div className="flex items-center gap-2 h-9 pt-1">
                        <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 select-none cursor-pointer">
                          <input type="checkbox" checked={rxMorning} onChange={(e) => setRxMorning(e.target.checked)} className="accent-primary" />
                          Morn
                        </label>
                        <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 select-none cursor-pointer">
                          <input type="checkbox" checked={rxNoon} onChange={(e) => setRxNoon(e.target.checked)} className="accent-primary" />
                          Noon
                        </label>
                        <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 select-none cursor-pointer">
                          <input type="checkbox" checked={rxNight} onChange={(e) => setRxNight(e.target.checked)} className="accent-primary" />
                          Night
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Duration</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="1"
                          value={rxDurationVal}
                          onChange={(e) => setRxDurationVal(e.target.value)}
                          className="w-16 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none text-center font-bold"
                        />
                        <select
                          value={rxDurationUnit}
                          onChange={(e) => setRxDurationUnit(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                        >
                          <option value="Days">Days</option>
                          <option value="Weeks">Weeks</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1 flex flex-col justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Instructions</label>
                      <div className="flex gap-2">
                        <select
                          value={rxTiming}
                          onChange={(e) => setRxTiming(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Medicines Draft table */}
                  <div className="bg-white border border-gray-155 rounded-xl overflow-hidden mb-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-2">Medicine</th>
                          <th className="px-4 py-2">Timings</th>
                          <th className="px-4 py-2">Instructions</th>
                          <th className="px-4 py-2">Duration</th>
                          <th className="px-4 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rxDraft.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-5 text-center text-xs text-gray-400 font-semibold">
                              No medicines added to prescription.
                            </td>
                          </tr>
                        ) : (
                          rxDraft.map((m) => (
                            <tr key={m.id} className="text-xs">
                              <td className="px-4 py-2 font-bold text-gray-900">{m.medicine}</td>
                              <td className="px-4 py-2 text-gray-700 font-semibold">{m.schedule}</td>
                              <td className="px-4 py-2 text-gray-650 font-semibold">{m.timing}</td>
                              <td className="px-4 py-2 font-bold text-gray-955">{m.duration}</td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => handleRemoveDraftMed(m.id)}
                                  className="text-xs text-danger hover:underline cursor-pointer"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSavePrescription}
                      disabled={rxDraft.length === 0}
                      className="px-4 py-2 bg-success text-white font-bold rounded-xl text-xs hover:bg-success/95 transition-all shadow-sm shadow-success/15 disabled:opacity-50 cursor-pointer"
                    >
                      🖨️ Save & Print Prescription
                    </button>
                  </div>
                </div>

                {/* Dental Lab Request */}
                <div className="border border-gray-150 rounded-xl p-5 bg-white">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <span>🔬</span> Restorative Lab Work Request
                  </h4>
                  <form onSubmit={handleAddLabOrderSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lab Item</label>
                      <select
                        value={labOrderItem}
                        onChange={(e) => setLabOrderItem(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                      >
                        <option value="Zirconia Crown">Zirconia Crown</option>
                        <option value="Ceramic Bridge">Ceramic Bridge</option>
                        <option value="E-Max Veneer">E-Max Veneer</option>
                        <option value="Clear Aligner Set">Clear Aligner Set</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tooth #</label>
                      <input
                        type="number"
                        value={labOrderTooth}
                        onChange={(e) => setLabOrderTooth(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl text-xs text-center font-bold"
                        min="11"
                        max="48"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Shade</label>
                      <select
                        value={labOrderShade}
                        onChange={(e) => setLabOrderShade(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Milling Lab</label>
                      <select
                        value={labOrderName}
                        onChange={(e) => setLabOrderName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                      >
                        <option value="Apex Dental Lab">Apex Dental Lab</option>
                        <option value="Elite Milling Center">Elite Milling Center</option>
                        <option value="SmileAlign Labs">SmileAlign Labs</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-colors cursor-pointer"
                    >
                      Order Lab
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column (1/3 width) - Daily Notes Form & Clinical History Timeline */}
              <div className="p-6 space-y-6">
                
                {/* Add Diagnosis Clinical Notes Form */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">✍️ Add Diagnosis Clinical Note</h4>
                  <form onSubmit={handleSubmitDiagNote} className="space-y-3">
                    <textarea
                      rows={3}
                      value={diagNoteInput}
                      onChange={(e) => setDiagNoteInput(e.target.value)}
                      placeholder="Write diagnostic observations or active findings..."
                      className="w-full px-4 py-2 bg-gray-55 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
                      >
                        Append Note
                      </button>
                    </div>
                  </form>
                </div>

                {/* Patient Clinical History Timeline */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">📜 Clinical History Timeline</h4>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {viewingPatient?.timeline && viewingPatient.timeline.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4">No historical timeline logs found.</p>
                    ) : (
                      viewingPatient?.timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-3 items-start relative pb-4 last:pb-0">
                          {idx !== viewingPatient.timeline.length - 1 && (
                            <span className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-100"></span>
                          )}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-white ${
                            event.type === "Prescription" ? "bg-purple-500" :
                            event.type === "Procedure" ? "bg-success" :
                            event.type === "Lab Order" ? "bg-warning" : "bg-primary"
                          }`}>
                            {event.type.charAt(0)}
                          </div>
                          <div className="flex-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-bold text-gray-400">{event.date}</span>
                              <span className="text-[8px] font-bold text-primary bg-primary/5 px-1 rounded">{event.type}</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-normal font-semibold">{event.note}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">Loading Clinical Profile...</div>
          )}
        </div>
      )}
    </div>
  );
}
