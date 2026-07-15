"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bug,
    Zap,
    LayoutGrid,
    Database,
    HelpCircle,
    MessageSquarePlus,
    Send,
    X,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Undo2,
    RefreshCw,
    Mail,
    Phone,
    ExternalLink,
    ShieldCheck,
    Info,
    Loader2,
    ListChecks,
} from "lucide-react";
import {
    getMyComplaints,
    submitComplaint,
    reopenComplaint,
    getComplaintLogs,
} from "@/services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const BUG_CATEGORIES = [
    { id: "ui_bug", label: "UI / Display Bug", icon: LayoutGrid, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
    { id: "feature_request", label: "Feature Request", icon: Zap, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { id: "data_issue", label: "Data / Sync Issue", icon: Database, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { id: "performance", label: "Performance / Speed", icon: Bug, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
    { id: "other", label: "Other / General", icon: HelpCircle, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
];

const FAQ_ITEMS = [
    {
        q: "How long does it take to get a response?",
        a: "Our development team reviews all reports within 1–2 business days. Critical bugs are escalated immediately and typically resolved within 24 hours.",
    },
    {
        q: "What information should I include in a bug report?",
        a: "Please include: the exact steps to reproduce the issue, which page/section it occurred on, what you expected vs what happened, and your browser/device if relevant.",
    },
    {
        q: "Can I reopen a resolved ticket?",
        a: "Yes. If an issue re-occurs after being marked Resolved, you can reopen it by clicking the 'Reopen' button on the ticket and providing a brief reason.",
    },
    {
        q: "What's the difference between statuses?",
        a: "Pending → your report is received. Under Review → developers are investigating. Resolved → the fix has been deployed. Closed → issue is archived.",
    },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        resolved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" />, label: "Resolved" },
        "under review": { cls: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse", icon: <Clock className="w-3 h-3" />, label: "Under Review" },
        closed: { cls: "bg-gray-100 text-gray-600 border-gray-300", icon: <X className="w-3 h-3" />, label: "Closed" },
        pending: { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <AlertCircle className="w-3 h-3" />, label: "Pending" },
    };
    const { cls, icon, label } = map[status?.toLowerCase()] ?? map.pending;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
            {icon} {label}
        </span>
    );
}

// ─── Category Pill ────────────────────────────────────────────────────────────

function CategoryPill({ cat, selected, onSelect }) {
    const Icon = cat.icon;
    return (
        <button
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${selected
                ? `${cat.bg} ${cat.color} ${cat.border} ring-2 ring-offset-1 ring-current/30 scale-[1.02]`
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
        >
            <Icon className="w-4 h-4" />
            {cat.label}
        </button>
    );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-4 text-left gap-3 cursor-pointer"
            >
                <span className="text-sm font-semibold text-gray-800">{q}</span>
                {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>
            {open && (
                <p className="text-xs text-gray-500 pb-4 leading-relaxed font-medium">{a}</p>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReceptionistSupport() {
    // ── Complaints state
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Form state
    const [modalOpen, setModalOpen] = useState(false);
    const [category, setCategory] = useState("ui_bug");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [relatedId, setRelatedId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // ── Expanded ticket state
    const [expandedId, setExpandedId] = useState(null);
    const [expandedLogs, setExpandedLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // ── Reopen state
    const [reopenModal, setReopenModal] = useState(false);
    const [reopenId, setReopenId] = useState(null);
    const [reopenReason, setReopenReason] = useState("");
    const [reopenSubmitting, setReopenSubmitting] = useState(false);

    // ── Active tab
    const [tab, setTab] = useState("reports"); // "reports" | "faq"

    // ── Fetch reports
    const fetchReports = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await getMyComplaints();
            setReports(data);
        } catch (err) {
            console.error("Failed to load reports:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    // ── Submit new report
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !body.trim()) {
            setFormError("Please complete all fields before submitting.");
            return;
        }
        const catLabel = BUG_CATEGORIES.find((c) => c.id === category)?.label ?? "";
        const fullSubject = `[${catLabel}] ${subject.trim()}`;
        try {
            setSubmitting(true);
            setFormError("");
            setFormSuccess("");
            await submitComplaint({ subject: fullSubject, body: body.trim(), related_complaint_id: relatedId });
            setFormSuccess("✅ Your report has been submitted to the development team.");
            setSubject("");
            setBody("");
            setCategory("ui_bug");
            setRelatedId(null);
            setTimeout(() => {
                setModalOpen(false);
                setFormSuccess("");
                fetchReports(true);
            }, 1800);
        } catch (err) {
            setFormError(err.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setSubject("");
        setBody("");
        setCategory("ui_bug");
        setRelatedId(null);
        setFormError("");
        setFormSuccess("");
    };

    // ── Toggle expanded ticket
    const toggleExpand = async (id) => {
        if (expandedId === id) { setExpandedId(null); setExpandedLogs([]); return; }
        setExpandedId(id);
        setExpandedLogs([]);
        setLoadingLogs(true);
        try {
            const logs = await getComplaintLogs(id);
            setExpandedLogs(logs);
        } catch { /* ignore */ }
        finally { setLoadingLogs(false); }
    };

    // ── Reopen
    const triggerReopen = (id) => { setReopenId(id); setReopenReason(""); setReopenModal(true); };
    const handleReopen = async (e) => {
        e.preventDefault();
        if (!reopenReason.trim()) { alert("A reason is required."); return; }
        setReopenSubmitting(true);
        try {
            await reopenComplaint(reopenId, reopenReason.trim());
            setReopenModal(false);
            await fetchReports(true);
            if (expandedId === reopenId) {
                const logs = await getComplaintLogs(reopenId);
                setExpandedLogs(logs);
            }
        } catch (err) {
            alert("Failed to reopen: " + err.message);
        } finally {
            setReopenSubmitting(false);
        }
    };

    // ── File a related complaint from a closed ticket
    const fileRelated = (id) => { setRelatedId(id); setSubject(""); setBody(""); setCategory("ui_bug"); setFormError(""); setFormSuccess(""); setModalOpen(true); };

    // ── Stats
    const stats = {
        total: reports.length,
        pending: reports.filter((r) => r.status?.toLowerCase() === "pending").length,
        underReview: reports.filter((r) => r.status?.toLowerCase() === "under review").length,
        resolved: reports.filter((r) => r.status?.toLowerCase() === "resolved").length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

            {/* ── Hero Banner ── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-700 to-violet-700 text-white">
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                <div className="relative max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Developer Support Portal
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Report a Bug or Request Help
                        </h1>
                        <p className="mt-2 text-blue-100 text-sm max-w-lg leading-relaxed">
                            Encountered an issue with the SmileCare system? Submit a detailed report and
                            our development team will investigate and keep you updated in real time.
                        </p>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="shrink-0 inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-3 rounded-2xl text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                        New Bug Report
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* ── Quick Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Reports", value: stats.total, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" },
                        { label: "Pending", value: stats.pending, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
                        { label: "Under Review", value: stats.underReview, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
                        { label: "Resolved", value: stats.resolved, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className={`${s.bg} border ${s.border} rounded-2xl p-5 flex flex-col gap-1 shadow-xs`}
                        >
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
                            <span className={`text-3xl font-extrabold ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* ── Tab Bar ── */}
                <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-xs w-fit">
                    {[
                        { id: "reports", label: "My Reports", icon: ListChecks },
                        { id: "faq", label: "Help & FAQ", icon: HelpCircle },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === id
                                ? "bg-indigo-600 text-white shadow"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Reports Tab ── */}
                {tab === "reports" && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-indigo-600" />
                                Your Submitted Reports
                                <span className="ml-1 text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reports.length}</span>
                            </h2>
                            <button
                                onClick={() => fetchReports(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                                <span className="text-sm font-semibold">Loading your reports…</span>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <Bug className="w-8 h-8 text-indigo-300" />
                                </div>
                                <p className="text-sm font-bold text-gray-700">No reports yet</p>
                                <p className="text-xs text-gray-400 max-w-xs">
                                    Found a bug or need help? Hit the <strong>"New Bug Report"</strong> button above and our team will get on it.
                                </p>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="mt-2 inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                                >
                                    <MessageSquarePlus className="w-4 h-4" /> Submit First Report
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {reports.map((r) => {
                                    const isExpanded = expandedId === r.id;
                                    const date = new Date(r.created_at).toLocaleDateString([], {
                                        year: "numeric", month: "short", day: "numeric",
                                        hour: "2-digit", minute: "2-digit",
                                    });
                                    return (
                                        <div key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Summary Row */}
                                            <div
                                                onClick={() => toggleExpand(r.id)}
                                                className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-xs font-extrabold text-gray-900 truncate max-w-sm">{r.subject}</span>
                                                        <span className="text-[10px] text-gray-400 font-semibold">{date}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate max-w-2xl">{r.body}</p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <StatusBadge status={r.status} />
                                                    <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded">#{r.id}</span>
                                                    {isExpanded
                                                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>
                                            </div>

                                            {/* Expanded Detail */}
                                            {isExpanded && (
                                                <div className="px-6 pb-6 pt-2 border-t border-dashed border-gray-100 bg-slate-50/50 space-y-4">
                                                    {/* Body Card */}
                                                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                            <span>Report Details</span>
                                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black">Report #{r.id}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                                                        {(r.resolved_at || r.closed_at || r.related_complaint_id) && (
                                                            <div className="pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                                                {r.resolved_at && <div>Resolved: <span className="text-gray-700">{new Date(r.resolved_at).toLocaleString()}</span></div>}
                                                                {r.closed_at && <div>Closed: <span className="text-gray-700">{new Date(r.closed_at).toLocaleString()}</span></div>}
                                                                {r.related_complaint_id && <div className="md:col-span-2 text-indigo-600">Linked to Report #{r.related_complaint_id}</div>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {r.status?.toLowerCase() === "resolved" && (
                                                            <button
                                                                onClick={() => triggerReopen(r.id)}
                                                                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                                                            >
                                                                <Undo2 className="w-3.5 h-3.5" /> Reopen Report
                                                            </button>
                                                        )}
                                                        {r.status?.toLowerCase() === "closed" && (
                                                            <button
                                                                onClick={() => fileRelated(r.id)}
                                                                className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                                                            >
                                                                <MessageSquarePlus className="w-3.5 h-3.5" /> File Related Report
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Audit Trail */}
                                                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                                                        <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status History &amp; Audit Trail</h4>
                                                        {loadingLogs ? (
                                                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading history…
                                                            </p>
                                                        ) : expandedLogs.length === 0 ? (
                                                            <p className="text-xs text-gray-400">No history yet.</p>
                                                        ) : (
                                                            <div className="relative pl-5 border-l-2 border-indigo-100 space-y-3">
                                                                {expandedLogs.map((log) => (
                                                                    <div key={log.id} className="relative text-xs">
                                                                        <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white ring-4 ring-indigo-100" />
                                                                        <div className="font-bold text-gray-700">
                                                                            {log.from_status ? `${log.from_status} → ` : ""}
                                                                            <span className="text-indigo-600">{log.to_status}</span>
                                                                            <span className="text-[10px] font-normal text-gray-400 ml-2">
                                                                                {new Date(log.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                                            By: <span className="text-gray-600 font-bold">{log.changed_by_name}</span>
                                                                        </div>
                                                                        {log.note && (
                                                                            <p className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2 mt-1 whitespace-pre-wrap">{log.note}</p>
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
                )}

                {/* ── FAQ Tab ── */}
                {tab === "faq" && (
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* FAQ Accordion */}
                        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs px-6 py-2">
                            <div className="py-4 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                                    Frequently Asked Questions
                                </h2>
                            </div>
                            {FAQ_ITEMS.map((item, i) => (
                                <FaqItem key={i} q={item.q} a={item.a} />
                            ))}
                        </div>

                        {/* Contact Card */}
                        <div className="space-y-5">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-lg leading-snug">Contact Dev Team</h3>
                                <p className="text-indigo-100 text-xs mt-1 mb-4 leading-relaxed">
                                    For urgent system issues not covered by the bug report form, reach out directly.
                                </p>
                                <div className="space-y-2">
                                    <a
                                        href="mailto:dev@smilecare.com"
                                        className="flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white transition-colors group"
                                    >
                                        <Mail className="w-4 h-4" />
                                        dev@smilecare.com
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                    <a
                                        href="tel:+1800SMILECARE"
                                        className="flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white transition-colors group"
                                    >
                                        <Phone className="w-4 h-4" />
                                        +1 800-SMILECARE
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                    <Info className="w-4 h-4" /> Tips for Great Reports
                                </div>
                                <ul className="space-y-2 text-xs text-blue-800/80 font-medium">
                                    <li className="flex gap-2"><span className="text-blue-400 font-black">→</span> Include the page name and exact steps to reproduce</li>
                                    <li className="flex gap-2"><span className="text-blue-400 font-black">→</span> Note your browser and any error messages shown</li>
                                    <li className="flex gap-2"><span className="text-blue-400 font-black">→</span> Describe expected vs actual behavior clearly</li>
                                    <li className="flex gap-2"><span className="text-blue-400 font-black">→</span> One issue per report — don't bundle multiple bugs</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── New Report Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                    <Bug className="w-5 h-5 text-indigo-600" />
                                    {relatedId ? `File Related Report (linked to #${relatedId})` : "New Bug Report"}
                                </h2>
                                <p className="text-[11px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wide">
                                    Submitted directly to the development team
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                disabled={submitting}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                                {/* Feedback Banners */}
                                {formError && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /> {formError}
                                    </div>
                                )}
                                {formSuccess && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {formSuccess}
                                    </div>
                                )}

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        Issue Category
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {BUG_CATEGORIES.map((cat) => (
                                            <CategoryPill
                                                key={cat.id}
                                                cat={cat}
                                                selected={category === cat.id}
                                                onSelect={setCategory}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        Short Title / Subject <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={submitting}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g., Patient search crashes on special characters"
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all font-semibold disabled:opacity-60"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        Detailed Description <span className="text-rose-400">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        disabled={submitting}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder={`Describe the issue in detail:\n\n• Steps to reproduce\n• What you expected to happen\n• What actually happened\n• Page / section where it occurred\n• Any error messages shown`}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all font-semibold resize-none leading-relaxed disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between gap-3">
                                <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
                                    Your name &amp; role are automatically attached to the report.
                                </p>
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                                        ) : (
                                            <><Send className="w-3.5 h-3.5" /> Submit Report</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Reopen Modal ── */}
            {reopenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-amber-50/60">
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                    <Undo2 className="w-4 h-4 text-amber-600" /> Reopen Report
                                </h2>
                                <p className="text-[11px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wide">Mandatory reason required</p>
                            </div>
                            <button onClick={() => setReopenModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleReopen}>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reason for Reopening</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        placeholder="Explain why this issue is not fully resolved…"
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all font-semibold resize-none"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReopenModal(false)}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reopenSubmitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer transition-colors disabled:opacity-50"
                                >
                                    {reopenSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
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