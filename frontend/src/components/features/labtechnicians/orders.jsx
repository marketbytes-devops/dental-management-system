"use client";

import React, { useState, useEffect } from "react";
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
  Microscope,
  FileText,
  Paperclip,
  Flag,
  Mail
} from "lucide-react";
import { getLabOrders, updateLabOrderStatus, updateLabOrder, getLabVendors, uploadLabFile } from "@/services/api";
import { validateLabOrderFields } from "@/services/labValidation";



export default function LabOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [labVendors, setLabVendors] = useState([]);

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
        orderDate: o.created_at ? o.created_at.split("T")[0] : "2026-06-10",
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

  const fetchVendors = async () => {
    try {
      const data = await getLabVendors();
      setLabVendors(data);
    } catch (err) {
      console.error("Failed to fetch lab vendors:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVendors();
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
  const [reworkFiles, setReworkFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState({});

  const togglePatientExpand = (patientName) => {
    setExpandedPatients((prev) => ({
      ...prev,
      [patientName]: !prev[patientName],
    }));
  };

  // Dispatch Modal States
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [dispatchFormData, setDispatchFormData] = useState({
    selectedPartnerKey: "apex",
    email: "apex.dental@labmail.com"
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

  const LAB_PARTNERS = {};
  if (labVendors && labVendors.length > 0) {
    labVendors.forEach((vendor) => {
      const key = vendor.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      LAB_PARTNERS[key] = {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email || "labs@smilecare.com",
        phone: vendor.phone || "",
        contact_person: vendor.contact_person || "",
        average_tat_days: vendor.average_tat_days || 5,
        address: vendor.pricing_list?.address || "Address not provided"
      };
    });
  } else {
    LAB_PARTNERS.apex = {
      id: 1,
      name: "Apex Dental Laboratories",
      address: "Apex Dental Lab, 2nd Floor, Plot 14, Road 12, Banjara Hills, Hyderabad — 500034",
      contact: "+91 40 2345 6789",
      email: "apex.dental@labmail.com",
      specialty: "Zirconia Crowns, E-max Veneers, Full-Arch Bridges"
    };
    LAB_PARTNERS.precision = {
      id: 2,
      name: "Precision Milling Centre",
      address: "Precision Milling Centre, Unit 3, HITEC City, Madhapur, Hyderabad — 500081",
      contact: "+91 40 6678 9012",
      email: "precision.dental@labmail.com",
      specialty: "CAD-CAM Milling, PMMA Temporaries, Implant Crowns"
    };
    LAB_PARTNERS.citypath = {
      id: 3,
      name: "City Path Labs",
      address: "City Path Diagnostics, Lane 4, Punjagutta, Hyderabad — 500082",
      contact: "+91 40 4456 7890",
      email: "citypath.diagnostics@labmail.com",
      specialty: "Biopsy Analysis, Blood Tests, Microbiology Panels"
    };
  }

  const getMeasurementsList = (order) => {
    if (!order) return [];
    const list = [];
    if (order.orderCategory === "Prosthetic") {
      if (order.prostheticType) list.push({ label: "Prosthetic type", value: order.prostheticType });
      if (order.toothQuadrant) list.push({ label: "Tooth number", value: order.toothQuadrant });
      if (order.shade) list.push({ label: "Shade", value: order.shade });
      if (order.material) list.push({ label: "Material", value: order.material });
      if (order.impressionType) list.push({ label: "Impression type", value: order.impressionType });
      if (order.marginDesign) list.push({ label: "Margin design", value: order.marginDesign });
      if (order.implantSystem) list.push({ label: "Implant system", value: order.implantSystem });
    } else {
      if (order.testType) list.push({ label: "Test Type", value: order.testType });
      if (order.sampleType) list.push({ label: "Sample Type", value: order.sampleType });
      if (order.reasonForTest) list.push({ label: "Reason for test", value: order.reasonForTest });
    }
    // Any other extra fields inside orderDetails can also be added dynamically if not already listed
    if (order.orderDetails && typeof order.orderDetails === "object") {
      Object.entries(order.orderDetails).forEach(([key, val]) => {
        if (typeof val === "string" && val.trim() && !["address", "notes", "lab_name", "lab_email"].includes(key)) {
          const cleanKey = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          // check if already added
          if (!list.some(item => item.label.toLowerCase() === cleanKey.toLowerCase())) {
            list.push({ label: cleanKey, value: val });
          }
        }
      });
    }
    return list;
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
    orderDate: selectedOrder.orderDate,
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
    priority: "Medium",
    orderDate: "",
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
        const orderDate = new Date(o.orderDate);
        const timeDiff = today.getTime() - orderDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dateFilter === "Today") {
          return o.orderDate === "2026-06-10";
        } else if (dateFilter === "Last 7 Days") {
          return daysDiff >= 0 && daysDiff <= 7;
        } else if (dateFilter === "Last 30 Days") {
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
    setReworkFiles([]);
    setIsReworkModalOpen(true);
  };

  const handleReworkFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadLabFile(formData);
      setReworkFiles((prev) => [...prev, res]);
      triggerToast(`File "${file.name}" uploaded successfully.`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to upload file.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReworkSubmit = async (e) => {
    e.preventDefault();
    if (!reworkOrder) return;
    try {
      await updateLabOrderStatus(reworkOrder.id, {
        status: "Returned for Rework",
        rejection_category: reworkReason,
        rejection_reason: reworkNote,
        attachments: reworkFiles
      });
      triggerToast(`Case ${reworkOrder.id} returned for rework.`);
      setIsReworkModalOpen(false);
      setReworkFiles([]);
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
      if (order.status === "Revision Requested") {
        return (
          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-100">
            Awaiting Doctor Revision
          </span>
        );
      }
      if (["submitted", "Submitted", "Pending", "Pending Review", "Confirmed by Tech", "Flagged", "flagged"].includes(order.status)) {
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => handleOpenDispatchModal(order)}
              className="px-2.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Send to Lab
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
                Missing: {missing.join(", ")}
              </span>
            )}
          </div>
        );
      }
      if (["Confirmed", "confirmed", "Doctor Accepted"].includes(order.status)) {
        return (
          <button
            onClick={() => handleOpenDispatchModal(order)}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Send to Lab
          </button>
        );
      }
      if (["Sent to Lab", "sent_to_lab", "Order Sent to Lab", "in_design", "in_fabrication", "quality_check"].includes(order.status)) {
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => updateDbStatus(order.id, "Order Received")}
              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-650 hover:text-white border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Mark as Received from Lab
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
      if (["Received from Lab", "received_from_lab", "Order Received"].includes(order.status)) {
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => updateDbStatus(order.id, "Fitted")}
              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Mark as Delivered to Clinic
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
            onClick={() => handleOpenDispatchModal(order)}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Send to Lab
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
    { id: "Submitted", label: "Submitted & Flagged", statuses: ["Pending Review", "Revision Requested", "Submitted", "submitted", "Flagged", "flagged", "Pending", "returned_for_rework", "Returned for Rework"] },
    { id: "ConfirmedSent", label: "Confirmed & Sent", statuses: ["Confirmed by Tech", "Pending Doctor Confirmation", "Pending Doctor Review", "Confirmed", "confirmed", "Doctor Accepted", "Order Sent to Lab", "Sent to Lab", "In Progress", "Accepted", "received_by_lab", "in_design", "in_fabrication", "quality_check"] },
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
        notes: editFormData.notes
      });
      if (selectedOrder && selectedOrder.id === editFormData.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          prostheticType: editFormData.prostheticType,
          material: editFormData.material,
          shade: editFormData.shade,
          priority: editFormData.priority,
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
    const initialKey = Object.keys(LAB_PARTNERS).find(key => LAB_PARTNERS[key].name === order.labName) || Object.keys(LAB_PARTNERS)[0] || "apex";
    setDispatchFormData({
      selectedPartnerKey: initialKey,
      email: LAB_PARTNERS[initialKey]?.email || "apex.dental@labmail.com",
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    try {
      const selectedPartner = LAB_PARTNERS[dispatchFormData.selectedPartnerKey];
      const orderDetailsPayload = {
        ...dispatchOrder.orderDetails,
        lab_name: selectedPartner.name,
        lab_email: selectedPartner.email,
      };

      await updateLabOrder(dispatchOrder.id, {
        status: "Sent to Lab",
        lab_name: selectedPartner.name,
        vendor_id: selectedPartner.id,
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
    handleOpenDispatchModal(order);
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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between relative overflow-hidden group hover:border-danger/45 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Urgent & High</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{urgentHighCases}</h3>
            <p className="text-xs text-danger font-semibold mt-2 flex items-center gap-1">
              Priority handling
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
              <option value="">All Order Dates</option>
              <option value="Today">Today (June 10)</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {viewMode === "table" ? (() => {
          // Group orders by patient
          const groupedPatients = filteredOrders.reduce((acc, order) => {
            const pName = order.patientName || "Unknown Patient";
            if (!acc[pName]) {
              acc[pName] = {
                name: pName,
                dentists: new Set(),
                orders: [],
                newOrdersCount: 0
              };
            }
            acc[pName].orders.push(order);
            if (order.dentistName) {
              acc[pName].dentists.add(order.dentistName);
            }
            if (["Pending Review", "pending_review", "Returned for Rework", "returned_for_rework"].includes(order.status)) {
              acc[pName].newOrdersCount += 1;
            }
            return acc;
          }, {});

          const patientRows = Object.values(groupedPatients);

          return (
            <div className="space-y-4">
              {patientRows.length === 0 ? (
                <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center text-gray-450">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="font-semibold text-base text-gray-750">No lab orders found</p>
                    <p className="text-xs text-gray-400">Try adjusting your filters or search term.</p>
                  </div>
                </div>
              ) : (
                patientRows.map((patient) => {
                  const isExpanded = !!expandedPatients[patient.name];
                  const firstLetter = patient.name.charAt(0).toUpperCase();
                  return (
                    <div 
                      key={patient.name}
                      className={`bg-white border rounded-2xl shadow-sm transition-all duration-300 overflow-hidden ${
                        isExpanded ? "border-indigo-200 ring-2 ring-indigo-50" : "border-gray-150 hover:border-indigo-150 hover:shadow-md"
                      }`}
                    >
                      {/* Header row */}
                      <div 
                        onClick={() => togglePatientExpand(patient.name)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none text-left"
                      >
                        {/* Left: Avatar & Patient Name */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-[200px]">
                          <div className="relative w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-750 text-sm shrink-0">
                            {firstLetter}
                            {patient.newOrdersCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-sm leading-tight">{patient.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Patient Profile</p>
                          </div>
                        </div>

                        {/* Middle Left: Dentist info */}
                        <div className="flex-1 min-w-[150px]">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ordering Dentist(s)</p>
                          <p className="text-xs text-gray-700 font-extrabold mt-0.5">
                            {Array.from(patient.dentists).join(", ") || "N/A"}
                          </p>
                        </div>

                        {/* Middle Right: Total Orders badge */}
                        <div className="w-20">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Cases</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-black rounded-md">
                              {patient.orders.length}
                            </span>
                          </div>
                        </div>

                        {/* Right: Status callout & Chevron */}
                        <div className="flex items-center justify-between md:justify-end gap-6 md:w-60">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recent Activity</p>
                            {patient.newOrdersCount > 0 ? (
                              <span className="text-red-500 font-extrabold text-xs flex items-center md:justify-end gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {patient.newOrdersCount} new order{patient.newOrdersCount > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-bold text-xs block mt-0.5">
                                No new activity
                              </span>
                            )}
                          </div>
                          
                          <div className="text-gray-400 hover:text-indigo-650 transition-colors p-1.5 bg-gray-50 rounded-xl shrink-0">
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90 text-indigo-650" : ""}`} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded section: nested details table */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/30 p-5 text-left">
                          <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-inner">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-gray-50/70 border-b border-gray-150 font-black text-gray-500 uppercase tracking-wider text-[10px]">
                                    <th className="px-4 py-3">Case ID</th>
                                    <th className="px-4 py-3">Prosthetic Specs</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Order Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {patient.orders.map((order) => (
                                    <tr 
                                      key={order.id} 
                                      onClick={() => openDetailsDrawer(order)}
                                      className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                                    >
                                      <td className="px-4 py-3.5 font-bold text-gray-900 group-hover:text-primary transition-colors">
                                        {order.id}
                                      </td>
                                      <td className="px-4 py-3.5">
                                        {order.orderCategory === "Prosthetic" ? (
                                          <div>
                                            <p className="font-semibold text-gray-750">{order.prostheticType}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{order.material} (Shade: {order.shade})</p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="font-semibold text-gray-750">{order.orderCategory}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">{JSON.stringify(order.orderDetails)}</p>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${getPriorityStyle(order.priority)}`}>
                                          {order.priority}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5 text-gray-650 font-medium">
                                        {order.orderDate}
                                      </td>
                                      <td className="px-4 py-3.5">
                                        <span className="flex items-center gap-1.5">
                                          <span className={`w-2 h-2 rounded-full ${getStatusDotColor(order.status)}`}></span>
                                          <span className="font-semibold text-gray-750">{getStatusLabel(order.status)}</span>
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end items-center gap-1.5 flex-wrap">
                                          {renderOrderActions(order)}
                                          <button 
                                            onClick={() => openDetailsDrawer(order)}
                                            className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-150 hover:text-gray-750 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-gray-100"
                                          >
                                            View Details
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })() : (
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
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Order Date</span>
                              <span className="text-[11px] font-bold text-gray-650">
                                {order.orderDate}
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

      {/* Return / Rework Reason Modal */}
      {isReworkModalOpen2 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-warning" /> Return / Request Rework
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
                <AlertTriangle className="w-4.5 h-4.5 text-danger" /> Reject Lab Case {rejectTargetId}
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
          <div className="bg-white text-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 my-8 font-sans text-left">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400">Order #{dispatchOrder.id}</p>
                <h2 className="text-lg font-bold text-gray-900 mt-1">Patient: {dispatchOrder.patientName}</h2>
              </div>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="p-6 space-y-5">
              
              {/* Measurements from doctor */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-550" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Measurements from doctor</span>
                </div>

                <div className="space-y-2 text-xs font-medium text-gray-800">
                  {getMeasurementsList(dispatchOrder).map(({ label, value }) => (
                    <div key={label} className="flex justify-between border-b border-gray-200/50 pb-1.5">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-900 font-bold">{value}</span>
                    </div>
                  ))}

                  {dispatchOrder.notes && (
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Doctor&apos;s notes</p>
                      <p className="text-gray-800 text-xs font-semibold leading-relaxed bg-white p-2.5 rounded-lg border border-gray-150">{dispatchOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {(dispatchOrder.scanFile || dispatchOrder.opposingBiteScan) && (
                <div className="bg-gray-50 border border-gray-155 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-1">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Attachments</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {dispatchOrder.scanFile && (
                      <a 
                        href={`/api/lab/files/${dispatchOrder.scanFile}`} 
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> {dispatchOrder.scanFile}
                      </a>
                    )}
                    {dispatchOrder.opposingBiteScan && (
                      <a 
                        href={`/api/lab/files/${dispatchOrder.opposingBiteScan}`} 
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> {dispatchOrder.opposingBiteScan}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Choose external lab or display selected lab */}
              {!["Sent to Lab", "sent_to_lab", "Order Sent to Lab", "In Progress", "in_progress", "in_design", "in_fabrication", "quality_check", "Order Received", "Received from Lab", "received_from_lab", "Completed", "completed", "Fitted", "fitted"].includes(dispatchOrder.status) ? (
                <>
                  <div className="bg-gray-50 border border-gray-155 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-1">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Choose external lab</span>
                    </div>

                    <div className="space-y-3">
                      <select
                        value={dispatchFormData.selectedPartnerKey}
                        onChange={(e) => {
                          const key = e.target.value;
                          setDispatchFormData({
                            selectedPartnerKey: key,
                            email: LAB_PARTNERS[key]?.email || "",
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 cursor-pointer"
                      >
                        {Object.entries(LAB_PARTNERS).map(([key, partner]) => (
                          <option key={key} value={key} className="bg-white text-gray-800">
                            {partner.name} — {partner.email}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={dispatchFormData.email}
                          className="w-full pl-8 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-xs text-primary flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">
                      An email with the measurements, notes, and attachment links will be sent directly to this lab.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      Send to lab ↗
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Read-only Lab details & Receipt tracking */}
                  <div className="bg-gray-50 border border-gray-155 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-1">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">External lab partner</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-800">
                      <p>{dispatchOrder.labName || LAB_PARTNERS[dispatchFormData.selectedPartnerKey]?.name || "Apex Dental Laboratories"}</p>
                      <p className="text-gray-500 mt-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {dispatchFormData.email}</p>
                    </div>
                  </div>

                  {/* Item receipt checkbox */}
                  <div className="bg-gray-50 border border-gray-155 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="modal-received-check"
                        checked={isReceived || ["Order Received", "Completed", "Fitted", "fitted"].includes(dispatchOrder.status)}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          setIsReceived(checked);
                          const newStatus = checked ? "Order Received" : "Sent to Lab";
                          const ok = await updateDbStatus(dispatchOrder.id, newStatus);
                          if (ok) {
                            setDispatchOrder({ ...dispatchOrder, status: newStatus });
                          }
                        }}
                        className="mt-0.5 w-4 h-4 accent-primary shrink-0 cursor-pointer rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="modal-received-check" className="text-xs font-bold text-gray-800 cursor-pointer">
                          Item Received at Clinic
                        </label>
                        <p className="text-[10px] text-gray-555 mt-0.5">Tick this once the package arrives from the lab.</p>
                        {(isReceived || ["Order Received", "Completed", "Fitted", "fitted"].includes(dispatchOrder.status)) && (
                          <div className="mt-3">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Date & Time Received</label>
                            <input
                              type="datetime-local"
                              value={receivedDate}
                              onChange={async (e) => {
                                setReceivedDate(e.target.value);
                                await updateLabOrder(dispatchOrder.id, {
                                  received_date: e.target.value
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs outline-none bg-white text-gray-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Close and Return for Correction buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDispatchModalOpen(false);
                        handleOpenReworkModal(dispatchOrder);
                      }}
                      className="flex-1 py-2.5 text-sm font-semibold text-danger bg-danger/10 hover:bg-danger hover:text-white border border-danger/20 rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Return for Correction
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-center"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

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
                <RefreshCw className="w-4 h-4 text-danger animate-spin" /> Return Case {reworkOrder.id} for Correction
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none transition-all text-sm text-gray-850 resize-none placeholder:text-gray-400"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Attach Reference File / Photo (Optional)</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      id="rework-file-input"
                      onChange={handleReworkFileChange}
                      disabled={isUploading}
                      className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                    />
                    {isUploading && (
                      <span className="text-[10px] text-gray-400 animate-pulse font-medium">Uploading reference file...</span>
                    )}
                    {reworkFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {reworkFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-700">
                            <span className="flex items-center gap-1"><Paperclip className="w-3 h-3 text-gray-400 shrink-0" /> {file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setReworkFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-red-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                <Flag className="w-4 h-4 text-warning" /> Flag Case {flagOrder.id} for Doctor
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
