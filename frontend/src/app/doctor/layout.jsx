"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import DoctorSidebar from "@/components/ui/doctor/layout/DoctorSidebar";
import DoctorNavbar from "@/components/ui/doctor/layout/DoctorNavbar";
import AuthGuard from "@/components/AuthGuard";
import EmergencyPopup from "@/components/ui/doctor/workspace/EmergencyPopup";
import ToothIcon from "@/components/ui/ToothIcon";
import { Share2, Microscope, AlertTriangle, Bell, X } from "lucide-react";

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
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [currentDoctorName, setCurrentDoctorName] = useState("Dr. Anoop Nair");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const name = user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`;
          setCurrentDoctorName(name);
        } catch (e) {}
      }
    }
  }, []);

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

  // Notifications State & Logic
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      message: "Incoming orthodontic referral from Dr. Sarah Jenkins for Rahul Kumar",
      type: "referral",
      link: "/doctor/referrals",
      status: "unread",
      dotColor: "red",
      timestamp: "10 mins ago",
      receivedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      itemId: "REF-201",
      patientId: "#004",
      patientName: "Rahul Kumar"
    },
    {
      id: "notif-2",
      message: "Lab Case LAB-698 for Rahul Kumar is ready / shipped",
      type: "labs",
      link: "/doctor/labs",
      status: "unread",
      dotColor: "green",
      timestamp: "30 mins ago",
      receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      itemId: "LAB-698",
      patientId: "#004",
      patientName: "Rahul Kumar"
    }
  ]);

  const [activeToast, setActiveToast] = useState(null);
  const [toastAnimation, setToastAnimation] = useState(""); // "slide-in" | "slide-out"
  const [bellAnimating, setBellAnimating] = useState(false);

  const triggerNotification = (newNotif) => {
    const notifWithId = {
      id: `notif-${Date.now()}`,
      status: "unread",
      timestamp: "Just now",
      receivedAt: new Date().toISOString(),
      ...newNotif
    };
    setNotifications(prev => [notifWithId, ...prev]);
    setActiveToast(notifWithId);
    setToastAnimation("slide-in");

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    if (window.toastExitTimeout) clearTimeout(window.toastExitTimeout);

    window.toastTimeout = setTimeout(() => {
      setToastAnimation("slide-out");
      window.toastExitTimeout = setTimeout(() => {
        setActiveToast(null);
        setToastAnimation("");
        setBellAnimating(true);
        setTimeout(() => {
          setBellAnimating(false);
        }, 2400);
      }, 400);
    }, 4500);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n));
  };

  const markAsUnread = (idOrItemId) => {
    setNotifications(prev => prev.map(n => (n.id === idOrItemId || n.itemId === idOrItemId) ? { ...n, status: "unread" } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: "read" })));
  };

  // Trigger a demo notification 6s after layout mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerNotification({
        message: "Incoming referral from Dr. Sarah Jenkins for patient Rahul Kumar",
        type: "referral",
        link: "/doctor/referrals",
        dotColor: "red",
        itemId: "REF-201",
        patientId: "#004",
        patientName: "Rahul Kumar"
      });
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Referrals database
  const [referrals, setReferrals] = useState([
    {
      id: "REF-201",
      patientToken: "#004", // Rahul Kumar
      referredBy: "Dr. Sarah Jenkins",
      speciality: "Orthodontics",
      date: "10-06-2026",
      reason: "Patient needs evaluation for root canal treatment before orthodontic brackets are placed on upper jaw.",
      clinicalNotes: "Tooth #16 shows deep dentinal caries. General bone density is good.",
      teethChart: { 16: "active-treatment" },
      status: "Pending", // Pending | Completed
      myConsultationNotes: "",
      myMedications: [],
      referralType: "Internal"
    },
    {
      id: "REF-202",
      patientToken: "#006", // Priya Nair
      referredBy: "Dr. James Kurt",
      speciality: "Oral Surgery",
      date: "11-06-2026",
      reason: "Patient is pregnant (2nd trimester). Needs professional scaling and localized gingival evaluation.",
      clinicalNotes: "Bleeding gums on brushing. Soft tissue swelling in lower anterior quadrant.",
      teethChart: {},
      status: "Pending",
      myConsultationNotes: "",
      myMedications: [],
      referralType: "Internal"
    },
    {
      id: "REF-203",
      patientToken: "#003", // Sneha Joseph
      referredBy: "Dr. Anoop Nair",
      speciality: "Orthodontics",
      targetDoctor: "Dr. Rajesh Shah",
      date: "12-06-2026",
      reason: "Referred outside for specialized lingual orthodontics not available in-house.",
      clinicalNotes: "Patient prefers lingual brackets.",
      teethChart: { 18: "restored" },
      status: "Pending",
      myConsultationNotes: "",
      myMedications: [],
      referralType: "External",
      externalFacility: "Apex Orthodontic Center"
    }
  ]);

  // Outgoing referral handler
  const handleReferPatient = (patientToken, doctorNameWithSpeciality, reason, referralType = "Internal", externalFacility = "") => {
    const [docName, docSpec] = doctorNameWithSpeciality.split(" - ");
    const newRef = {
      id: `REF-${Math.floor(200 + Math.random() * 800)}`,
      patientToken,
      referredBy: currentDoctorName,
      speciality: docSpec || "General Dentistry",
      targetDoctor: docName,
      date: "12-06-2026 (Today)",
      reason: reason,
      clinicalNotes: patients[patientToken]?.chiefComplaint || "",
      teethChart: patients[patientToken]?.teethChart || {},
      status: "Pending",
      myConsultationNotes: "",
      myMedications: [],
      referralType,
      externalFacility
    };

    setReferrals(prev => [newRef, ...prev]);

    // Add event to patient timeline
    const timelineEvent = {
      date: "10-06-2026 (Today)",
      note: `Outbound ${referralType} Referral generated to ${docName}${externalFacility ? ` at ${externalFacility}` : ""} (${docSpec || "Specialist"}). Reason: ${reason}`,
      type: "Referral"
    };

    setPatients(prev => ({
      ...prev,
      [patientToken]: {
        ...prev[patientToken],
        timeline: [timelineEvent, ...prev[patientToken].timeline]
      }
    }));

    showNotification(`Patient referred to ${docName} successfully.`);
  };

  // Incoming referral response handler
  const handleCompleteReferral = (refId, consultationNotes, medications) => {
    setReferrals(prev => prev.map(ref => {
      if (ref.id === refId) {
        return {
          ...ref,
          status: "Completed",
          myConsultationNotes: consultationNotes,
          myMedications: medications
        };
      }
      return ref;
    }));

    // Find the referral to fetch patient info
    const referral = referrals.find(r => r.id === refId);
    if (referral) {
      // Append to patient timeline
      const timelineEvent = {
        date: "10-06-2026 (Today)",
        note: `Consultation complete by ${currentDoctorName}: ${consultationNotes}`,
        type: "Consultation",
        details: medications
      };

      setPatients(prev => ({
        ...prev,
        [referral.patientToken]: {
          ...prev[referral.patientToken],
          timeline: [timelineEvent, ...prev[referral.patientToken].timeline]
        }
      }));

      showNotification(`Completed consultation for referral ${refId}.`);
    }
  };

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
      triggerNotification({
        message: "🚨 URGENT: Emergency patient Commander Vikram checked in at desk!",
        type: "alerts",
        link: "/doctor/alerts",
        dotColor: "red",
        itemId: newToken,
        patientId: newToken,
        patientName: "Commander Vikram"
      });
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

  // Submit Specialty Log (auto-save aware)
  const handleSubmitSpecialtyLog = (noteText, sheetLabel, isAutoSave = false) => {
    if (!viewingPatientToken) return;

    setPatients(prev => {
      const patient = prev[viewingPatientToken];
      if (!patient) return prev;

      const specialtyPrefix = `[${sheetLabel} Log]`;
      const existingEventIndex = patient.timeline.findIndex(
        event => event.type === "Clinical Note" && event.note.startsWith(specialtyPrefix)
      );

      let updatedTimeline = [...patient.timeline];

      if (existingEventIndex > -1) {
        updatedTimeline[existingEventIndex] = {
          ...updatedTimeline[existingEventIndex],
          note: noteText,
          date: "10-06-2026 (Today)"
        };
      } else {
        const newTimelineEvent = {
          date: "10-06-2026 (Today)",
          note: noteText,
          type: "Clinical Note"
        };
        updatedTimeline = [newTimelineEvent, ...updatedTimeline];
      }

      return {
        ...prev,
        [viewingPatientToken]: {
          ...patient,
          timeline: updatedTimeline
        }
      };
    });

    if (!isAutoSave) {
      showNotification(`${sheetLabel} workspace logs saved!`);
    }
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

  return (
    <AuthGuard allowedRoles={["doctor"]} type="staff">
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
        handleSubmitSpecialtyLog,
        handleAddAlert,
        referrals,
        setReferrals,
        handleReferPatient,
        handleCompleteReferral,
        sidebarMinimized,
        setSidebarMinimized,
        notifications,
        activeToast,
        toastAnimation,
        bellAnimating,
        triggerNotification,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        setBellAnimating
      }}>
        <div className="flex h-screen bg-background overflow-hidden">
          {/* Sidebar Nav */}
          <DoctorSidebar isMinimized={sidebarMinimized} onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)} />

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
              <ToothIcon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-semibold">{notification}</span>
            </div>
          )}

          {/* Swipeable Notification Toast */}
          {activeToast && (
            <NotificationToast 
              toast={activeToast} 
              animation={toastAnimation}
              onDismiss={() => {
                if (window.toastTimeout) clearTimeout(window.toastTimeout);
                if (window.toastExitTimeout) clearTimeout(window.toastExitTimeout);
                setToastAnimation("slide-out");
                window.toastExitTimeout = setTimeout(() => {
                  setActiveToast(null);
                  setToastAnimation("");
                  setBellAnimating(true);
                  setTimeout(() => setBellAnimating(false), 2400);
                }, 400);
              }}
              onClick={() => {
                const link = activeToast.link;
                const id = activeToast.id;
                markAsRead(id);
                if (window.toastTimeout) clearTimeout(window.toastTimeout);
                if (window.toastExitTimeout) clearTimeout(window.toastExitTimeout);
                setActiveToast(null);
                setToastAnimation("");
                router.push(link);
              }}
            />
          )}

          {/* Simulator removed */}

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
    </AuthGuard>
  );
}

// Swipeable Toast Component
function NotificationToast({ toast, animation, onDismiss, onClick }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleStart = (clientX) => {
    setIsDragging(true);
    startX.current = clientX;
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const offset = clientX - startX.current;
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 120) {
      onDismiss();
    } else {
      setDragOffset(0);
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "referral":
        return <Share2 className="w-5 h-5 text-primary" />;
      case "labs":
        return <Microscope className="w-5 h-5 text-secondary" />;
      case "alerts":
        return <AlertTriangle className="w-5 h-5 text-danger" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onClick={onClick}
      style={{
        transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
        transition: isDragging ? "none" : "transform 0.2s ease-out",
        cursor: isDragging ? "grabbing" : "pointer",
      }}
      className={`fixed top-20 right-5 max-w-sm w-96 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl p-4 flex gap-3 z-50 select-none ${
        animation === "slide-in" ? "animate-slide-in" : "animate-slide-out"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
          {getIcon()}
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${toast.dotColor === 'green' ? 'bg-success' : 'bg-danger'}`} />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            New {toast.type} Notification
          </span>
          <span className="text-[9px] text-gray-400 font-semibold">{toast.timestamp}</span>
        </div>
        <p className="text-xs font-semibold text-gray-800 mt-1 leading-normal line-clamp-2">
          {toast.message}
        </p>
        <span className="text-[9px] font-semibold text-primary mt-2 block hover:underline">
          Click to view →
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-2 right-2 text-gray-300 hover:text-gray-600 cursor-pointer p-1 rounded-full hover:bg-gray-50 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gray-150 rounded-l-md flex flex-col justify-between items-center py-1">
        <div className="w-0.5 h-1 bg-gray-300 rounded" />
        <div className="w-0.5 h-1 bg-gray-300 rounded" />
        <div className="w-0.5 h-1 bg-gray-300 rounded" />
      </div>
    </div>
  );
}
