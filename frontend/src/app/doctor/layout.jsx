"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import DoctorSidebar from "@/components/ui/doctor/layout/DoctorSidebar";
import DoctorNavbar from "@/components/ui/doctor/layout/DoctorNavbar";
import EmergencyPopup from "@/components/ui/doctor/workspace/EmergencyPopup";

// Create context
const DoctorContext = createContext(null);

export function useDoctor() {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error("useDoctor must be used within a DoctorProvider");
  }
  return context;
}

export default function DoctorLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

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

  // State Management
  const [activePatientToken, setActivePatientToken] = useState("#004");
  const [viewingPatientToken, setViewingPatientToken] = useState("#004");
  const [completedPatientHistory, setCompletedPatientHistory] = useState(["#003"]);

  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [hasTriggeredAutoEmergency, setHasTriggeredAutoEmergency] = useState(false);

  // Waiting queue
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

  // Prescription draft & notes
  const [rxDraft, setRxDraft] = useState([]);
  const [notification, setNotification] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const activePatient = patients[activePatientToken] || null;
  const viewingPatient = patients[viewingPatientToken] || null;

  // Active Emergency badge tracker
  const hasUrgentInQueue = queue.some(q => q.priority === "Urgent");

  // Call Patient from table
  const handleCallPatient = (token) => {
    const p = patients[token];
    if (!p) return;

    setQueue(prev => prev.filter(item => item.token !== token));

    if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
      setCompletedPatientHistory(prev => [...prev, activePatientToken]);
    }

    setActivePatientToken(token);
    setViewingPatientToken(token);
    setRxDraft([]);
    showNotification(`Patient ${p.name} (${token}) is now in the chair.`);
    router.push("/doctor/workspace");
  };

  // Call Next Patient from Queue
  const handleCallNextPatient = () => {
    if (queue.length === 0) {
      showNotification("No patients remaining in the waiting queue.");
      return;
    }

    if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
      setCompletedPatientHistory(prev => [...prev, activePatientToken]);
    }

    const nextItem = queue[0];
    setQueue(prev => prev.slice(1));

    setActivePatientToken(nextItem.token);
    setViewingPatientToken(nextItem.token);
    setRxDraft([]);
    showNotification(`Token ${nextItem.token} called to chair. Clinical sheet loaded.`);
    router.push("/doctor/workspace");
  };

  // View Previous Completed Patient from History
  const handleViewPreviousPatient = () => {
    if (completedPatientHistory.length === 0) {
      showNotification("No previous patient records available in this session.");
      return;
    }

    const prevToken = completedPatientHistory[completedPatientHistory.length - 1];
    setViewingPatientToken(prevToken);
    showNotification(`Viewing previous completed patient: ${patients[prevToken].name}`);
    router.push("/doctor/workspace");
  };

  // Skip Patient
  const handleSkipPatient = (token) => {
    setQueue(prev => prev.map(q => q.token === token ? { ...q, status: "Skipped" } : q));
    showNotification(`Token ${token} marked as skipped.`);
  };

  // Requeue Patient
  const handleRequeuePatient = (token) => {
    setQueue(prev => prev.map(q => q.token === token ? { ...q, status: "Waiting" } : q));
    showNotification(`Token ${token} returned to waiting status.`);
  };

  // Remove Patient
  const handleRemovePatient = (token) => {
    setQueue(prev => prev.filter(q => q.token !== token));
    showNotification(`Token ${token} removed from queue.`);
  };

  // Simulate an Emergency Check-in with a 5-second delay
  const simulateEmergencyCheckin = () => {
    setHasTriggeredAutoEmergency(true);
    showNotification("🚨 Simulating emergency check-in... Popup warning will trigger in 5 seconds!");

    setTimeout(() => {
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

      setPatients(prev => ({ ...prev, [newToken]: newPatient }));
      setQueue(prev => [...prev, { token: newToken, time: "03:45 PM", status: "Waiting", priority: "Urgent" }]);

      setEmergencyAlert(newPatient);
      showNotification("🚨 URGENT: Emergency patient Vikram checked in at desk!");
    }, 5000);
  };

  // Mark Lab Order Delivered
  const handleMarkLabDelivered = (id) => {
    setLabOrders(prev => prev.map(order => {
      if (order.id === id) {
        return { ...order, status: "Delivered", eta: "Completed" };
      }
      return order;
    }));
    showNotification(`Lab Case ${id} marked as Delivered.`);
  };

  // Submit Lab Order from form
  const handleSubmitLabOrder = ({ item, tooth, shade, labName }) => {
    const newOrder = {
      id: `LAB-${Math.floor(700 + Math.random() * 200)}`,
      patientToken: viewingPatientToken,
      item: `${item} (Tooth #${tooth}, Shade ${shade})`,
      status: "In Production",
      labName: labName,
      eta: "3 Days"
    };

    setLabOrders(prev => [newOrder, ...prev]);

    // Add to timeline
    const newTimelineEvent = {
      date: "10-06-2026 (Today)",
      note: `Ordered ${newOrder.item} from ${labName}`,
      type: "Lab Order"
    };

    setPatients(prev => ({
      ...prev,
      [viewingPatientToken]: {
        ...prev[viewingPatientToken],
        timeline: [newTimelineEvent, ...prev[viewingPatientToken].timeline],
        teethChart: { ...prev[viewingPatientToken].teethChart, [tooth]: "lab-ordered" }
      }
    }));

    showNotification(`Lab order submitted to ${labName}.`);
  };

  // Interactive tooth chart select
  const handleToggleToothState = (tooth) => {
    if (!viewingPatient) return;
    const currentStatus = viewingPatient.teethChart[tooth];
    let newStatus = "";

    if (!currentStatus) newStatus = "active-treatment";
    else if (currentStatus === "active-treatment") newStatus = "restored";
    else newStatus = "";

    setPatients(prev => ({
      ...prev,
      [viewingPatientToken]: {
        ...prev[viewingPatientToken],
        teethChart: {
          ...prev[viewingPatientToken].teethChart,
          [tooth]: newStatus
        }
      }
    }));

    showNotification(`Tooth #${tooth} status updated to ${newStatus || "Healthy"}`);
  };

  // Prescription Form Draft management
  const handleAddDraftMedicine = (newItem) => {
    setRxDraft(prev => [...prev, newItem]);
    showNotification(`${newItem.medicine} added to draft.`);
  };

  const handleRemoveDraftMed = (id) => {
    setRxDraft(prev => prev.filter(m => m.id !== id));
  };

  // Save/Print prescription
  const handleSavePrescription = () => {
    if (rxDraft.length === 0) return;

    const rxText = rxDraft.map(m => `${m.medicine} (${m.schedule} - ${m.timing} for ${m.duration})`).join(" | ");

    const newTimelineEvent = {
      date: "10-06-2026 (Today)",
      note: `Rx Prescription issued: ${rxText}`,
      type: "Prescription",
      details: rxDraft
    };

    setPatients(prev => ({
      ...prev,
      [viewingPatientToken]: {
        ...prev[viewingPatientToken],
        timeline: [newTimelineEvent, ...prev[viewingPatientToken].timeline]
      }
    }));

    setRxDraft([]);
    showNotification(`Prescription printed & saved for ${viewingPatient.name}.`);
  };

  // Submit Clinical Diagnosis Note
  const handleSubmitDiagNote = (noteText) => {
    if (!viewingPatient) return;

    const newTimelineEvent = {
      date: "10-06-2026 (Today)",
      note: noteText,
      type: "Clinical Note"
    };

    setPatients(prev => ({
      ...prev,
      [viewingPatientToken]: {
        ...prev[viewingPatientToken],
        timeline: [newTimelineEvent, ...prev[viewingPatientToken].timeline]
      }
    }));

    showNotification("Clinical diagnosis note updated.");
  };

  // Add Chronic Safety Alert Warning
  const handleAddAlert = (alertText) => {
    if (!activePatient) return;

    setPatients(prev => ({
      ...prev,
      [activePatientToken]: {
        ...prev[activePatientToken],
        medicalAlerts: [...prev[activePatientToken].medicalAlerts, alertText]
      }
    }));
    showNotification(`Medical alert added to ${activePatient.name}`);
  };

  // 10-Second Auto Emergency Trigger simulation
  useEffect(() => {
    if (pathname === "/doctor/workspace" && !hasTriggeredAutoEmergency) {
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
  }, [pathname, hasTriggeredAutoEmergency]);

  return (
    <DoctorContext.Provider value={{
      patients,
      activePatientToken,
      setActivePatientToken,
      viewingPatientToken,
      setViewingPatientToken,
      completedPatientHistory,
      emergencyAlert,
      setEmergencyAlert,
      queue,
      labOrders,
      rxDraft,
      notification,
      showNotification,
      activePatient,
      viewingPatient,
      hasUrgentInQueue,
      handleCallPatient,
      handleCallNextPatient,
      handleViewPreviousPatient,
      handleSkipPatient,
      handleRequeuePatient,
      handleRemovePatient,
      simulateEmergencyCheckin,
      handleMarkLabDelivered,
      handleSubmitLabOrder,
      handleToggleToothState,
      handleAddDraftMedicine,
      handleRemoveDraftMed,
      handleSavePrescription,
      handleSubmitDiagNote,
      handleAddAlert
    }}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar Nav */}
        <DoctorSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar */}
          <DoctorNavbar />

          {/* Main workspace container */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </div>

        {/* Global Toast */}
        {notification && (
          <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
            <span className="text-primary">🦷</span>
            <span className="text-sm font-semibold">{notification}</span>
          </div>
        )}

        {/* Critical Emergency Interruption Modal Popup */}
        <EmergencyPopup
          emergencyAlert={emergencyAlert}
          onAcknowledge={() => setEmergencyAlert(null)}
          onConsultFirst={() => {
            if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
              setCompletedPatientHistory(prev => [...prev, activePatientToken]);
            }
            setActivePatientToken(emergencyAlert.token);
            setViewingPatientToken(emergencyAlert.token);
            setQueue(prev => prev.filter(q => q.token !== emergencyAlert.token));
            setEmergencyAlert(null);
            setRxDraft([]);
            showNotification(`Emergency patient ${emergencyAlert.name} called to chair.`);
            router.push("/doctor/workspace");
          }}
        />
      </div>
    </DoctorContext.Provider>
  );
}
