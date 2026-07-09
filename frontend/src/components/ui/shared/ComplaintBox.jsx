"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Paperclip,
  Send,
  Undo2
} from "lucide-react";
import { 
  getMyComplaints, 
  submitComplaint, 
  reopenComplaint, 
  getComplaintLogs 
} from "@/services/api";

export default function ComplaintBox() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form fields
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [relatedComplaintId, setRelatedComplaintId] = useState(null);
  
  // Feedback messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Expanded complaints tracker
  const [expandedId, setExpandedId] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Reopen modal states
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenId, setReopenId] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      await submitComplaint({ 
        subject, 
        body, 
        related_complaint_id: relatedComplaintId 
      });
      setSuccessMsg("Complaint submitted successfully to the administrator.");
      setSubject("");
      setBody("");
      setRelatedComplaintId(null);
      
      // Close modal after a short delay and refresh list
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg("");
        fetchComplaints();
      }, 1500);

    } catch (err) {
      console.error("Failed to submit complaint:", err);
      setErrorMsg(err.message || "An error occurred while submitting your complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedLogs([]);
    } else {
      setExpandedId(id);
      setExpandedLogs([]);
      try {
        setLoadingLogs(true);
        const data = await getComplaintLogs(id);
        setExpandedLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoadingLogs(false);
      }
    }
  };

  const triggerReopen = (id) => {
    setReopenId(id);
    setReopenReason("");
    setReopenModalOpen(true);
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      alert("A mandatory reason is required to reopen.");
      return;
    }
    
    try {
      setSubmitting(true);
      await reopenComplaint(reopenId, reopenReason);
      setReopenModalOpen(false);
      
      // Refresh list
      await fetchComplaints();
      
      // Refresh logs if it was expanded
      if (expandedId === reopenId) {
        const data = await getComplaintLogs(reopenId);
        setExpandedLogs(data);
      }
    } catch (err) {
      console.error("Failed to reopen:", err);
      alert("Failed to reopen: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerFileRelated = (id) => {
    setRelatedComplaintId(id);
    setSubject("");
    setBody("");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setRelatedComplaintId(null);
    setSubject("");
    setBody("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case "under review":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 bg-gray-150 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-300">
            <X className="w-3.5 h-3.5" /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-150 shadow-xs gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Complaint Box
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit your feedback, issues, or complaints directly to the administration.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> File a Complaint
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900">Your Submission History</h3>
          <span className="text-xs font-semibold text-gray-400">{complaints.length} Total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-semibold flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            Loading complaints history...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-semibold">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">You haven't submitted any complaints yet.</p>
            <p className="text-xs text-gray-400 font-normal mt-1">Use the "File a Complaint" button above to submit feedback.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map((complaint) => {
              const isExpanded = expandedId === complaint.id;
              const formattedDate = new Date(complaint.created_at).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={complaint.id} className="transition-colors hover:bg-gray-50/30 text-left">
                  {/* Summary row */}
                  <div 
                    onClick={() => toggleExpand(complaint.id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900 truncate max-w-md">
                          {complaint.subject}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {formattedDate}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-2xl font-normal">
                        {complaint.body}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(complaint.status)}
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded body details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-dashed border-gray-100 bg-gray-50/50 animate-in fade-in duration-200 space-y-4">
                      {/* Body Content */}
                      <div className="bg-white rounded-xl border border-gray-150 p-4 space-y-3 shadow-xs">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          <span>Complaint Content</span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-black">
                            ID: #{complaint.id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                          {complaint.body}
                        </p>
                        
                        {/* Audit Details */}
                        {(complaint.resolved_at || complaint.closed_at || complaint.related_complaint_id) && (
                          <div className="pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-bold text-gray-500 uppercase">
                            {complaint.resolved_at && (
                              <div>
                                Resolved At: <span className="text-gray-750">{new Date(complaint.resolved_at).toLocaleString()}</span>
                              </div>
                            )}
                            {complaint.closed_at && (
                              <div>
                                Closed At: <span className="text-gray-750">{new Date(complaint.closed_at).toLocaleString()}</span>
                              </div>
                            )}
                            {complaint.related_complaint_id && (
                              <div className="md:col-span-2 text-primary">
                                Linked to Complaint ID: #{complaint.related_complaint_id}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {complaint.status?.toLowerCase() === "resolved" && (
                          <button
                            onClick={() => triggerReopen(complaint.id)}
                            className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Reopen Complaint
                          </button>
                        )}
                        {complaint.status?.toLowerCase() === "closed" && (
                          <button
                            onClick={() => triggerFileRelated(complaint.id)}
                            className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> File Related Complaint
                          </button>
                        )}
                      </div>

                      {/* Audit Logs Trail */}
                      <div className="bg-white rounded-xl border border-gray-150 p-4 space-y-3 shadow-xs">
                        <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status History & Audit Trail</h4>
                        {loadingLogs ? (
                          <p className="text-xs text-gray-450">Loading history logs...</p>
                        ) : expandedLogs.length === 0 ? (
                          <p className="text-xs text-gray-450">No logs found.</p>
                        ) : (
                          <div className="relative pl-4 border-l border-gray-200 space-y-3">
                            {expandedLogs.map((log) => (
                              <div key={log.id} className="relative text-xs text-left">
                                <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white ring-4 ring-primary/10"></span>
                                <div className="font-bold text-gray-700">
                                  {log.from_status ? `${log.from_status} → ` : ""}
                                  <span className="text-primary">{log.to_status}</span>
                                  <span className="text-[10px] font-normal text-gray-400 ml-2">
                                    {new Date(log.created_at).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  Action by: <span className="text-gray-600 font-bold">{log.changed_by_name}</span>
                                </div>
                                {log.note && (
                                  <p className="text-xs font-medium text-gray-650 bg-gray-50 border border-gray-150 rounded p-1.5 mt-1 whitespace-pre-wrap">
                                    {log.note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complaint Submission Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-gray-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-b-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-base font-extrabold text-gray-950">File a New Complaint</h2>
                <p className="text-[10px] text-gray-450 font-bold uppercase mt-0.5">
                  {relatedComplaintId ? `Linking back to closed complaint #${relatedComplaintId}` : 'Reach out to the administrative team'}
                </p>
              </div>
              <button 
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer outline-none disabled:opacity-50"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Feedback notifications */}
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Subject</label>
                  <input 
                    type="text" 
                    required
                    disabled={submitting}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                    placeholder="e.g., Equipment Malfunction in Chair 2"
                  />
                </div>

                {/* Body */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Complaint details (Body)</label>
                  <textarea 
                    required
                    rows={6}
                    disabled={submitting}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-semibold resize-none"
                    placeholder="Provide details about the issue, including timestamps, equipment IDs, or clinical impacts. Be descriptive so the admin team can troubleshoot."
                  />
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50 outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 cursor-pointer transition-colors disabled:opacity-50 outline-none"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Complaint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Reopen Modal for Staff */}
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

            <form onSubmit={handleReopenSubmit}>
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
