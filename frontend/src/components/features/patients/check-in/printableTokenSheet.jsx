"use client";

import { useState } from "react";
import { 
  Printer, 
  CheckCircle, 
  Clock, 
  Phone, 
  User, 
  Calendar, 
  Stethoscope, 
  FileText, 
  QrCode, 
  Award, 
  HeartPulse, 
  FileCheck,
  Activity,
  ShieldCheck
} from "lucide-react";

export default function PrintableTokenSheet({ 
  appointment, 
  paymentDetails, 
  queueNo, 
  waitTime, 
  isEmergency, 
  patientProfile 
}) {
  const [printFormat, setPrintFormat] = useState("full"); // "full" (A4 Full Page) or "half" (A5 Half Page)

  const handlePrint = (format) => {
    setPrintFormat(format);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const patientName = patientProfile?.name || appointment?.patient_name || appointment?.patient?.name || "Patient";
  const patientToken = patientProfile?.token || appointment?.patient_token || appointment?.patient?.token || `PT-${appointment?.patient_id || '001'}`;
  const phone = patientProfile?.phone || appointment?.patient_phone || appointment?.patient?.phone || "N/A";
  const doctorName = appointment?.doctor || appointment?.doctor_name || "Dr. Anoop Nair";
  const treatment = appointment?.treatment || appointment?.treatment_type || "General Consultation";
  const date = appointment?.date || appointment?.appointment_date || new Date().toISOString().split("T")[0];
  const time = appointment?.time || appointment?.appointment_time || "10:00 AM";
  const symptoms = appointment?.symptoms || "General oral health checkup and consultation.";
  const txnId = paymentDetails?.transactionId || `TXN-${Date.now().toString().slice(-6)}`;
  const amountPaid = paymentDetails?.amount || 500;
  const payMethod = paymentDetails?.method || "UPI / Online";

  return (
    <div className="space-y-6">
      {/* Screen Alert Banner & Format Selection */}
      <div className="no-print bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-600/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-emerald-950">Medical Pass & Queue Token Ready</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 uppercase">
                Official Case Pass
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              Select your preferred print layout: a prestigious Full-Page (A4) case pass or a Compact Half-Page (A5) slip.
            </p>
          </div>
        </div>

        {/* Print Option Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => handlePrint("full")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm border ${
              printFormat === "full"
                ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20"
                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print Full Page (A4)
          </button>

          <button
            type="button"
            onClick={() => handlePrint("half")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm border ${
              printFormat === "half"
                ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20"
                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            Print Half Page (A5)
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          FULL PAGE MEDICAL CASE PASS (A4 Layout)
          ───────────────────────────────────────────────────────────────────────────── */}
      {printFormat === "full" ? (
        <div className="printable-pass-sheet full-page-pass bg-white rounded-3xl border-2 border-slate-900 p-8 shadow-xl space-y-6 text-slate-900 max-w-3xl mx-auto">
          
          {/* Top Accredited Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
            <div className="flex gap-3.5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <HeartPulse className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                    SMILECARE DENTAL CLINIC
                  </h1>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    ISO 9001:2015
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  Advanced Oral Surgery, Orthodontics & Dental Surgery Centre
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  123 Healthcare Blvd, Medical District • Ph: +91 40 2345 6789 • Web: www.smilecare.com
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">
                MEDICAL CASE PASS (A4)
              </span>
              <div className="text-[11px] text-slate-600 font-bold mt-2">
                Issue Date: <span className="font-mono text-slate-900">{new Date().toLocaleDateString("en-IN")}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                PASS ID: #SCP-{Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>

          {/* Large Live Queue Token & Stage Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center shadow-md">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                OFFICIAL DOCTOR QUEUE TOKEN
              </span>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="text-6xl font-black text-amber-400 tracking-tight">#{queueNo || '01'}</span>
                <span className="text-xs font-bold text-slate-300">
                  Priority Status:{" "}
                  <span className={isEmergency ? "text-rose-400 font-black" : "text-emerald-400 font-extrabold"}>
                    {isEmergency ? "EMERGENCY TRIAGE" : "ROUTINE CONSULTATION"}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                Estimated Wait Time:{" "}
                <span className="text-white font-bold">
                  {waitTime !== null && waitTime !== undefined ? `${waitTime} Mins` : "Next in Line"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center p-2.5">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">ASSIGNED CABIN</span>
                <span className="text-2xl font-black text-white mt-1">ROOM 3</span>
                <span className="text-[10px] text-emerald-400 font-extrabold mt-0.5">STAGE 1</span>
              </div>

              {/* Decorative QR/Barcode Token Visual */}
              <div className="hidden sm:flex w-24 h-24 bg-white text-slate-900 rounded-2xl flex-col items-center justify-center p-2 border border-slate-300">
                <QrCode className="w-14 h-14 text-slate-900" />
                <span className="text-[8px] font-mono font-bold uppercase mt-1 tracking-tighter">
                  {patientToken}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Patient & Doctor Identification Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PATIENT IDENTIFICATION
              </span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> {patientName}
              </h3>
              <p className="text-xs text-slate-700 font-bold">
                Patient Token: <span className="font-mono text-slate-900">{patientToken}</span>
              </p>
              <p className="text-xs text-slate-700 font-medium">Contact Phone: {phone}</p>
              <p className="text-xs text-slate-500 font-medium">Check-In Time: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>

            <div className="space-y-1.5 border-l-2 border-slate-200 pl-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                CONSULTING DENTAL SURGEON
              </span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" /> {doctorName}
              </h3>
              <p className="text-xs text-slate-700 font-bold">
                Department: <span className="text-slate-900">{treatment}</span>
              </p>
              <p className="text-xs text-slate-700 font-medium">
                Appointment Date: {date} at {time}
              </p>
              <p className="text-xs text-emerald-700 font-bold">Status: Active Consultation Pass</p>
            </div>
          </div>

          {/* Screening & Complaint Summary */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                PATIENT DENTAL SCREENING & TRIAGE COMPLAINTS
              </span>
              <span className="text-[10px] font-bold text-slate-400">Verified at Reception</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 leading-relaxed">
              <p><span className="text-slate-500">Recorded Symptoms:</span> {symptoms}</p>
            </div>
          </div>

          {/* Payment Receipt Banner */}
          <div className="border-2 border-dashed border-emerald-500 bg-emerald-50/60 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                OFFICIAL CONSULTATION PAYMENT RECEIPT
              </span>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">{treatment} Charge</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Txn Ref: <span className="font-mono text-slate-900 font-bold">{txnId}</span> • Method: <span className="font-bold text-slate-800">{payMethod}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg mb-1 shadow-sm">
                STATUS: PAID
              </span>
              <div className="text-3xl font-black text-emerald-700">₹{amountPaid.toLocaleString()}</div>
            </div>
          </div>

          {/* Full-Page Exclusive: Dentist Clinical Examination & Prescription Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                CLINICAL EXAMINATION & DENTAL PRESCRIPTION RECORD (DOCTOR USE)
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Cabin Room 3 Case Notes</span>
            </div>
            <div className="p-4 bg-white divide-y divide-slate-100">
              <div className="grid grid-cols-4 gap-4 pb-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">BLOOD PRESSURE</span>
                  <div className="mt-1 h-6 border-b border-slate-300 font-mono text-slate-700">___ / ___ mmHg</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">PULSE / VITALS</span>
                  <div className="mt-1 h-6 border-b border-slate-300 font-mono text-slate-700">______ bpm</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">FDI TOOTH NO.</span>
                  <div className="mt-1 h-6 border-b border-slate-300 font-mono text-slate-700"># ____________</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">ALLERGY CHECK</span>
                  <div className="mt-1 h-6 border-b border-slate-300 font-mono text-slate-700">NKA / Tested</div>
                </div>
              </div>

              <div className="pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  DIAGNOSIS / CLINICAL OBSERVATIONS & PRESCRIPTION
                </span>
                <div className="space-y-4 pt-1">
                  <div className="border-b border-slate-200 h-6"></div>
                  <div className="border-b border-slate-200 h-6"></div>
                  <div className="border-b border-slate-200 h-6"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Official Signatures & Instructions */}
          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end text-[11px] text-slate-600 font-medium">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">Important Patient Instructions:</p>
              <p>• Please present this physical A4 Medical Case Pass to the Assistant Doctor or Cabin Nurse.</p>
              <p>• Keep this sheet intact for prescription recording and pharmacy dispensing.</p>
              <p>• Do not leave the waiting lounge when your Token #{queueNo || '01'} is active on cabin screens.</p>
            </div>

            <div className="flex gap-8 text-right">
              <div className="text-center w-36">
                <div className="border-b border-slate-400 h-8 mb-1.5"></div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Duty Officer / Registrar</span>
              </div>
              <div className="text-center w-36">
                <div className="border-b border-slate-400 h-8 mb-1.5"></div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Consulting Dental Surgeon</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────────────────
           HALF PAGE MEDICAL CASE PASS (A5 Compact Layout)
           ───────────────────────────────────────────────────────────────────────────── */
        <div className="printable-pass-sheet half-page-pass bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-xl space-y-4 text-slate-900 max-w-2xl mx-auto">
          
          {/* Compact Top Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
                    SMILECARE DENTAL CLINIC
                  </h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    A5 COMPACT PASS
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold">
                  Ph: +91 40 2345 6789 • Issue Date: {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-md">
                MEDICAL PASS (HALF-PAGE)
              </span>
              <div className="text-[10px] text-slate-500 font-mono font-bold mt-1">
                {patientToken}
              </div>
            </div>
          </div>

          {/* Compact 3-Column Token & Assignment Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-4 grid grid-cols-3 gap-3 items-center">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                QUEUE TOKEN NO.
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl font-black text-amber-400 tracking-tight">#{queueNo || '01'}</span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase">
                  {isEmergency ? "EMERGENCY" : "ROUTINE"}
                </span>
              </div>
            </div>

            <div className="border-x border-slate-700 px-3">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">CABIN & STAGE</span>
              <span className="text-base font-black text-white block mt-0.5">ROOM 3 • STAGE 1</span>
              <span className="text-[10px] text-slate-300 font-medium">
                Wait Time: {waitTime !== null && waitTime !== undefined ? `${waitTime} Mins` : "Next in line"}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">STATUS</span>
              <span className="text-xs font-black text-emerald-400 uppercase block mt-0.5">
                CONSULTATION PAID
              </span>
              <span className="text-[11px] text-white font-mono font-bold">
                ₹{amountPaid.toLocaleString()} ({payMethod})
              </span>
            </div>
          </div>

          {/* Compact Patient & Doctor Strip */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">PATIENT DETAIL</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{patientName}</p>
              <p className="text-slate-600 font-medium">ID: {patientToken} • Ph: {phone}</p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">CONSULTING DOCTOR</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{doctorName}</p>
              <p className="text-slate-600 font-medium">{treatment} • {date} at {time}</p>
            </div>
          </div>

          {/* Compact Screening & Complaint Strip */}
          <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-500">Screening Complaint: </span>
            <span className="text-slate-800 font-semibold">{symptoms}</span>
          </div>

          {/* Compact Footer Sign-off */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Please present this slip to Room 3 assistant nurse upon token call.</span>
            <div className="text-right w-32 border-t border-slate-400 pt-1 mt-1">
              <span className="text-[9px] font-bold uppercase text-slate-600">Duty Registrar / Officer</span>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ROBUST PRINT STYLES FOR CRISP FULL-PAGE / HALF-PAGE MEDICAL PASS
          ───────────────────────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .printable-pass-sheet, .printable-pass-sheet * {
            visibility: visible !important;
          }
          .printable-pass-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: white !important;
          }
          .half-page-pass {
            max-height: 140mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .full-page-pass {
            min-height: 250mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
