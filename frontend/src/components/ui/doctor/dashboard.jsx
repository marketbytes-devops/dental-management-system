"use client";

import { useState } from "react";

export default function DoctorDashboard() {
  // Mock initial state for queue
  const [queue, setQueue] = useState([
    { token: "#005", name: "Rohan Varma", time: "11:45 AM", status: "Waiting", procedure: "Consultation", age: 28, gender: "Male" },
    { token: "#006", name: "Priya Nair", time: "12:15 PM", status: "Waiting", procedure: "Scaling & Polishing", age: 34, gender: "Female" },
    { token: "#007", name: "Deepak Kurian", time: "12:45 PM", status: "Waiting", procedure: "Root Canal Treatment", age: 45, gender: "Male" },
    { token: "#008", name: "Meera Pillai", time: "01:30 PM", status: "Waiting", procedure: "Extraction", age: 62, gender: "Female" },
  ]);

  // Current patient in chair
  const [currentPatient, setCurrentPatient] = useState({
    token: "#004",
    name: "Rahul Kumar",
    age: 32,
    gender: "Male",
    procedure: "RCT - Single Sitting (Tooth #16)",
    chiefComplaint: "Severe throbbing pain in the upper right back tooth, sensitive to hot & cold.",
    medicalHistory: "No known systemic illness. Non-diabetic.",
    timeline: [
      { date: "02-06-2026", note: "Diagnostic X-ray completed. Deep dentinal caries reaching pulp on #16." },
      { date: "05-06-2026", note: "Scaling completed. RCT initiated (pulpectomy done, temporary filling)." }
    ]
  });

  const [completedCount, setCompletedCount] = useState(3);
  const [activeTab, setActiveTab] = useState("charting");
  const [notification, setNotification] = useState("");

  // Quick Action Modal states
  const [modalType, setModalType] = useState(null); // 'notes', 'prescription', 'lab', 'xray'
  const [modalInput, setModalInput] = useState("");

  // Lab Cases Tracker
  const [labCases, setLabCases] = useState([
    { id: "LAB-291", patient: "Sneha Joseph", item: "Zirconia Crown #24", status: "In Production", labName: "Apex Dental Lab", eta: "Tomorrow" },
    { id: "LAB-289", patient: "George Mathew", item: "Ceramic Bridge #35-37", status: "Ready / Shipped", labName: "Elite Milling Center", eta: "Today (3:00 PM)" },
    { id: "LAB-288", patient: "Abhilash K.", item: "Maxillary Clear Aligners", status: "Delivered", labName: "SmileAlign Labs", eta: "Completed" }
  ]);

  // Interactive functions
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleCallNext = () => {
    if (queue.length === 0) {
      showNotification("No patients remaining in the waiting queue.");
      return;
    }

    // Save current patient to completed list simulation
    if (currentPatient) {
      setCompletedCount(prev => prev + 1);
    }

    const next = queue[0];
    const updatedQueue = queue.slice(1);
    setQueue(updatedQueue);

    setCurrentPatient({
      token: next.token,
      name: next.name,
      age: next.age,
      gender: next.gender,
      procedure: next.procedure,
      chiefComplaint: `Referred for scheduled ${next.procedure.toLowerCase()}.`,
      medicalHistory: "Under evaluation.",
      timeline: [{ date: "10-06-2026", note: "Check-in completed. Waiting room queue transition." }]
    });

    showNotification(`Calling patient ${next.name} (Token ${next.token}) to the dental chair.`);
  };

  const handleMarkComplete = () => {
    if (!currentPatient) {
      showNotification("No patient is currently in the chair.");
      return;
    }

    showNotification(`Consultation and procedure completed for ${currentPatient.name}.`);
    setCompletedCount(prev => prev + 1);
    setCurrentPatient(null);
  };

  const handleSkipPatient = (token) => {
    const updatedQueue = queue.map(p => {
      if (p.token === token) {
        return { ...p, status: "Skipped" };
      }
      return p;
    });
    setQueue(updatedQueue);
    showNotification(`Patient with token ${token} marked as skipped.`);
  };

  const handleRecallPatient = (token) => {
    const updatedQueue = queue.map(p => {
      if (p.token === token) {
        return { ...p, status: "Waiting" };
      }
      return p;
    });
    setQueue(updatedQueue);
    showNotification(`Patient with token ${token} returned to waiting status.`);
  };

  const submitModalAction = (e) => {
    e.preventDefault();
    if (!modalInput.trim()) return;

    if (modalType === "notes") {
      if (currentPatient) {
        setCurrentPatient({
          ...currentPatient,
          timeline: [
            { date: "10-06-2026 (Today)", note: modalInput },
            ...currentPatient.timeline
          ]
        });
        showNotification("Clinical note added successfully.");
      }
    } else if (modalType === "prescription") {
      showNotification(`Prescription written: "${modalInput}"`);
    } else if (modalType === "lab") {
      const newLab = {
        id: `LAB-${Math.floor(100 + Math.random() * 900)}`,
        patient: currentPatient ? currentPatient.name : "Walk-in Patient",
        item: modalInput,
        status: "Requested",
        labName: "Apex Dental Lab",
        eta: "3 Days"
      };
      setLabCases([newLab, ...labCases]);
      showNotification(`Dental lab request created for "${modalInput}"`);
    } else if (modalType === "xray") {
      showNotification(`X-ray request submitted: "${modalInput}"`);
    }

    setModalInput("");
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
          <span className="text-primary">🔔</span>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Profile Info */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
            👨‍⚕️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dr. Anoop Nair</h1>
            <p className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-0.5">
              <span>🦷 MDS - Conservative Dentistry & Endodontics</span>
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">Active Duty</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCallNext}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 transition-colors shadow-sm shadow-primary/20 flex items-center gap-2 cursor-pointer outline-none"
          >
            <span>📢</span> Call Next Patient
          </button>
          {currentPatient && (
            <button
              onClick={handleMarkComplete}
              className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-success/95 transition-colors shadow-sm shadow-success/20 flex items-center gap-2 cursor-pointer outline-none"
            >
              <span>✅</span> Complete Treatment
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Chair */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Patient</p>
            <h3 className="text-xl font-bold text-gray-900 truncate max-w-[170px]">
              {currentPatient ? currentPatient.name : "Chair Empty"}
            </h3>
            <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
              {currentPatient ? `${currentPatient.token} • In Chair` : "Call next from queue"}
            </p>
          </div>
          <span className="text-2xl bg-primary/10 p-2.5 rounded-xl text-primary">🛋️</span>
        </div>

        {/* Card 2: Patients in Queue */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Queue Waiting</p>
            <h3 className="text-2xl font-bold text-gray-900">{queue.filter(p => p.status === "Waiting").length} Patients</h3>
            <p className="text-xs text-secondary font-medium mt-2">
              Approx. {queue.filter(p => p.status === "Waiting").length * 20} mins wait time
            </p>
          </div>
          <span className="text-2xl bg-secondary/10 p-2.5 rounded-xl text-secondary">⏳</span>
        </div>

        {/* Card 3: Consultations Done */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-success/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completed Today</p>
            <h3 className="text-2xl font-bold text-gray-900">{completedCount} Patients</h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>📈</span> 85% of target schedule
            </p>
          </div>
          <span className="text-2xl bg-success/10 p-2.5 rounded-xl text-success">✅</span>
        </div>

        {/* Card 4: Pending Lab Cases */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Lab Work</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {labCases.filter(c => c.status !== "Delivered").length} Active
            </h3>
            <p className="text-xs text-warning font-medium mt-2">
              1 due today from lab
            </p>
          </div>
          <span className="text-2xl bg-warning/10 p-2.5 rounded-xl text-warning">🔬</span>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Doctor Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setModalType("notes")}
            disabled={!currentPatient}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-gray-700 hover:text-primary group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:hover:text-gray-700 cursor-pointer outline-none"
          >
            <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">📝</span>
            <span className="text-xs font-semibold">Clinical Note</span>
          </button>

          <button
            onClick={() => setModalType("prescription")}
            disabled={!currentPatient}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-secondary/20 hover:bg-secondary/5 transition-all text-gray-700 hover:text-secondary group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:hover:text-gray-700 cursor-pointer outline-none"
          >
            <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">💊</span>
            <span className="text-xs font-semibold">Prescription</span>
          </button>

          <button
            onClick={() => setModalType("lab")}
            disabled={!currentPatient}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-warning/20 hover:bg-warning/5 transition-all text-gray-700 hover:text-warning group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:hover:text-gray-700 cursor-pointer outline-none"
          >
            <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🦷</span>
            <span className="text-xs font-semibold">Lab Work Order</span>
          </button>

          <button
            onClick={() => setModalType("xray")}
            disabled={!currentPatient}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-danger/20 hover:bg-danger/5 transition-all text-gray-700 hover:text-danger group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:hover:text-gray-700 cursor-pointer outline-none"
          >
            <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🩻</span>
            <span className="text-xs font-semibold">Request X-Ray</span>
          </button>

          <button
            onClick={handleCallNext}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-success/20 hover:bg-success/5 transition-all text-gray-700 hover:text-success group cursor-pointer outline-none"
          >
            <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🔊</span>
            <span className="text-xs font-semibold">Call Patient</span>
          </button>

          <button
            onClick={() => showNotification("Navigating to comprehensive dental chart view.")}
            disabled={!currentPatient}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-gray-700 hover:text-primary group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:hover:text-gray-700 cursor-pointer outline-none"
          >
            <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">📊</span>
            <span className="text-xs font-semibold">Full Dental Chart</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Chair Treatment Panel */}
        <div className="lg:col-span-2 space-y-6">
          {currentPatient ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-5 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {currentPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      {currentPatient.name}
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-normal">
                        {currentPatient.token}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Age: {currentPatient.age} • Gender: {currentPatient.gender}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-yellow-50 text-warning border border-warning/20 rounded-lg text-xs font-semibold">
                    In Dental Chair
                  </span>
                </div>
              </div>

              {/* Treatment Area Tabs */}
              <div className="border-b border-gray-100 flex px-5 bg-gray-50/50">
                <button
                  onClick={() => setActiveTab("charting")}
                  className={`px-4 py-3 text-xs font-semibold transition-colors relative border-b-2 cursor-pointer outline-none ${activeTab === "charting" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  Clinical Assessment
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`px-4 py-3 text-xs font-semibold transition-colors relative border-b-2 cursor-pointer outline-none ${activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  Treatment History
                </button>
              </div>

              <div className="p-6">
                {activeTab === "charting" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Chief Complaint</span>
                        <p className="text-sm font-medium text-gray-800">{currentPatient.chiefComplaint}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Planned Procedure</span>
                        <p className="text-sm font-semibold text-primary">{currentPatient.procedure}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50/40 rounded-xl border border-danger/10">
                      <span className="text-xs font-bold text-danger uppercase tracking-wider block mb-1">Medical Alert & History</span>
                      <p className="text-sm font-medium text-gray-700">{currentPatient.medicalHistory}</p>
                    </div>

                    {/* Tooth Selection Visual Mock */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/30">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dental Chart & Tooth Map</h4>
                      <div className="flex flex-col items-center gap-4">
                        {/* Upper Jaw Teeth */}
                        <div className="flex gap-1.5 flex-wrap justify-center">
                          {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(tooth => {
                            const isAffected = tooth === 16;
                            const isTreated = tooth === 24;
                            return (
                              <button
                                key={tooth}
                                onClick={() => showNotification(`Tooth #${tooth} selected for analysis.`)}
                                className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border cursor-pointer transition-all ${isAffected ? "bg-red-100 border-danger text-danger font-extrabold shadow-sm" : isTreated ? "bg-success/10 border-success text-success" : "bg-white border-gray-200 text-gray-500 hover:border-primary/50 hover:text-primary"}`}
                              >
                                {tooth}
                                <span className="text-[6px]">{isAffected ? "🚨" : isTreated ? "👑" : "🦷"}</span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Lower Jaw Teeth */}
                        <div className="flex gap-1.5 flex-wrap justify-center">
                          {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(tooth => (
                            <button
                              key={tooth}
                              onClick={() => showNotification(`Tooth #${tooth} selected for analysis.`)}
                              className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                            >
                              {tooth}
                              <span className="text-[6px]">🦷</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-center gap-4 mt-4 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-100 border border-danger"></span> Active Treatment (#16)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success/10 border border-success"></span> Restored/Crown (#24)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white border border-gray-200"></span> Healthy Tooth</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Previous Visits & Notes</h4>
                    {currentPatient.timeline.map((event, idx) => (
                      <div key={idx} className="flex gap-4 items-start relative pb-4 last:pb-0">
                        {idx !== currentPatient.timeline.length - 1 && (
                          <span className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-gray-100"></span>
                        )}
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-primary">{event.date}</span>
                            <span className="text-[10px] text-gray-400">Dr. Anoop Nair</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed font-medium">{event.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center shadow-sm">
              <span className="text-5xl block mb-4">🛋️</span>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Patient in Chair</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Call the next patient from the waiting room queue to begin treatment, view history, or log diagnoses.</p>
              <button
                onClick={handleCallNext}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-sm shadow-primary/20 flex items-center gap-2 mx-auto cursor-pointer"
              >
                📢 Call Next Patient
              </button>
            </div>
          )}

          {/* Dental Lab Orders Tracker */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🔬</span> Custom Dental Lab Orders
              </h3>
              <span className="text-xs text-gray-500 font-medium">Tracking custom fabrications</span>
            </div>
            <div className="divide-y divide-gray-100">
              {labCases.map((c) => (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 first:pt-0 last:pb-0 group">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{c.patient}</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{c.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">{c.item} • <span className="text-gray-400">{c.labName}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">ETA: {c.eta}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "Delivered" ? "bg-success/10 text-success" : c.status === "Ready / Shipped" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Live Patient Queue */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>⏳</span> Waiting Queue
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Live check-in room status</p>
            </div>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {queue.filter(p => p.status === "Waiting").length} Waiting
            </span>
          </div>

          <div className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Waiting room is empty.</p>
            ) : (
              queue.map((patient, idx) => {
                const isWaiting = patient.status === "Waiting";
                return (
                  <div key={idx} className={`p-4 rounded-xl border transition-all ${isWaiting ? "bg-white border-gray-100 hover:border-primary/20" : "bg-gray-50 border-gray-200 opacity-60"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {patient.token}
                          </span>
                          <span className="text-sm font-bold text-gray-950">{patient.name}</span>
                        </div>
                        <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1.5">
                          <span>🦷</span> {patient.procedure}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Checked in at: {patient.time}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isWaiting ? "bg-primary/5 text-primary" : "bg-gray-200 text-gray-600"}`}>
                        {patient.status}
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end mt-3 border-t border-gray-50 pt-2.5">
                      {isWaiting ? (
                        <>
                          <button
                            onClick={() => handleSkipPatient(patient.token)}
                            className="px-2 py-1 text-[10px] font-semibold text-danger bg-danger/5 hover:bg-danger/10 transition-colors rounded cursor-pointer"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => {
                              // Call this patient directly into chair
                              if (currentPatient) {
                                setQueue([
                                  { ...currentPatient, token: currentPatient.token, status: "Waiting" },
                                  ...queue.filter(p => p.token !== patient.token)
                                ]);
                              } else {
                                setQueue(queue.filter(p => p.token !== patient.token));
                              }
                              setCurrentPatient({
                                token: patient.token,
                                name: patient.name,
                                age: patient.age,
                                gender: patient.gender,
                                procedure: patient.procedure,
                                chiefComplaint: `Referred for ${patient.procedure.toLowerCase()}.`,
                                medicalHistory: "Under evaluation.",
                                timeline: [{ date: "10-06-2026", note: "Checked-in patient moved directly to dental chair." }]
                              });
                              showNotification(`Called ${patient.name} to the dental chair.`);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-primary hover:bg-primary/95 transition-colors rounded shadow-sm shadow-primary/10 cursor-pointer"
                          >
                            Call
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRecallPatient(patient.token)}
                          className="px-2.5 py-1 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors rounded cursor-pointer"
                        >
                          Re-queue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Interactive Modal Component */}
      {modalType && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">
                {modalType === "notes" && "✍️ Add Clinical Diagnosis & Note"}
                {modalType === "prescription" && "💊 Write Prescription"}
                {modalType === "lab" && "🔬 Order Custom Dental Lab Work"}
                {modalType === "xray" && "🩻 Request Radiology / X-Ray"}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-lg cursor-pointer select-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitModalAction}>
              <div className="p-6 space-y-4">
                {currentPatient && (
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Active Treatment Patient</p>
                      <p className="text-sm font-bold text-gray-900">{currentPatient.name}</p>
                    </div>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{currentPatient.token}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    {modalType === "notes" && "Diagnosis Notes"}
                    {modalType === "prescription" && "Prescription & Dosage Details"}
                    {modalType === "lab" && "Dental Crown / Restorative Details"}
                    {modalType === "xray" && "Imaging Region (e.g. OPG, Intraoral #16)"}
                  </label>
                  <textarea
                    rows={4}
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder={
                      modalType === "notes" ? "Enter cavity levels, pulp status, bleeding indices..." :
                      modalType === "prescription" ? "Amoxicillin 500mg - 3 times daily for 5 days..." :
                      modalType === "lab" ? "Zirconia Crown for tooth #16, shade A2, medium glaze..." :
                      "Digital OPG / Cone Beam Computed Tomography (CBCT) region..."
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 transition-colors rounded-xl shadow-sm shadow-primary/15 cursor-pointer"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
