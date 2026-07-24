"use client";

import { Printer, CheckCircle, Clock, Phone, User, Calendar, Stethoscope, AlertTriangle, Shield, FileText } from "lucide-react";

export default function PrintableTokenSheet({ appointment, paymentDetails, queueNo, waitTime, isEmergency, patientProfile }) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const patientName = patientProfile?.name || appointment?.patient_name || "Patient";
  const patientToken = patientProfile?.token || appointment?.patient_token || `PT-${appointment?.patient_id || '001'}`;
  const phone = patientProfile?.phone || appointment?.patient_phone || "N/A";
  const doctorName = appointment?.doctor || appointment?.doctor_name || "Dr. Anoop Nair";
  const treatment = appointment?.treatment || appointment?.treatment_type || "General Consultation";
  const date = appointment?.date || appointment?.appointment_date || new Date().toISOString().split("T")[0];
  const time = appointment?.time || appointment?.appointment_time || "10:00 AM";

  return (
    <div className="space-y-6">
      {/* Screen Alert Banner */}
      <div className="no-print bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Check-in & Payment Successful!</h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              Your consultation pass is confirmed. Print or save this token sheet to present directly to the assistant doctor.
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4" /> Print Medical Pass (A4)
        </button>
      </div>

      {/* Printable Medical Case Pass (A4 Format Container) */}
      <div className="printable-pass-sheet bg-white rounded-3xl border-2 border-slate-900 p-8 shadow-xl space-y-6 text-slate-900 max-w-2xl mx-auto">
        
        {/* Pass Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">SMILECARE DENTAL CLINIC</h1>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Advanced Oral Health & Dental Surgery Centre • ISO 9001:2015 Certified
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ph: +91 40 2345 6789 | Email: care@smilecare.com | Web: www.smilecare.com
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-lg">
              MEDICAL CASE PASS
            </span>
            <div className="text-[10px] text-slate-500 font-bold mt-1">Date: {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        </div>

        {/* Large Queue Token Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center shadow-md">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">LIVE DOCTOR QUEUE TOKEN</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-5xl font-black text-amber-400">#{queueNo || '01'}</span>
              <span className="text-xs font-bold text-slate-300">Priority: <span className={isEmergency ? "text-rose-400 font-black" : "text-emerald-400 font-bold"}>{isEmergency ? "Emergency Triage" : "Routine Consultation"}</span></span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Estimated Wait Time: <span className="text-white font-bold">{waitTime !== null && waitTime !== undefined ? `${waitTime} Mins` : "Next in Line"}</span>
            </p>
          </div>
          <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center p-2">
            <span className="text-[9px] font-bold uppercase text-slate-400">CABIN ROOM</span>
            <span className="text-xl font-black text-white mt-0.5">ROOM 3</span>
            <span className="text-[9px] text-emerald-400 font-bold">STAGE 1</span>
          </div>
        </div>

        {/* Patient & Doctor Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PATIENT IDENTIFICATION</span>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary" /> {patientName}
            </h3>
            <p className="text-xs text-slate-600 font-bold">Token ID: <span className="text-slate-900">{patientToken}</span></p>
            <p className="text-xs text-slate-600 font-medium">Contact: {phone}</p>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONSULTING DOCTOR</span>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-primary" /> {doctorName}
            </h3>
            <p className="text-xs text-slate-600 font-bold">Department: <span className="text-slate-900">{treatment}</span></p>
            <p className="text-xs text-slate-600 font-medium">Appt Time: {date} at {time}</p>
          </div>
        </div>

        {/* Symptoms & Screening Summary */}
        <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            PATIENT DENTAL SCREENING SUMMARY
          </span>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-semibold text-slate-800 space-y-1">
            <p><span className="text-slate-500">Recorded Complaints:</span> {appointment?.symptoms || "General oral health checkup and consultation."}</p>
          </div>
        </div>

        {/* Payment Receipt Box */}
        <div className="border-2 border-dashed border-emerald-500 bg-emerald-50/50 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">OFFICIAL PAYMENT RECEIPT</span>
            <h4 className="text-sm font-black text-slate-900 mt-0.5">{paymentDetails?.category || "Consultation Fee"}</h4>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              Txn Ref: <span className="font-mono text-slate-900">{paymentDetails?.transactionId || `TXN-${Date.now().toString().slice(-6)}`}</span> • Method: <span className="font-bold">{paymentDetails?.method || "UPI"}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-md mb-1">STATUS: PAID</span>
            <div className="text-2xl font-black text-emerald-700">₹{(paymentDetails?.amount || 500).toLocaleString()}</div>
          </div>
        </div>

        {/* Signature & Instructions Line */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500 font-semibold">
          <div>
            <p>• Please present this printable ticket to the Asst. Doctor / Nurse.</p>
            <p>• Do not leave the waiting lounge when your token number is active.</p>
          </div>
          <div className="text-right border-t border-slate-400 pt-2 w-40">
            <p className="text-[10px] font-bold uppercase text-slate-600 text-center">Duty Officer / Registrar</p>
          </div>
        </div>
      </div>

      {/* Screen Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .printable-pass-sheet, .printable-pass-sheet * {
            visibility: visible;
          }
          .printable-pass-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
