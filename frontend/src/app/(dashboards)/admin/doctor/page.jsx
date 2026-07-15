"use client";

import { useState, useEffect, Fragment } from "react";
import { Stethoscope, Calendar, Search, Filter, ShieldAlert, RefreshCw, Star, X, Save } from "lucide-react";
import client from "@/services/api";

export default function DoctorManagementPage() {

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedDoctorId, setExpandedDoctorId] = useState(null);

  const [editingShiftDoc, setEditingShiftDoc] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // 1. Fetch users to get profile details
      const response = await client.get("/admin/users");
      const usersData = response.data;
      
      // Filter users who have the "Doctor" role
      const doctorUsers = usersData.filter(user => {
        let r = user.roles;
        if (typeof r === 'string') {
          try { r = JSON.parse(r); } catch(e) { r = []; }
        }
        return r && Array.isArray(r) && r.some(role => role.toLowerCase() === "doctor");
      });

      // 2. Fetch doctors roster to get active patient counts
      let rosterData = [];
      try {
        const rosterResponse = await client.get("/auth/doctors");
        rosterData = rosterResponse.data;
      } catch (err) {
        console.error("Failed to load doctor roster stats:", err);
      }

      // 3. Map/Merge backend users and roster to doctor UI fields
      const mappedDoctors = doctorUsers.map((user, index) => {
        const rosterItem = rosterData.find(r => r.id === user.id);
        let specArr = user.specialties;
        if (typeof specArr === 'string') {
          try { specArr = JSON.parse(specArr); } catch(e) { specArr = []; }
        }
        const specialtyStr = specArr && Array.isArray(specArr) && specArr.length > 0 
          ? specArr.join(", ") 
          : "General Dentistry";
          
        let defaultStatus = "On Duty";
        if (user.status === "Inactive") {
          defaultStatus = "Off Duty";
        } else if (user.status === "On Break") {
          defaultStatus = "On Break";
        }

        return {
          id: user.id,
          name: user.name ? (user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`) : "Dr. Unknown",
          specialty: specialtyStr,
          operatory: user.chair_setup || (rosterItem ? rosterItem.operatory : `Operatory ${index + 1}`),
          shift: rosterItem ? rosterItem.shift : "09:00 AM - 05:00 PM",
          status: rosterItem ? rosterItem.status : defaultStatus,
          patientsCount: rosterItem ? rosterItem.patientsCount : 0,
          dob: user.dob,
          phone: user.phone,
          address: user.address,
          licence_id: user.licence_id,
          chair_setup: user.chair_setup,
          board: user.board,
          working_hours: user.working_hours
        };
      });
      
      setDoctors(mappedDoctors);
    } catch (err) {
      console.warn("Error loading doctors:", err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchDoctors();
    }, 0);
  }, []);

  const toggleStatus = async (id) => {
    try {
      const response = await client.put(`/admin/doctors/${id}/status`);
      const updated = response.data;
      setDoctors(prev => prev.map(doc => {
        if (doc.id === id) {
          return { ...doc, status: updated.status };
        }
        return doc;
      }));
    } catch (err) {
      console.warn("Failed to toggle doctor status, cycling locally:", err);
      // Local fallback cycling
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
    }
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
            <Stethoscope className="w-6 h-6 text-primary" /> Doctor Details & Schedules
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctor work schedules, active operatories, and status codes.</p>
        </div>
        
        <button
          onClick={fetchDoctors}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
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
            {Array.from(new Set(doctors.map(d => d.specialty))).filter(Boolean).map(spec => (
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
              {loading && doctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500 font-semibold italic">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary inline mr-2" /> Loading doctor roster...
                  </td>
                </tr>
              ) : (
                filteredDoctors.map(doc => (
                  <Fragment key={doc.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{doc.name}</td>
                      <td className="py-4 px-6 text-xs text-gray-600 font-semibold">{doc.specialty}</td>
                      <td className="py-4 px-6 font-mono text-xs text-primary font-bold">{doc.operatory}</td>
                      <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                        {(() => {
                          if (typeof doc.shift === 'object' && doc.shift !== null) {
                            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                            const todaySchedule = doc.shift[todayDay];
                            if (todaySchedule) {
                              return todaySchedule.is_off ? "Off Duty" : `${todaySchedule.start} - ${todaySchedule.end}`;
                            }
                          }
                          return typeof doc.shift === 'string' ? doc.shift : "Not Scheduled";
                        })()}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-700 font-bold">{doc.patientsCount}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(doc.id)}
                          className="px-3 py-1 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-200 hover:border-primary/25 rounded-lg text-xs font-bold transition-all cursor-pointer mr-2 outline-none"
                        >
                          Cycle Status
                        </button>
                        <button
                          onClick={() => setExpandedDoctorId(expandedDoctorId === doc.id ? null : doc.id)}
                          className="px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold transition-all cursor-pointer mr-2 outline-none"
                        >
                          {expandedDoctorId === doc.id ? "Hide Details" : "View Details"}
                        </button>
                        <button
                          onClick={() => setEditingShiftDoc(doc)}
                          className="px-3 py-1 bg-white hover:bg-gray-150 border border-gray-250 rounded-lg text-xs font-bold transition-all cursor-pointer outline-none"
                        >
                          Edit Shift
                        </button>
                      </td>
                    </tr>
                    {expandedDoctorId === doc.id && (
                      <tr className="bg-gray-50/40">
                        <td colSpan="7" className="px-8 py-5 border-t border-b border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-left animate-fade-in">
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</span>
                              <span className="font-semibold text-gray-800">{doc.dob || "Not Specified"}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</span>
                              <span className="font-semibold text-gray-800">{doc.phone || "Not Specified"}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">License ID</span>
                              <span className="font-semibold text-gray-800">{doc.licence_id || "Not Specified"}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Board / Council</span>
                              <span className="font-semibold text-gray-800">{doc.board || "Not Specified"}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Chair / Operatory Setup</span>
                              <span className="font-semibold text-gray-800">{doc.chair_setup || "Not Specified"}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs md:col-span-3">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Address</span>
                              <span className="font-semibold text-gray-800">{doc.address || "Not Specified"}</span>
                            </div>
                            <DoctorReviewsPanel doctorName={doc.name} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
              {!loading && filteredDoctors.length === 0 && (
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

      {editingShiftDoc && (
        <ShiftEditorModal 
          doctor={editingShiftDoc} 
          onClose={() => setEditingShiftDoc(null)} 
          onSave={() => {
            setEditingShiftDoc(null);
            fetchDoctors();
          }}
        />
      )}
    </div>
  );
}

function DoctorReviewsPanel({ doctorName }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await client.get(`/patient/feedback/doctor/${encodeURIComponent(doctorName)}`);
        const data = response.data;
        setReviews(data.feedbacks || []);
        setStats({
          average_rating: data.average_rating || 0,
          total_reviews: data.total_reviews || 0
        });
      } catch (err) {
        console.error("Failed to load doctor feedbacks", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [doctorName]);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs md:col-span-3">
      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Patient Feedback & Performance (Escalated to Admin)</span>
      
      {loading ? (
        <div className="text-center py-4 text-xs text-gray-400">Loading reviews...</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
            <span className="text-xs font-bold text-gray-800">Average Rating:</span>
            <div className="flex items-center text-amber-500 font-bold text-xs">
              {stats.average_rating}
              <div className="flex gap-0.5 ml-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= stats.average_rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-500 font-medium">({stats.total_reviews} reviews total)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto mt-2 pr-1">
            {reviews.map(rev => (
              <div key={rev.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-bold text-gray-800 text-xs block">{rev.patient_name}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ""}</span>
                  </div>
                  <span className="text-xs text-amber-500 font-bold flex items-center">{rev.rating} ★</span>
                </div>
                {rev.feedback_text && (
                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium mt-1">"{rev.feedback_text}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 font-semibold italic text-xs border border-dashed border-gray-150 rounded-xl">
          No patient feedbacks submitted for {doctorName} yet.
        </div>
      )}
    </div>
  );
}

function ShiftEditorModal({ doctor, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Initialize from doctor.working_hours or default
  const [schedule, setSchedule] = useState(() => {
    if (doctor.working_hours && typeof doctor.working_hours === 'object') {
      return doctor.working_hours;
    }
    const defaultSchedule = {};
    daysOfWeek.forEach(day => {
      defaultSchedule[day] = { is_off: false, start: "09:00 AM", end: "05:00 PM" };
    });
    return defaultSchedule;
  });

  const handleUpdate = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await client.put(`/admin/users/${doctor.id}`, {
        working_hours: schedule
      });
      onSave();
    } catch (err) {
      console.error("Failed to save working hours", err);
      alert("Failed to save working hours.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Shift Schedule</h2>
            <p className="text-xs text-gray-500 mt-1">{doctor.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer transition-colors text-gray-500 hover:text-gray-900 outline-none">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {daysOfWeek.map(day => (
              <div key={day} className={`flex items-center gap-4 p-4 rounded-xl border ${schedule[day]?.is_off ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-200'}`}>
                <div className="w-32 font-bold text-sm text-gray-800">{day}</div>
                
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={schedule[day]?.is_off || false} 
                    onChange={(e) => handleUpdate(day, 'is_off', e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
                  />
                  <span className="text-xs font-semibold text-gray-600">Off Duty</span>
                </label>

                {!schedule[day]?.is_off && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input 
                      type="text" 
                      value={schedule[day]?.start || ""} 
                      onChange={(e) => handleUpdate(day, 'start', e.target.value)}
                      placeholder="09:00 AM"
                      className="w-24 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-center"
                    />
                    <span className="text-xs text-gray-400 font-bold">to</span>
                    <input 
                      type="text" 
                      value={schedule[day]?.end || ""} 
                      onChange={(e) => handleUpdate(day, 'end', e.target.value)}
                      placeholder="05:00 PM"
                      className="w-24 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-center"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer outline-none"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer outline-none flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
