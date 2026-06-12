"use client";

import { Pill, Activity, ShieldAlert, Award, FileText } from "lucide-react";

export default function PatientRecordsPage() {
  const prescriptions = [
    { id: "RX-501", date: "2026-05-12", drug: "Amoxicillin 500mg", dosage: "1 capsule × 3 times/day", duration: "5 days", doctor: "Dr. Anoop Nair", status: "Active", note: "Take after food. Complete full course." },
    { id: "RX-482", date: "2025-11-20", drug: "Paracetamol 650mg", dosage: "1 tablet as needed", duration: "3 days", doctor: "Dr. Anoop Nair", status: "Expired", note: "Take for toothache or mild fever." }
  ];

  const clinicalNotes = [
    { date: "2026-05-12", treatment: "Scaling & Polishing", clinic: "SmileCare Center", comments: "Subgingival calculus removed, clean polishing completed. Mild gingival inflammation observed." },
    { date: "2024-10-02", treatment: "Dental Restoration (Composite filling)", clinic: "SmileCare Center", comments: "Class I cavity filled in molar #36. Filling checked and polished." }
  ];

  const allergies = ["Penicillin", "Sulfa Drugs", "Aspirin"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Medical Records</h1>
        <p className="text-sm text-gray-500 mt-1">
          Detailed summary of your dental history, current medications, clinical observations, and allergies.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Medications and History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Prescriptions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Pill className="w-5 h-5 text-warning" /> Active & Past Prescriptions
            </h3>

            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="border border-gray-100 rounded-xl p-4 hover:border-warning/30 transition-all bg-gray-50/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-950">{rx.drug}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          rx.status === "Active" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
                        }`}>
                          {rx.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{rx.dosage} · {rx.duration}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{rx.date}</span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-400">Dr. Instructions:</span> {rx.note}
                    </div>
                    <div className="font-medium text-gray-450 text-right">
                      Issued by: {rx.doctor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dental History & Treatment Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <FileText className="w-5 h-5 text-primary" /> Treatment Records
            </h3>

            <div className="space-y-4">
              {clinicalNotes.map((note, idx) => (
                <div key={idx} className="flex gap-4">
                  {/* Timeline bullet */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {idx + 1}
                    </div>
                    {idx !== clinicalNotes.length - 1 && (
                      <div className="w-0.5 bg-gray-100 flex-1 my-2" />
                    )}
                  </div>
                  
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-gray-950">{note.treatment}</h4>
                      <span className="text-xs text-gray-400 font-medium">{note.date}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{note.comments}</p>
                    <span className="inline-block mt-2 text-[10px] font-semibold text-primary">
                      📍 {note.clinic}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Vitals & Allergies */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Allergies Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <ShieldAlert className="w-5 h-5 text-danger" /> Drug Allergies
            </h3>
            
            <p className="text-xs text-gray-450 leading-relaxed">
              These drug allergies are noted on your medical profile. Please alert clinic personnel if this list requires updates.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {allergies.map((allergy, idx) => (
                <span 
                  key={idx}
                  className="bg-danger/10 text-danger text-xs font-semibold px-3 py-1 rounded-lg border border-danger/10 flex items-center gap-1.5"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          </div>

          {/* Health Score Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Award className="w-5 h-5 text-secondary" /> Health Profile
            </h3>
            
            <div className="space-y-4 text-xs font-medium text-gray-650">
              <div className="flex justify-between">
                <span>Oral Score:</span>
                <span className="font-bold text-gray-950">78 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Gingival Health:</span>
                <span className="font-bold text-warning">Moderate</span>
              </div>
              <div className="flex justify-between">
                <span>Brushing Routine:</span>
                <span className="font-bold text-gray-950">2x daily (reported)</span>
              </div>
              <div className="flex justify-between">
                <span>Fluoride Treatment:</span>
                <span className="font-bold text-success">Updated</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
