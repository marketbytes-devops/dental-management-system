"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Hourglass, 
  Flame, 
  Search, 
  Calendar,
  X,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  Truck,
  UploadCloud,
  AlertCircle,
  Check,
  ChevronRight,
  Eye,
  Settings,
  ShieldCheck,
  RefreshCw,
  Plus,
  Microscope
} from "lucide-react";
import { getLabOrders, updateLabOrderStatus, updateLabOrder } from "@/services/api";
import { validateLabOrderFields } from "@/services/labValidation";



export default function LabOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const data = await getLabOrders();
      const mapped = data.map(o => ({
        id: o.id,
        patientName: o.patient_name || "Walk-in Patient",
        dentistName: o.dentist_name || "Dr. Anoop Nair",
        dentistContact: o.dentist_contact || "+91 98765 43210",
        orderCategory: o.order_category || "Prosthetic",
        orderDetails: o.order_details || {},
        prostheticType: o.prosthetic_type,
        material: o.material || "Zirconia",
        shade: o.shade || "A2",
        priority: o.priority || "Medium",
        dueDate: o.due_date || "2026-06-15",
        status: o.status,
        notes: o.notes || "",
        rejectionReason: o.rejection_reason || "",
        resultDocumentUrl: o.result_document_url || "",
        // Added properties
        labName: o.lab_name || "",
        vendorId: o.vendor_id || "",
        impressionType: o.impression_type || "Physical",
        toothQuadrant: o.tooth_quadrant || "",
        externalCost: o.external_cost || 0,
        dispatchDate: o.dispatch_date || "",
        expectedReturnDate: o.expected_return_date || "",
        receivedDate: o.received_date || "",
        marginDesign: o.margin_design || "",
        procedureCode: o.procedure_code || "",
        stage: o.stage || "New Cases",
        patientToken: o.patient_token || "",
        isRework: o.is_rework || false,
        originalCaseId: o.original_case_id || "",
        scanFile: o.scan_file || "",
        opposingBiteScan: o.opposing_bite_scan || "",
        implantSystem: o.implant_system || "",
        testType: o.test_type || "",
        sampleType: o.sample_type || "",
        reasonForTest: o.reason_for_test || "",
        sampleCollectedConfirm: o.sample_collected_confirm || false
      }));
      setOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch lab orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dentistFilter, setDentistFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [activeCategory, setActiveCategory] = useState("Dental Prosthetics");
  const [viewMode, setViewMode] = useState("table");

  // Flag modal states
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagOrder, setFlagOrder] = useState(null);
  const [flagNote, setFlagNote] = useState("");

  const validateOrderFields = (order) => {
    const missing = validateLabOrderFields(order);
    
    // Add lab-tech specific universal routing requirements
    if (!order.labName && !order.lab_name && !order.external_lab_name) {
      missing.push("Lab partner selection");
    }
    if (!order.dueDate && !order.due_date) {
      missing.push("Due date");
    }
    return missing;
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagOrder) return;
    try {
      await updateLabOrderStatus(flagOrder.id, {
        status: "Flagged",
        rejection_reason: flagNote
      });
      triggerToast(`Case ${flagOrder.id} has been flagged for Doctor review.`);
      setIsFlagModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to flag order.", "error");
    }
  };

  const handleOpenFlagModal = (order) => {
    setFlagOrder(order);
    const missing = validateOrderFields(order);
    setFlagNote(`Missing fields required for confirmation: ${missing.join(", ")}`);
    setIsFlagModalOpen(true);
  };

  // Rework modal states
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [reworkOrder, setReworkOrder] = useState(null);
  const [reworkReason, setReworkReason] = useState("shade mismatch");
  const [reworkNote, setReworkNote] = useState("");

  // Dispatch Modal States
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [dispatchFormData, setDispatchFormData] = useState({
    labName: "Apex Dental Laboratories",
    address: "SmileCare Dental Practice, 4th Floor, Suite 402, Jubilee Hills, Hyderabad, Telangana - 500033",
    expectedReturnDate: "",
    courierPartner: "SmileCare Express",
    marginClearance: "Verified (Correct)",
    prepHeight: "Verified (Correct)",
    occlusalFit: "Verified (Correct)",
    externalCost: 3500,
    notes: "",
    prostheticType: "",
    material: "",
    shade: "",
    toothQuadrant: ""
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Drawer states
  const [selectedLabPartner, setSelectedLabPartner] = useState("apex");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [labNotes, setLabNotes] = useState("");
  const [isReceived, setIsReceived] = useState(false);
  const [receivedDate, setReceivedDate] = useState("");
  const [isReworkModalOpen2, setIsReworkModalOpen2] = useState(false);
  const [reworkReason2, setReworkReason2] = useState("");
  const [reworkCategory2, setReworkCategory2] = useState("shade mismatch");

  const LAB_PARTNERS = {
    apex: {
      name: "Apex Dental Laboratories",
      address: "Apex Dental Lab, 2nd Floor, Plot 14, Road 12, Banjara Hills, Hyderabad — 500034",
      contact: "+91 40 2345 6789",
      specialty: "Zirconia Crowns, E-max Veneers, Full-Arch Bridges"
    },
    precision: {
      name: "Precision Milling Centre",
      address: "Precision Milling Centre, Unit 3, HITEC City, Madhapur, Hyderabad — 500081",
      contact: "+91 40 6678 9012",
      specialty: "CAD-CAM Milling, PMMA Temporaries, Implant Crowns"
    },
    citypath: {
      name: "City Path Labs",
      address: "City Path Diagnostics, Lane 4, Punjagutta, Hyderabad — 500082",
      contact: "+91 40 4456 7890",
      specialty: "Biopsy Analysis, Blood Tests, Microbiology Panels"
    }
  };

  const currentCase = selectedOrder ? {
    id: selectedOrder.id,
    patient: selectedOrder.patientName,
    dentist: selectedOrder.dentistName,
    dentistContact: selectedOrder.dentistContact,
    orderCategory: selectedOrder.orderCategory,
    orderDetails: selectedOrder.orderDetails,
    type: selectedOrder.prostheticType,
    material: selectedOrder.material,
    priority: selectedOrder.priority,
    dueDate: selectedOrder.dueDate,
    shade: selectedOrder.shade,
    status: selectedOrder.status,
    notes: selectedOrder.notes,
    rejectionReason: selectedOrder.rejectionReason,
    resultDocumentUrl: selectedOrder.resultDocumentUrl,
    scanFile: selectedOrder.scanFile,
    opposingBiteScan: selectedOrder.opposingBiteScan,
    implantSystem: selectedOrder.implantSystem,
    testType: selectedOrder.testType,
    sampleType: selectedOrder.sampleType,
    reasonForTest: selectedOrder.reasonForTest,
    sampleCollectedConfirm: selectedOrder.sampleCollectedConfirm,
    isRework: selectedOrder.isRework,
    toothQuadrant: selectedOrder.toothQuadrant
  } : null;

  const updateDbStatus = async (caseId, statusValue, rejectionReason = null) => {
    try {
      const body = { status: statusValue };
      if (rejectionReason) {
        body.rejection_reason = rejectionReason;
      }
      await updateLabOrderStatus(caseId, body);
      if (selectedOrder && selectedOrder.id === caseId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: statusValue,
          rejectionReason: rejectionReason || ""
        }));
      }
      fetchOrders();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateStage = (caseId, targetStage) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lab_production_stage_map");
      const currentMap = saved ? JSON.parse(saved) : {};
      const nextMap = { ...currentMap, [caseId]: targetStage };
      localStorage.setItem("lab_production_stage_map", JSON.stringify(nextMap));
    }
  };

  const handleQCPass = async () => {
    const allChecked = Object.values(qcChecklist).every(v => v === true);
    if (!allChecked) {
      alert("Please verify all QC checklist parameters before passing.");
      return;
    }
    const ok = await updateDbStatus(selectedOrder.id, "Ready / Shipped");
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} successfully passed Quality Control!`);
      updateStage(selectedOrder.id, "QC");
    } else {
      triggerToast("Failed to pass Quality Control status.", "error");
    }
  };

  const handleQCFailRework = async () => {
    if (qcComments.trim() === "") {
      alert("Please specify rework comments.");
      return;
    }
    const ok = await updateDbStatus(selectedOrder.id, "In Progress", qcComments);
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} returned to Production for rework.`, "error");
      updateStage(selectedOrder.id, "Finishing");
    } else {
      triggerToast("Failed to update status.", "error");
    }
  };

  const handleQCReject = async () => {
    if (qcComments.trim() === "") {
      alert("Please specify reasons for rejection.");
      return;
    }
    const ok = await updateDbStatus(selectedOrder.id, "Rejected", qcComments);
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} has been rejected.`, "error");
      setIsDrawerOpen(false);
    } else {
      triggerToast("Failed to reject order.", "error");
    }
  };

  const handleDispatchOrder = async () => {
    const ok = await updateDbStatus(selectedOrder.id, "Completed");
    if (ok) {
      triggerToast(`Case ${selectedOrder.id} marked as completed and shipped!`);
      setIsDrawerOpen(false);
    } else {
      triggerToast("Failed to dispatch order.", "error");
    }
  };

  const handleCadVersionUpload = (e) => {
    e.preventDefault();
    const newVersionNum = (cadVersions.length + 1) * 0.1 + 1.0;
    const newVersion = {
      version: `v${newVersionNum.toFixed(1)}`,
      date: new Date().toLocaleString(),
      author: "Alen Joseph (CAD)",
      status: "Review",
      notes: "Uploaded new scan model parameters.",
      color: "bg-warning/10 text-warning border-warning/20"
    };
    setCadVersions([newVersion, ...cadVersions]);
    triggerToast("STL scan revision uploaded.");
  };

  const handleAddDesignerNote = (e) => {
    e.preventDefault();
    if (designerNote.trim() === "") return;
    setDesignerNotesList([...designerNotesList, designerNote.trim()]);
    setDesignerNote("");
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    prostheticType: "",
    material: "",
    shade: "",
    priority: "",
    dueDate: "",
    notes: ""
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const dentists = Array.from(new Set(orders.map((o) => o.dentistName)));

  useEffect(() => {
    let result = [...orders];

    // Filter by category first
    result = result.filter((o) =>
      activeCategory === "Dental Prosthetics"
        ? o.orderCategory === "Prosthetic"
        : o.orderCategory !== "Prosthetic"
    );

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.patientName.toLowerCase().includes(q) ||
          o.dentistName.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (priorityFilter !== "") {
      result = result.filter((o) => o.priority === priorityFilter);
    }

    if (dentistFilter !== "") {
      result = result.filter((o) => o.dentistName === dentistFilter);
    }

    if (dateFilter !== "") {
      const today = new Date("2026-06-10");
      result = result.filter((o) => {
        const orderDate = new Date(o.dueDate);
        const timeDiff = orderDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dateFilter === "Today") {
          return o.dueDate === "2026-06-10";
        } else if (dateFilter === "Next 7 Days") {
          return daysDiff >= 0 && daysDiff <= 7;
        } else if (dateFilter === "Next 30 Days") {
          return daysDiff >= 0 && daysDiff <= 30;
        }
        return true;
      });
    }

    setFilteredOrders(result);
  }, [orders, searchQuery, statusFilter, priorityFilter, dentistFilter, dateFilter, activeCategory]);

  const categoryFiltered = orders.filter((o) =>
    activeCategory === "Dental Prosthetics"
      ? o.orderCategory === "Prosthetic"
      : o.orderCategory !== "Prosthetic"
  );

  const totalCases = categoryFiltered.filter((o) => o.status !== "completed" && o.status !== "Completed").length;
  const pendingCases = categoryFiltered.filter((o) => 
    ["submitted", "Submitted", "Pending", "Flagged", "flagged", "ordered", "Ordered"].includes(o.status)
  ).length;
  const inProductionCases = categoryFiltered.filter((o) => {
    if (activeCategory === "Dental Prosthetics") {
      return ["received_by_lab", "in_design", "in_fabrication", "quality_check", "Accepted", "In Progress", "Confirmed", "Sent to Lab", "Received from Lab", "Fitted"].includes(o.status);
    } else {
      return ["Sample Collected", "Sent to Lab", "Report Received", "Reviewed by Doctor"].includes(o.status);
    }
  }).length;
  const urgentHighCases = categoryFiltered.filter((o) => 
    ["Urgent", "High"].includes(o.priority) && o.status !== "completed" && o.status !== "Completed"
  ).length;

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-danger/10 text-danger border border-danger/20";
      case "High":
        return "bg-warning/10 text-warning border border-warning/20";
      case "Medium":
        return "bg-primary/10 text-primary border border-primary/20";
      case "Low":
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Submitted":
      case "submitted":
        return "Submitted";
      case "Pending Doctor Confirmation":
      case "Pending Doctor Review":
        return "Pending Doctor Confirmation";
      case "Doctor Accepted":
      case "Confirmed":
      case "confirmed":
        return "Doctor Accepted";
      case "Order Sent to Lab":
      case "Sent to Lab":
      case "sent_to_lab":
        return "Order Sent to Lab";
      case "Order Received":
      case "Received from Lab":
      case "received_from_lab":
        return "Order Received";
      case "Returned for Rework":
      case "returned_for_rework":
        return "Returned for Rework";
      case "Completed":
      case "completed":
        return "Completed";
      case "Flagged":
      case "flagged":
        return "Flagged";
      case "Rejected":
        return "Rejected";
      case "Ordered":
      case "ordered":
        return "Ordered";
      case "Sample Collected":
      case "sample_collected":
        return "Sample Collected";
      case "Report Received":
      case "report_received":
        return "Report Received";
      case "Reviewed by Doctor":
      case "reviewed_by_doctor":
        return "Reviewed by Doctor";
      default:
        return status || "Unknown";
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "Submitted":
      case "submitted":
        return "bg-blue-400";
      case "Pending Doctor Confirmation":
      case "Pending Doctor Review":
        return "bg-warning animate-pulse";
      case "Doctor Accepted":
      case "Confirmed":
      case "confirmed":
        return "bg-emerald-400";
      case "Order Sent to Lab":
      case "Sent to Lab":
      case "sent_to_lab":
        return "bg-indigo-600";
      case "Order Received":
      case "Received from Lab":
      case "received_from_lab":
        return "bg-purple-600";
      case "Returned for Rework":
      case "returned_for_rework":
        return "bg-danger animate-pulse";
      case "Completed":
      case "completed":
        return "bg-success";
      case "Flagged":
      case "flagged":
        return "bg-danger animate-pulse";
      case "Rejected":
        return "bg-danger";
      case "Ordered":
      case "ordered":
        return "bg-yellow-500";
      case "Sample Collected":
      case "sample_collected":
        return "bg-emerald-400";
      case "Report Received":
      case "report_received":
        return "bg-purple-600";
      case "Reviewed by Doctor":
      case "reviewed_by_doctor":
        return "bg-teal-500";
      default:
        return "bg-gray-400";
    }
  };

  const handleTransitionStatus = async (orderId, nextStatus) => {
    try {
      await updateLabOrderStatus(orderId, { status: nextStatus });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
      }
      triggerToast(`Case ${orderId} status updated to ${getStatusLabel(nextStatus)}.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update status.", "error");
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await updateLabOrderStatus(orderId, { status: "received_by_lab" });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: "received_by_lab" }));
      }
      triggerToast(`Case ${orderId} accepted by lab.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to accept order.", "error");
    }
  };

  const handleStartProduction = async (orderId) => {
    try {
      await updateLabOrderStatus(orderId, { status: "in_design" });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: "in_design" }));
      }
      triggerToast(`Case ${orderId} status updated to In Design.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to start design.", "error");
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await updateLabOrderStatus(orderId, { status: "completed" });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: "completed" }));
      }
      triggerToast(`Case ${orderId} marked as Completed.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to complete order.", "error");
    }
  };

  const handleOpenReworkModal = (order) => {
    setReworkOrder(order);
    setReworkReason("shade mismatch");
    setReworkNote("");
    setIsReworkModalOpen(true);
  };

  const handleReworkSubmit = async (e) => {
    e.preventDefault();
    if (!reworkOrder) return;
    try {
      await updateLabOrderStatus(reworkOrder.id, {
        status: "Returned for Rework",
        rejection_category: reworkReason,
        rejection_reason: reworkNote
      });
      triggerToast(`Case ${reworkOrder.id} returned for rework.`);
      setIsReworkModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update status for rework.", "error");
    }
  };

  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData("text/plain", orderId);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    let targetStatus = "";
    if (activeCategory === "Dental Prosthetics") {
      if (columnId === "Submitted") targetStatus = "Submitted";
      else if (columnId === "ConfirmedSent") targetStatus = "Doctor Accepted";
      else if (columnId === "ReceivedFitted") targetStatus = "Order Received";
      else if (columnId === "Completed") targetStatus = "Completed";
    } else {
      if (columnId === "OrderedCollected") targetStatus = "Sample Collected";
      else if (columnId === "SentReport") targetStatus = "Report Received";
      else if (columnId === "Reviewed") targetStatus = "Reviewed by Doctor";
      else if (columnId === "Completed") targetStatus = "Completed";
    }

    if (targetStatus && targetStatus !== order.status) {
      if (activeCategory === "Dental Prosthetics" && columnId !== "Submitted") {
        const missing = validateOrderFields(order);
        if (missing.length > 0) {
          triggerToast(`Cannot move case: missing confirmation fields: ${missing.join(", ")}`, "error");
          return;
        }
      }
      const ok = await updateDbStatus(orderId, targetStatus);
      if (ok) {
        triggerToast(`Case ${orderId} moved to ${targetStatus}.`);
      } else {
        triggerToast("Failed to move case.", "error");
      }
    }
  };

  const renderOrderActions = (order) => {
    const isProsthetic = order.orderCategory === "Prosthetic";
    const missing = validateOrderFields(order);
    const hasMissing = missing.length > 0;
    
    if (isProsthetic) {
      if (order.status === "submitted" || order.status === "Submitted" || order.status === "Pending" || order.status === "Flagged" || order.status === "flagged") {
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => updateDbStatus(order.id, "Doctor Accepted")}
              disabled={hasMissing}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                hasMissing 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                  : "bg-primary text-white hover:bg-primary/95"
              }`}
              title={hasMissing ? `Missing fields: ${missing.join(", ")}` : "Confirm Order"}
            >
              Confirm Order
            </button>
            {order.status !== "Flagged" && order.status !== "flagged" && (
              <button
                onClick={() => handleOpenFlagModal(order)}
                className="px-2.5 py-1.5 bg-warning/10 hover:bg-warning text-warning hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-warning/10"
              >
                Flag for Doctor
              </button>
            )}
            {hasMissing && (
              <span className="text-[10px] text-warning font-semibold block w-full mt-1">
                ⚠️ Missing: {missing.join(", ")}
              </span>
            )}
          </div>
        );
      }
      if (["Confirmed", "confirmed", "Doctor Accepted"].includes(order.status)) {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Order Sent to Lab")}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Sent to Lab
          </button>
        );
      }
      if (["Sent to Lab", "sent_to_lab", "Order Sent to Lab", "in_design", "in_fabrication", "quality_check"].includes(order.status)) {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Order Received")}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-650 hover:text-white border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Received from Lab
          </button>
        );
      }
      if (["Received from Lab", "received_from_lab", "Order Received"].includes(order.status)) {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Fitted")}
            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Delivered to Clinic
          </button>
        );
      }
      if (order.status === "Fitted" || order.status === "fitted") {
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => updateDbStatus(order.id, "Completed")}
              className="px-2.5 py-1.5 bg-success/15 hover:bg-success text-success hover:text-white border border-success/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Complete Order
            </button>
            <button
              onClick={() => handleOpenReworkModal(order)}
              className="px-2.5 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Return for Correction
            </button>
          </div>
        );
      }
      if (order.status === "Completed" || order.status === "completed") {
        return (
          <button
            onClick={() => handleOpenReworkModal(order)}
            className="px-2.5 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Return for Correction
          </button>
        );
      }
    } else {
      // Diagnostic / Pathology
      if (order.status === "Ordered" || order.status === "ordered" || order.status === "Pending" || order.status === "submitted" || order.status === "Submitted") {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Sample Collected")}
            className="px-2.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Confirm Sample Collection
          </button>
        );
      }
      if (order.status === "Sample Collected" || order.status === "sample_collected") {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Order Sent to Lab")}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Sent to Lab
          </button>
        );
      }
      if (["Sent to Lab", "sent_to_lab", "Order Sent to Lab"].includes(order.status)) {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Report Received")}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-650 hover:text-white border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Report Received
          </button>
        );
      }
      if (order.status === "Report Received" || order.status === "report_received") {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Reviewed by Doctor")}
            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Reviewed by Doctor
          </button>
        );
      }
      if (order.status === "Reviewed by Doctor" || order.status === "reviewed_by_doctor") {
        return (
          <button
            onClick={() => updateDbStatus(order.id, "Completed")}
            className="px-2.5 py-1.5 bg-success/15 hover:bg-success text-success hover:text-white border border-success/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Completed
          </button>
        );
      }
    }
    return null;
  };

  const BOARD_COLUMNS = activeCategory === "Dental Prosthetics" ? [
    { id: "Submitted", label: "Submitted & Flagged", statuses: ["Submitted", "submitted", "Flagged", "flagged", "Pending", "returned_for_rework", "Returned for Rework"] },
    { id: "ConfirmedSent", label: "Confirmed & Sent", statuses: ["Pending Doctor Confirmation", "Pending Doctor Review", "Confirmed", "confirmed", "Doctor Accepted", "Order Sent to Lab", "Sent to Lab", "In Progress", "Accepted", "received_by_lab", "in_design", "in_fabrication", "quality_check"] },
    { id: "ReceivedFitted", label: "Received & Fitted", statuses: ["Order Received", "Received from Lab", "received_from_lab", "Fitted", "fitted"] },
    { id: "Completed", label: "Completed", statuses: ["Completed", "completed"] }
  ] : [
    { id: "OrderedCollected", label: "Ordered & Collected", statuses: ["Ordered", "ordered", "Sample Collected", "sample_collected", "Pending"] },
    { id: "SentReport", label: "Sent & Report", statuses: ["Order Sent to Lab", "Sent to Lab", "sent_to_lab", "Report Received", "report_received"] },
    { id: "Reviewed", label: "Reviewed by Doctor", statuses: ["Reviewed by Doctor", "reviewed_by_doctor"] },
    { id: "Completed", label: "Completed", statuses: ["Completed", "completed"] }
  ];

  const openRejectModal = (orderId) => {
    setRejectTargetId(orderId);
    setRejectReasonText("");
    setIsRejectModalOpen(true);
  };

  const handleRejectOrder = async () => {
    if (rejectReasonText.trim() === "") {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      await updateLabOrderStatus(rejectTargetId, { status: "Rejected", rejection_reason: rejectReasonText });
      if (selectedOrder && selectedOrder.id === rejectTargetId) {
        setSelectedOrder((prev) => ({
          ...prev,
          status: "Rejected",
          rejectionReason: rejectReasonText
        }));
      }
      setIsRejectModalOpen(false);
      triggerToast(`Case ${rejectTargetId} has been rejected.`, "error");
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to reject order.", "error");
    }
  };

  const openEditModal = (order) => {
    setEditFormData({
      id: order.id,
      prostheticType: order.prostheticType,
      material: order.material,
      shade: order.shade,
      priority: order.priority,
      dueDate: order.dueDate,
      notes: order.notes
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateLabOrder(editFormData.id, {
        prosthetic_type: editFormData.prostheticType,
        material: editFormData.material,
        shade: editFormData.shade,
        priority: editFormData.priority,
        due_date: editFormData.dueDate,
        notes: editFormData.notes
      });
      if (selectedOrder && selectedOrder.id === editFormData.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          prostheticType: editFormData.prostheticType,
          material: editFormData.material,
          shade: editFormData.shade,
          priority: editFormData.priority,
          dueDate: editFormData.dueDate,
          notes: editFormData.notes
        }));
      }
      setIsEditModalOpen(false);
      triggerToast(`Case ${editFormData.id} specifications updated.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update specifications.", "error");
    }
  };

  const handleSendToInHouse = async (orderId) => {
    try {
      await updateLabOrder(orderId, { lab_name: "In-House", status: "Accepted" });
      triggerToast(`Case ${orderId} has been successfully routed to In-House.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to route to In-House.", "error");
    }
  };

  const handleOpenDispatchModal = (order) => {
    setDispatchOrder(order);
    const details = order.orderDetails || {};
    setDispatchFormData({
      address: details.address || "",
      expectedReturnDate: order.expectedReturnDate || order.dueDate || "",
      notes: details.notes || order.notes || "",
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    try {
      const orderDetailsPayload = {
        ...dispatchOrder.orderDetails,
        address: dispatchFormData.address,
        notes: dispatchFormData.notes
      };

      await updateLabOrder(dispatchOrder.id, {
        status: "Sent to Lab",
        expected_return_date: dispatchFormData.expectedReturnDate,
        order_details: orderDetailsPayload,
      });

      triggerToast(`Case ${dispatchOrder.id} sent to external lab successfully.`);
      setIsDispatchModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to dispatch order.", "error");
    }
  };

  const openDetailsDrawer = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);

    const partnerKey = Object.keys(LAB_PARTNERS).find(key => LAB_PARTNERS[key].name === order.labName) || "apex";
    setSelectedLabPartner(partnerKey);
    setDeliveryAddress(order.orderDetails?.address || LAB_PARTNERS[partnerKey].address);
    setLabNotes(order.orderDetails?.notes || order.notes || "");
    setIsReceived(["Order Received", "Completed"].includes(order.status));
    setReceivedDate(order.receivedDate || "");
  };

  return (
    <div className="space-y-6 relative pb-10">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 bg-white border-gray-100">
          <span className={`w-3 h-3 rounded-full ${toast.type === "error" ? "bg-danger animate-pulse" : "bg-success animate-pulse"}`}></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage prosthetic fabrications, track statuses, and coordinate with dentists.</p>
        </div>
        
        {/* Category Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveCategory("Dental Prosthetics")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === "Dental Prosthetics"
                ? "bg-white text-gray-900 shadow-sm font-extrabold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Dental Prosthetics
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("Blood Work / Pathology")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === "Blood Work / Pathology"
                ? "bg-white text-gray-900 shadow-sm font-extrabold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Blood Work / Pathology
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-primary/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Cases</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{totalCases}</h3>
            <p className="text-xs text-gray-500 font-medium mt-2">Active cases in dashboard</p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0 z-10">
            <ClipboardList className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-warning/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pending Review</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{pendingCases}</h3>
            <p className="text-xs text-warning font-semibold mt-2 flex items-center gap-1">
              <span>●</span> Requires attention
            </p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0 z-10">
            <Hourglass className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-purple-55/35 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">In Production</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{inProductionCases}</h3>
            <p className="text-xs text-purple-650 font-semibold mt-2">Accepted & active</p>
          </div>
          <span className="bg-purple-50 p-3 rounded-xl text-purple-600 flex items-center justify-center shrink-0 z-10">
            <Microscope className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-danger/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Urgent & High</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{urgentHighCases}</h3>
            <p className="text-xs text-danger font-semibold mt-2 flex items-center gap-1">
              <span>⚠️</span> Priority handling
            </p>
          </div>
          <span className="bg-danger/10 p-3 rounded-xl text-danger flex items-center justify-center shrink-0 z-10">
            <Flame className="w-6 h-6" />
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96 flex items-center bg-gray-55 rounded-xl px-4 py-2.5 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-gray-400 mr-2.5 w-4 h-4 shrink-0" />
            <input 
              type="text" 
              placeholder="Search Case ID, patient, or dentist..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 text-gray-800"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-655 ml-1.5 text-xs bg-gray-200/60 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 mr-2 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "board"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Board
              </button>
            </div>

            {(searchQuery || statusFilter || priorityFilter || dentistFilter || dateFilter) && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setDentistFilter("");
                  setDateFilter("");
                }}
                className="px-3 py-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 rounded-lg cursor-pointer"
              >
                Reset Filters
              </button>
            )}

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-705 min-w-[110px]"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="received_by_lab">Received by Lab</option>
              <option value="in_design">In Design</option>
              <option value="in_fabrication">In Fabrication</option>
              <option value="quality_check">Quality Check</option>
              <option value="shipped">Shipped</option>
              <option value="received_at_clinic">Received at Clinic</option>
              <option value="fitted">Fitted</option>
              <option value="completed">Completed</option>
              <option value="returned_for_rework">Returned for Rework</option>
            </select>

            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[110px]"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            <select 
              value={dentistFilter}
              onChange={(e) => setDentistFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[130px]"
            >
              <option value="">All Dentists</option>
              {dentists.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[130px]"
            >
              <option value="">All Due Dates</option>
              <option value="Today">Today (June 10)</option>
              <option value="Next 7 Days">Next 7 Days</option>
              <option value="Next 30 Days">Next 30 Days</option>
            </select>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Case ID</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Dentist</th>
                  <th className="px-6 py-4">Prosthetic Specs</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-gray-450">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Search className="w-8 h-8 text-gray-300" />
                        <p className="font-semibold text-base text-gray-750">No lab orders found</p>
                        <p className="text-xs text-gray-400">Try adjusting your filters or search term.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                      onClick={() => openDetailsDrawer(order)}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 text-xs group-hover:text-primary transition-colors">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {order.patientName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>
                          <p className="font-medium text-gray-800">{order.dentistName}</p>
                          <p className="text-xs text-gray-400">{order.dentistContact}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>
                          {order.orderCategory === "Prosthetic" ? (
                            <>
                              <p className="font-semibold text-gray-750 text-xs">{order.prostheticType}</p>
                              <p className="text-[11px] text-gray-400">{order.material} (Shade: {order.shade})</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-750 text-xs">{order.orderCategory}</p>
                              <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{JSON.stringify(order.orderDetails)}</p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${getPriorityStyle(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {order.dueDate === "2026-06-10" ? (
                          <span className="text-danger font-semibold flex items-center gap-1">
                            Today ⚠️
                          </span>
                        ) : (
                          order.dueDate
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(order.status)}`}></span>
                          <span className="text-sm font-semibold text-gray-700">{getStatusLabel(order.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1.5 flex-wrap">
                          {renderOrderActions(order)}
                          <button 
                            onClick={() => openDetailsDrawer(order)}
                            className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {BOARD_COLUMNS.map((column) => {
              const columnOrders = filteredOrders.filter((o) =>
                column.statuses.includes(o.status)
              );
              return (
                <div
                  key={column.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className="bg-gray-55 border border-gray-150 rounded-2xl p-4 flex flex-col min-h-[500px]"
                >
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                    <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                      {column.label}
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {columnOrders.length}
                      </span>
                    </h4>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {columnOrders.length === 0 ? (
                      <div className="h-24 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 bg-white">
                        No cases
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <div
                          key={order.id}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onClick={() => openDetailsDrawer(order)}
                          className="bg-white border border-gray-155 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/45 relative select-none"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors">
                              {order.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${getPriorityStyle(order.priority)}`}>
                              {order.priority}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-gray-850 truncate">{order.patientName}</p>
                            <p className="text-xs text-gray-450 truncate">Dr. {order.dentistName}</p>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Due Date</span>
                              <span className={`text-[11px] font-bold ${order.dueDate === "2026-06-10" ? "text-danger" : "text-gray-600"}`}>
                                {order.dueDate}
                              </span>
                            </div>
                            
                            {order.isRework && (
                              <span className="bg-danger/10 text-danger border border-danger/20 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                Rework
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-3 flex gap-1.5 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
                            {renderOrderActions(order)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isDrawerOpen && currentCase && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Wrapper */}
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-right duration-300 pointer-events-auto">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/60 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">{currentCase.id}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPriorityStyle(currentCase.priority)}`}>
                    {currentCase.priority}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">{currentCase.patient}</h3>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-650 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single scrollable content — no tabs */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">

                {/* ── SECTION 1: Doctor's Specifications (read-only) ── */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Specifications</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      {currentCase.orderCategory === "Prosthetic" ? (
                        <>
                          <div>
                            <p className="text-gray-400 font-medium">Prosthetic Type</p>
                            <p className="font-bold text-gray-800 mt-0.5">{currentCase.type || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Material</p>
                            <p className="font-bold text-gray-800 mt-0.5">{currentCase.material || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Tooth / Quadrant</p>
                            <p className="font-bold text-gray-800 mt-0.5">{currentCase.toothQuadrant ? `#${currentCase.toothQuadrant}` : "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Shade</p>
                            <p className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/30 inline-block mt-0.5">{currentCase.shade || "—"}</p>
                          </div>
                          {currentCase.implantSystem && (
                            <div className="col-span-2">
                              <p className="text-gray-400 font-medium">Implant System</p>
                              <p className="font-bold text-gray-800 mt-0.5">{currentCase.implantSystem}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400 font-medium">Due Date</p>
                            <p className="font-bold text-danger mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{currentCase.dueDate || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Priority</p>
                            <p className="font-bold text-gray-800 mt-0.5">{currentCase.priority || "—"}</p>
                          </div>
                          {currentCase.scanFile && (
                            <div className="col-span-2">
                              <p className="text-gray-400 font-medium mb-1">Scan File</p>
                              <a href={`/api/lab/files/${currentCase.scanFile}`} download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-primary hover:bg-primary/10 font-bold text-[11px] transition-colors">
                                📂 {currentCase.scanFile}
                              </a>
                            </div>
                          )}
                          {currentCase.opposingBiteScan && (
                            <div className="col-span-2">
                              <p className="text-gray-400 font-medium mb-1">Opposing Bite Scan</p>
                              <a href={`/api/lab/files/${currentCase.opposingBiteScan}`} download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-primary hover:bg-primary/10 font-bold text-[11px] transition-colors">
                                📂 {currentCase.opposingBiteScan}
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-gray-400 font-medium">Test Type</p>
                            <p className="font-bold text-gray-800 mt-0.5">{currentCase.testType || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Sample Type</p>
                            <p className="font-bold text-gray-800 mt-0.5">{currentCase.sampleType || "—"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-400 font-medium">Reason for Test</p>
                            <p className="font-bold text-gray-700 mt-0.5">{currentCase.reasonForTest || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Due Date</p>
                            <p className="font-bold text-danger mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{currentCase.dueDate || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Sample Collected</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider mt-0.5 ${
                              currentCase.sampleCollectedConfirm
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-danger/10 text-danger border-danger/20"
                            }`}>
                              {currentCase.sampleCollectedConfirm ? "Confirmed" : "Pending"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {currentCase.notes && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Doctor&apos;s Notes</p>
                        <p className="text-xs text-gray-600 italic leading-relaxed">&ldquo;{currentCase.notes}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  {/* Ordering Dentist strip */}
                  <div className="mt-3 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between bg-white">
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Ordering Dentist</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">{currentCase.dentist}</p>
                      <p className="text-[10px] text-gray-400">{currentCase.dentistContact}</p>
                    </div>
                    <span className="text-lg bg-gray-50 p-2 rounded-xl border border-gray-100">👤</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200" />

                {/* ── SECTION 2: Service Provider ── */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Select Service Provider</p>
                  <div className="space-y-2">
                    {Object.entries(LAB_PARTNERS).map(([key, lab]) => (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedLabPartner === key
                            ? "border-primary bg-primary/5"
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="labPartner"
                          value={key}
                          checked={selectedLabPartner === key}
                          onChange={() => {
                            setSelectedLabPartner(key);
                            setDeliveryAddress(LAB_PARTNERS[key].address);
                          }}
                          className="mt-0.5 accent-primary shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900">{lab.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{lab.specialty}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{lab.contact}</p>
                        </div>
                        {selectedLabPartner === key && (
                          <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-white text-[8px] font-black">✓</span>
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── SECTION 3: Delivery Address ── */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Delivery Address <span className="text-red-400 normal-case tracking-normal font-bold">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter the address where the item should be delivered"
                    value={deliveryAddress || (selectedLabPartner ? LAB_PARTNERS[selectedLabPartner].address : "")}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 resize-none placeholder-gray-400 leading-relaxed"
                  />
                </div>

                {/* ── SECTION 4: Additional Notes ── */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Additional Notes
                    <span className="ml-1.5 normal-case tracking-normal font-normal text-gray-400">(optional — sent to doctor)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Please use A1 shade guide. Urgent — patient appointment on Friday."
                    value={labNotes}
                    onChange={(e) => setLabNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 resize-none placeholder-gray-400 leading-relaxed"
                  />
                </div>

                {/* ── SECTION 5: Dispatch button ── */}
                {["Sent to Lab", "Order Sent to Lab", "Order Received", "Completed", "Returned for Rework"].includes(currentCase.status) ? (
                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                    <span className="text-lg shrink-0">📦</span>
                    <div>
                      <p className="text-xs font-bold text-primary">Dispatched &amp; Sent to External Lab</p>
                      <p className="text-[10px] text-gray-550 mt-0.5 leading-relaxed">
                        This order has been physically sent to {selectedLabPartner ? LAB_PARTNERS[selectedLabPartner]?.name : "the lab"}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!deliveryAddress && !LAB_PARTNERS[selectedLabPartner]?.address) {
                        triggerToast("Please enter a delivery address.", "error");
                        return;
                      }
                      const ok = await updateDbStatus(currentCase.id, "Order Sent to Lab");
                      if (ok) {
                        triggerToast(`Case ${currentCase.id} marked as Order Sent to Lab.`);
                      } else {
                        triggerToast("Failed to update status.", "error");
                      }
                    }}
                    className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" /> Mark as Sent to Lab
                  </button>
                )}

                {/* ── SECTION 6: Receipt tracking (only after order is sent to lab) ── */}
                {["Sent to Lab", "Order Sent to Lab", "Order Received", "Completed", "Returned for Rework"].includes(currentCase.status) && (
                  <>
                    <div className="border-t border-dashed border-gray-200" />

                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Item Receipt</p>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-150 rounded-xl">
                        <input
                          type="checkbox"
                          id="received-check"
                          checked={isReceived || ["Order Received", "Completed"].includes(currentCase.status)}
                          onChange={async (e) => {
                            const checked = e.target.checked;
                            setIsReceived(checked);
                            if (checked) {
                              await updateDbStatus(currentCase.id, "Order Received");
                            } else {
                              await updateDbStatus(currentCase.id, "Order Sent to Lab");
                            }
                          }}
                          className="mt-0.5 w-4 h-4 accent-primary shrink-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <label htmlFor="received-check" className="text-xs font-bold text-gray-800 cursor-pointer">
                            Item Received at Clinic
                          </label>
                          <p className="text-[10px] text-gray-400 mt-0.5">Tick this once the package arrives from the lab.</p>
                          {(isReceived || ["Order Received", "Completed"].includes(currentCase.status)) && (
                            <div className="mt-3">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Date & Time Received</label>
                              <input
                                type="text"
                                placeholder="e.g. 10 July 2026, 11:30 AM"
                                value={receivedDate}
                                onChange={(e) => setReceivedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder-gray-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {isReceived && (
                        <button
                          onClick={() => setIsReworkModalOpen2(true)}
                          className="mt-3 w-full py-2.5 bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          🔄 Return / Request Rework
                        </button>
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </>
      )}

      {/* Return / Rework Reason Modal */}
      {isReworkModalOpen2 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="text-warning">🔄</span> Return / Request Rework
              </h2>
              <button
                onClick={() => setIsReworkModalOpen2(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason Category</label>
                <select
                  value={reworkCategory2}
                  onChange={(e) => setReworkCategory2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning"
                >
                  <option value="shade mismatch">Shade Mismatch</option>
                  <option value="poor fit">Poor Fit / Wrong Size</option>
                  <option value="contact issue">Contact Point Issue</option>
                  <option value="surface defect">Surface Defect / Crack</option>
                  <option value="wrong specs">Wrong Specifications</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Detailed Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the issue clearly so the lab can correct it..."
                  value={reworkReason2}
                  onChange={(e) => setReworkReason2(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning text-gray-800 placeholder-gray-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReworkModalOpen2(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reworkReason2.trim()) {
                    triggerToast("Please describe the rework reason.", "error");
                    return;
                  }
                  const ok = await updateDbStatus(currentCase.id, "Returned for Rework", reworkReason2);
                  if (ok) {
                    triggerToast(`Case ${currentCase.id} returned for rework.`);
                    setIsReworkModalOpen2(false);
                    setReworkReason2("");
                    setIsReceived(false);
                  } else {
                    triggerToast("Failed to update status.", "error");
                  }
                }}
                disabled={!reworkReason2.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-warning hover:bg-warning/90 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Edit Lab Specifications</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Case ID</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={editFormData.id}
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none text-sm cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prosthetic Type</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.prostheticType}
                      onChange={(e) => setEditFormData({ ...editFormData, prostheticType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Shade</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.shade}
                      onChange={(e) => setEditFormData({ ...editFormData, shade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                      placeholder="e.g. A1, B2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Material</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.material}
                    onChange={(e) => setEditFormData({ ...editFormData, material: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Priority</label>
                    <select 
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                    <input 
                      type="date" 
                      required
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes / Instructions</label>
                  <textarea 
                    rows="3"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 resize-none"
                    placeholder="Enter special lab instructions..."
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-danger">⚠️</span> Reject Lab Case {rejectTargetId}
              </h2>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Please provide a reason for rejecting this case. This reason will be communicated back to the ordering dentist immediately.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reason for Rejection</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="e.g. Impression margins are distorted; please take a new scanner model and resubmit."
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none transition-all text-sm text-gray-800 resize-none placeholder:text-gray-400"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleRejectOrder}
                className="px-5 py-2 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors shadow-sm shadow-danger/30 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to External Lab Modal */}
      {isDispatchModalOpen && dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">📦</span> Send to External Lab
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Review the doctor&apos;s order, enter the delivery address, and send.</p>
              </div>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit}>
              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* Doctor Specs — read-only */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Doctor&apos;s Specifications</p>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    {[
                      { label: "Patient", value: dispatchOrder.patientName },
                      { label: "Dentist", value: dispatchOrder.dentistName },
                      { label: "Case ID", value: dispatchOrder.id },
                      { label: "Priority", value: dispatchOrder.priority },
                      { label: "Category", value: dispatchOrder.category || dispatchOrder.prostheticType || "—" },
                      { label: "Tooth / Quadrant", value: dispatchOrder.toothQuadrant || "—" },
                      { label: "Material", value: dispatchOrder.material || "—" },
                      { label: "Shade", value: dispatchOrder.shade || "—" },
                      { label: "Due Date", value: dispatchOrder.dueDate || "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  {(dispatchOrder.notes || (dispatchOrder.orderDetails || {}).notes) && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Doctor&apos;s Notes</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{dispatchOrder.notes || (dispatchOrder.orderDetails || {}).notes}</p>
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Lab Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="e.g. Apex Dental Lab, 2nd Floor, Banjara Hills, Hyderabad — 500034"
                    value={dispatchFormData.address}
                    onChange={(e) => setDispatchFormData({ ...dispatchFormData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 resize-none placeholder:text-gray-400"
                  ></textarea>
                </div>

                {/* Expected Return Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Expected Return Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dispatchFormData.expectedReturnDate}
                    onChange={(e) => setDispatchFormData({ ...dispatchFormData, expectedReturnDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800"
                  />
                </div>

                {/* Optional notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Additional Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    rows="2"
                    value={dispatchFormData.notes}
                    onChange={(e) => setDispatchFormData({ ...dispatchFormData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 resize-none placeholder:text-gray-400"
                    placeholder="Any special handling notes for the lab..."
                  ></textarea>
                </div>

              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 cursor-pointer flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" /> Send to Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rework Modal */}
      {isReworkModalOpen && reworkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-danger">🔄</span> Return Case {reworkOrder.id} for Correction
              </h2>
              <button 
                onClick={() => setIsReworkModalOpen(false)}
                className="text-gray-400 hover:text-gray-655 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReworkSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  Please specify the reason for returning this case to the lab. The case will be re-opened for correction.
                </p>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rework Reason</label>
                  <select
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none transition-all text-sm text-gray-800 bg-white"
                  >
                    <option value="shade mismatch">Shade Mismatch</option>
                    <option value="poor fit">Poor Fit</option>
                    <option value="contact issue">Contact Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Detailed Explanation / Notes</label>
                  <textarea 
                    rows="4"
                    required
                    placeholder="Enter detailed correction request notes..."
                    value={reworkNote}
                    onChange={(e) => setReworkNote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none transition-all text-sm text-gray-805 resize-none placeholder:text-gray-400"
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsReworkModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors shadow-sm shadow-danger/30 cursor-pointer"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {isFlagModalOpen && flagOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-warning">🚩</span> Flag Case {flagOrder.id} for Doctor
              </h2>
              <button 
                onClick={() => setIsFlagModalOpen(false)}
                className="text-gray-400 hover:text-gray-655 transition-colors p-2 hover:bg-gray-100 rounded-full font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFlagSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  This sends the case back to the doctor as "Flagged" to fill in missing fields or resolve clinical issues.
                </p>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Flag Explanation / Missing Fields Note</label>
                  <textarea 
                    rows="5"
                    required
                    placeholder="Describe what is missing or incorrect..."
                    value={flagNote}
                    onChange={(e) => setFlagNote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-warning/20 focus:border-warning outline-none transition-all text-sm text-gray-805 resize-none placeholder:text-gray-400"
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFlagModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-655 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-warning hover:bg-warning/90 rounded-xl transition-colors shadow-sm shadow-warning/30 cursor-pointer"
                >
                  Send Flag Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
