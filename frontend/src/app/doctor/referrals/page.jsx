"use client";

import { useState, useEffect, useRef } from "react";
import { useDoctor } from "@/app/doctor/layout";
import { 
  ArrowRight, 
  ChevronRight, 
  Share2, 
  User, 
  Heart, 
  Microscope, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  Stethoscope, 
  Clock,
  ClipboardList,
  X,
  Search
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

export default function DoctorReferralsPage() {
  const { 
    referrals, 
    handleCompleteReferral,
    patients,
    notifications = [],
    markAsRead,
    markAsUnread
  } = useDoctor();

  const [newlyAddedIds, setNewlyAddedIds] = useState([]);
  const newlyAddedIdsRef = useRef([]);

  useEffect(() => {
    newlyAddedIdsRef.current = newlyAddedIds;
  }, [newlyAddedIds]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const pageNotifications = notifications.filter(
        n => n.status === "unread" && n.link === "/doctor/referrals"
      );
      if (pageNotifications.length > 0) {
        const itemIds = pageNotifications.map(n => n.itemId);
        setNewlyAddedIds(itemIds);
        pageNotifications.forEach(n => markAsRead(n.id));
      }
    }

    const reminderTimer = setTimeout(() => {
      const remainingUnread = newlyAddedIdsRef.current;
      if (remainingUnread.length > 0) {
        remainingUnread.forEach(itemId => markAsUnread(itemId));
      }
    }, 15000);

    return () => {
      clearTimeout(reminderTimer);
      const remainingUnread = newlyAddedIdsRef.current;
      if (remainingUnread.length > 0) {
        remainingUnread.forEach(itemId => markAsUnread(itemId));
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState("incoming"); // incoming | outgoing
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Consultation Response Form States
  const [consultNotes, setConsultNotes] = useState("");
  const [medsList, setMedsList] = useState([]);
  const [currentMed, setCurrentMed] = useState({ name: "", dosage: "", duration: "" });

  const incomingReferrals = referrals
    .filter(r => r.referredBy !== "Dr. Anoop Nair")
    .filter(r => {
      const pat = patients[r.patientToken];
      const nameMatch = pat?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = r.patientToken?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || idMatch;
    })
    .sort((a, b) => {
      if (a.status === "Pending" && b.status === "Completed") return -1;
      if (a.status === "Completed" && b.status === "Pending") return 1;
      return 0;
    });

  const outgoingReferrals = referrals
    .filter(r => r.referredBy === "Dr. Anoop Nair")
    .filter(r => {
      const pat = patients[r.patientToken];
      const nameMatch = pat?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = r.patientToken?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || idMatch;
    })
    .sort((a, b) => {
      if (a.status === "Pending" && b.status === "Completed") return -1;
      if (a.status === "Completed" && b.status === "Pending") return 1;
      return 0;
    });

  const selectedReferral = referrals.find(r => r.id === selectedReferralId);
  const selectedPatient = selectedReferral ? patients[selectedReferral.patientToken] : null;

  // Add medication to response checklist
  const handleAddMed = () => {
    if (!currentMed.name.trim() || !currentMed.dosage.trim()) return;
    setMedsList(prev => [...prev, { ...currentMed, id: Date.now() }]);
    setCurrentMed({ name: "", dosage: "", duration: "" });
  };

  const handleRemoveMed = (medId) => {
    setMedsList(prev => prev.filter(m => m.id !== medId));
  };

  const handleSubmitConsultation = (e) => {
    e.preventDefault();
    if (!consultNotes.trim()) return;

    // Map medicines list to simple prescription formats
    const medsTextList = medsList.map(m => ({
      medicine: m.name,
      schedule: m.dosage,
      timing: "As Directed",
      duration: m.duration || "5 Days"
    }));

    handleCompleteReferral(selectedReferral.id, consultNotes.trim(), medsTextList);
    
    // Reset inputs
    setConsultNotes("");
    setMedsList([]);
    setSelectedReferralId(null);
  };

  // Helper to get styling for tooth chart (Read Only)
  const getToothStyles = (teethChart, tooth) => {
    const state = teethChart?.[tooth];
    if (state === "active-treatment") return "bg-red-50 border-danger text-danger font-extrabold shadow-sm";
    if (state === "restored") return "bg-success/10 border-success text-success";
    if (state === "lab-ordered") return "bg-warning/10 border-warning text-warning";
    return "bg-white border-gray-250 text-gray-400";
  };

  const getToothEmoji = (teethChart, tooth) => {
    const state = teethChart?.[tooth];
    if (state === "active-treatment") return "🚨";
    if (state === "restored") return "👑";
    if (state === "lab-ordered") return "🔬";
    return "🦷";
  };

  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-primary" /> Specialist Consultation Referrals
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review referral records and respond with specialist dental recommendations.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button 
            onClick={() => { setActiveTab("incoming"); setSelectedReferralId(null); }}
            className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "incoming" ? "bg-white text-gray-900 shadow-sm" : "text-gray-505 hover:text-gray-900"
            }`}
          >
            Incoming ({incomingReferrals.length})
          </button>
          <button 
            onClick={() => { setActiveTab("outgoing"); setSelectedReferralId(null); }}
            className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "outgoing" ? "bg-white text-gray-900 shadow-sm" : "text-gray-505 hover:text-gray-900"
            }`}
          >
            Outgoing ({outgoingReferrals.length})
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Pane */}
        <div className={`space-y-4 ${selectedReferralId ? "lg:col-span-4" : "lg:col-span-12"}`}>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {activeTab === "incoming" ? "Consultations Requested of Me" : "Referred by Me to Other Doctors"}
            </h3>

            {/* Search Input Box */}
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-xl px-3 py-2 transition-all">
              <Search className="text-gray-400 mr-2 w-4 h-4 shrink-0" />
              <input
                type="text"
                placeholder="Search patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-400 text-gray-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(activeTab === "incoming" ? incomingReferrals : outgoingReferrals).map((ref) => {
                const pat = patients[ref.patientToken];
                const isSelected = selectedReferralId === ref.id;

                return (
                  <button
                    key={ref.id}
                    onClick={() => {
                      setSelectedReferralId(ref.id);
                      setConsultNotes(ref.myConsultationNotes || "");
                      setMedsList([]);
                      setNewlyAddedIds(prev => prev.filter(id => id !== ref.id));
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col justify-between items-start cursor-pointer hover:scale-101 ${
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" 
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400">{ref.id} • {ref.date}</span>
                        <h4 className="font-bold text-gray-900 text-sm mt-0.5 flex items-center gap-1.5">
                          {pat?.name || "Unknown Patient"}
                          {newlyAddedIds.includes(ref.id) && (
                            <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="New Referral" />
                          )}
                        </h4>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        ref.status === "Pending" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                      }`}>
                        {ref.status}
                      </span>
                    </div>

                    <div className="w-full border-t border-dashed border-gray-200/60 my-3"></div>

                    <div className="text-xs text-gray-505 space-y-1 w-full">
                      <div className="flex justify-between">
                        <span>{activeTab === "incoming" ? "Referred By:" : "Target Doctor:"}</span>
                        <span className="font-bold text-gray-800">{ref.referredBy} ({ref.speciality})</span>
                      </div>
                      <p className="line-clamp-2 italic text-[11px] text-gray-400 mt-1">"{ref.reason}"</p>
                    </div>
                  </button>
                );
              })}

              {(activeTab === "incoming" ? incomingReferrals : outgoingReferrals).length === 0 && (
                <div className="text-center py-12 text-gray-400 font-semibold border border-dashed border-gray-250 rounded-xl">
                  No {activeTab} referrals found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Details Pane (Displays when selected) */}
        {selectedReferralId && selectedReferral && (
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-left">
            
            {/* Detail Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded">
                  Referral Details
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-2">
                  Referred Patient: {selectedPatient?.name}
                </h2>
                <p className="text-xs text-gray-550 mt-1">
                  Age: {selectedPatient?.age} • Gender: {selectedPatient?.gender} • Phone: {selectedPatient?.phone}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReferralId(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Referral Reason Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Referring Doctor Notes</span>
                <span className="font-bold text-slate-800">{selectedReferral.referredBy} ({selectedReferral.speciality})</span>
              </div>
              <p className="text-sm font-medium text-gray-700 italic">"{selectedReferral.reason}"</p>
            </div>

            {/* Read-Only Tooth Chart of Patient */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <ToothIcon className="w-4.5 h-4.5 text-primary" /> Patient Tooth Chart
              </h4>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/20 overflow-x-auto">
                <div className="min-w-[450px] flex flex-col items-center gap-3">
                  {/* Upper Row */}
                  <div className="flex gap-1">
                    {upperTeeth.map(tooth => (
                      <div 
                        key={tooth} 
                        className={`w-7 h-7 rounded border text-[9px] font-bold flex flex-col items-center justify-center ${getToothStyles(selectedReferral.teethChart, tooth)}`}
                      >
                        {tooth}
                        <span className="text-[6px]">{getToothEmoji(selectedReferral.teethChart, tooth)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Lower Row */}
                  <div className="flex gap-1">
                    {lowerTeeth.map(tooth => (
                      <div 
                        key={tooth} 
                        className={`w-7 h-7 rounded border text-[9px] font-bold flex flex-col items-center justify-center ${getToothStyles(selectedReferral.teethChart, tooth)}`}
                      >
                        {tooth}
                        <span className="text-[6px]">{getToothEmoji(selectedReferral.teethChart, tooth)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Clinical History Timeline (Read Only) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-primary" /> Past Clinical History
              </h4>
              <div className="max-h-[140px] overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/20">
                {selectedPatient?.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-3 text-left">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400">{event.date} • {event.type}</p>
                      <p className="text-xs text-gray-700 font-medium mt-0.5">{event.note}</p>
                    </div>
                  </div>
                ))}
                {(!selectedPatient?.timeline || selectedPatient.timeline.length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-2">No past history recorded.</p>
                )}
              </div>
            </div>

            {/* RESPOND FORM (Only if Pending and Tab is Incoming) */}
            {selectedReferral.status === "Pending" && activeTab === "incoming" ? (
              <form onSubmit={handleSubmitConsultation} className="border-t border-gray-100 pt-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Stethoscope className="w-4.5 h-4.5 text-primary" /> Submit Consultation Findings
                  </h4>
                  <textarea
                    rows={3}
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Enter your clinical diagnosis and evaluation findings here..."
                    className="w-full px-4 py-2 border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Medications List responses */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-450 tracking-wider block">Medications & Prescriptions</label>
                  
                  {/* Added list */}
                  {medsList.length > 0 && (
                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 space-y-1">
                      {medsList.map(med => (
                        <div key={med.id} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700">{med.name} — {med.dosage} ({med.duration})</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMed(med.id)}
                            className="text-danger hover:text-danger/80 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Medicine Name (eg. Paracetamol)" 
                      value={currentMed.name}
                      onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                      className="sm:col-span-5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none text-gray-700 focus:bg-white focus:border-primary"
                    />
                    <input 
                      type="text" 
                      placeholder="Schedule (eg. 1-0-1)" 
                      value={currentMed.dosage}
                      onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                      className="sm:col-span-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none text-gray-700 focus:bg-white focus:border-primary"
                    />
                    <input 
                      type="text" 
                      placeholder="Duration (eg. 5 Days)" 
                      value={currentMed.duration}
                      onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                      className="sm:col-span-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none text-gray-700 focus:bg-white focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="sm:col-span-1 bg-primary text-white rounded-lg p-1.5 flex items-center justify-center hover:bg-primary/95 transition-all shadow shadow-primary/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/95 transition-all shadow-md shadow-success/15 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Submit Consultation & Save
                  </button>
                </div>
              </form>
            ) : (
              /* COMPLETED VIEWS OR OUTGOING LOGS */
              <div className="border-t border-gray-100 pt-5 space-y-4 text-left">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4.5 h-4.5 text-success" /> Completed Consultation Findings
                </h4>
                {selectedReferral.status === "Completed" ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-gray-150 rounded-xl p-4.5">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Consultation Notes</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedReferral.myConsultationNotes}</p>
                    </div>

                    {selectedReferral.myMedications && selectedReferral.myMedications.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Prescribed Medications</p>
                        <div className="bg-slate-50 border border-gray-150 rounded-xl p-3.5 space-y-1">
                          {selectedReferral.myMedications.map((m, i) => (
                            <div key={i} className="text-xs font-semibold text-gray-700">
                              💊 {m.medicine} — {m.schedule} for {m.duration}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 font-semibold border border-dashed border-gray-200 rounded-xl text-xs">
                    Pending consultation response by {selectedReferral.referredBy === "Dr. Anoop Nair" ? selectedReferral.targetDoctor : "Dr. Anoop Nair"}.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
