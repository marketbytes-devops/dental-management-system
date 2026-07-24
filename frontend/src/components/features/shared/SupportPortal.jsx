"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    Search,
    SlidersHorizontal,
    MessageSquare,
    CornerDownRight,
    ArrowUpRight
} from "lucide-react";
import {
    getMyComplaints,
    submitComplaint,
    reopenComplaint,
    getComplaintLogs,
} from "@/services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const BUG_CATEGORIES = [
    { id: "ui_bug", label: "UI / Display Bug", icon: LayoutGrid, color: "text-violet-650", bg: "bg-violet-50/70", border: "border-violet-100", accent: "indigo" },
    { id: "feature_request", label: "Feature Request", icon: Zap, color: "text-amber-600", bg: "bg-amber-50/70", border: "border-amber-100", accent: "amber" },
    { id: "data_issue", label: "Data / Sync Issue", icon: Database, color: "text-blue-600", bg: "bg-blue-50/70", border: "border-blue-100", accent: "blue" },
    { id: "performance", label: "Performance", icon: Bug, color: "text-rose-650", bg: "bg-rose-50/70", border: "border-rose-100", accent: "rose" },
    { id: "other", label: "Other / General", icon: HelpCircle, color: "text-slate-600", bg: "bg-slate-50/70", border: "border-slate-100", accent: "slate" },
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

// Helper to parse subject and category label
const parseSubject = (fullSubject) => {
    if (!fullSubject) return { categoryLabel: "General", subject: "" };
    const match = fullSubject.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
        return {
            categoryLabel: match[1],
            subject: match[2]
        };
    }
    return {
        categoryLabel: "General",
        subject: fullSubject
    };
};

