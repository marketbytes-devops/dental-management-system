"use client";

import { useState, useEffect } from "react";
import { Share2, Globe, Building } from "lucide-react";


export default function ReferralForm({ patientToken, onReferPatient }) {
  const [referralType, setReferralType] = useState("Internal"); // Internal | External
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [clinicDoctors, setClinicDoctors] = useState([]);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("http://127.0.0.1:8000/frontdesk/doctors");
        if (res.ok) {
          const data = await res.json();
          setClinicDoctors(data);
          if (data.length > 0) {
            setSelectedDoctor(`${data[0].name} - ${data[0].specialty}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch clinic doctors:", err);
      }
    }
    fetchDoctors();
  }, []);
  const [externalDoctor, setExternalDoctor] = useState("");
  const [externalSpeciality, setExternalSpeciality] = useState("");
  const [externalFacility, setExternalFacility] = useState("");
  const [reasonInput, setReasonInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reasonInput.trim()) return;

    if (referralType === "Internal") {
      onReferPatient(patientToken, selectedDoctor, reasonInput.trim(), "Internal", "");
    } else {
      const docName = externalDoctor.trim() || "External Specialist";
      const spec = externalSpeciality.trim() || "General Specialist";
      const doctorStr = `${docName} - ${spec}`;
      onReferPatient(patientToken, doctorStr, reasonInput.trim(), "External", externalFacility.trim());
      // Reset external inputs
      setExternalDoctor("");
      setExternalSpeciality("");
      setExternalFacility("");
    }
    
    setReasonInput("");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <Share2 className="w-4 h-4 text-primary" /> Refer to Specialist Doctor
      </h4>

      {/* Referral Type Selector Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => setReferralType("Internal")}
          className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            referralType === "Internal" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Internal (In-Clinic)
        </button>
        <button
          type="button"
          onClick={() => setReferralType("External")}
          className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            referralType === "External" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          External (Outside)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {referralType === "Internal" ? (
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Specialist Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">Select a doctor...</option>
              {clinicDoctors.map((doc) => (
                <option key={doc.id} value={`${doc.name} - ${doc.specialty}`}>
                  {doc.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">External Doctor Name</label>
              <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <Globe className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Amit Patel"
                  value={externalDoctor}
                  onChange={(e) => setExternalDoctor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Speciality</label>
                <input
                  type="text"
                  placeholder="e.g. Orthodontics"
                  value={externalSpeciality}
                  onChange={(e) => setExternalSpeciality(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hospital / Facility</label>
                <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Building className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Apollo Hospital"
                    value={externalFacility}
                    onChange={(e) => setExternalFacility(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reason for Referral</label>
          <textarea
            rows={2}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="Write clinical justification or request for evaluation..."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder:text-gray-400"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm shadow-primary/10 cursor-pointer outline-none"
          >
            Refer Patient
          </button>
        </div>
      </form>
    </div>
  );
}
