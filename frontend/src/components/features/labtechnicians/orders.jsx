"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Mail,
  Wrench,
  Package,
  Send
} from "lucide-react";
import { getLabOrders, updateLabOrderStatus, checkVendorLabPricing, updateLabOrder, getLabVendors, uploadLabFile, acceptEmailUpdate, dismissEmailUpdate, sendOrderToVendor, markItemReceivedAtClinic, uploadVendorInvoiceFile, sendExternalLabReminder, cancelExternalLabRequest, sendReworkToExternalLab, processCompletionEmail, confirmCompletionEmail, dismissCompletionEmail, getUnmatchedEmails, assignUnmatchedEmail, dismissUnmatchedEmail } from "@/services/api";
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
        sampleCollectedConfirm: o.sample_collected_confirm || false,
        reworkHistory: o.rework_history || [],
        claimedBy: o.claimed_by || null,
        physicalMoldSent: o.physical_mold_sent || false,
        physicalOpposingMoldSent: o.physical_opposing_mold_sent || false,
        trackingNumber: o.tracking_number || "",
        pendingEmailProposal: o.pending_email_proposal || null
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
    const interval = setInterval(fetchOrders, 30000);
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
  
  // ── EMAIL COMPLETION PROPOSALS & UNMATCHED QUEUE STATES ──
  const [unmatchedEmails, setUnmatchedEmails] = useState([]);
  const [isUnmatchedModalOpen, setIsUnmatchedModalOpen] = useState(false);
  const [assignTargetOrderId, setAssignTargetOrderId] = useState("");

  const [isEditProposalModalOpen, setIsEditProposalModalOpen] = useState(false);
  const [proposalTargetOrder, setProposalTargetOrder] = useState(null);
  const [proposalFormData, setProposalFormData] = useState({
    courier_name: "",
    tracking_number: "",
    expected_delivery_date: "",
    remarks: ""
  });

  const [isSimulateEmailModalOpen, setIsSimulateEmailModalOpen] = useState(false);
  const [simRawEmailText, setSimRawEmailText] = useState("");

  const fetchUnmatchedEmailsList = async () => {
    try {
      const data = await getUnmatchedEmails();
      setUnmatchedEmails(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnmatchedEmailsList();
  }, []);

  const handleOpenEditProposalModal = (order) => {
    const prop = order.pendingEmailProposal || {};
    setProposalTargetOrder(order);
    setProposalFormData({
      courier_name: prop.courier_name || order.courier_name || "",
      tracking_number: prop.tracking_number || order.tracking_number || "",
      expected_delivery_date: prop.expected_delivery_date || order.expected_return_date || "",
      remarks: prop.remarks || ""
    });
    setIsEditProposalModalOpen(true);
  };

  const handleConfirmEditProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposalTargetOrder) return;
    try {
      await confirmCompletionEmail(proposalTargetOrder.id, proposalFormData);
      triggerToast(`Completion details updated & confirmed for Case ${proposalTargetOrder.id}.`);
      setIsEditProposalModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to confirm completion details.", "error");
    }
  };

  const handleSimulateEmailSubmit = async (e) => {
    e.preventDefault();
    if (!simRawEmailText.trim()) return;
    try {
      const res = await processCompletionEmail({ raw_email_text: simRawEmailText });
      if (res.status === "matched") {
        triggerToast(res.message);
      } else {
        triggerToast(res.message, "error");
      }
      setSimRawEmailText("");
      setIsSimulateEmailModalOpen(false);
      fetchOrders();
      fetchUnmatchedEmailsList();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to process email text.", "error");
    }
  };

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
    email: "apex.dental@labmail.com",
    vendorName: "",
    techNotes: ""
  });

  const handleOpenDispatchModal = (order) => {
    setDispatchOrder(order);
    const initialKey = Object.keys(LAB_PARTNERS)[0] || "apex";
    setDispatchFormData({
      selectedPartnerKey: initialKey,
      email: order.orderDetails?.lab_email || LAB_PARTNERS[initialKey]?.email || "apex.dental@labmail.com",
      vendorName: order.labName || LAB_PARTNERS[initialKey]?.name || "Apex Dental Laboratories",
      techNotes: order.techNotes || ""
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    try {
      const selectedPartner = LAB_PARTNERS[dispatchFormData.selectedPartnerKey] || {};
      const vendorPayload = {
        vendor_id: selectedPartner.id || null,
        vendor_name: selectedPartner.name || dispatchFormData.vendorName || "External Dental Lab",
        vendor_email: dispatchFormData.email || selectedPartner.email || "external-lab@labmail.com",
        tech_notes: dispatchFormData.techNotes || ""
      };

      await sendOrderToVendor(dispatchOrder.id, vendorPayload);
      triggerToast(`Case ${dispatchOrder.id} dispatched to ${vendorPayload.vendor_name}. Email with secure token sent!`);
      setIsDispatchModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error("Failed to send order to vendor:", err);
      triggerToast(err.message || "Failed to send order to lab vendor.", "error");
    }
  };

  // Item Received at Clinic Modal States
  const [isItemReceivedModalOpen, setIsItemReceivedModalOpen] = useState(false);
  const [itemReceivedOrder, setItemReceivedOrder] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [itemReceivedFormData, setItemReceivedFormData] = useState({
    received_date: new Date().toISOString().slice(0, 10),
    received_by: "Alen Joseph (Lab Tech)",
    item_condition: "Good",
    item_remarks: "",
    vendor_name: "ABC Dental Lab",
    vendor_invoice_number: "INV-2451",
    vendor_invoice_amount: "2400",
    vendor_invoice_file_url: ""
  });

  const handleOpenItemReceivedModal = (order) => {
    setItemReceivedOrder(order);
    setInvoiceFile(null);
    setItemReceivedFormData({
      received_date: new Date().toISOString().slice(0, 10),
      received_by: "Alen Joseph (Lab Tech)",
      item_condition: "Good",
      item_remarks: "",
      vendor_name: order.vendor_name || order.vendorName || "ABC Dental Lab",
      vendor_invoice_number: order.vendor_invoice_number || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor_invoice_amount: order.vendor_invoice_amount || "2400",
      vendor_invoice_file_url: order.vendor_invoice_file_url || ""
    });
    setIsItemReceivedModalOpen(true);
  };

  const handleItemReceivedSubmit = async (e) => {
    e.preventDefault();
    if (!itemReceivedOrder) return;
    try {
      let uploadedUrl = itemReceivedFormData.vendor_invoice_file_url;
      if (invoiceFile) {
        setUploadingInvoice(true);
        const formData = new FormData();
        formData.append("file", invoiceFile);
        const uploadRes = await uploadVendorInvoiceFile(itemReceivedOrder.id, formData);
        uploadedUrl = uploadRes.invoice_url;
      }

      const payload = {
        ...itemReceivedFormData,
        vendor_invoice_amount: parseFloat(itemReceivedFormData.vendor_invoice_amount) || 0.0,
        vendor_invoice_file_url: uploadedUrl
      };

      await markItemReceivedAtClinic(itemReceivedOrder.id, payload);
      triggerToast(`Case #${itemReceivedOrder.id} marked as received! External Lab Invoice recorded & Accountant automatically notified.`);
      setIsItemReceivedModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error("Failed to mark item received:", err);
      triggerToast("Failed to update status to Item Received at Clinic.", "error");
    } finally {
      setUploadingInvoice(false);
    }
  };

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

  const getMissingDoctorFields = (order) => {
    if (!order) return [];
    const missing = [];

    if (order.orderCategory === "Prosthetic" || !order.orderCategory) {
      const tooth = order.toothQuadrant || order.toothNumber || (order.orderDetails && order.orderDetails.tooth_number);
      if (!tooth || tooth === "N/A" || tooth === "Unspecified") missing.push("Tooth Number");

      const shade = order.shade || (order.orderDetails && order.orderDetails.shade);
      if (!shade || shade === "N/A" || shade === "Unspecified") missing.push("Shade");

      const mat = order.material || order.prostheticType || (order.orderDetails && order.orderDetails.material);
      if (!mat || mat === "N/A" || mat === "Unspecified") missing.push("Material / Specs");

      const imp = order.impressionType || (order.orderDetails && order.orderDetails.impression_type);
      if (!imp || imp === "N/A" || imp === "Unspecified") missing.push("Impression Type");

      if (!order.notes || !order.notes.trim()) missing.push("Doctor Notes");

      const hasScan = order.scanFile || order.opposingBiteScan || (Array.isArray(order.attachments) && order.attachments.length > 0);
      if (!hasScan) missing.push("Clinical Scan / Attachment");
    }
    return missing;
  };

  const getMeasurementsList = (order) => {
    if (!order) return [];
    const list = [];
    if (order.orderCategory === "Prosthetic") {
      const toothVal = order.toothQuadrant || order.toothNumber || (order.orderDetails && order.orderDetails.tooth_number);
      list.push({ label: "Tooth number", value: toothVal || "Missing", isMissing: !toothVal });

      const shadeVal = order.shade || (order.orderDetails && order.orderDetails.shade);
      list.push({ label: "Shade", value: shadeVal || "Missing", isMissing: !shadeVal });

      const matVal = order.material || order.prostheticType || (order.orderDetails && order.orderDetails.material);
      list.push({ label: "Material", value: matVal || "Missing", isMissing: !matVal });

      const impVal = order.impressionType || (order.orderDetails && order.orderDetails.impression_type);
      list.push({ label: "Impression type", value: impVal || "Missing", isMissing: !impVal });

      if (order.marginDesign) list.push({ label: "Margin design", value: order.marginDesign, isMissing: false });
      if (order.implantSystem) list.push({ label: "Implant system", value: order.implantSystem, isMissing: false });
    } else {
      if (order.testType) list.push({ label: "Test Type", value: order.testType, isMissing: false });
      if (order.sampleType) list.push({ label: "Sample Type", value: order.sampleType, isMissing: false });
      if (order.reasonForTest) list.push({ label: "Reason for test", value: order.reasonForTest, isMissing: false });
    }

    if (order.orderDetails && typeof order.orderDetails === "object") {
      Object.entries(order.orderDetails).forEach(([key, val]) => {
        if (typeof val === "string" && val.trim() && !["address", "notes", "lab_name", "lab_email"].includes(key)) {
          const cleanKey = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          if (!list.some(item => item.label.toLowerCase() === cleanKey.toLowerCase())) {
            list.push({ label: cleanKey, value: val, isMissing: false });
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

  const dentists = useMemo(() => Array.from(new Set(orders.map((o) => o.dentistName))), [orders]);

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

  const categoryFiltered = useMemo(() => {
    return orders.filter((o) =>
      activeCategory === "Dental Prosthetics"
        ? o.orderCategory === "Prosthetic"
        : o.orderCategory !== "Prosthetic"
    );
  }, [orders, activeCategory]);

  const totalCases = useMemo(() => categoryFiltered.filter((o) => o.status !== "completed" && o.status !== "Completed").length, [categoryFiltered]);
  const pendingCases = useMemo(() => categoryFiltered.filter((o) => 
    ["Submitted", "submitted", "Pending Review", "Pending Lab Review", "Flagged", "flagged", "Revision Requested"].includes(o.status)
  ).length, [categoryFiltered]);
  const inProductionCases = useMemo(() => categoryFiltered.filter((o) => {
    return ["Order Sent to Lab", "Sent to Lab", "sent_to_lab", "Accepted by Lab", "accepted_by_lab", "Case Completed", "case_completed"].includes(o.status);
  }).length, [categoryFiltered]);
  const urgentHighCases = useMemo(() => categoryFiltered.filter((o) => 
    ["Urgent", "High"].includes(o.priority) && o.status !== "completed" && o.status !== "Completed"
  ).length, [categoryFiltered]);

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
      case "Pending Review":
      case "pending_review":
      case "Submitted":
      case "submitted":
        return "Pending Lab Review";
      case "Flagged":
      case "flagged":
      case "Revision Requested":
        return "Flagged";
      case "Order Sent to Lab":
      case "Sent to Lab":
      case "sent_to_lab":
        return "Order Sent to Lab";
      case "Accepted by Lab":
      case "accepted_by_lab":
        return "Accepted by Lab";
      case "Rejected by Lab":
      case "rejected_by_lab":
        return "Rejected by Lab";
      case "Case Completed":
      case "case_completed":
        return "Case Completed";
      case "Item Received at Clinic":
      case "item_received_at_clinic":
        return "Item Received at Clinic";
      case "Bill Ready":
      case "bill_ready":
        return "Bill Ready";
      case "Completed":
      case "completed":
        return "Completed";
      default:
        return status || "Pending Lab Review";
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "Pending Review":
      case "pending_review":
      case "Submitted":
      case "submitted":
        return "bg-amber-400 animate-pulse";
      case "Flagged":
      case "flagged":
      case "Revision Requested":
        return "bg-rose-500 font-bold";
      case "Order Sent to Lab":
      case "Sent to Lab":
      case "sent_to_lab":
        return "bg-indigo-600 animate-pulse";
      case "Accepted by Lab":
      case "accepted_by_lab":
        return "bg-emerald-500 font-extrabold";
      case "Rejected by Lab":
      case "rejected_by_lab":
        return "bg-rose-600 animate-pulse";
      case "Case Completed":
      case "case_completed":
        return "bg-sky-500 font-bold";
      case "Item Received at Clinic":
      case "item_received_at_clinic":
        return "bg-teal-600 font-black";
      case "Bill Ready":
      case "bill_ready":
        return "bg-emerald-600 font-black";
      case "Completed":
      case "completed":
        return "bg-emerald-500";
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
    if (columnId === "PendingReview") targetStatus = "Submitted";
    else if (columnId === "SentToLab") targetStatus = "Order Sent to Lab";
    else if (columnId === "CaseCompleted") targetStatus = "Case Completed";
    else if (columnId === "ReceivedBilled") targetStatus = "Item Received at Clinic";

    if (targetStatus && targetStatus !== order.status) {
      const ok = await updateDbStatus(orderId, targetStatus);
      if (ok) {
        triggerToast(`Case ${orderId} moved to ${targetStatus}.`);
      } else {
        triggerToast("Failed to move case.", "error");
      }
    }
  };

  const handleSendReminder = async (order) => {
    try {
      await sendExternalLabReminder(order.id);
      triggerToast(`Reminder email dispatched to external lab for Case ${order.id}.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to send reminder email.", "error");
    }
  };

  const handleCancelRequest = async (order) => {
    try {
      await cancelExternalLabRequest(order.id);
      triggerToast(`External lab request for Case ${order.id} cancelled. Reverted to Pending Lab Review.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to cancel external lab request.", "error");
    }
  };

  const handleSendReworkToLab = async (order) => {
    try {
      await sendReworkToExternalLab(order.id, {});
      triggerToast(`Rework request for Case ${order.id} sent to external lab!`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to send rework to external lab.", "error");
    }
  };

  const renderOrderActions = (order) => {
    const isProsthetic = order.orderCategory === "Prosthetic";
    
    let actionButtons = null;
    if (isProsthetic) {
      if (["Order Sent to Lab", "Sent to Lab", "sent_to_lab", "Rework Sent to Lab"].includes(order.status)) {
        // Awaiting external lab acceptance (initial or rework)
        const isRework = order.status === "Rework Sent to Lab";
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded border ${
              isRework ? "text-purple-700 bg-purple-50 border-purple-200" : "text-indigo-700 bg-indigo-50 border-indigo-200"
            }`}>
              {isRework ? "Rework Sent – Awaiting Lab Response" : "Awaiting External Lab Response"}
            </span>
            {!isRework && (
              <button
                onClick={() => handleSendReminder(order)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Send Reminder
              </button>
            )}
            <button
              onClick={() => handleCancelRequest(order)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel Request
            </button>
          </div>
        );
      } else if (order.status === "Doctor Requested Rework") {
        // Doctor requested rework → lab tech can send to external vendor
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 flex items-center gap-1">
              <Wrench className="w-3 h-3" /> Rework Requested by Doctor
            </span>
            <button
              onClick={() => handleSendReworkToLab(order)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Send className="w-3 h-3" /> Send Rework to External Lab
            </button>
            <button
              onClick={() => handleOpenFlagModal(order)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Flag Doctor
            </button>
          </div>
        );
      } else if (["Rework In Progress"].includes(order.status)) {
        // Rework accepted by external lab – awaiting completion
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200 flex items-center gap-1">
              <Wrench className="w-3 h-3" /> Rework In Progress
            </span>
          </div>
        );
      } else if (["Rework Completed"].includes(order.status)) {
        // Rework shipped back by external lab → mark received
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded border border-teal-200 flex items-center gap-1">
              <Package className="w-3 h-3" /> Rework Completed – Item en Route
            </span>
            <button
              onClick={() => handleOpenItemReceivedModal(order)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Mark Rework Received
            </button>
          </div>
        );
      } else if (["Rework Rejected"].includes(order.status)) {
        // External lab rejected rework → option to resend or flag
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Rework Rejected by External Lab
            </span>
            <button
              onClick={() => handleSendReworkToLab(order)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Send className="w-3 h-3" /> Resend Rework to Lab
            </button>
            <button
              onClick={() => handleOpenFlagModal(order)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Flag Doctor
            </button>
          </div>
        );
      } else if (["Completed by External Lab"].includes(order.status)) {
        // External lab completed fabrication and shipped → mark received
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded border border-teal-200 flex items-center gap-1">
              <Package className="w-3 h-3" /> Completed by External Lab – Item en Route
            </span>
            <button
              onClick={() => handleOpenItemReceivedModal(order)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Mark Item Received & Record Invoice
            </button>
          </div>
        );
      } else if (["Awaiting Doctor Review", "Appointment Scheduled"].includes(order.status)) {
        // Receptionist scheduled fitting, doctor will review
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded border border-sky-200">
              Awaiting Doctor Review (Fitting Scheduled)
            </span>
          </div>
        );
      } else if (order.status === "Completed") {
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Case Completed
            </span>
          </div>
        );
      } else if (order.status === "Resubmitted by Doctor") {
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
              Resubmitted by Doctor
            </span>
            <button
              onClick={() => handleOpenDispatchModal(order)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Send Updated Case
            </button>
            <button
              onClick={() => handleOpenFlagModal(order)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Flag Doctor
            </button>
          </div>
        );
      } else if (["Revision Requested", "Flagged", "flagged", "Flagged - Waiting for Doctor Review"].includes(order.status)) {
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-100 flex items-center gap-1">
              Flagged - Waiting for Doctor Review
            </span>
            <button
              onClick={() => handleOpenFlagModal(order)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Flag Doctor
            </button>
          </div>
        );
      } else if (["Rejected by Lab", "rejected_by_lab"].includes(order.status)) {
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => handleOpenDispatchModal(order)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Send to External Lab
            </button>
            <button
              onClick={() => handleOpenFlagModal(order)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Flag Doctor
            </button>
          </div>
        );
      } else if (["Accepted by Lab", "accepted_by_lab", "In Fabrication"].includes(order.status)) {
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Accepted by Lab / In Fabrication
            </span>
            <button
              onClick={() => handleOpenItemReceivedModal(order)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Mark Item Received & Record Invoice
            </button>
          </div>
        );
      } else if (["Item Received at Clinic", "item_received_at_clinic"].includes(order.status)) {
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1.5 rounded border border-teal-200 flex items-center gap-1">
              Item Received at Clinic (Accountant Notified)
            </span>
          </div>
        );
      } else {
        // Pending Lab Review, Submitted, or Default
        actionButtons = (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => handleOpenDispatchModal(order)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Send to External Lab
            </button>
            <button
              onClick={() => handleOpenFlagModal(order)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Flag Doctor
            </button>
          </div>
        );
      }
    } else {
      // Diagnostic / Pathology
      if (["Ordered", "ordered", "Pending", "submitted", "Submitted"].includes(order.status)) {
        actionButtons = (
          <button
            onClick={() => updateDbStatus(order.id, "Sample Collected")}
            className="px-2.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Confirm Sample Collection
          </button>
        );
      } else if (["Sample Collected", "sample_collected"].includes(order.status)) {
        actionButtons = (
          <button
            onClick={() => handleOpenDispatchModal(order)}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Send to Lab
          </button>
        );
      } else if (["Sent to Lab", "sent_to_lab", "Order Sent to Lab"].includes(order.status)) {
        actionButtons = (
          <button
            onClick={() => updateDbStatus(order.id, "Report Received")}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-650 hover:text-white border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Report Received
          </button>
        );
      } else if (["Report Received", "report_received"].includes(order.status)) {
        actionButtons = (
          <button
            onClick={() => updateDbStatus(order.id, "Reviewed by Doctor")}
            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Reviewed by Doctor
          </button>
        );
      } else if (["Reviewed by Doctor", "reviewed_by_doctor"].includes(order.status)) {
        actionButtons = (
          <button
            onClick={() => updateDbStatus(order.id, "Completed")}
            className="px-2.5 py-1.5 bg-success/15 hover:bg-success text-success hover:text-white border border-success/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Mark as Completed
          </button>
        );
      }
    }

    return (
      <div className="flex flex-col gap-1.5 w-full items-end">
        {order.pendingEmailProposal && (
          <div className="w-full my-1.5 p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs text-left">
            <div className="flex items-start gap-2.5">
              <span className="p-2 bg-indigo-100/80 rounded-xl text-indigo-700 font-bold shrink-0">📩</span>
              <div>
                <span className="font-extrabold text-indigo-950 block text-[11px] uppercase tracking-wider">
                  New Completion Email Received ({order.pendingEmailProposal.case_id || order.id})
                </span>
                <p className="text-xs text-indigo-900 font-medium mt-0.5 leading-relaxed">
                  Patient: <strong>{order.patient_name || order.patientName}</strong> • Courier: <strong>{order.pendingEmailProposal.courier_name || "N/A"}</strong> • Tracking: <strong>{order.pendingEmailProposal.tracking_number || "N/A"}</strong> • ETA: <strong>{order.pendingEmailProposal.expected_return_date || "N/A"}</strong>
                  {order.pendingEmailProposal.remarks && <> • Remarks: <em>"{order.pendingEmailProposal.remarks}"</em></>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await confirmCompletionEmail(order.id);
                    triggerToast(`Completion confirmed for Case ${order.id}.`);
                    fetchOrders();
                  } catch (err) {
                    triggerToast("Failed to confirm completion.", "error");
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer border-none flex items-center gap-1"
              >
                ✓ Confirm Completion
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditProposalModal(order);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await dismissCompletionEmail(order.id);
                    triggerToast(`Completion proposal ignored for Case ${order.id}.`);
                    fetchOrders();
                  } catch (err) {
                    triggerToast("Failed to ignore proposal.", "error");
                  }
                }}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Ignore
              </button>
            </div>
          </div>
        )}
        {actionButtons}
      </div>
    );
  };

  const BOARD_COLUMNS = activeCategory === "Dental Prosthetics" ? [
    { id: "Submitted", label: "Submitted & Flagged", statuses: ["Pending Review", "Revision Requested", "Submitted", "submitted", "Flagged", "flagged", "Pending", "returned_for_rework", "Returned for Rework", "Rejected by Lab", "rejected_by_lab"] },
    { id: "ConfirmedSent", label: "Confirmed & Sent", statuses: ["Confirmed by Tech", "Pending Doctor Confirmation", "Pending Doctor Review", "Confirmed", "confirmed", "Doctor Accepted", "Order Sent to Lab", "Sent to Lab", "In Progress", "Accepted by Lab", "accepted_by_lab", "received_by_lab", "in_design", "in_fabrication", "quality_check"] },
    { id: "ReceivedFitted", label: "Received & Fitted", statuses: ["Order Received", "Received from Lab", "received_from_lab", "Fitted", "fitted"] },
    { id: "Completed", label: "Completed", statuses: ["Completed", "completed", "Case Completed", "case_completed", "Results Received"] }
  ] : [
    { id: "OrderedCollected", label: "Ordered & Collected", statuses: ["Ordered", "ordered", "Sample Collected", "sample_collected", "Pending"] },
    { id: "SentReport", label: "Sent & Report", statuses: ["Order Sent to Lab", "Sent to Lab", "sent_to_lab", "Report Received", "report_received", "Accepted by Lab", "accepted_by_lab"] },
    { id: "Reviewed", label: "Reviewed by Doctor", statuses: ["Reviewed by Doctor", "reviewed_by_doctor"] },
    { id: "Completed", label: "Completed", statuses: ["Completed", "completed", "Case Completed", "case_completed", "Results Received"] }
  ];

  
  const [pricingCheck, setPricingCheck] = useState({ loading: false, configured: true, message: "", patient_charge: 0 });

  const verifySelectedVendorPricing = async (vendorId, restorationType) => {
    if (!vendorId || !restorationType) return;
    setPricingCheck(prev => ({ ...prev, loading: true }));
    try {
      const res = await checkVendorLabPricing(vendorId, restorationType);
      setPricingCheck({
        loading: false,
        configured: res.configured,
        message: res.message || "",
        patient_charge: res.patient_charge || 0
      });
    } catch (err) {
      console.error("Pricing check failed", err);
      setPricingCheck({ loading: false, configured: true, message: "", patient_charge: 0 });
    }
  };

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
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSimulateEmailModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Mail className="w-4 h-4 text-indigo-600" /> Simulate Lab Email Reply
          </button>

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
      </div>

      {/* Unmatched Emails Queue Alert Banner */}
      {unmatchedEmails.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs animate-scale-up">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 rounded-xl text-amber-700 font-bold shrink-0">⚠️</span>
            <div>
              <span className="font-black text-amber-950 uppercase tracking-wider block text-[11px]">
                Unmatched External Lab Emails Queue ({unmatchedEmails.length})
              </span>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                {unmatchedEmails.length} external lab completion reply email{unmatchedEmails.length === 1 ? "" : "s"} could not be automatically matched to a case ID.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUnmatchedModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer border-none shrink-0"
          >
            Review Unmatched Queue ({unmatchedEmails.length})
          </button>
        </div>
      )}

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
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="Awaiting Lab Review">Awaiting Review</option>
              <option value="Flagged by Lab">Flagged</option>
              <option value="Sent to External Lab">Sent</option>
              <option value="Accepted by External Lab">Accepted</option>
              <option value="Delivery Delayed">Delivery Delayed</option>
              <option value="Pending Completion Confirmation">Pending Completion Confirmation</option>
              <option value="Completed by External Lab">Completed</option>
              <option value="Rework Requested">Rework</option>
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

                        {/* Middle Right: Total Orders badge */}
                        <div className="w-24">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Cases</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-black rounded-md">
                              {patient.orders.length}
                            </span>
                          </div>
                        </div>

                        {/* Right: Status callout & Chevron */}
                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                          <div className="text-left md:text-right hidden sm:block">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recent Activity</p>
                            {patient.newOrdersCount > 0 ? (
                              <span className="text-red-500 font-extrabold text-xs flex items-center md:justify-end gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {patient.newOrdersCount} new order{patient.newOrdersCount > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-bold text-xs block mt-0.5">
                                Active Case
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
                                        <div className="font-extrabold text-sm">{order.id}</div>
                                        <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md w-fit mt-1">
                                          {order.dentistName || "Dr. Anoop Nair"}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3.5">
                                        {(() => {
                                          const missing = getMissingDoctorFields(order);
                                          return order.orderCategory === "Prosthetic" ? (
                                            <div>
                                              <p className="font-semibold text-gray-750">{order.prostheticType || "Prosthetic Case"}</p>
                                              <p className="text-[10px] text-gray-400 mt-0.5">{order.material || "Material Unspecified"} (Shade: {order.shade || "None"})</p>
                                              {missing.length > 0 && (
                                                <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-extrabold block w-fit mt-1">
                                                  Missing: {missing.join(", ")}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div>
                                              <p className="font-semibold text-gray-750">{order.orderCategory}</p>
                                              <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">{JSON.stringify(order.orderDetails)}</p>
                                              {missing.length > 0 && (
                                                <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-extrabold block w-fit mt-1">
                                                  Missing: {missing.join(", ")}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })()}
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

      {/* Mark Item Received at Clinic Modal */}
      {isItemReceivedModalOpen && itemReceivedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 font-sans text-left my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-teal-50/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Lab Technician Verification & Receipt
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
                  <span>📦</span> Mark Item Received for #{itemReceivedOrder.id}
                </h2>
              </div>
              <button 
                onClick={() => setIsItemReceivedModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleItemReceivedSubmit} className="p-6 space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Patient</span>
                  <span className="font-bold text-gray-900">{itemReceivedOrder.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Ordering Doctor</span>
                  <span className="font-bold text-gray-900">{itemReceivedOrder.dentistName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Restoration / Procedure</span>
                  <span className="font-bold text-teal-700">{itemReceivedOrder.prostheticType || itemReceivedOrder.orderCategory}</span>
                </div>
              </div>

              {/* Section 1: Item Receipt */}
              <div className="p-4 bg-teal-50/40 border border-teal-150 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <span>🏥</span> Section 1: Physical Item Receipt
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Received Date</label>
                    <input 
                      type="date" 
                      required
                      value={itemReceivedFormData.received_date}
                      onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, received_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Received By (Lab Tech)</label>
                    <input 
                      type="text" 
                      required
                      value={itemReceivedFormData.received_by}
                      onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, received_by: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Physical Condition</label>
                  <select 
                    value={itemReceivedFormData.item_condition}
                    onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, item_condition: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="Good">Good (Intact & Fit for Delivery)</option>
                    <option value="Damaged">Damaged (Defect / Needs Attention)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remarks (Optional)</label>
                  <textarea 
                    rows="2"
                    value={itemReceivedFormData.item_remarks}
                    onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, item_remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none"
                    placeholder="e.g. Checked crown margin under microscope."
                  />
                </div>
              </div>

              {/* Section 2: External Lab Invoice Details */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <span>📑</span> Section 2: External Lab Supplier Invoice
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">External Lab Name</label>
                    <input 
                      type="text" 
                      required
                      value={itemReceivedFormData.vendor_name}
                      onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, vendor_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Invoice Number</label>
                    <input 
                      type="text" 
                      required
                      value={itemReceivedFormData.vendor_invoice_number}
                      onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, vendor_invoice_number: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500"
                      placeholder="e.g. INV-2451"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lab Invoice Amount (₹) * Required</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="10"
                    value={itemReceivedFormData.vendor_invoice_amount}
                    onChange={(e) => setItemReceivedFormData({ ...itemReceivedFormData, vendor_invoice_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-black text-rose-600 outline-none focus:border-indigo-500"
                    placeholder="2400"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Required: This actual cost will be passed directly to the Accountant for final patient bill calculation.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upload Invoice (PDF / Image Optional)</label>
                  <input 
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setInvoiceFile(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-[11px] font-medium text-teal-900 flex items-start gap-2">
                <span className="shrink-0 text-sm">🔔</span>
                <p>Clicking <strong>Save & Notify Accountant</strong> will log the lab receipt, pass the recorded invoice cost to the Accountant's <strong>Pending Lab Billing</strong> queue, and notify the Receptionist.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsItemReceivedModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploadingInvoice}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingInvoice ? "Uploading..." : "Save & Notify Accountant ↗"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send to External Lab Modal */}
      {isDispatchModalOpen && dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white text-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 font-sans text-left my-6">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-indigo-50/40 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                  External Dental Lab Dispatch Terminal
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-1">
                  Order #{dispatchOrder.id} — Patient: {dispatchOrder.patientName}
                </h2>
              </div>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: Measurements & Notes */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Measurements & Doctor Specs</span>
                    </div>

                    <div className="space-y-2 text-xs font-medium text-gray-800">
                      {getMeasurementsList(dispatchOrder).map(({ label, value, isMissing, isRevised }) => (
                        <div key={label} className={`flex justify-between border-b pb-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
                          isRevised
                            ? "bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold"
                            : isMissing
                            ? "bg-rose-50 border border-rose-200"
                            : "border-gray-200/50"
                        }`}>
                          <span className={isRevised ? "text-emerald-900 font-black flex items-center gap-1.5 text-xs" : isMissing ? "text-rose-700 font-bold flex items-center gap-1 text-xs" : "text-gray-500"}>
                            {isMissing && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                            {label}
                          </span>
                          <span className={isRevised ? "text-emerald-900 font-black flex items-center gap-1.5 text-xs" : isMissing ? "text-rose-700 font-black uppercase text-[11px]" : "text-gray-900 font-bold"}>
                            {value}
                            {isRevised && (
                              <span className="bg-emerald-200 text-emerald-900 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                Revised by Doctor
                              </span>
                            )}
                          </span>
                        </div>
                      ))}

                      {dispatchOrder.notes ? (
                        <div className="pt-2 border-t border-gray-200 mt-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Doctor&apos;s notes</p>
                          <p className="text-gray-800 text-xs font-semibold leading-relaxed bg-white p-3 rounded-xl border border-gray-200">{dispatchOrder.notes}</p>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-rose-200 mt-2">
                          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide mb-1">Doctor&apos;s notes</p>
                          <p className="text-rose-700 text-xs font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                            Missing (Doctor did not provide notes)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  {(dispatchOrder.scanFile || dispatchOrder.opposingBiteScan || (dispatchOrder.attachments && dispatchOrder.attachments.length > 0)) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 max-w-full overflow-hidden">
                      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
                        <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Clinical Attachments</span>
                      </div>

                      <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                        {dispatchOrder.scanFile && (
                          <a 
                            href={`/api/lab/files/${dispatchOrder.scanFile}`} 
                            download
                            title={dispatchOrder.scanFile}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-xs max-w-full"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[220px] sm:max-w-[260px]">{dispatchOrder.scanFile}</span>
                          </a>
                        )}
                        {dispatchOrder.opposingBiteScan && (
                          <a 
                            href={`/api/lab/files/${dispatchOrder.opposingBiteScan}`} 
                            download
                            title={dispatchOrder.opposingBiteScan}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-xs max-w-full"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[220px] sm:max-w-[260px]">{dispatchOrder.opposingBiteScan}</span>
                          </a>
                        )}
                        {Array.isArray(dispatchOrder.attachments) && dispatchOrder.attachments.map((att, idx) => {
                          const fname = typeof att === 'string' ? att : (att.name || att.filename || `Attachment ${idx + 1}`);
                          const url = typeof att === 'string' ? `/api/lab/files/${att}` : (att.url || "#");
                          return (
                            <a 
                              key={idx}
                              href={url} 
                              target="_blank"
                              rel="noopener noreferrer"
                              title={fname}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-xs max-w-full"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate max-w-[220px] sm:max-w-[260px]">{fname}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Vendor Selection & Actions */}
                <div className="space-y-4">
                  {!["Sent to Lab", "sent_to_lab", "Order Sent to Lab", "In Progress", "Completed", "completed"].includes(dispatchOrder.status) ? (
                    <>
                      <div className="bg-indigo-50/60 border border-indigo-100/80 rounded-2xl p-4.5 space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-indigo-100/80 pb-2">
                          <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Choose External Laboratory</span>
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
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 cursor-pointer"
                          >
                            {Object.entries(LAB_PARTNERS).map(([key, partner]) => (
                              <option key={key} value={key} className="bg-white text-gray-800 font-semibold">
                                {partner.name} — {partner.email}
                              </option>
                            ))}
                          </select>

                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                              <Mail className="w-4 h-4 text-indigo-500" />
                            </span>
                            <input
                              type="text"
                              readOnly
                              value={dispatchFormData.email}
                              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contract Pricing Status Banner */}
                      {!pricingCheck.configured ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-2.5 shadow-xs">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black uppercase tracking-wider block text-[11px] text-rose-700">Pricing Configuration Missing</span>
                            <p className="font-medium text-[11px] leading-relaxed mt-0.5">
                              Admin must configure contract pricing for this vendor and restoration type before proceeding.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-[11px]">Contract Pricing Verified</span>
                          </div>
                          <span className="font-black text-sky-700 bg-white px-2.5 py-1 rounded-xl border border-sky-200 text-xs">
                            Patient Charge: ₹{(pricingCheck.patient_charge || dispatchOrder.patient_charge || dispatchOrder.patient_total_amount || 3500).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsDispatchModalOpen(false)}
                          className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!pricingCheck.configured || pricingCheck.loading}
                          className="flex-1 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={!pricingCheck.configured ? "Admin must configure pricing rule before proceeding" : ""}
                        >
                          Send to External Lab
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600">External Lab Status</span>
                        <p className="font-bold text-sm text-gray-900">{dispatchOrder.labName || LAB_PARTNERS[dispatchFormData.selectedPartnerKey]?.name || "Apex Dental Laboratories"}</p>
                        <p className="text-xs text-gray-500">{dispatchFormData.email}</p>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsDispatchModalOpen(false)}
                          className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
    
      {/* ── EDIT PROPOSAL MODAL ── */}
      {isEditProposalModalOpen && proposalTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 font-sans text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-indigo-50/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">Email Completion Review</span>
                <h2 className="text-lg font-black text-gray-900 mt-1">Review / Edit Details — Case #{proposalTargetOrder.id}</h2>
              </div>
              <button onClick={() => setIsEditProposalModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full font-bold">✕</button>
            </div>
            <form onSubmit={handleConfirmEditProposalSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-2xl border text-xs text-gray-700">
                <p>Patient: <strong>{proposalTargetOrder.patient_name || proposalTargetOrder.patientName}</strong></p>
                <p>Status transition: <strong>{proposalTargetOrder.pendingEmailProposal?.proposed_status || "Completed by External Lab"}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Courier Name</label>
                <input type="text" required value={proposalFormData.courier_name} onChange={(e) => setProposalFormData({ ...proposalFormData, courier_name: e.target.value })} placeholder="e.g. BlueDart, DHL, Professional Courier" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tracking Number</label>
                <input type="text" required value={proposalFormData.tracking_number} onChange={(e) => setProposalFormData({ ...proposalFormData, tracking_number: e.target.value })} placeholder="e.g. BD4587921" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Expected Delivery Date</label>
                <input type="text" required value={proposalFormData.expected_delivery_date} onChange={(e) => setProposalFormData({ ...proposalFormData, expected_delivery_date: e.target.value })} placeholder="e.g. 09-Aug-2026" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Remarks / Notes</label>
                <textarea rows={2} value={proposalFormData.remarks} onChange={(e) => setProposalFormData({ ...proposalFormData, remarks: e.target.value })} placeholder="Add any special remarks or handle instructions..." className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditProposalModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl border-none cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl border-none cursor-pointer shadow-md">✓ Confirm Completion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UNMATCHED EMAILS QUEUE MODAL ── */}
      {isUnmatchedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 font-sans text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-amber-50/80">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">Unmatched Queue</span>
                <h2 className="text-lg font-black text-gray-900 mt-1">Unmatched External Lab Emails ({unmatchedEmails.length})</h2>
              </div>
              <button onClick={() => setIsUnmatchedModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {unmatchedEmails.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-6">No unmatched external lab emails in queue.</p>
              ) : (
                unmatchedEmails.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-gray-900">From: {item.sender_email || "Unknown Vendor"}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Received: {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}</span>
                      </div>
                      <button type="button" onClick={async () => { try { await dismissUnmatchedEmail(item.id); fetchUnmatchedEmailsList(); triggerToast("Email dismissed."); } catch(err) { triggerToast("Failed.", "error"); } }} className="text-xs text-rose-600 hover:underline font-bold">Dismiss</button>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto">{item.raw_body}</div>
                    <div className="flex items-center gap-2 pt-1">
                      <input type="text" placeholder="Enter Case ID to assign (e.g. CASE-2026-649)..." value={assignTargetOrderId} onChange={(e) => setAssignTargetOrderId(e.target.value)} className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none" />
                      <button type="button" onClick={async () => { if (!assignTargetOrderId.trim()) return; try { await assignUnmatchedEmail(item.id, assignTargetOrderId.trim()); triggerToast(`Assigned email to Case #${assignTargetOrderId.trim()}`); setAssignTargetOrderId(""); setIsUnmatchedModalOpen(false); fetchOrders(); fetchUnmatchedEmailsList(); } catch(err) { triggerToast("Failed to assign email.", "error"); } }} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl border-none cursor-pointer">Assign to Case</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-right">
              <button type="button" onClick={() => setIsUnmatchedModalOpen(false)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl border-none cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIMULATE EMAIL REPLY MODAL ── */}
      {isSimulateEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 font-sans text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-sky-50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-800 bg-sky-200 px-2.5 py-0.5 rounded-full">Email Reply Simulator</span>
                <h2 className="text-lg font-black text-gray-900 mt-1">Simulate External Lab Completion Email</h2>
              </div>
              <button onClick={() => setIsSimulateEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full font-bold">✕</button>
            </div>
            <form onSubmit={handleSimulateEmailSubmit} className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Paste the raw completion email reply from an external dental laboratory to test automatic extraction & fault tolerance.</p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Raw Email Text</label>
                <textarea rows={8} required value={simRawEmailText} onChange={(e) => setSimRawEmailText(e.target.value)} placeholder={`Case Number:\nCASE-2026-649\n\nStatus:\nCOMPLETED\n\nCourier:\nBlueDart\n\nTracking Number:\nBD4587921\n\nExpected Delivery:\n09-Aug-2026\n\nRemarks:\nHandle carefully.`} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 outline-none" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsSimulateEmailModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl border-none cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl border-none cursor-pointer shadow-md">Process Email Reply</button>
              </div>
            </form>
          </div>
        </div>
      )}

</div>
  );
}
