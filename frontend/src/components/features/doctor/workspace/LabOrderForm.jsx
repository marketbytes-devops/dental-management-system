"use client";

import { useState, useEffect } from "react";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";
import { uploadLabFile } from "@/services/api";
import { validateLabOrderFields } from "@/services/labValidation";
import { AlertCircle, FileText, UploadCloud, Info } from "lucide-react";

export default function LabOrderForm({ onSubmitLabOrder, initialOrder, onCancel }) {
  const doctorCtx = useDoctor();
  
  // Universal fields
  const [orderCategory, setOrderCategory] = useState("Prosthetic");
  const [priority, setPriority] = useState("Medium");
  const [specialNotes, setSpecialNotes] = useState("");

  // Dental Prosthetics fields
  const [fabricationType, setFabricationType] = useState("Crown");
  const [toothNumber, setToothNumber] = useState("");
  const [material, setMaterial] = useState("Zirconia");
  
  // File attachments and fallbacks
  const [scanFile, setScanFile] = useState("");
  const [physicalMoldSent, setPhysicalMoldSent] = useState(false);
  
  // Conditional Prosthetics fields
  const [shade, setShade] = useState("A2");
  const [opposingBiteScan, setOpposingBiteScan] = useState("");
  const [physicalOpposingMoldSent, setPhysicalOpposingMoldSent] = useState(false);
  const [biteRegistration, setBiteRegistration] = useState("");
  const [tryInStageRequired, setTryInStageRequired] = useState(false);
  const [implantSystem, setImplantSystem] = useState("");
  const [referencePhoto, setReferencePhoto] = useState("");

  // Blood Work / Pathology fields
  const [testType, setTestType] = useState("CBC");
  const [sampleType, setSampleType] = useState("Blood");
  const [reasonForTest, setReasonForTest] = useState("");

  // Validation Error list
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadingField, setUploadingField] = useState(null);

  // Populate data when editing an existing order
  useEffect(() => {
    if (initialOrder) {
      setOrderCategory(initialOrder.order_category || initialOrder.orderCategory || "Prosthetic");
      setPriority(initialOrder.priority || "Medium");
      setSpecialNotes(initialOrder.notes || "");

      const isDiag = (initialOrder.order_category || initialOrder.orderCategory) === "Diagnostic";
      if (isDiag) {
        setTestType(initialOrder.test_type || "CBC");
        setSampleType(initialOrder.sample_type || "Blood");
        setReasonForTest(initialOrder.reason_for_test || "");
      } else {
        const fab = initialOrder.fabrication_type || initialOrder.prostheticType || "Crown";
        setFabricationType(fab);
        setToothNumber(initialOrder.tooth_number || initialOrder.tooth || "");
        setMaterial(initialOrder.material || "Zirconia");
        setScanFile(initialOrder.scan_file || initialOrder.scanFile || "");
        setPhysicalMoldSent(!!initialOrder.physical_mold_sent);
        setShade(initialOrder.shade || "A2");
        setOpposingBiteScan(initialOrder.opposing_bite_scan || initialOrder.opposingBiteScan || "");
        setPhysicalOpposingMoldSent(!!initialOrder.physical_opposing_mold_sent);
        setBiteRegistration(initialOrder.bite_registration || "");
        setTryInStageRequired(!!initialOrder.try_in_stage_required);
        setImplantSystem(initialOrder.implant_system || "");
        setReferencePhoto(initialOrder.reference_photo || "");
      }
    }
  }, [initialOrder]);

  // Derived patient name
  const patientName = initialOrder?.patient_name || initialOrder?.patientName || doctorCtx?.viewingPatient?.name || "Select Patient";

  // Helper check for conditional subfields
  const fabLower = fabricationType.toLowerCase();
  const showShade = ["crown", "bridge", "veneer", "implant crown"].some(t => fabLower.includes(t));
  const showOpposing = ["crown", "bridge", "implant crown"].some(t => fabLower.includes(t));
  const showBiteReg = fabLower.includes("denture");
  const showTryIn = fabLower.includes("denture");
  const showImplantSystem = fabLower.includes("implant crown");
  const showRefPhoto = fabLower.includes("veneer");

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingField(field);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await uploadLabFile(formData);
      if (field === "scan") {
        setScanFile(data.name);
        setPhysicalMoldSent(false); // upload overrides fallback
      } else if (field === "opposing") {
        setOpposingBiteScan(data.name);
        setPhysicalOpposingMoldSent(false);
      } else if (field === "ref") {
        setReferencePhoto(data.name);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("File upload failed. Please try again.");
    } finally {
      setUploadingField(null);
    }
  };

  const executeFormSubmit = (statusValue) => {
    setValidationErrors([]);

    // Construct unified payload representing current states
    const payload = {
      order_category: orderCategory,
      priority,
      notes: specialNotes,
      status: statusValue,
      patient_token: initialOrder?.patientToken || initialOrder?.patient_token || doctorCtx?.viewingPatient?.token || ""
    };

    if (orderCategory === "Prosthetic") {
      payload.fabrication_type = fabricationType;
      payload.tooth_number = toothNumber;
      payload.material = material;
      payload.scan_file = scanFile;
      payload.physical_mold_sent = physicalMoldSent;

      // Add subfields conditionally based on ruleset
      if (showShade) payload.shade = shade;
      if (showOpposing) {
        payload.opposing_bite_scan = opposingBiteScan;
        payload.physical_opposing_mold_sent = physicalOpposingMoldSent;
      }
      if (showBiteReg) payload.bite_registration = biteRegistration;
      if (showTryIn) payload.try_in_stage_required = tryInStageRequired;
      if (showImplantSystem) payload.implant_system = implantSystem;
      if (showRefPhoto) payload.reference_photo = referencePhoto;
    } else {
      payload.test_type = testType;
      payload.sample_type = sampleType;
      payload.reason_for_test = reasonForTest;
    }

    // Run unified validation ruleset
    const errors = validateLabOrderFields(payload);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (onSubmitLabOrder) {
      onSubmitLabOrder(payload);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
            {initialOrder ? `Edit Lab Case Request` : `New Lab Case Request`}
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Specify case details to send to external lab partners.</p>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
        {/* Universal Fields Block */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Universal Case details</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Read-only Patient field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Patient (Encounter)</label>
              <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-2 select-none">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                {patientName}
              </div>
            </div>

            {/* Priority dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Two-Button Toggle Category Selection */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Case Category</label>
            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-150 max-w-md">
              <button
                type="button"
                onClick={() => setOrderCategory("Prosthetic")}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  orderCategory === "Prosthetic"
                    ? "bg-white text-primary shadow-xs border border-gray-200"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Dental Prosthetics
              </button>
              <button
                type="button"
                onClick={() => setOrderCategory("Diagnostic")}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  orderCategory === "Diagnostic"
                    ? "bg-white text-secondary shadow-xs border border-gray-200"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Blood Work / Pathology
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* Conditional Layouts based on swap */}
        {orderCategory === "Prosthetic" ? (
          <div className="space-y-5 animate-fade-in">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Dental Prosthetic Specifications</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fabrication Type dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Fabrication Type *</label>
                <select
                  value={fabricationType}
                  onChange={(e) => setFabricationType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Crown">Crown</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Denture">Denture</option>
                  <option value="Veneer">Veneer</option>
                  <option value="Night guard-Retainer">Night guard / Retainer</option>
                  <option value="Implant crown">Implant crown</option>
                </select>
              </div>

              {/* Tooth Number input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Tooth Number(s) *</label>
                <input
                  type="text"
                  placeholder="e.g. 18, 17, 26 (FDI or Universal)"
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0 text-gray-350" /> Specify isolated teeth codes or quadrants.
                </p>
              </div>

              {/* Material selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Material *</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Zirconia">Zirconia</option>
                  <option value="PFM">PFM (Porcelain Fused to Metal)</option>
                  <option value="Acrylic">Acrylic</option>
                  <option value="Composite">Composite</option>
                  <option value="Metal">Metal (Gold / Cobalt-Chromium)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Digital Scan File Upload & fallback */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Digital Scan / STL file</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, "scan")}
                    disabled={physicalMoldSent}
                    className="hidden"
                    id="doc-scan-upload"
                  />
                  <label
                    htmlFor="doc-scan-upload"
                    className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      physicalMoldSent 
                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-350"
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-gray-500" />
                    {uploadingField === "scan" ? "Uploading..." : "Upload STL Scan"}
                  </label>
                  <span className="text-[10px] text-gray-550 truncate max-w-[200px]" title={scanFile}>
                    {scanFile || "No file uploaded"}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="physical-mold-check"
                    checked={physicalMoldSent}
                    onChange={(e) => {
                      setPhysicalMoldSent(e.target.checked);
                      if (e.target.checked) setScanFile(""); // clear scan if fallback checked
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <label htmlFor="physical-mold-check" className="text-xs font-bold text-gray-550 select-none cursor-pointer">
                    Physical mold sent to lab instead
                  </label>
                </div>
              </div>
            </div>

            {/* Conditionally Rendered Sub-fields */}
            {(showShade || showOpposing || showBiteReg || showTryIn || showImplantSystem || showRefPhoto) && (
              <div className="p-5 bg-gray-50/60 border border-gray-150 rounded-2xl space-y-4 animate-scale-up">
                <p className="text-[9px] font-black text-gray-450 uppercase tracking-wider">Required Specs for {fabricationType}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shade */}
                  {showShade && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Shade Match *</label>
                      <select
                        value={shade}
                        onChange={(e) => setShade(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="Bleach">Bleach Guide</option>
                      </select>
                    </div>
                  )}

                  {/* Opposing Bite Scan */}
                  {showOpposing && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Opposing Bite Scan *</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, "opposing")}
                          disabled={physicalOpposingMoldSent}
                          className="hidden"
                          id="doc-opposing-upload"
                        />
                        <label
                          htmlFor="doc-opposing-upload"
                          className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            physicalOpposingMoldSent 
                              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-gray-500" />
                          {uploadingField === "opposing" ? "Uploading..." : "Upload Opposing STL"}
                        </label>
                        <span className="text-[10px] text-gray-550 truncate max-w-[200px]" title={opposingBiteScan}>
                          {opposingBiteScan || "No file uploaded"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="opposing-mold-check"
                          checked={physicalOpposingMoldSent}
                          onChange={(e) => {
                            setPhysicalOpposingMoldSent(e.target.checked);
                            if (e.target.checked) setOpposingBiteScan("");
                          }}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                        <label htmlFor="opposing-mold-check" className="text-xs font-bold text-gray-550 select-none cursor-pointer">
                          Physical opposing mold sent instead
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Bite Registration details */}
                  {showBiteReg && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Bite Registration details *</label>
                      <input
                        type="text"
                        placeholder="e.g. Centric relation record, bite block dimensions"
                        value={biteRegistration}
                        onChange={(e) => setBiteRegistration(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Try-in Stage Boolean Toggle */}
                  {showTryIn && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Wax Try-In Stage Required?</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTryInStageRequired(true)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            tryInStageRequired
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          Yes, Required
                        </button>
                        <button
                          type="button"
                          onClick={() => setTryInStageRequired(false)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            !tryInStageRequired
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          No, Skip Try-In
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Implant system brand */}
                  {showImplantSystem && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Implant Brand / System *</label>
                      <input
                        type="text"
                        placeholder="e.g. Straumann, Nobel Biocare, Dentium"
                        value={implantSystem}
                        onChange={(e) => setImplantSystem(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Reference Photo */}
                  {showRefPhoto && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Reference Photo (Optional)</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, "ref")}
                          className="hidden"
                          id="doc-ref-upload"
                        />
                        <label
                          htmlFor="doc-ref-upload"
                          className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs text-gray-700"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-gray-500" />
                          {uploadingField === "ref" ? "Uploading..." : "Upload Photo"}
                        </label>
                        <span className="text-[10px] text-gray-550 truncate max-w-[200px]" title={referencePhoto}>
                          {referencePhoto || "No photo uploaded"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Blood Work / Pathology Details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Test Type dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Pathology Test Type *</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                >
                  <option value="PT/INR">PT/INR (Coagulation check)</option>
                  <option value="HbA1c">HbA1c (Glycated hemoglobin)</option>
                  <option value="CBC">CBC (Complete Blood Count)</option>
                  <option value="Bleeding Time">Bleeding Time</option>
                  <option value="Biopsy/Histopathology">Biopsy / Histopathology</option>
                  <option value="Hepatitis/HIV Screening">Hepatitis / HIV Screening</option>
                  <option value="Other">Other Diagnostic Panels</option>
                </select>
              </div>

              {/* Sample Type dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Sample Type *</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                >
                  <option value="Blood">Blood sample</option>
                  <option value="Tissue">Tissue / Biopsy sample</option>
                </select>
              </div>

              {/* Reason for test */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Reason for Test *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify clinical reasons or indications for pathology routing..."
                  value={reasonForTest}
                  onChange={(e) => setReasonForTest(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary resize-none placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-gray-200" />

        {/* Universal Special Notes */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Special Instructions / Notes</label>
          <textarea
            rows={3}
            placeholder="Add any extra notes or guidelines for the technician/lab partner..."
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder-gray-400"
          />
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-danger/5 border border-danger/20 rounded-2xl flex items-start gap-3 animate-scale-up">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-danger">Please fix the following validation errors before submitting:</p>
              <ul className="list-disc list-inside text-[11px] text-danger/80 mt-1.5 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Form Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-250 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          {(!initialOrder || initialOrder.status === "Draft") ? (
            <>
              <button
                type="button"
                onClick={() => executeFormSubmit("Draft")}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-255 text-gray-700 font-extrabold rounded-xl text-xs transition-all cursor-pointer border border-gray-200"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => executeFormSubmit("Pending Review")}
                className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
              >
                Submit for Review
              </button>
            </>
          ) : initialOrder.status === "Revision Requested" ? (
            <button
              type="button"
              onClick={() => executeFormSubmit("Pending Review")}
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              Resubmit for Review
            </button>
          ) : (
            <button
              type="button"
              onClick={() => executeFormSubmit(initialOrder.status)}
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              Save Specs Changes
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
