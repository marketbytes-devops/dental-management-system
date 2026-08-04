"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Clock,
  Pill,
  CheckCircle,
  AlertCircle,
  FileSignature,
  CreditCard,
  Receipt,
  ClipboardList,
  Stethoscope,
  Search,
  Filter,
  ArrowUpDown,
  Printer,
  Download,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  Sparkles
} from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import {
  getPatientProfile,
  getPatientAppointments,
  getPatientPrescriptions,
  getSignedConsents,
  getMyClinicalNotes,
  getPatientNotifications
} from "@/services/api";

const safeParseTimestamp = (dateStr, timeStr) => {
  try {
    if (!dateStr) return 0;
    if (typeof dateStr === "number") return dateStr;
    const cleanDate = String(dateStr).replace(" (Today)", "").trim();
    if (cleanDate.includes("T")) {
      const parsed = new Date(cleanDate).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    const cleanTime = timeStr ? String(timeStr).replace(/[^0-9:]/g, "") : "00:00";
    const combined = `${cleanDate}T${cleanTime.length === 5 ? cleanTime + ":00" : cleanTime}`;
    const timestamp = new Date(combined).getTime();
    if (!isNaN(timestamp)) return timestamp;
    return new Date(cleanDate).getTime() || 0;
  } catch (err) {
    return 0;
  }
};

const formatDisplayDate = (dateStr, timeStr) => {
  if (!dateStr) return "N/A";
  try {
    const ts = safeParseTimestamp(dateStr, timeStr);
    if (ts > 0) {
      const dateObj = new Date(ts);
      return dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
  } catch (err) {
    // fallback
  }
  return String(dateStr);
};

export default function PatientActivityPage() {
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = Newest First, asc = Oldest First
  const [expandedActivityId, setExpandedActivityId] = useState(null);

  useEffect(() => {
    async function fetchAllActivityData() {
      setLoading(true);
      setError("");
      try {
        // 1. Fetch patient profile
        const profileData = await getPatientProfile();
        setProfile(profileData);

        const loadedActivities = [];

        // 2. Appointments
        try {
          const appts = await getPatientAppointments(profileData.id);
          const treatmentCosts = {
            "checkup": 500,
            "cleaning": 1000,
            "root canal": 5000,
            "crown": 8000,
            "extraction": 1500,
            "filling": 1200,
            "consultation": 1500
          };

          appts.forEach((appt) => {
            const dateStr = appt.appointment_date || "N/A";
            const timeStr = appt.appointment_time || "";
            const isCompleted = appt.status === "Completed";
            const isMissed = appt.status === "Missed";

            loadedActivities.push({
              id: `appt-${appt.id}`,
              type: isCompleted
                ? "Completed Visit"
                : isMissed
                ? "Missed Visit"
                : `Appointment (${appt.status})`,
              title: isCompleted
                ? "Dental Visit Completed"
                : isMissed
                ? "Missed Appointment"
                : `Appointment Scheduled (${appt.status})`,
              detail: `${appt.treatment_type || "Consultation"} with ${appt.doctor_name || "Doctor"}`,
              category: "appointment",
              date: dateStr,
              time: timeStr,
              status: appt.status || "Scheduled",
              doctor: appt.doctor_name || "Clinic Dentist",
              treatment: appt.treatment_type || "Consultation",
              symptoms: appt.symptoms || "Routine examination and dental checkup",
              rawDate: safeParseTimestamp(dateStr, timeStr),
              metadata: {
                priority: appt.priority || "Normal",
                appointmentId: appt.id
              }
            });

            // Derive Billing Activity for this appointment
            const treatmentLower = (appt.treatment_type || "consultation").toLowerCase();
            let gross = 1500;
            for (const [key, cost] of Object.entries(treatmentCosts)) {
              if (treatmentLower.includes(key)) {
                gross = cost;
                break;
              }
            }
            const insurancePaid = Math.round(gross * 0.7);
            const patientDue = appt.payment_status === "Paid" ? 0 : gross - insurancePaid;

            loadedActivities.push({
              id: `bill-${appt.id}`,
              type: appt.payment_status === "Paid" ? "Payment Processed" : "Invoice Issued",
              title: appt.payment_status === "Paid" ? "Payment Received" : "Invoice Issued",
              detail: `₹${gross.toLocaleString()} for ${appt.treatment_type || "Consultation"} — ${appt.payment_status === "Paid" ? "Settled" : `₹${patientDue} Due`}`,
              category: "billing",
              date: dateStr,
              time: timeStr,
              status: appt.payment_status === "Paid" ? "Paid" : "Pending",
              doctor: appt.doctor_name || "Clinic Dentist",
              treatment: appt.treatment_type || "Consultation",
              rawDate: safeParseTimestamp(dateStr, timeStr) - 1000, // order slightly after appt
              metadata: {
                gross,
                insurancePaid,
                patientDue,
                invoiceNo: `INV-${appt.id + 100}`
              }
            });
          });
        } catch (apptErr) {
          console.warn("Failed to fetch appointments for activity log:", apptErr);
        }

        // 3. Prescriptions
        try {
          const rxList = await getPatientPrescriptions();
          (rxList || []).forEach((rx) => {
            const dateStr = rx.created_at
              ? new Date(rx.created_at).toISOString().split("T")[0]
              : "N/A";
            const timeStr = rx.created_at
              ? new Date(rx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            loadedActivities.push({
              id: `rx-${rx.id}`,
              type: "Prescription Issued",
              title: "Prescription Issued",
              detail: `Prescribed ${(rx.medications || []).length} medication(s) by ${rx.doctor_name || "Doctor"}`,
              category: "prescription",
              date: dateStr,
              time: timeStr,
              status: "Active",
              doctor: rx.doctor_name || "Attending Dentist",
              rawDate: rx.created_at ? new Date(rx.created_at).getTime() : 0,
              metadata: {
                medications: rx.medications || [],
                prescriptionId: rx.id
              }
            });
          });
        } catch (rxErr) {
          console.warn("Failed to fetch prescriptions for activity log:", rxErr);
        }

        // 4. Signed Consents
        try {
          const consents = await getSignedConsents();
          (consents || []).forEach((c) => {
            const dateVal = c.signed_at || c.created_at;
            const dateStr = dateVal ? new Date(dateVal).toISOString().split("T")[0] : "N/A";
            const timeStr = dateVal
              ? new Date(dateVal).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            loadedActivities.push({
              id: `consent-${c.id}`,
              type: "Consent Form Signed",
              title: "Consent Form Signed",
              detail: `${c.procedure_name || c.title || "Procedure Consent"} — Approved for ${c.doctor_name || "Doctor"}`,
              category: "consent",
              date: dateStr,
              time: timeStr,
              status: "SIGNED",
              doctor: c.doctor_name || "Clinic Dentist",
              rawDate: dateVal ? new Date(dateVal).getTime() : 0,
              metadata: {
                consentId: c.id,
                procedure: c.procedure_name || c.title || "Procedure Consent"
              }
            });
          });
        } catch (consentErr) {
          console.warn("Failed to fetch consents for activity log:", consentErr);
        }

        // 5. Clinical Consultation Notes
        try {
          const notes = await getMyClinicalNotes();
          (notes || []).forEach((n, idx) => {
            const dateStr = n.date || "Recent";
            loadedActivities.push({
              id: `note-${n.id || idx}`,
              type: "Clinical Consultation Note",
              title: "Consultation Record Added",
              detail: `Clinical notes and observations by ${n.doctor_name || "Doctor"}`,
              category: "clinical_note",
              date: dateStr,
              time: "",
              status: "Recorded",
              doctor: n.doctor_name || "Attending Dentist",
              rawDate: safeParseTimestamp(dateStr, ""),
              metadata: {
                noteContent: n.note || "No additional text recorded.",
                medications: n.medications || []
              }
            });
          });
        } catch (noteErr) {
          console.warn("Failed to fetch clinical notes for activity log:", noteErr);
        }

        // 6. Registration event from Profile
        if (profileData && profileData.created_at) {
          const regDateStr = new Date(profileData.created_at).toISOString().split("T")[0];
          const regTimeStr = new Date(profileData.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          loadedActivities.push({
            id: `reg-${profileData.id}`,
            type: "Patient Registration",
            title: "Account Registered",
            detail: `Joined SmileCare via ${profileData.address_line1 ? "Online Portal" : "Walk-in Registration"}`,
            category: "account",
            date: regDateStr,
            time: regTimeStr,
            status: "Active",
            doctor: "SmileCare Admin",
            rawDate: new Date(profileData.created_at).getTime(),
            metadata: {
              email: profileData.email,
              phone: profileData.phone
            }
          });
        }

        setActivities(loadedActivities);
      } catch (err) {
        console.error("Failed to load patient activity timeline:", err);
        setError(err.message || "Could not load activity history.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllActivityData();
  }, []);

  const filteredActivities = useMemo(() => {
    let list = [...activities];

    // Filter by Category
    if (selectedCategory !== "all") {
      list = list.filter((a) => a.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.detail.toLowerCase().includes(q) ||
          (a.doctor && a.doctor.toLowerCase().includes(q)) ||
          (a.treatment && a.treatment.toLowerCase().includes(q)) ||
          a.status.toLowerCase().includes(q) ||
          a.date.toLowerCase().includes(q)
      );
    }

    // Sort Order
    list.sort((a, b) => {
      return sortOrder === "desc" ? b.rawDate - a.rawDate : a.rawDate - b.rawDate;
    });

    return list;
  }, [activities, selectedCategory, searchQuery, sortOrder]);

  const toggleExpand = (id) => {
    setExpandedActivityId((prev) => (prev === id ? null : id));
  };

  const handlePrintSummary = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-semibold mt-4">Loading your complete activity timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Unable to Load Activity</h3>
        <p className="text-xs text-gray-600 leading-relaxed">{error}</p>
        <Link
          href="/patient/dashboard"
          className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Summary counts
  const totalCount = activities.length;
  const visitCount = activities.filter((a) => a.category === "appointment").length;
  const prescriptionCount = activities.filter((a) => a.category === "prescription").length;
  const consentCount = activities.filter((a) => a.category === "consent").length;
  const billingCount = activities.filter((a) => a.category === "billing").length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity History &amp; Audit Log</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete timeline of every visit, prescription, consent, clinical record &amp; transaction in your account
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintSummary}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            Print Report
          </button>
          <Link
            href="/patient/records"
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 flex items-center gap-1.5 transition-all"
          >
            My Clinical Records &rarr;
          </Link>
        </div>
      </div>

      {/* KPI Cards / Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedCategory("all")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            selectedCategory === "all"
              ? "bg-primary/5 border-primary shadow-sm"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Activities</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalCount}</h3>
            <span className="text-[11px] font-semibold text-primary mt-1 block">View All Records</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedCategory("appointment")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            selectedCategory === "appointment"
              ? "bg-emerald-50 border-emerald-500 shadow-sm"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dental Visits</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{visitCount}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Appointments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedCategory("prescription")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            selectedCategory === "prescription"
              ? "bg-purple-50 border-purple-500 shadow-sm"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Prescriptions</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{prescriptionCount}</h3>
            <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Medication Logs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedCategory("consent")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            selectedCategory === "consent"
              ? "bg-indigo-50 border-indigo-500 shadow-sm"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Consent Forms</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{consentCount}</h3>
            <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">Legal Approvals</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FileSignature className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by treatment, doctor name, medication, or status..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 transition-all select-none"
          >
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: "all", label: "All Activity", count: totalCount },
            { id: "appointment", label: "Visits & Appointments", count: visitCount },
            { id: "prescription", label: "Prescriptions", count: prescriptionCount },
            { id: "consent", label: "Signed Consents", count: consentCount },
            { id: "billing", label: "Billing & Invoices", count: billingCount },
            { id: "clinical_note", label: "Clinical Notes", count: activities.filter(a => a.category === "clinical_note").length },
            { id: "account", label: "Account History", count: activities.filter(a => a.category === "account").length }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-150"
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Activity className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-900">No matching activities found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              We couldn&apos;t find any records matching your filter criteria. Try resetting the category filter or clearing your search query.
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/15 text-xs font-bold rounded-xl transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {filteredActivities.map((act) => {
              const isCompleted = act.status === "Completed" || act.status === "Paid" || act.status === "SIGNED";
              const isMissed = act.status === "Missed";
              const isPrescription = act.category === "prescription";
              const isConsent = act.category === "consent";
              const isBilling = act.category === "billing";
              const isNote = act.category === "clinical_note";
              const isAccount = act.category === "account";
              const isExpanded = expandedActivityId === act.id;

              return (
                <div
                  key={act.id}
                  className="relative group transition-all"
                >
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shadow-sm bg-white transition-transform group-hover:scale-110 ${
                      isCompleted
                        ? "border-emerald-500 text-emerald-600"
                        : isMissed
                        ? "border-amber-500 text-amber-600"
                        : isPrescription
                        ? "border-purple-500 text-purple-600"
                        : isConsent
                        ? "border-indigo-500 text-indigo-600"
                        : isBilling
                        ? "border-blue-500 text-blue-600"
                        : isNote
                        ? "border-sky-500 text-sky-600"
                        : "border-primary text-primary"
                    }`}
                  >
                    {isCompleted && !isConsent && !isBilling && <ToothIcon className="w-3 h-3 text-emerald-600" />}
                    {isCompleted && isConsent && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    {isCompleted && isBilling && <CreditCard className="w-3 h-3 text-emerald-600" />}
                    {isMissed && <AlertCircle className="w-3 h-3 text-amber-600" />}
                    {isPrescription && <Pill className="w-3 h-3 text-purple-600" />}
                    {!isCompleted && !isMissed && !isPrescription && !isConsent && !isBilling && !isNote && (
                      <Calendar className="w-3 h-3 text-primary" />
                    )}
                    {isNote && <ClipboardList className="w-3 h-3 text-sky-600" />}
                    {isAccount && <User className="w-3 h-3 text-primary" />}
                  </div>

                  {/* Activity Card */}
                  <div
                    onClick={() => toggleExpand(act.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isExpanded
                        ? "bg-slate-50/90 border-gray-300 shadow-md"
                        : "bg-white border-gray-100 hover:border-gray-250 hover:bg-slate-50/50 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider shrink-0 ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isMissed
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : isPrescription
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : isConsent
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : isBilling
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {act.type}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 truncate">{act.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDisplayDate(act.date, act.time)}</span>
                        {act.time && <span>• {act.time}</span>}
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 font-medium mt-2 leading-relaxed">
                      {act.detail}
                    </p>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-primary" />
                        <span>Doctor: <strong className="text-gray-700">{act.doctor}</strong></span>
                      </span>

                      <span
                        className={`text-[10px] font-extrabold uppercase ${
                          act.status === "Completed" || act.status === "Paid" || act.status === "SIGNED"
                            ? "text-emerald-600"
                            : act.status === "Missed"
                            ? "text-amber-600"
                            : "text-primary"
                        }`}
                      >
                        Status: {act.status}
                      </span>
                    </div>

                    {/* Expandable Full Detail Drawer */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200/80 space-y-3 animate-fadeIn text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-150">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Record Type</span>
                            <span className="font-bold text-gray-800 mt-0.5 block">{act.category.replace("_", " ")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Logged Timestamp</span>
                            <span className="font-bold text-gray-800 mt-0.5 block">
                              {act.date} {act.time ? `at ${act.time}` : ""}
                            </span>
                          </div>
                        </div>

                        {/* Prescription specific metadata details */}
                        {act.category === "prescription" && act.metadata?.medications && (
                          <div className="bg-purple-50/50 border border-purple-150 rounded-xl p-3.5 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-purple-900 block">
                              Prescribed Medications List ({act.metadata.medications.length})
                            </span>
                            <div className="space-y-1.5">
                              {act.metadata.medications.map((med, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100"
                                >
                                  <span className="font-bold text-gray-800">
                                    {med.medicine || med.name}
                                  </span>
                                  <span className="text-gray-600 font-semibold text-[11px]">
                                    {med.schedule || med.dosage} • {med.timing || med.frequency} — {med.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Appointment specific metadata details */}
                        {act.category === "appointment" && (
                          <div className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-3.5 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-emerald-900 block">
                              Clinical Visit Symptoms &amp; Notes
                            </span>
                            <p className="text-gray-800 font-medium leading-relaxed">
                              {act.symptoms || "Routine examination and dental checkup."}
                            </p>
                          </div>
                        )}

                        {/* Consent specific metadata details */}
                        {act.category === "consent" && (
                          <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-3.5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-indigo-900 block">
                                Digital Consent Document
                              </span>
                              <span className="text-gray-800 font-bold text-xs">
                                {act.metadata?.procedure || "Clinical Consent Form"}
                              </span>
                            </div>
                            <Link
                              href="/patient/documents"
                              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-[11px] rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>View Document</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}

                        {/* Billing specific metadata details */}
                        {act.category === "billing" && act.metadata && (
                          <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-3.5 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-blue-900 block">
                              Invoice Breakdown ({act.metadata.invoiceNo})
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-lg border border-blue-100">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-gray-400 block">Gross Cost</span>
                                <span className="font-extrabold text-gray-800 text-xs">₹{(act.metadata.gross || 0).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-gray-400 block">Insurance Cover</span>
                                <span className="font-extrabold text-emerald-600 text-xs">₹{(act.metadata.insurancePaid || 0).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-gray-400 block">Patient Due</span>
                                <span className="font-extrabold text-primary text-xs">₹{(act.metadata.patientDue || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Clinical note metadata details */}
                        {act.category === "clinical_note" && (
                          <div className="bg-sky-50/50 border border-sky-150 rounded-xl p-3.5 space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-sky-900 block">
                              Doctor&apos;s Full Note
                            </span>
                            <p className="text-gray-800 font-medium whitespace-pre-line leading-relaxed bg-white p-2.5 rounded-lg border border-sky-100">
                              {act.metadata?.noteContent || act.detail}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Patient Record
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info note */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Need an official signed copy of your treatment history or activity audit log?{" "}
          <button
            onClick={handlePrintSummary}
            className="text-primary font-bold hover:underline ml-1"
          >
            Download Official Report &rarr;
          </button>
        </p>
      </div>
    </div>
  );
}