const getCategoryByLabel = (label) => {
    return BUG_CATEGORIES.find(c => c.label.toLowerCase() === label?.toLowerCase()) || BUG_CATEGORIES[BUG_CATEGORIES.length - 1];
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        resolved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Resolved" },
        "under review": { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5 animate-spin" />, label: "Under Review" },
        closed: { cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <X className="w-3.5 h-3.5" />, label: "Closed" },
        pending: { cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Pending" },
    };
    const { cls, icon, label } = map[status?.toLowerCase()] ?? map.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs transition-all ${cls}`}>
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
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${selected
                ? `${cat.bg} ${cat.color} ${cat.border} ring-2 ring-offset-1 ring-current/25 scale-[1.02]`
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            <Icon className="w-4 h-4 shrink-0" />
            {cat.label}
        </button>
    );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-100 rounded-2xl bg-white shadow-xs overflow-hidden transition-all duration-300 hover:border-slate-200">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left gap-4 cursor-pointer outline-none select-none"
            >
                <span className="text-sm font-semibold text-slate-800 transition-colors duration-200 hover:text-indigo-650">{q}</span>
                <span className={`p-1 rounded-full transition-all duration-300 ${open ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                </span>
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${open ? "max-h-[300px] border-t border-slate-50" : "max-h-0"}`}>
                <p className="text-xs text-slate-500 p-5 leading-relaxed font-medium bg-slate-50/30">{a}</p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SupportPortal() {
    // ── Complaints state
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // ── Selected Report Details
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [selectedReportLogs, setSelectedReportLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // ── Form modals state
    const [modalOpen, setModalOpen] = useState(false);
    const [category, setCategory] = useState("ui_bug");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [relatedId, setRelatedId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // ── Reopen modal state
    const [reopenModal, setReopenModal] = useState(false);
    const [reopenId, setReopenId] = useState(null);
    const [reopenReason, setReopenReason] = useState("");
    const [reopenSubmitting, setReopenSubmitting] = useState(false);

    // ── Active Tab
    const [activeTab, setActiveTab] = useState("desk"); // "desk" | "faq"

    // ── Fetch reports from API
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

    // ── Auto-select first report when reports are loaded
    const parsedAndFilteredReports = useMemo(() => {
        return reports.filter(r => {
            const parsed = parseSubject(r.subject);
            const cat = getCategoryByLabel(parsed.categoryLabel);

            const matchesSearch =
                parsed.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
                `#${r.id}`.includes(searchQuery);

            const matchesStatus = statusFilter === "all" || r.status?.toLowerCase() === statusFilter.toLowerCase();
            const matchesCategory = categoryFilter === "all" || cat.id === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [reports, searchQuery, statusFilter, categoryFilter]);

    useEffect(() => {
        if (parsedAndFilteredReports.length > 0) {
            // Only auto-select if current selection is not in the filtered results
            const selectionIsValid = parsedAndFilteredReports.some(r => r.id === selectedReportId);
            if (!selectionIsValid) {
                setSelectedReportId(parsedAndFilteredReports[0].id);
            }
        } else {
            setSelectedReportId(null);
        }
    }, [parsedAndFilteredReports, selectedReportId]);

    // ── Fetch logs for selected report
    useEffect(() => {
        if (!selectedReportId) {
            setSelectedReportLogs([]);
            return;
        }

        const fetchLogs = async () => {
            setLoadingLogs(true);
            try {
                const logs = await getComplaintLogs(selectedReportId);
                setSelectedReportLogs(logs);
            } catch (err) {
                console.error("Failed to load ticket logs:", err);
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [selectedReportId]);

    // ── Submit new ticket
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
            const res = await submitComplaint({ subject: fullSubject, body: body.trim(), related_complaint_id: relatedId });
            setFormSuccess("✅ Your report has been submitted to the development team.");
            setSubject("");
            setBody("");
            setCategory("ui_bug");
            setRelatedId(null);
            setTimeout(() => {
                setModalOpen(false);
                setFormSuccess("");
                fetchReports(true);
                if (res?.id) {
                    setSelectedReportId(res.id);
                }
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
            const logs = await getComplaintLogs(reopenId);
            setSelectedReportLogs(logs);
        } catch (err) {
            alert("Failed to reopen: " + err.message);
        } finally {
            setReopenSubmitting(false);
        }
    };

    // ── File a related complaint from a closed ticket
    const fileRelated = (id) => { setRelatedId(id); setSubject(""); setBody(""); setCategory("ui_bug"); setFormError(""); setFormSuccess(""); setModalOpen(true); };

    // ── Stats calculation
    const stats = useMemo(() => {
        return {
            total: reports.length,
            pending: reports.filter((r) => r.status?.toLowerCase() === "pending").length,
            underReview: reports.filter((r) => r.status?.toLowerCase() === "under review").length,
            resolved: reports.filter((r) => r.status?.toLowerCase() === "resolved").length,
        };
    }, [reports]);

    const activeReport = useMemo(() => {
        return reports.find(r => r.id === selectedReportId);
    }, [reports, selectedReportId]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-1 py-3 text-slate-800">

            {/* ── Custom Glassmorphism Navigation Bar ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                        <ShieldCheck className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <div className="text-[10px] tracking-wider uppercase font-extrabold text-indigo-650">SmileCare Support</div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight">Developer Support Desk</h1>
                    </div>
                </div>

                {/* Tabs & New Ticket Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 border border-slate-200/50 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setActiveTab("desk")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-205 select-none ${activeTab === "desk"
                                ? "bg-white text-indigo-750 shadow-sm font-extrabold"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Ticket Workspace
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("faq")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-205 select-none ${activeTab === "faq"
                                ? "bg-white text-indigo-750 shadow-sm font-extrabold"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Help &amp; FAQs
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer select-none"
                    >
                        <MessageSquarePlus className="w-4 h-4 shrink-0" />
                        Create Ticket
                    </button>
                </div>
            </div>

            {/* ── Stats Dashboard Widgets ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "All Tickets", value: stats.total, color: "text-slate-800", bg: "bg-white border-slate-100", highlight: "bg-slate-400" },
                    { label: "Pending Review", value: stats.pending, color: "text-indigo-650", bg: "bg-white border-slate-100", highlight: "bg-indigo-500" },
                    { label: "Under Review", value: stats.underReview, color: "text-amber-600", bg: "bg-white border-slate-100", highlight: "bg-amber-400" },
                    { label: "Resolved Cases", value: stats.resolved, color: "text-emerald-600", bg: "bg-white border-slate-100", highlight: "bg-emerald-400" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs bg-white ${s.bg} relative overflow-hidden`}
                    >
                        <div className="text-left">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
                            <span className={`text-2xl font-black ${s.color} mt-1 block`}>{s.value}</span>
                        </div>
                        <span className={`w-1.5 h-10 rounded-full ${s.highlight}`} />
                    </div>
                ))}
            </div>

            {/* ── Tab Layout Workspace ── */}
            {activeTab === "desk" ? (
                <div className="flex flex-col lg:flex-row border border-slate-200/60 rounded-3xl bg-white shadow-sm overflow-hidden h-[700px]">

                    {/* Left Pane: Ticket Sidebar list */}
                    <div className="w-full lg:w-[360px] xl:w-[400px] border-b lg:border-b-0 lg:border-r border-slate-150 flex flex-col h-full bg-slate-50/50 shrink-0">
                        {/* Search & Header */}
                        <div className="p-4 border-b border-slate-150 bg-white space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Tickets List</h3>
                                <button
                                    type="button"
                                    onClick={() => fetchReports(true)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                    title="Refresh tickets list"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
                                </button>
                            </div>

                            {/* Search bar */}
                            <div className="relative flex items-center">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, title, or body..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-100 border-0 focus:bg-white border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                                />
                            </div>

                            {/* Category Filter dropdown */}
                            <div className="flex gap-2 text-[11px] font-bold text-slate-500">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200/70 border-0 rounded-lg px-2.5 py-1.5 outline-none font-semibold cursor-pointer"
                                >
                                    <option value="all">All Categories</option>
                                    {BUG_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200/70 border-0 rounded-lg px-2.5 py-1.5 outline-none font-semibold cursor-pointer"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="under review">Under Review</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        {/* Reports scrollable list */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-20">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
                                    <span className="text-xs font-bold">Loading workspace...</span>
                                </div>
                            ) : parsedAndFilteredReports.length === 0 ? (
                                <div className="text-center py-20 px-4 space-y-3">
                                    <Bug className="w-8 h-8 text-slate-350 mx-auto" />
                                    <h4 className="text-xs font-bold text-slate-700">No tickets found</h4>
                                    <p className="text-[11px] text-slate-400 leading-normal max-w-[220px] mx-auto">
                                        Try adjusting your search criteria or create a new bug report.
                                    </p>
                                </div>
                            ) : (
                                parsedAndFilteredReports.map((r) => {
                                    const isSelected = selectedReportId === r.id;
                                    const parsed = parseSubject(r.subject);
                                    const categoryInfo = getCategoryByLabel(parsed.categoryLabel);
                                    const CategoryIcon = categoryInfo.icon;

                                    const timeStr = new Date(r.created_at).toLocaleDateString([], {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    });

                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => setSelectedReportId(r.id)}
                                            className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left ${isSelected
                                                ? "bg-indigo-500/10 border-indigo-200 shadow-sm"
                                                : "bg-white hover:bg-slate-50 border-slate-100"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-1.5">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${categoryInfo.color} ${categoryInfo.bg}`}>
                                                    <CategoryIcon className="w-3 h-3" />
                                                    <span>{categoryInfo.label}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{r.id}</span>
                                            </div>
                                            <h4 className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950 font-extrabold" : "text-slate-800"}`}>
                                                {parsed.subject}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 truncate mt-1 leading-normal font-medium">
                                                {r.body}
                                            </p>
                                            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/50">
                                                <span className="text-[9px] text-slate-400 font-bold">{timeStr}</span>
                                                <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${r.status?.toLowerCase() === "resolved" ? "bg-emerald-500" :
                                                    r.status?.toLowerCase() === "under review" ? "bg-amber-500 animate-pulse" :
                                                        r.status?.toLowerCase() === "closed" ? "bg-slate-400" : "bg-indigo-500"
                                                    }`} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Ticket Details View */}
                    <div className="flex-1 flex flex-col h-full bg-slate-50/20 overflow-y-auto">
                        {activeReport ? (
                            <div className="flex-1 flex flex-col divide-y divide-slate-150">

                                {/* Detail Header */}
                                <div className="p-6 bg-white space-y-4 text-left">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={activeReport.status} />
                                            <span className="text-xs font-extrabold bg-slate-100 text-slate-650 px-2.5 py-1 rounded-lg">Ticket #{activeReport.id}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">
                                            Submitted: {new Date(activeReport.created_at).toLocaleString([], {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 leading-snug">
                                            {parseSubject(activeReport.subject).subject}
                                        </h2>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-bold">
                                            <span className="text-slate-800">{activeReport.staff_name || "Staff Member"}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-505">{activeReport.staff_role || "Staff"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details Card */}
                                <div className="p-6 space-y-6">
                                    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Report Details</div>
                                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-semibold">
                                            {activeReport.body}
                                        </p>

                                        {activeReport.related_complaint_id && (
                                            <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100/60 rounded-xl text-xs text-indigo-750 font-bold flex items-center gap-2">
                                                <CornerDownRight className="w-4 h-4 text-indigo-550 shrink-0" />
                                                <span>Linked to parent ticket <span className="font-black bg-indigo-100 px-1.5 py-0.5 rounded">#{activeReport.related_complaint_id}</span></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons panel */}
                                    {(activeReport.status?.toLowerCase() === "resolved" || activeReport.status?.toLowerCase() === "closed") && (
                                        <div className="flex items-center gap-3">
                                            {activeReport.status?.toLowerCase() === "resolved" && (
                                                <button
                                                    type="button"
                                                    onClick={() => triggerReopen(activeReport.id)}
                                                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer select-none shadow-sm shadow-amber-100"
                                                >
                                                    <Undo2 className="w-4 h-4" /> Reopen Ticket
                                                </button>
                                            )}
                                            {activeReport.status?.toLowerCase() === "closed" && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileRelated(activeReport.id)}
                                                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer select-none shadow-sm"
                                                >
                                                    <MessageSquarePlus className="w-4 h-4" /> File Related Ticket
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Audit Trail Timeline */}
                                    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status logs &amp; Dev History</h4>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{selectedReportLogs.length} updates</span>
                                        </div>

                                        {loadingLogs ? (
                                            <div className="flex items-center justify-center gap-2 py-6 text-slate-450 text-xs font-semibold">
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                                Loading audit log history...
                                            </div>
                                        ) : selectedReportLogs.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-6">No workflow changes recorded for this ticket.</p>
                                        ) : (
                                            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-4 mt-2">
                                                {selectedReportLogs.map((log) => (
                                                    <div key={log.id} className="relative text-xs">
                                                        <span className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-white ring-2 ring-indigo-100 shrink-0" />
                                                        <div className="flex flex-wrap items-baseline gap-2 font-bold text-slate-700">
                                                            {log.from_status ? (
                                                                <>
                                                                    <span className="line-through text-slate-400 font-medium">{log.from_status}</span>
                                                                    <span className="text-slate-400 font-normal">→</span>
                                                                </>
                                                            ) : null}
                                                            <span className="text-indigo-700 uppercase tracking-wide text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-black">{log.to_status}</span>

                                                            <span className="text-[10px] font-semibold text-slate-400 ml-auto">
                                                                {new Date(log.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1 font-bold">
                                                            Changed by: <span className="text-slate-600 font-extrabold">{log.changed_by_name}</span>
                                                        </div>
                                                        {log.note && (
                                                            <p className="text-xs font-medium text-slate-650 bg-slate-50 border border-slate-100 rounded-xl p-3 mt-2 whitespace-pre-wrap leading-relaxed shadow-3xs">{log.note}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-4 min-h-[450px]">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                                    <MessageSquare className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700">Select a Ticket</h4>
                                    <p className="text-xs text-slate-400 leading-normal max-w-sm mt-1">
                                        Choose one of the bug reports or support request cases on the left sidebar list to inspect details, read status history logs, or reopen resolved tickets.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Help & FAQ Tab Content */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-indigo-600" />
                                Frequently Asked Questions
                            </h2>
                            <div className="space-y-3 mt-4">
                                {FAQ_ITEMS.map((item, i) => (
                                    <FaqItem key={i} q={item.q} a={item.a} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Direct Dev contact card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-550/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-extrabold text-base leading-snug">Developer Direct Support</h3>
                            <p className="text-slate-400 text-xs mt-2 mb-4 leading-relaxed font-semibold">
                                For high-priority system crashes, server network downtime, or database locking issues, contact developers directly.
                            </p>
                            <div className="space-y-3 pt-3 border-t border-slate-800">
                                <a
                                    href="mailto:dev@smilecare.com"
                                    className="flex items-center gap-2.5 text-xs font-bold text-slate-200 hover:text-white transition-colors group"
                                >
                                    <Mail className="w-4 h-4 text-indigo-400" />
                                    dev@smilecare.com
                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-0.5" />
                                </a>
                                <a
                                    href="tel:+1800SMILECARE"
                                    className="flex items-center gap-2.5 text-xs font-bold text-slate-200 hover:text-white transition-colors group"
                                >
                                    <Phone className="w-4 h-4 text-indigo-400" />
                                    +1 (800) SMILE-CARE
                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-0.5" />
                                </a>
                            </div>
                        </div>

                        {/* Tips list */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-750 font-extrabold text-xs uppercase tracking-wider">
                                <Info className="w-4 h-4 text-indigo-600" /> Tips for Better Reports
                            </div>
                            <ul className="space-y-3 text-xs text-indigo-900/80 font-medium pl-1">
                                <li className="flex gap-2"><span className="text-indigo-500 font-black">1.</span> <span><strong>Steps to reproduce</strong>: Detail precisely which button you clicked and when.</span></li>
                                <li className="flex gap-2"><span className="text-indigo-500 font-black">2.</span> <span><strong>Context detail</strong>: Mention error popups, blank screens, or slow queries.</span></li>
                                <li className="flex gap-2"><span className="text-indigo-500 font-black">3.</span> <span><strong>Isolated topics</strong>: Create one bug ticket per issue. Do not list unrelated bugs in the same card.</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ── New Report Modal Overlay ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 text-left animate-in fade-in zoom-in duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2 tracking-wide">
                                    <Bug className="w-5 h-5 text-indigo-600 animate-pulse" />
                                    {relatedId ? `File Related Ticket (Linked to #${relatedId})` : "Create Support Ticket"}
                                </h2>
                                <p className="text-[10px] text-slate-450 font-bold uppercase mt-1">
                                    Dispatched directly to the dental engineering queue
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer disabled:opacity-50 outline-none"
                            >
                                <X className="w-4.5 h-4.5" />
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
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                        Select Issue Category
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
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                        Short Title / Subject <span className="text-rose-450">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={submitting}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g., Accountant payments panel freezes during checkout"
                                        className="w-full px-4 py-2.5 bg-slate-55 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:bg-white transition-all font-semibold disabled:opacity-60"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                        Detailed Description <span className="text-rose-450">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        disabled={submitting}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder={`Explain details:\n\n• What did you do to hit the issue?\n• What was the expected behavior vs the actual outcome?\n• Mention the specific screen, page url, or patient token if applicable.`}
                                        className="w-full px-4 py-2.5 bg-slate-55 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:bg-white transition-all font-semibold resize-none leading-relaxed disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3">
                                <p className="text-[10px] text-slate-400 font-bold hidden sm:block">
                                    Your name &amp; module role are auto-appended to the ticket.
                                </p>
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50 outline-none"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 outline-none"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                                        ) : (
                                            <><Send className="w-3.5 h-3.5" /> Dispatch Ticket</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Reopen Modal Overlay ── */}
            {reopenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-amber-50/50">
                            <div>
                                <h2 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2 tracking-wide">
                                    <Undo2 className="w-4 h-4 text-amber-600 animate-pulse" /> Reopen Ticket
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Reason required for audit logs</p>
                            </div>
                            <button onClick={() => setReopenModal(false)} className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer outline-none">
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>
                        <form onSubmit={handleReopen}>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reason for Reopening</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        placeholder="Briefly clarify why this bug or request is not resolved..."
                                        className="w-full px-4 py-2.5 bg-slate-55 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:bg-white transition-all font-semibold resize-none"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReopenModal(false)}
                                    className="px-4 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reopenSubmitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 outline-none"
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
