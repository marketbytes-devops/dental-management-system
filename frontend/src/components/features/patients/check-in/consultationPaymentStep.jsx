"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShieldCheck, CreditCard, Wallet, Loader2, CheckCircle2, User, Stethoscope } from "lucide-react";
import client, { getConsultationFees } from "@/services/api";

export default function ConsultationPaymentStep({ appointment, symptomData, onPaymentSuccess, onBack }) {
  const [tariffs, setTariffs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("UPI"); // UPI, Card, Counter Cash
  const [submitting, setSubmitting] = useState(false);
  const [selectedFeeCategory, setSelectedFeeCategory] = useState("General Consultation");
  const [applicableAmount, setApplicableAmount] = useState(500.0);

  useEffect(() => {
    async function loadTariffs() {
      try {
        const data = await getConsultationFees();
        setTariffs(data);

        // Auto-detect applicable charge based on treatment & doctor specialty
        const treatmentLower = (appointment?.treatment || "").toLowerCase();
        const doctorLower = (appointment?.doctor || "").toLowerCase();

        if (treatmentLower.includes("follow-up") || treatmentLower.includes("followup") || treatmentLower.includes("review")) {
          setSelectedFeeCategory("Follow-up Visit");
          setApplicableAmount(data.followup_consultation_fee || 300.0);
        } else if (
          doctorLower.includes("specialist") ||
          treatmentLower.includes("root canal") ||
          treatmentLower.includes("ortho") ||
          treatmentLower.includes("surgery") ||
          treatmentLower.includes("implant")
        ) {
          setSelectedFeeCategory("Specialist Consultation");
          setApplicableAmount(data.specialist_consultation_fee || 800.0);
        } else {
          setSelectedFeeCategory("General Consultation");
          setApplicableAmount(data.general_consultation_fee || 500.0);
        }
      } catch (err) {
        console.error("Failed to load consultation tariffs:", err);
        setApplicableAmount(500.0);
      } finally {
        setLoading(false);
      }
    }
    loadTariffs();
  }, [appointment]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Package formatted symptoms string from screening questionnaire
      const symptomString = [
        symptomData?.primaryReason ? `Complaint: ${symptomData.primaryReason}` : "",
        symptomData?.painLevel !== undefined ? `Pain: ${symptomData.painLevel}/10 (${symptomData.painCharacter || 'general'})` : "",
        symptomData?.duration ? `Duration: ${symptomData.duration}` : "",
        symptomData?.affectedArea ? `Area: ${symptomData.affectedArea}` : "",
        symptomData?.symptoms?.length > 0 ? `Symptoms: ${symptomData.symptoms.join(", ")}` : "",
        symptomData?.additionalNotes ? `Notes: ${symptomData.additionalNotes}` : ""
      ].filter(Boolean).join(" | ");

      // Submit payment and register patient in live doctor queue
      const res = await client.post(`/frontdesk/appointments/${appointment.id}/pay-consultation`, {
        amount: applicableAmount,
        payment_method: paymentMethod,
        symptoms: symptomString,
        is_emergency: symptomData?.isEmergency || false
      });

      const updatedAppt = res.data;

      // Also record payment entry in ConsultationPaymentModel if counter/UPI
      try {
        await client.post("/payment/consultation", {
          appointment_id: appointment.id,
          patient_token: appointment.patient_token,
          patient_name: appointment.patient_name,
          doctor_name: appointment.doctor,
          payment_method: paymentMethod,
          amount: applicableAmount,
          status: "Paid"
        });
      } catch (payErr) {
        console.warn("Recorded payment log notice:", payErr);
      }

      // Return success data to proceed to Printable Token Sheet
      onPaymentSuccess({
        appointment: updatedAppt,
        paymentDetails: {
          amount: applicableAmount,
          category: selectedFeeCategory,
          method: paymentMethod,
          transactionId: `TXN-${Date.now().toString().slice(-6)}`,
          date: new Date().toLocaleDateString("en-IN"),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      });

    } catch (err) {
      alert(err.message || "Failed to process consultation payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-gray-500 font-semibold">Fetching active clinic consultation tariffs...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleProcessPayment} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Consultation Fee & Queue Registration
        </h3>
        <p className="text-xs text-gray-500">
          Pay your admin-configured consultation charges to instantly confirm your live queue token for Dr. {appointment?.doctor}.
        </p>
      </div>

      {/* Appointment Summary Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            {appointment?.treatment || "Consultation"}
          </div>
          <h4 className="text-base font-black text-white mt-0.5">{appointment?.doctor}</h4>
          <p className="text-xs text-slate-300 mt-1">
            Scheduled Date: <span className="font-bold text-emerald-400">{appointment?.date}</span> at <span className="font-bold text-emerald-400">{appointment?.time}</span>
          </p>
        </div>
        <div className="text-right sm:text-right w-full sm:w-auto bg-slate-800 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Selected Tariff</div>
          <div className="text-xs font-extrabold text-amber-400">{selectedFeeCategory}</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">₹{applicableAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Tariff Category Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Select Consultation Fee Category (Set by Clinic Admin)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { key: "General Consultation", label: "General Dentist Fee", amount: tariffs?.general_consultation_fee || 500.0 },
            { key: "Specialist Consultation", label: "Specialist Consultation", amount: tariffs?.specialist_consultation_fee || 800.0 },
            { key: "Follow-up Visit", label: "Follow-up Re-evaluation", amount: tariffs?.followup_consultation_fee || 300.0 }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setSelectedFeeCategory(t.key);
                setApplicableAmount(t.amount);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedFeeCategory === t.key
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="text-xs font-bold">{t.label}</div>
              <div className="text-sm font-black text-emerald-600 mt-1">₹{t.amount.toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Choose Payment Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "UPI", label: "UPI / QR Code", icon: Wallet },
            { id: "Card", label: "Debit / Credit Card", icon: CreditCard },
            { id: "Counter Cash", label: "Pay at Reception", icon: DollarSign }
          ].map((m) => {
            const IconComp = m.icon;
            const isSelected = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm font-bold"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <IconComp className="w-5 h-5" />
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Protection Disclaimer */}
      <div className="bg-blue-50 border border-blue-150 p-3 rounded-xl flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
          Upon payment confirmation, your live token ticket and digital receipt will be generated instantly. An SMS confirmation will also be sent to your registered phone number.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" /> Pay ₹{applicableAmount.toLocaleString()} & Get Token Pass →
            </>
          )}
        </button>
      </div>
    </form>
  );
}
