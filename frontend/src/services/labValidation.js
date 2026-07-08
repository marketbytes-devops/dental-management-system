/**
 * Shared validation ruleset for Lab Orders (Dental Prosthetics and Pathology/Blood Work).
 * Reused by both the doctor-facing LabOrderForm and the lab technician's dashboard.
 */
export function validateLabOrderFields(order) {
  if (!order) return [];
  const missing = [];
  const category = order.order_category || order.orderCategory || "Prosthetic";

  if (category === "Prosthetic" || category === "Dental Prosthetics") {
    // 1. Always required Dental Prosthetics fields
    if (!order.tooth_number && !order.tooth && !order.toothQuadrant) {
      missing.push("Tooth Number(s)");
    }
    
    const fabType = (order.fabrication_type || order.prostheticType || order.item || "").toLowerCase();
    if (!fabType) {
      missing.push("Fabrication Type");
    }
    
    if (!order.material) {
      missing.push("Material");
    }
    
    // Scan file upload OR physical mold fallback check
    const hasScanFile = !!(order.scan_file || order.scanFile);
    const hasPhysicalMold = !!(order.physical_mold_sent || order.physicalMoldSent);
    if (!hasScanFile && !hasPhysicalMold) {
      missing.push("Scan file or Physical mold fallback");
    }

    // 2. Conditionally required Dental Prosthetics fields
    // Shade — Crown, Bridge, Veneer, Implant crown
    if (["crown", "bridge", "veneer", "implant crown"].some(t => fabType.includes(t))) {
      if (!order.shade) {
        missing.push("Shade");
      }
    }

    // Opposing scan — Crown, Bridge, Implant crown
    if (["crown", "bridge", "implant crown"].some(t => fabType.includes(t))) {
      const hasOpposingScan = !!(order.opposing_bite_scan || order.opposingBiteScan);
      const hasOpposingPhysical = !!(order.physical_opposing_mold_sent || order.physicalOpposingMoldSent);
      if (!hasOpposingScan && !hasOpposingPhysical) {
        missing.push("Opposing bite scan or Physical mold fallback");
      }
    }

    // Bite registration — Denture
    if (fabType.includes("denture")) {
      if (!order.bite_registration && !order.biteRegistration) {
        missing.push("Bite Registration details");
      }
      
      // Try-in stage required (boolean Yes/No toggle)
      const tryInVal = order.try_in_stage_required !== undefined ? order.try_in_stage_required : order.tryInStageRequired;
      if (tryInVal === undefined || tryInVal === null || tryInVal === "") {
        missing.push("Try-in stage option selection");
      }
    }

    // Implant system/brand — Implant crown
    if (fabType.includes("implant crown")) {
      if (!order.implant_system && !order.implantSystem) {
        missing.push("Implant brand / system");
      }
    }
  } else {
    // 3. Always required Blood Work / Pathology fields
    if (!order.test_type && !order.testType) {
      missing.push("Test Type");
    }
    
    if (!order.sample_type && !order.sampleType) {
      missing.push("Sample Type");
    }
    
    if (!order.reason_for_test && !order.reasonForTest) {
      missing.push("Reason for Test");
    }
  }

  return missing;
}
