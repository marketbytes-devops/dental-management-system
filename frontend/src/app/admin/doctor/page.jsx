"use client";

import { useState, useEffect } from "react";
import { Stethoscope, Calendar, Search, Filter, ShieldAlert, RefreshCw } from "lucide-react";

export default function DoctorManagementPage() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchDoctors = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://localhost:8000/admin/users", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to load users.");
      const data = await response.json();
      
      // Filter users who have the "Doctor" role
      const doctorUsers = data.filter(user => 
        user.roles && user.roles.some(role => role.toLowerCase() === "doctor")
      );

      // Map backend users to doctor UI fields
      const mappedDoctors = doctorUsers.map((user, index) => {
        const specialtyStr = user.specialties && user.specialties.length > 0 
          ? user.specialties.join(", ") 
          : "General Dentistry";
          
        return {
          id: user.id,
          name: user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`,
          specialty: specialtyStr,
          operatory: `Operatory ${index + 1}`,
          shift: "09:00 AM - 05:00 PM",
          status: user.status === "Active" ? "On Duty" : "Off Duty",
          patientsCount: 0
        };
      });
      
      setDoctors(mappedDoctors);
    } catch (err) {
      console.error("Error loading doctors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const toggleStatus = (id) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === id) {
        let nextStatus = "On Duty";
        if (doc.status === "On Duty") nextStatus = "On Break";
        else if (doc.status === "On Break") nextStatus = "Off Duty";
        else nextStatus = "On Duty";
        return { ...doc, status: nextStatus };
      }
      return doc;
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "On Duty": return "bg-emerald-50 border border-emerald-200 text-emerald-700";
      case "On Break": return "bg-amber-50 border border-amber-200 text-amber-700";
      case "Off Duty": return "bg-gray-50 border border-gray-200 text-gray-400";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = filterSpecialty === "" || doc.specialty === filterSpecialty;
    const matchesStatus = filterStatus === "" || doc.status === filterStatus;
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" /> Doctor Roster & Schedules
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctor work schedules, active operatories, and status codes.</p>
        </div>
        
        <button
          onClick={fetchDoctors}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
        >
          <RefreshCw className="w-4 h-4" /> Refresh roster
        </button>
      </div>

      {/* Roster Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">On-Duty Doctors</span>
          <span className="text-3xl font-black text-emerald-600 mt-2">
            {doctors.filter(d => d.status === "On Duty").length}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">Ready for patient consultation</span>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Scheduled</span>
          <span className="text-3xl font-black text-gray-900 mt-2">
            {doctors.length}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">Practitioners registered</span>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Allocated Operatories</span>
          <span className="text-3xl font-black text-primary mt-2">
            {doctors.filter(d => d.status !== "Off Duty").length} / 6
          </span>
          <span className="text-[10px] text-gray-500 mt-1">Chairs active this session</span>
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
              placeholder="Search by name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-400 text-gray-800"
            />
          </div>

          <select 
            value={filterSpecialty} 
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-gray-700 cursor-pointer"
          >
            <option value="">All Specialties</option>
            {Array.from(new Set(doctors.map(d => d.specialty))).map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-gray-700 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="On Duty">On Duty</option>
            <option value="On Break">On Break</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-4.5 px-6">Doctor</th>
                <th className="py-4.5 px-6">Specialty</th>
                <th className="py-4.5 px-6">Chair Room</th>
                <th className="py-4.5 px-6">Shift Hours</th>
                <th className="py-4.5 px-6">Patients Active</th>
                <th className="py-4.5 px-6">Duty Status</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {filteredDoctors.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900">{doc.name}</td>
                  <td className="py-4 px-6 text-xs text-gray-600 font-semibold">{doc.specialty}</td>
                  <td className="py-4 px-6 font-mono text-xs text-primary font-bold">{doc.operatory}</td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-medium">{doc.shift}</td>
                  <td className="py-4 px-6 font-mono text-xs text-gray-700 font-bold">{doc.patientsCount}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => toggleStatus(doc.id)}
                      className="px-3 py-1 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-250 hover:border-primary/25 rounded-lg text-xs font-bold transition-all cursor-pointer mr-2 outline-none"
                    >
                      Cycle Status
                    </button>
                    <button
                      onClick={() => alert(`Modifying shift details for ${doc.name}...`)}
                      className="px-3 py-1 bg-white hover:bg-gray-150 border border-gray-250 rounded-lg text-xs font-bold transition-all cursor-pointer outline-none"
                    >
                      Edit Shift
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400 font-semibold italic">
                    No doctors matching selected filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
