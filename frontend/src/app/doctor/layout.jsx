"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import DoctorSidebar from "@/components/layout/Sidebar";
import DoctorNavbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/AuthGuard";
import EmergencyPopup from "@/components/ui/doctor/workspace/EmergencyPopup";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { Share2, Microscope, AlertTriangle, Bell, X } from "lucide-react";
import {
  getLabOrders,
  getLabNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateLabOrderStatus,
  createLabOrder,
  getQueue,
  callPatient,
  updateAppointmentStatus,
  getPatientAppointments,
  getPatientByToken,
  getPatientTreatmentPlan,
  createPrescription,
  createReferral,
  getAllReferrals,
  updateReferral
} from "@/services/api";

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
  const [patients, setPatients] = useState({});

  // State Management
  const [activePatientToken, setActivePatientToken] = useState("");
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [viewingPatientToken, setViewingPatientToken] = useState("");
  const [completedPatientHistory, setCompletedPatientHistory] = useState([]);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [currentDoctorName, setCurrentDoctorName] = useState("Dr. Anoop Nair");

  const getTodayString = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year} (Today)`;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("staff_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const name = user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`;
          setCurrentDoctorName(name);
        } catch (e) { }
      }
    }
  }, []);

  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [hasTriggeredAutoEmergency, setHasTriggeredAutoEmergency] = useState(false);

  const [queue, setQueue] = useState([]);

  // Lab Orders
  const [labOrders, setLabOrders] = useState([]);

  // Prescription draft & notes
  const [rxDraft, setRxDraft] = useState([]);
  const [notification, setNotification] = useState("");

  // Notifications State & Logic (Referrals, etc.)
  const [notifications, setNotifications] = useState([]);

  const [dbNotifications, setDbNotifications] = useState([]);
  const allNotifications = [...dbNotifications, ...notifications];

  const fetchLabOrders = async () => {
    try {
      const data = await getLabOrders();
      const mapped = data.map(o => ({
        id: o.id,
        patientToken: o.patient_token,
        item: o.material ? `${o.prosthetic_type} (${o.material}, Shade ${o.shade})` : `${o.prosthetic_type} (Shade ${o.shade})`,
        status: o.status,
        labName: o.lab_name || "Apex Dental Lab",
        eta: o.due_date || "3 Days"
      }));
      setLabOrders(mapped);
    } catch (err) {
      console.warn("Failed to fetch lab orders from backend:", err);
    }
  };

  const fetchDbNotifications = async () => {
    try {
      const data = await getLabNotifications('doctor');
      const mapped = data.map(n => ({
        id: n.id,
        message: n.desc,
        type: "labs",
        link: "/doctor/labs",
        status: n.read ? "read" : "unread",
        dotColor: n.title.toLowerCase().includes("rejected") ? "red" : "green",
        timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        receivedAt: n.created_at,
        itemId: n.title.split(" ").pop()
      }));
      setDbNotifications(mapped);
    } catch (err) {
      console.warn("Failed to fetch doctor notifications from backend:", err);
    }
  };

  useEffect(() => {
    fetchLabOrders();
    fetchDbNotifications();
    fetchReferrals();
    const interval = setInterval(() => {
      fetchLabOrders();
      fetchDbNotifications();
      fetchReferrals();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [activeToast, setActiveToast] = useState(null);
  const [toastAnimation, setToastAnimation] = useState("");
  const [bellAnimating, setBellAnimating] = useState(false);

  const prevUnreadCountRef = useRef(0);
  useEffect(() => {
    const unreadDbNotifs = dbNotifications.filter(n => n.status === "unread");
    if (unreadDbNotifs.length > prevUnreadCountRef.current) {
      const latest = unreadDbNotifs[0];
      if (latest) {
        setActiveToast({
          id: latest.id,
          message: latest.message,
          type: latest.type,
          link: latest.link,
          dotColor: latest.dotColor,
          timestamp: "Just now"
        });
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
      }
    }
    prevUnreadCountRef.current = unreadDbNotifs.length;
  }, [dbNotifications]);

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

  const markAsRead = async (id) => {
    if (typeof id === "number" || !isNaN(id)) {
      try {
        await markNotificationAsRead(id);
        fetchDbNotifications();
      } catch (err) {
        console.error("Failed to mark notification read in backend:", err);
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n));
    }
  };

  const markAsUnread = (idOrItemId) => {
    setNotifications(prev => prev.map(n => (n.id === idOrItemId || n.itemId === idOrItemId) ? { ...n, status: "unread" } : n));
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchDbNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read in backend:", err);
    }
    setNotifications(prev => prev.map(n => ({ ...n, status: "read" })));
  };

  // Referrals database
  const [referrals, setReferrals] = useState([]);

  // Fetch referrals from database
  const fetchReferrals = async () => {
    try {
      const data = await getAllReferrals();
      const mapped = data.map(ref => ({
        id: ref.id,
        patientToken: ref.patient_token,
        referredBy: ref.referred_by,
        speciality: ref.speciality,
        targetDoctor: ref.target_doctor,
        date: ref.date,
        reason: ref.reason,
        clinicalNotes: ref.clinical_notes || "",
        teethChart: ref.teethChart || {},
        status: ref.status,
        myConsultationNotes: ref.my_consultation_notes || "",
        myMedications: ref.my_medications || [],
        referralType: ref.referral_type,
        externalFacility: ref.external_facility || ""
      }));

      // Detect new incoming referrals or completed outgoing referrals to trigger local notifications
      if (referrals.length > 0 && currentDoctorName) {
        const currentLower = currentDoctorName.toLowerCase().replace("dr.", "").trim();
        mapped.forEach(newRef => {
          const isTargeted = newRef.targetDoctor && newRef.targetDoctor.toLowerCase().replace("dr.", "").trim() === currentLower;
          const isReferredByMe = newRef.referredBy && newRef.referredBy.toLowerCase().replace("dr.", "").trim() === currentLower;
          const isNew = !referrals.some(r => r.id === newRef.id);
          const wasPending = referrals.some(r => r.id === newRef.id && r.status === "Pending");

          // 1. Incoming new referral notification
          if (isTargeted && isNew && newRef.status === "Pending") {
            triggerNotification({
              message: `Incoming referral from ${newRef.referredBy} for patient token ${newRef.patientToken}`,
              type: "referral",
              link: "/doctor/referrals",
              dotColor: "blue",
              itemId: newRef.id,
              patientId: newRef.patientToken
            });
          }
          // 2. Outgoing completed referral notification
          else if (isReferredByMe && newRef.status === "Completed" && wasPending) {
            triggerNotification({
              message: `Referral consultation completed by ${newRef.targetDoctor || "Specialist"} for patient token ${newRef.patientToken}`,
              type: "referral",
              link: "/doctor/referrals",
              dotColor: "green",
              itemId: newRef.id,
              patientId: newRef.patientToken
            });
          }
        });
      }

      setReferrals(mapped);

      // Enrich patient details for each referral so name, age, and timeline are loaded
      data.forEach(ref => {
        if (ref.patient_token) {
          enrichPatientTimeline(ref.patient_token);
        }
      });
    } catch (err) {
      console.warn("Failed to fetch referrals from database:", err);
    }
  };

  // Outgoing referral handler
  const handleReferPatient = async (patientToken, doctorNameWithSpeciality, reason, referralType = "Internal", externalFacility = "") => {
    const [docName, docSpec] = doctorNameWithSpeciality.split(" - ");
    const refId = `REF-${Math.floor(200 + Math.random() * 800)}`;
    const refDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const clinicNotes = patients[patientToken]?.chiefComplaint || "";

    const newRef = {
      id: refId,
      patientToken,
      referredBy: currentDoctorName,
      speciality: docSpec || "General Dentistry",
      targetDoctor: docName,
      date: refDate,
      reason: reason,
      clinicalNotes: clinicNotes,
      teethChart: patients[patientToken]?.teethChart || {},
      status: "Pending",
      myConsultationNotes: "",
      myMedications: [],
      referralType,
      externalFacility
    };

    try {
      await createReferral({
        id: newRef.id,
        patient_token: newRef.patientToken,
        referred_by: newRef.referredBy,
        speciality: newRef.speciality,
        target_doctor: newRef.targetDoctor,
        date: newRef.date,
        reason: newRef.reason,
        clinical_notes: newRef.clinicalNotes,
        referral_type: newRef.referralType,
        external_facility: newRef.externalFacility
      });

      await fetchReferrals();

      const timelineEvent = {
        date: getTodayString(),
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
      showNotification(`Referral created successfully for patient.`);
    } catch (err) {
      console.error("Failed to create referral in database:", err);
      showNotification("Failed to create referral in database: " + (err.message || ""));
    }
  };

  // Incoming referral response handler
  const handleCompleteReferral = async (refId, consultationNotes, medications) => {
    try {
      await updateReferral(refId, {
        status: "Completed",
        my_consultation_notes: consultationNotes,
        my_medications: medications
      });

      await fetchReferrals();

      const referral = referrals.find(r => r.id === refId);
      if (referral) {
        const timelineEvent = {
          date: getTodayString(),
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
    } catch (err) {
      console.error("Failed to complete referral in database:", err);
      showNotification("Failed to complete referral: " + (err.message || ""));
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

  // ─── fetchQueue ────────────────────────────────────────────────────────────
  // Fetches the live queue from the backend, filters by the current doctor,
  // maps the response to frontend shape, and hydrates the patients dictionary.
  const fetchQueue = async () => {
    try {
      const data = await getQueue();

      const doctorNameLower = currentDoctorName ? currentDoctorName.toLowerCase() : "";
      const doctorNameWithoutTitleLower = currentDoctorName ? currentDoctorName.replace("Dr. ", "").toLowerCase() : "";

      const myQueue = data.filter(q => {
        if (!currentDoctorName) return true;
        const qDocLower = q.doctor_name.toLowerCase();
        return (
          qDocLower.includes(doctorNameLower) ||
          qDocLower.includes(doctorNameWithoutTitleLower)
        );
      });

      const mappedQueue = myQueue.map(q => ({
        token: q.token,
        time: q.appointment_time,
        status: q.status,
        priority: q.priority,
        id: q.id
      }));

      setQueue(mappedQueue);

      const inChairPatient = myQueue.find(q => q.status === "In Chair");
      if (inChairPatient) {
        setActivePatientToken(inChairPatient.token);
        setActiveAppointmentId(inChairPatient.id);
        setViewingPatientToken(prev => prev || inChairPatient.token);
      } else {
        setActivePatientToken("");
        setActiveAppointmentId(null);
      }

      setPatients(prev => {
        const updated = { ...prev };
        myQueue.forEach(q => {
          updated[q.token] = {
            token: q.token,
            name: q.patient_name,
            age: q.age,
            gender: q.gender,
            phone: q.patient_phone,
            procedure: q.procedure || "Consultation",
            chiefComplaint: q.chief_complaint || "Routine Checkup",
            medicalAlerts: q.medical_alerts || [],
            teethChart: prev[q.token]?.teethChart || {},
            timeline: prev[q.token]?.timeline || [
              { date: new Date(q.checked_in_at).toLocaleDateString(), note: "Checked in", type: "Check-In" }
            ]
          };
        });
        return updated;
      });
    } catch (err) {
      console.warn("Failed to fetch live queue for doctor:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [currentDoctorName]);

  const handleCallPatient = async (token) => {
    const p = patients[token];
    if (!p) return;

    const queueItem = queue.find(item => item.token === token);
    if (queueItem && queueItem.id) {
      setActiveAppointmentId(queueItem.id);
      try {
        await callPatient(queueItem.id, "In Chair");
        await fetchQueue();
      } catch (err) {
        console.error("Failed to call patient in backend:", err);
      }
    }

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

  const handleCallNextPatient = async () => {
    if (queue.length === 0) {
      showNotification("No patients remaining in the waiting queue.");
      return;
    }

    if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
      setCompletedPatientHistory(prev => [...prev, activePatientToken]);
    }

    const nextItem = queue[0];
    if (nextItem && nextItem.id) {
      setActiveAppointmentId(nextItem.id);
      try {
        await callPatient(nextItem.id, "In Chair");
        await fetchQueue();
      } catch (err) {
        console.error("Failed to call next patient in backend:", err);
      }
    }

    setQueue(prev => prev.slice(1));

    setActivePatientToken(nextItem.token);
    setViewingPatientToken(nextItem.token);
    setRxDraft([]);
    showNotification(`Token ${nextItem.token} called to chair. Clinical sheet loaded.`);
    router.push("/doctor/workspace");
  };

  const handleCompleteConsultation = async () => {
    if (!activeAppointmentId) {
      showNotification("No active appointment found to complete.");
      return;
    }

    try {
      await callPatient(activeAppointmentId, "Completed");
      showNotification(`Consultation completed for ${patients[activePatientToken]?.name || "patient"}.`);

      if (activePatientToken && !completedPatientHistory.includes(activePatientToken)) {
        setCompletedPatientHistory(prev => [...prev, activePatientToken]);
      }

      setActivePatientToken("");
      setViewingPatientToken("");
      setActiveAppointmentId(null);
      setRxDraft([]);

      router.push("/doctor/dashboard");
      await fetchQueue();
    } catch (err) {
      console.error("Failed to complete consultation:", err);
      showNotification("Error completing consultation: " + (err.message || "Failed."));
    }
  };

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

  const handleSkipPatient = async (token) => {
    const queueItem = queue.find(q => q.token === token);
    if (queueItem && queueItem.id) {
      try {
        await updateAppointmentStatus(queueItem.id, { status: "Skipped" });
        await fetchQueue();
      } catch (err) {
        console.error("Failed to skip patient:", err);
      }
    }
    setQueue(prev => prev.map(q => q.token === token ? { ...q, status: "Skipped" } : q));
    showNotification(`Token ${token} marked as skipped.`);
  };

  const handleRequeuePatient = async (token) => {
    const queueItem = queue.find(q => q.token === token);
    if (queueItem && queueItem.id) {
      try {
        await updateAppointmentStatus(queueItem.id, { status: "Waiting" });
        await fetchQueue();
      } catch (err) {
        console.error("Failed to requeue patient:", err);
      }
    }
    setQueue(prev => prev.map(q => q.token === token ? { ...q, status: "Waiting" } : q));
    showNotification(`Token ${token} returned to waiting status.`);
  };

  const handleRemovePatient = async (token) => {
    const queueItem = queue.find(q => q.token === token);
    if (queueItem && queueItem.id) {
      try {
        await updateAppointmentStatus(queueItem.id, { status: "Completed" });
        await fetchQueue();
      } catch (err) {
        console.error("Failed to remove patient:", err);
      }
    }
    setQueue(prev => prev.filter(q => q.token !== token));
    showNotification(`Token ${token} removed from queue.`);
  };

  const simulateEmergencyCheckin = () => {
    setHasTriggeredAutoEmergency(true);
    showNotification("🚨 Simulating emergency check-in... Popup warning will trigger in 5 seconds!");

    setTimeout(() => {
      const lastKey = Object.keys(patients).length > 0 ? Object.keys(patients).sort().pop() : "";
      const cleanedKey = lastKey && lastKey.startsWith("#") ? lastKey.replace("#", "") : "";
      const lastTokenNum = cleanedKey ? parseInt(cleanedKey) : 8;
      const newToken = `#${String((isNaN(lastTokenNum) ? 8 : lastTokenNum) + 1).padStart(3, "0")}`;

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
        timeline: [{ date: new Date().toISOString().split("T")[0], note: "Emergency check-in. High pain score.", type: "Check-In" }]
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

  const handleMarkLabDelivered = async (id) => {
    try {
      await updateLabOrderStatus(id, { status: "Delivered" });
      showNotification(`Lab Case ${id} marked as Delivered.`);
      fetchLabOrders();
    } catch (err) {
      console.error("Error marking lab order delivered:", err);
      showNotification("Failed to mark lab order as delivered.");
    }
  };

  const handleSubmitLabOrder = async ({ item, tooth, shade, labName }) => {
    try {
      const createdOrder = await createLabOrder({
        patient_token: viewingPatientToken,
        prosthetic_type: item,
        material: `Tooth #${tooth}`,
        shade: shade,
        lab_name: labName,
        due_date: "2026-06-15",
        notes: `Tooth #${tooth}, Shade ${shade}`
      });

      const newTimelineEvent = {
        date: getTodayString(),
        note: `Ordered ${createdOrder.prosthetic_type} (Tooth #${tooth}, Shade ${shade}) from ${labName}`,
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
      fetchLabOrders();
    } catch (err) {
      console.error("Error submitting lab order:", err);
      showNotification("Failed to submit lab order.");
    }
  };

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

  const handleAddDraftMedicine = (newItem) => {
    setRxDraft(prev => [...prev, newItem]);
    showNotification(`${newItem.medicine} added to draft.`);
  };

  const handleRemoveDraftMed = (id) => {
    setRxDraft(prev => prev.filter(m => m.id !== id));
  };

  const handleSavePrescription = async () => {
    if (rxDraft.length === 0) return;

    try {
      await createPrescription({
        patient_token: viewingPatientToken,
        doctor_name: currentDoctorName,
        medications: rxDraft
      });

      const rxText = rxDraft.map(m => `${m.medicine} (${m.schedule} - ${m.timing} for ${m.duration})`).join(" | ");

      const newTimelineEvent = {
        date: getTodayString(),
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
    } catch (err) {
      console.error("Failed to save prescription to database:", err);
      showNotification("Failed to save prescription to database: " + (err.message || ""));
    }
  };

  const handleSubmitDiagNote = (noteText) => {
    if (!viewingPatient) return;

    const newTimelineEvent = {
      date: getTodayString(),
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
          date: getTodayString()
        };
      } else {
        const newTimelineEvent = {
          date: getTodayString(),
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

  const enrichPatientTimeline = async (token) => {
    if (!token) return;
    try {
      const patientData = await getPatientByToken(token);
      if (!patientData || !patientData.id) return;
      const patientId = patientData.id;

      const [appointmentsData, plansData] = await Promise.all([
        getPatientAppointments(patientId).catch(err => {
          console.warn("Failed to fetch appointments:", err);
          return [];
        }),
        getPatientTreatmentPlan(token).catch(err => {
          console.warn("Failed to fetch treatment plan:", err);
          return null;
        })
      ]);

      const timelineEvents = [];

      if (Array.isArray(appointmentsData)) {
        appointmentsData.forEach(app => {
          if (app.status === "Completed") {
            timelineEvents.push({
              date: app.appointment_date,
              note: `Treated for ${app.treatment_type} with symptoms "${app.symptoms || 'None'}"`,
              type: "Treatment"
            });
          } else if (app.status !== "Cancelled") {
            timelineEvents.push({
              date: app.appointment_date,
              note: `Scheduled for ${app.treatment_type} (${app.appointment_time})`,
              type: "Appointment"
            });
          }
        });
      }

      // Add patient referrals and consultations to timeline
      const patientRefs = referrals.filter(r => r.patientToken === token);
      patientRefs.forEach(ref => {
        if (ref.status === "Completed") {
          timelineEvents.push({
            date: ref.date,
            note: `Referral Consultation Completed by ${ref.targetDoctor || "Specialist"}: ${ref.myConsultationNotes}`,
            type: "Consultation"
          });
        } else {
          timelineEvents.push({
            date: ref.date,
            note: `Referred to ${ref.targetDoctor || "Specialist"} for: "${ref.reason}"`,
            type: "Referral"
          });
        }
      });

      let plans = [];
      if (Array.isArray(plansData)) {
        plans = plansData;
      } else if (plansData) {
        plans = [plansData];
      }

      const activePlan = plans.find(p => p.status === "Active") || plans[0];
      if (activePlan) {
        if (activePlan.next_visit_date) {
          timelineEvents.push({
            date: activePlan.next_visit_date,
            note: `Next Planned Visit: ${activePlan.next_visit_procedure || "Consultation"}`,
            type: "Appointment"
          });
        }

        if (Array.isArray(activePlan.steps)) {
          activePlan.steps.forEach(step => {
            if (step.consent_status === "Given") {
              const consentDate = step.consent_given_at
                ? new Date(step.consent_given_at).toISOString().split("T")[0]
                : new Date(activePlan.created_at || Date.now()).toISOString().split("T")[0];
              timelineEvents.push({
                date: consentDate,
                note: `Signed Consent for: ${step.title}`,
                type: "Consent"
              });
            }
          });
        }
      }

      setPatients(prev => {
        const existingEvents = prev[token]?.timeline || [];
        const mergedEvents = [...timelineEvents];
        existingEvents.forEach(exist => {
          const isDuplicate = mergedEvents.some(
            m => m.type === exist.type && m.note === exist.note && m.date === exist.date
          );
          if (!isDuplicate) {
            mergedEvents.push(exist);
          }
        });

        const parseDate = (dStr) => {
          if (!dStr) return new Date(0);
          const clean = dStr.split(" ")[0];
          const parts = clean.split("-");
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else if (parts[0].length === 4) {
              return new Date(clean);
            }
          }
          const parsed = new Date(clean);
          return isNaN(parsed.getTime()) ? new Date(0) : parsed;
        };

        mergedEvents.sort((a, b) => parseDate(b.date) - parseDate(a.date));

        const patient = prev[token] || {
          token,
          name: patientData.name,
          age: patientData.age,
          gender: patientData.gender,
          phone: patientData.phone,
          procedure: "Consultation",
          chiefComplaint: "Routine Checkup",
          medicalAlerts: [],
          teethChart: {}
        };

        return {
          ...prev,
          [token]: {
            ...patient,
            timeline: mergedEvents
          }
        };
      });

    } catch (err) {
      console.error("Failed to enrich patient timeline:", err);
    }
  };

  useEffect(() => {
    if (viewingPatientToken) {
      enrichPatientTimeline(viewingPatientToken);
    }
  }, [viewingPatientToken, referrals]);

  return (
    <AuthGuard allowedRoles={["doctor"]} type="staff">
      <DoctorContext.Provider value={{
        patients,
        activePatientToken,
        setActivePatientToken,
        viewingPatientToken,
        setViewingPatientToken,
        enrichPatientTimeline,
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
        handleCompleteConsultation,
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
        notifications: allNotifications,
        activeToast,
        toastAnimation,
        bellAnimating,
        triggerNotification,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        setBellAnimating,
        currentDoctorName
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

// ─── Swipeable Toast Component ─────────────────────────────────────────────
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
      className={`fixed top-20 right-5 max-w-sm w-96 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl p-4 flex gap-3 z-50 select-none ${animation === "slide-in" ? "animate-slide-in" : "animate-slide-out"
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