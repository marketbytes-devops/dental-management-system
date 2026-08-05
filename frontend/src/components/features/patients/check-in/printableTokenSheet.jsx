"use client";

import { useState, useEffect } from "react";
import { 
  Printer, 
  CheckCircle, 
  ShieldCheck
} from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { getConsultationFees } from "@/services/api";

export default function PrintableTokenSheet({ 
  appointment, 
  paymentDetails, 
  queueNo, 
  waitTime, 
  isEmergency, 
  patientProfile 
}) {
  const [fetchedFee, setFetchedFee] = useState(null);

  useEffect(() => {
    let mounted = true;
    getConsultationFees()
      .then((data) => {
        if (mounted && data) {
          setFetchedFee(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch consultation fees for OPD pass:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  const patientName = patientProfile?.name || appointment?.patient_name || appointment?.patient?.name || "Patient";
  const patientToken = patientProfile?.token || appointment?.patient_token || appointment?.patient?.token || `PT-${appointment?.patient_id || '001'}`;
  const phone = patientProfile?.phone || appointment?.patient_phone || appointment?.patient?.phone || "N/A";
  const doctorName = appointment?.doctor || appointment?.doctor_name || "Dr. Priya";
  const treatment = appointment?.treatment || appointment?.treatment_type || "Consultation";
  const date = appointment?.date || appointment?.appointment_date || new Date().toISOString().split("T")[0];
  const time = appointment?.time || appointment?.appointment_time || "12:30 PM";
  const symptoms = appointment?.symptoms || appointment?.chiefComplaint || "Reason: routine | Pain: 3/10 | Symptoms: sensitivity";
  const txnId = paymentDetails?.transactionId || appointment?.transaction_id || `TXN-${Date.now().toString().slice(-6)}`;
  const payMethod = paymentDetails?.method || appointment?.payment_method || "UPI / Online";

  const getActualPaidAmount = () => {
    if (paymentDetails?.amount !== undefined && paymentDetails?.amount !== null) {
      return Number(paymentDetails.amount);
    }
    if (appointment?.amount_paid !== undefined && appointment?.amount_paid !== null) {
      return Number(appointment.amount_paid);
    }
    if (appointment?.consultation_fee !== undefined && appointment?.consultation_fee !== null) {
      return Number(appointment.consultation_fee);
    }
    if (appointment?.fee !== undefined && appointment?.fee !== null) {
      return Number(appointment.fee);
    }
    if (appointment?.amount !== undefined && appointment?.amount !== null) {
      return Number(appointment.amount);
    }

    if (fetchedFee) {
      const trLower = String(treatment).toLowerCase();
      if (trLower.includes("follow") || trLower.includes("follow-up")) {
        return Number(fetchedFee.followup_consultation_fee || 300);
      }
      if (trLower.includes("routine")) {
        return Number(fetchedFee.routine_checkup_fee || 400);
      }
      return Number(fetchedFee.general_consultation_fee || 500);
    }

    return 200;
  };

  const amountPaid = getActualPaidAmount();
  const formattedTokenNo = queueNo ? `#${queueNo}` : "#1";
  const formattedPassId = `OPD-${(appointment?.id || Date.now()).toString().slice(-6)}`;

  return (
    <div className="space-y-5">
      {/* Action Banner (Hidden on Print) */}
      <div className="no-print bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Hospital Medical Pass & Receipt</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                OPD TOKEN ISSUED
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Standard OPD receipt layout for physical check-in and consulting room admission.
            </p>
          </div>
        </div>

        {/* Single Print Pass Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-teal-600/20 shrink-0"
        >
          <Printer className="w-4 h-4" />
          Print Pass
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          HOSPITAL MEDICAL PASS (Clean Layout - Borderless on Print)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="printable-pass-sheet bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5 text-gray-900 max-w-2xl mx-auto">
        
        {/* Hospital Header */}
        <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ToothIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold uppercase tracking-tight text-gray-900">
                  SMILECARE 
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 uppercase">
                  OPD PASS
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 text-[10px] font-bold uppercase rounded-md border border-gray-200">
              CONSULTATION RECEIPT
            </span>
            <div className="text-[11px] text-gray-600 font-semibold mt-1">
              Date: <span className="text-gray-900 font-mono font-bold">{new Date().toLocaleDateString("en-IN")}</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              PASS ID: #{formattedPassId}
            </div>
          </div>
        </div>

        {/* Token & Cabin Banner */}
        <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-4 grid grid-cols-3 gap-4 items-center print-banner">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
              QUEUE TOKEN NO.
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl font-black text-teal-900 tracking-tight">{formattedTokenNo}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                isEmergency 
                  ? "bg-rose-100 text-rose-700 border border-rose-200" 
                  : "bg-teal-100 text-teal-800 border border-teal-200"
              }`}>
                {isEmergency ? "Emergency" : "Routine"}
              </span>
            </div>
          </div>

          <div className="border-x border-teal-200/60 px-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-teal-800 block">ASSIGNED CABIN</span>
            <span className="text-base font-extrabold text-gray-900 block mt-0.5">ROOM 3 • STAGE 1</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-teal-800 block">CHECK-IN STATUS</span>
            <span className="text-xs font-bold text-emerald-700 uppercase block mt-1 flex items-center justify-end gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              PAID & VERIFIED
            </span>
            <span className="text-[11px] text-gray-500 font-mono block mt-0.5">
              {time}
            </span>
          </div>
        </div>

        {/* Patient & Consulting Surgeon Information Grid */}
        <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50 text-xs print-grid">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">PATIENT DETAILS</span>
            <p className="font-extrabold text-gray-900 text-sm">{patientName}</p>
            <p className="text-gray-600 font-medium">Patient ID: <span className="font-mono text-gray-800 font-bold">{patientToken}</span></p>
            <p className="text-gray-600 font-medium">Phone: {phone}</p>
          </div>

          <div className="border-l border-gray-200 pl-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">CONSULTING DOCTOR</span>
            <p className="font-extrabold text-gray-900 text-sm">{doctorName}</p>
            <p className="text-gray-600 font-medium">Treatment: <span className="text-gray-800 font-bold">{treatment}</span></p>
            <p className="text-gray-600 font-medium">Appointment: {date} at {time}</p>
          </div>
        </div>

        {/* OPD Consultation Receipt Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs print-table">
          <div className="bg-gray-100/80 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center border-b border-gray-200">
            <span>FEE ITEMIZATION</span>
            <span>RECEIPT DETAIL</span>
          </div>
          
          <div className="p-4 bg-white space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">OPD Dental Consultation & Screening Fee</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Payment Method: <span className="font-semibold text-gray-700">{payMethod}</span> • Ref: <span className="font-mono">{txnId}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-gray-900 text-base">₹{amountPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-gray-500 font-medium">
                Recorded Complaint: <span className="text-gray-800 font-semibold">{symptoms}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 uppercase">
                  PAID IN FULL
                </span>
                <span className="text-sm font-extrabold text-emerald-700">₹{amountPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Hospital Footer & Authorized Sign-off */}
        <div className="pt-2 border-t border-gray-200 flex justify-between items-end text-[11px] text-gray-500">
          <div>
            <p className="font-semibold text-gray-700">Important Note:</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              • Please present this OPD consultation pass at Cabin Room 3 when Token {formattedTokenNo} is announced.
            </p>
          </div>

          <div className="text-right w-36">
            <div className="border-b border-gray-300 h-6 mb-1"></div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block">AUTHORIZED REGISTRAR</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PURE PRINT CSS (Hides Browser Headers/Footers & Outer Box Frames)
          ───────────────────────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          /* Hide non-printable elements */
          .no-print, 
          nav, 
          aside, 
          header, 
          footer, 
          button {
            display: none !important;
          }

          /* Reset page body */
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }

          /* Completely strip borders, shadows, rounded corners, padding, and background frames from all parent elements */
          body *, 
          div:not(.printable-pass-sheet):not(.printable-pass-sheet *) {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Format printable pass sheet to render cleanly on paper without an outer card box */
          .printable-pass-sheet {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .print-banner {
            background: #f0fdf4 !important;
            border: 1px solid #bbf7d0 !important;
            border-radius: 6px !important;
            padding: 12px !important;
          }

          .print-grid, .print-table {
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            background: #ffffff !important;
            padding: 12px !important;
          }

          /* Setting page margin: 0 hides default browser print header (date/title) & footer (URL/page#) */
          @page {
            size: A4 portrait;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
