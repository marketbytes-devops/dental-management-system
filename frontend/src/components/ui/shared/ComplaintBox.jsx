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
  Send
} from "lucide-react";
import { getMyComplaints, submitComplaint } from "@/services/api";

export default function ComplaintBox() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form fields
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  // Feedback messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Expanded complaints tracker
  const [expandedId, setExpandedId] = useState(null);

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
      await submitComplaint({ subject, body });
      setSuccessMsg("Complaint submitted successfully to the administrator.");
      setSubject("");
      setBody("");
      
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

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
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
                    <div className="px-5 pb-5 pt-1 border-t border-dashed border-gray-100 bg-gray-50/50 animate-in fade-in duration-200">
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
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Reach out to the administrative team</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
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
                  onClick={() => setModalOpen(false)}
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
    </div>
  );
}
