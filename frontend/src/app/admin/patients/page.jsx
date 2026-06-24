"use client";

import { useState, useEffect } from "react";
import { Users, Search, X, History, CreditCard, User, Activity, AlertTriangle, FileText, IndianRupee } from "lucide-react";

export default function GlobalPatientDirectoryPage() {

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProcedure, setFilterProcedure] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, clinical, payment

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://127.0.0.1:8000/admin/patients", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to load patient directory.");
      const data = await response.json();
      setPatients(data);
    } catch (err) {
      console.error("Failed to fetch patients, using fallback data:", err);
      setPatients(initialPatients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.phone.includes(search) || 
                          p.token.toLowerCase().includes(search.toLowerCase());
    const matchesProcedure = filterProcedure === "" || p.procedure.includes(filterProcedure);
    return matchesSearch && matchesProcedure;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Patient Registry Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">Global audit interface for EDR patient files and clinical chart history.</p>
        </div>
        <button
          onClick={fetchPatients}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
        >
          <History className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Registry
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registered Patients</span>
          <span className="text-3xl font-black text-gray-900 mt-2 block">{patients.length}</span>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medical Warnings</span>
          <span className="text-3xl font-black text-rose-500 mt-2 block">
            {patients.filter(p => p.medicalAlerts.length > 0).length}
          </span>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Major Procedures</span>
          <span className="text-3xl font-black text-primary mt-2 block">
            {patients.filter(p => p.procedure.includes("Root Canal") || p.procedure.includes("Extraction")).length}
          </span>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Visit Count</span>
          <span className="text-3xl font-black text-gray-700 mt-2 block">2.4</span>
        </div>
      </div>

      {/* Directory Table Area */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/25 flex flex-wrap gap-3">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-64 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by Name, Phone, or Token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-400 text-gray-800"
            />
          </div>

          <select 
            value={filterProcedure} 
            onChange={(e) => setFilterProcedure(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-gray-700 cursor-pointer"
          >
            <option value="">All Procedures</option>
            <option value="Scaling">Scaling & Cleaning</option>
            <option value="Root Canal">Root Canal Treatment</option>
            <option value="Filling">Filling</option>
            <option value="Extraction">Extraction / Surgery</option>
            <option value="Crown">Crown Fitting</option>
          </select>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-4.5 px-6">Token ID</th>
                <th className="py-4.5 px-6">Patient Details</th>
                <th className="py-4.5 px-6">Planned Treatment</th>
                <th className="py-4.5 px-6">Clinical Alerts</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading && patients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500 font-semibold italic">
                    <History className="w-4 h-4 animate-spin text-primary inline mr-2" /> Loading patient registry...
                  </td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.token} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-gray-400 font-bold">{p.token}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{p.gender}, {p.age} years • {p.phone}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-primary font-bold">{p.procedure}</td>
                    <td className="py-4 px-6">
                      {p.medicalAlerts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.medicalAlerts.map((alert, idx) => (
                            <span key={idx} className="bg-red-50 text-rose-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-rose-100">
                              {alert}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedPatient(p);
                          setActiveTab("profile");
                        }}
                        className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-all cursor-pointer mr-2 outline-none"
                      >
                        Audit Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 font-semibold italic">
                    No registered patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Audit Modal Overlay */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-gray-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary/5 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="text-left">
                <h3 className="font-extrabold text-lg text-gray-900">Patient Case Dossier</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">EMR & Clinical Chart</p>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-gray-50/50">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors outline-none cursor-pointer ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                <div className="flex items-center gap-1.5"><User className="w-4 h-4"/> Profile</div>
              </button>
              <button 
                onClick={() => setActiveTab("clinical")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors outline-none cursor-pointer ${activeTab === 'clinical' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                <div className="flex items-center gap-1.5"><Activity className="w-4 h-4"/> Clinical</div>
              </button>
              <button 
                onClick={() => setActiveTab("payment")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors outline-none cursor-pointer ${activeTab === 'payment' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                <div className="flex items-center gap-1.5"><CreditCard className="w-4 h-4"/> Payment</div>
              </button>
            </div>

            <div className="p-6 h-[320px] overflow-y-auto">
              {activeTab === 'profile' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex justify-between mb-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Basic Details</span>
                      <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{selectedPatient.token}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Full Name</span>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{selectedPatient.name}</h4>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Contact</span>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{selectedPatient.phone}</h4>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Demographics</span>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{selectedPatient.gender}, {selectedPatient.age} yrs</h4>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Blood Group</span>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{selectedPatient.bloodGroup}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'clinical' && (
                <div className="space-y-5 animate-in fade-in duration-200 text-left">
                  {/* Medical Alerts */}
                  {selectedPatient.medicalAlerts.length > 0 && (
                    <div className="space-y-1.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-rose-700 font-semibold">
                      <span className="font-black flex items-center gap-1 text-[10px] uppercase text-rose-600 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Medical Warnings
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPatient.medicalAlerts.map((a, i) => (
                          <span key={i} className="bg-rose-100 px-2 py-0.5 rounded text-[9px] font-black uppercase text-rose-700">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chief complaint */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chief Complaint</span>
                    <p className="text-xs text-gray-700 italic font-semibold border-l-2 border-primary pl-3 py-1">"{selectedPatient.chiefComplaint}"</p>
                  </div>

                  {/* Clinical Timeline History */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Clinical Timeline Audit
                    </span>
                    <div className="border border-gray-100 rounded-xl p-3.5 space-y-3 bg-gray-50/20">
                      {selectedPatient.timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-3 text-left">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400">{event.date} • {event.type}</p>
                            <p className="text-xs text-gray-700 font-semibold mt-0.5">{event.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Billing Overview</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        selectedPatient.paymentDetails.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                        selectedPatient.paymentDetails.status === 'Pending' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedPatient.paymentDetails.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Billed</span>
                        <h4 className="text-lg font-black text-gray-900 mt-1 flex items-center"><IndianRupee className="w-4 h-4 mr-0.5"/> {selectedPatient.paymentDetails.totalBilled}</h4>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Amount Paid</span>
                        <h4 className="text-lg font-black text-emerald-600 mt-1 flex items-center"><IndianRupee className="w-4 h-4 mr-0.5"/> {selectedPatient.paymentDetails.amountPaid}</h4>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-rose-100 bg-rose-50/30 col-span-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-rose-500 uppercase">Outstanding Balance</span>
                        <h4 className="text-xl font-black text-rose-600 flex items-center"><IndianRupee className="w-5 h-5 mr-0.5"/> {selectedPatient.paymentDetails.balance}</h4>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Last Payment Date</span>
                      <p className="text-xs font-bold text-gray-700 mt-0.5">{selectedPatient.paymentDetails.lastPaymentDate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-250 text-xs font-bold rounded-xl transition-colors cursor-pointer outline-none"
              >
                Close EMR View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
