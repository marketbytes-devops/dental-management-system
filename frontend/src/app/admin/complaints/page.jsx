"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ChevronRight, 
  Filter, 
  Search,
  X,
  Undo2
} from "lucide-react";
import { 
  getAllComplaints, 
  updateComplaintStatus, 
  reopenComplaint, 
  getComplaintLogs 
} from "@/services/api";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Filtering and searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Audit trail and action states
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [transitionNote, setTransitionNote] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [reopenModalOpen, setReopenModalOpen] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getAllComplaints();
      setComplaints(data);
      
      // Keep selected complaint details updated
      if (selectedComplaint) {
        const updated = data.find(c => c.id === selectedComplaint.id);
        setSelectedComplaint(updated || null);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Fetch logs whenever selected complaint changes
  useEffect(() => {
    if (selectedComplaint) {
      const fetchLogs = async () => {
        try {
          setLoadingLogs(true);
          const data = await getComplaintLogs(selectedComplaint.id);
          setLogs(data);
        } catch (err) {
          console.error("Failed to fetch logs:", err);
        } finally {
          setLoadingLogs(false);
        }
      };
      fetchLogs();
      setTransitionNote("");
    } else {
      setLogs([]);
    }
  }, [selectedComplaint]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const updated = await updateComplaintStatus(id, newStatus, transitionNote);
      
      // Update local state
      setComplaints(prev => prev.map(c => c.id === id ? updated : c));
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(updated);
      }
      setTransitionNote("");
      
      // Refresh logs
      const updatedLogs = await getComplaintLogs(id);
      setLogs(updatedLogs);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      alert("A mandatory reason is required to reopen.");
      return;
    }
    
    try {
      setUpdatingId(selectedComplaint.id);
      const updated = await reopenComplaint(selectedComplaint.id, reopenReason);
      
      // Update local state
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
      setSelectedComplaint(updated);
      setReopenReason("");
      setReopenModalOpen(false);
      
      // Refresh logs
      const updatedLogs = await getComplaintLogs(selectedComplaint.id);
      setLogs(updatedLogs);
    } catch (err) {
      console.error("Failed to reopen complaint:", err);
      alert("Failed to reopen: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics calculations
  const pendingCount = complaints.filter(c => c.status?.toLowerCase() === "pending").length;
  const underReviewCount = complaints.filter(c => c.status?.toLowerCase() === "under review").length;
  const resolvedCount = complaints.filter(c => c.status?.toLowerCase() === "resolved").length;
  const closedCount = complaints.filter(c => c.status?.toLowerCase() === "closed").length;

  // Filtered list
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.staff_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || c.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesRole = roleFilter === "all" || c.staff_role?.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case "under review":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase animate-pulse">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300 uppercase">
            <X className="w-3 h-3" /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase">
            <AlertCircle className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const getRoleLabelStyle = (role) => {
    switch (role?.toLowerCase()) {
      case "doctor":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "receptionist":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "accountant":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "lab tech":
      case "lab technician":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-150 shadow-xs gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Admin Complaint Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review, investigate, and update status on feedback and complaints filed by staff.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Filed</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{complaints.length}</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Under Investigation</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{underReviewCount}</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        {/* Closed */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 bg-gray-100 text-gray-500 rounded-xl">
            <X className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Closed</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{closedCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80 flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400 font-semibold"
            placeholder="Search by subject, body, or staff name..."
          />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-wrap gap-2 items-center justify-end">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-primary font-semibold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-primary font-semibold cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="accountant">Accountant</option>
            <option value="lab tech">Lab Technician</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left Side: Complaints List (takes 2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Complaint Feed</h3>
            <span className="text-xs text-gray-400 font-bold bg-white px-2 py-0.5 border border-gray-150 rounded">
              Showing {filteredComplaints.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-semibold gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                Fetching complaints...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-2" />
                <p className="text-sm font-semibold">No complaints matching your criteria.</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => {
                const formattedDate = new Date(complaint.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const isSelected = selectedComplaint?.id === complaint.id;

                return (
                  <div
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className={`p-4 transition-all hover:bg-gray-50/50 cursor-pointer flex items-center justify-between gap-4 border-l-4 ${
                      isSelected ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getRoleLabelStyle(complaint.staff_role)}`}>
                          {complaint.staff_role}
                        </span>
                        <span className="text-xs font-extrabold text-gray-800">
                          {complaint.staff_name}
                        </span>
                        <span className="text-[10px] text-gray-450 font-semibold">
                          {formattedDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {complaint.subject}
                      </h4>
                      <p className="text-xs text-gray-500 truncate font-normal">
                        {complaint.body}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(complaint.status)}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Review Card */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs h-[600px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Complaint Detail</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {selectedComplaint ? (
              <div className="space-y-6">
                {/* Staff User Header */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-150 rounded-2xl">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Submitted By</p>
                    <h4 className="text-sm font-extrabold text-gray-950 truncate mt-0.5">
                      {selectedComplaint.staff_name}
                    </h4>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border mt-1.5 ${getRoleLabelStyle(selectedComplaint.staff_role)}`}>
                      {selectedComplaint.staff_role}
                    </span>
                  </div>
                </div>

                {/* Date & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-3">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Submission Date</p>
                    <p className="text-xs font-bold text-gray-700 mt-1">
                      {new Date(selectedComplaint.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-3">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedComplaint.status)}</div>
                  </div>

                  {selectedComplaint.resolved_at && (
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 col-span-2">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Resolved Date</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        {new Date(selectedComplaint.resolved_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {selectedComplaint.closed_at && (
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 col-span-2">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Closed Date</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        {new Date(selectedComplaint.closed_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {selectedComplaint.related_complaint_id && (
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 col-span-2">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Linked to Complaint</p>
                      <p className="text-xs font-extrabold text-primary mt-1">
                        Related Complaint ID: #{selectedComplaint.related_complaint_id}
                      </p>
                    </div>
                  )}
                </div>

                {/* Complaint Text */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subject</p>
                  <h4 className="text-sm font-extrabold text-gray-900 border-l-2 border-primary pl-3">
                    {selectedComplaint.subject}
                  </h4>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Detailed Body</p>
                  <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-4 min-h-[120px] text-xs text-gray-755 whitespace-pre-wrap leading-relaxed font-semibold">
                    {selectedComplaint.body}
                  </div>
                </div>

                {/* Administrative Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Actions</p>
                  
                  {selectedComplaint.status?.toLowerCase() === "closed" ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs font-bold text-gray-500">
                      Closed (Final State - No changes allowed)
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Transition Note Input (only for non-closed complaints) */}
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Transition Note / Comment (Optional)</label>
                        <textarea
                          value={transitionNote}
                          onChange={(e) => setTransitionNote(e.target.value)}
                          placeholder="Add comments or status investigation updates..."
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary focus:bg-white transition-all font-semibold resize-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Resolve to Closed (from Resolved) */}
                        {selectedComplaint.status?.toLowerCase() === "resolved" && (
                          <>
                            <button
                              onClick={() => setReopenModalOpen(true)}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <Undo2 className="w-3.5 h-3.5" /> Reopen
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedComplaint.id, "Closed")}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Close
                            </button>
                          </>
                        )}

                        {/* Transitions from Pending */}
                        {selectedComplaint.status?.toLowerCase() === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(selectedComplaint.id, "Under Review")}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <Clock className="w-3.5 h-3.5" /> Review
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedComplaint.id, "Resolved")}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedComplaint.id, "Closed")}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Close
                            </button>
                          </>
                        )}

                        {/* Transitions from Under Review */}
                        {selectedComplaint.status?.toLowerCase() === "under review" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(selectedComplaint.id, "Resolved")}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedComplaint.id, "Closed")}
                              disabled={updatingId === selectedComplaint.id}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Close
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Trail Timeline */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Status History & Audit Trail</p>
                  {loadingLogs ? (
                    <p className="text-xs text-gray-450">Loading audit history...</p>
                  ) : logs.length === 0 ? (
                    <p className="text-xs text-gray-450">No logs available.</p>
                  ) : (
                    <div className="relative pl-4 border-l border-gray-200 space-y-4">
                      {logs.map((log) => {
                        const logDate = new Date(log.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return (
                          <div key={log.id} className="relative space-y-0.5 text-xs text-left">
                            {/* Dot indicator */}
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white ring-4 ring-primary/10"></span>
                            <div className="flex items-center gap-1.5 font-bold text-gray-700">
                              <span>
                                {log.from_status ? `${log.from_status} → ` : ""}
                                <span className="text-primary">{log.to_status}</span>
                              </span>
                              <span className="text-[10px] font-normal text-gray-400">{logDate}</span>
                            </div>
                            <p className="text-[10px] font-semibold text-gray-500">
                              By: <span className="text-gray-700">{log.changed_by_name}</span>
                            </p>
                            {log.note && (
                              <p className="text-xs font-normal text-gray-650 bg-gray-50 p-2 rounded border border-gray-150 mt-1 whitespace-pre-wrap">
                                {log.note}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-2" />
                <p className="text-sm font-semibold">No Complaint Selected</p>
                <p className="text-xs text-gray-400 font-normal mt-1">Select a complaint from the feed to view details and update status.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Reopen Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-gray-150">
            <div className="flex items-center justify-between p-5 border-b border-b-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-base font-extrabold text-gray-950">Reopen Complaint</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Mandatory Reason Required</p>
              </div>
              <button 
                onClick={() => setReopenModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer outline-none"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleReopen}>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reason for Reopening</label>
                  <textarea
                    required
                    rows={4}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Provide a clear, detailed reason for reopening this complaint..."
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary focus:bg-white transition-all font-semibold resize-none"
                  />
                </div>
              </div>

              <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 cursor-pointer transition-colors outline-none"
                >
                  Confirm Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
