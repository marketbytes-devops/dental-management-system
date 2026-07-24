"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, ChevronRight, ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import client, { getDoctorLeaves, getAvailableDoctors, createAppointment, createPaymentOrder, verifyPayment, getConsultationFees } from "@/services/api";
import PrintableTokenSheet from "@/components/features/patients/check-in/printableTokenSheet";

const VISIT_REASONS = [
  "Consultation",
  "Routine check-up",
  "Follow-up checkup"
];

const SPECIALTY_DESCRIPTIONS = {
  "General Dentistry": "Focuses on routine cleanings, fillings, checkups, and general oral health maintenance.",
  "Orthodontics": "Specializes in correcting misaligned teeth, bite problems, braces, and clear aligners.",
  "Endodontics": "Specializes in root canal treatments and treating issues with the tooth pulp/nerve.",
  "Periodontics": "Focuses on diagnosing and treating gum diseases, deep scaling, and dental implants.",
  "Prosthodontics": "Specializes in replacing missing teeth with crowns, bridges, veneers, or dentures.",
  "Pediatric Dentistry": "Dedicated to the oral health of children from infancy through the teen years.",
  "Oral Surgery": "Specializes in complex extractions, wisdom teeth removal, and surgical jaw treatments."
};

const INITIAL_FORM = {
  doctor: "",
  treatment: "Consultation",
  date: "",
  time: "",
  notes: "",
};

export default function BookAppointmentModal({ patientId, initialData, onClose, onBook }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    date: initialData?.date || "",
    time: initialData?.time || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const [doctorsLoaded, setDoctorsLoaded] = useState(false);

  // Track if we are auto-submitting from a redirect
  const [autoSubmitting, setAutoSubmitting] = useState(!!initialData?.autoSubmit);
  const [createdApptId, setCreatedApptId] = useState(null);
  // Payment & Tariff state
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const [tariffs, setTariffs] = useState(null);
  const [applicableAmount, setApplicableAmount] = useState(500.0);
  const [selectedFeeCategory, setSelectedFeeCategory] = useState("General Consultation");
  const [createdApptObj, setCreatedApptObj] = useState(null);
  const [queueNo, setQueueNo] = useState(1);
  const [waitTime, setWaitTime] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPrintablePass, setShowPrintablePass] = useState(false);

  useEffect(() => {
    const fetchDoctorsAndTariffs = async () => {
      setDoctorsLoaded(false);
      try {
        // Fetch doctors
        const data = await getAvailableDoctors();
        setDoctors(data);

        // Fetch clinic consultation tariffs
        try {
          const tariffData = await getConsultationFees();
          setTariffs(tariffData);
        } catch (tErr) {
          console.warn("Could not fetch consultation tariffs:", tErr);
        }
      } catch (e) {
        console.error("Failed to fetch doctors:", e);
        setDoctors([]);
      } finally {
        setDoctorsLoaded(true);
      }
    };
    fetchDoctorsAndTariffs();
  }, []);

  // Update tariff based on doctor specialty / treatment reason
  useEffect(() => {
    if (!tariffs) return;
    const doctorLower = (form.doctor || "").toLowerCase();
    const treatmentLower = (form.treatment || "").toLowerCase();

    if (treatmentLower.includes("follow-up") || treatmentLower.includes("followup")) {
      setSelectedFeeCategory("Follow-up Visit");
      setApplicableAmount(tariffs.followup_consultation_fee || 300.0);
    } else if (
      doctorLower.includes("specialist") ||
      treatmentLower.includes("root canal") ||
      treatmentLower.includes("ortho") ||
      treatmentLower.includes("surgery")
    ) {
      setSelectedFeeCategory("Specialist Consultation");
      setApplicableAmount(tariffs.specialist_consultation_fee || 800.0);
    } else {
      setSelectedFeeCategory("General Consultation");
      setApplicableAmount(tariffs.general_consultation_fee || 500.0);
    }
  }, [form.doctor, form.treatment, tariffs]);

  // Pre-select doctor if initialData has a doctorId
  useEffect(() => {
    if (initialData?.doctorId && doctorsLoaded && !form.doctor) {
      const doctorObj = doctors.find(d => d.id.toString() === initialData.doctorId.toString());
      if (doctorObj) {
        setForm(prev => ({ ...prev, doctor: doctorObj.name }));
        if (initialData.autoSubmit) {
          // If autoSubmit is true and we have all data, auto trigger submit
          handleAutoSubmit(doctorObj.name);
        }
      } else if (initialData.autoSubmit) {
        alert("The selected doctor is not available on this date. Please select a different slot.");
        setAutoSubmitting(false);
      }
    }
  }, [initialData, doctors, form.doctor, doctorsLoaded]);

  useEffect(() => {
    const fetchDoctorLeaves = async () => {
      if (!form.doctor) {
        setDoctorLeaves([]);
        return;
      }
      try {
        const data = await getDoctorLeaves(form.doctor);
        setDoctorLeaves(data);
      } catch (e) {
        console.error("Failed to fetch doctor leaves:", e);
      }
    };
    fetchDoctorLeaves();
  }, [form.doctor]);

  useEffect(() => {
    if (form.date && form.doctor && doctorLeaves.length > 0) {
      const selectedDate = new Date(form.date);
      selectedDate.setHours(0, 0, 0, 0);

      const isOnLeave = doctorLeaves.some(leave => {
        const start = new Date(leave.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.end_date);
        end.setHours(0, 0, 0, 0);
        return selectedDate >= start && selectedDate <= end;
      });

      if (isOnLeave) {
        alert(`${form.doctor} is on leave on this day. Please select another date.`);
        setForm(prev => ({ ...prev, date: "", time: "" }));
      }
    }
  }, [form.date, doctorLeaves, form.doctor]);

  const handleAutoSubmit = async (doctorName) => {
    if (!patientId) {
      alert("Patient profile not loaded. Please try again.");
      setAutoSubmitting(false);
      return;
    }

    setStep(3); // Go to confirm step implicitly
    setSubmitting(true);
    try {
      const data = await createAppointment({
        patient_id: patientId,
        doctor_name: doctorName,
        appointment_date: initialData.date,
        appointment_time: initialData.time,
        treatment_type: "Consultation",
        status: "Confirmed",
        priority: "Routine",
        symptoms: null
      });

      setSubmitting(false);
      setAutoSubmitting(false);
      setCreatedApptId(data.id);
      setStep(4);

      const newAppt = {
        id: data.id,
        doctor: data.doctor_name,
        treatment: data.treatment_type,
        date: data.appointment_date,
        time: data.appointment_time,
        status: data.status,
        notes: data.symptoms || "",
      };
      onBook?.(newAppt);
    } catch (err) {
      alert(err.message || "An error occurred during automatic booking.");
      setSubmitting(false);
      setAutoSubmitting(false);
      setStep(1);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const isPastTime = (time, selectedDate) => {
    // If no date is selected, don't disable the slot
    if (!selectedDate) return false;

    // Only check past time if selected date is today
    if (selectedDate !== today) return false;

    const now = new Date();

    // Example: "10:30 AM"
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    // Convert 12-hour format to 24-hour format
    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    // Create today's slot time
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);

    // Return true if slot time has already passed
    return slotDate <= now;
  };

  const selectedDoctorObj = doctors.find((d) => d.name === form.doctor);
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDoctorObj && form.date) {
        try {
          const { getDoctorAvailableSlots } = await import("@/services/api");
          const data = await getDoctorAvailableSlots(selectedDoctorObj.id, form.date);
          setTimeSlots(data.available_slots || []);
        } catch (e) {
          console.error("Failed to fetch slots:", e);
          setTimeSlots([]);
        }
      } else {
        setTimeSlots([]);
      }
    };
    fetchSlots();
  }, [selectedDoctorObj, form.date]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const nextStep = () => {
    if (step === 1 && !form.doctor) {
      setErrors({ doctor: "Please select a doctor." });
      return;
    }
    if (step === 2) {
      const errs = {};
      if (!form.date) errs.date = "Please pick a date.";
      if (!form.time) errs.time = "Please select a time slot.";
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
    }
    setErrors({});
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setErrors({});
    setStep(prev => prev - 1);
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!form.treatment) {
      setErrors({ treatment: "Please select a visit reason." });
      return;
    }

    setSubmitting(true);
    try {
      const data = await createAppointment({
        patient_id: patientId,
        doctor_name: form.doctor,
        appointment_date: form.date,
        appointment_time: form.time,
        treatment_type: form.treatment,
        status: "Confirmed",
        priority: "Routine",
        symptoms: form.notes || null
      });

      setSubmitting(false);
      setCreatedApptId(data.id);
      setCreatedApptObj(data);
      setStep(4); // Success & Payment step

      const newAppt = {
        id: data.id,
        doctor: data.doctor_name,
        treatment: data.treatment_type,
        date: data.appointment_date,
        time: data.appointment_time,
        status: data.status,
        notes: data.symptoms || "",
      };
      onBook?.(newAppt);

    } catch (err) {
      alert(err.message || "An error occurred during booking.");
      setSubmitting(false);
    }
  }

  const [counterPendingNotice, setCounterPendingNotice] = useState(false);

  const finalizePaymentAndQueue = async (methodName = "Online Payment") => {
    if (methodName === "Counter Payment") {
      setCounterPendingNotice(true);
      return;
    }

    try {
      // Complete consultation payment and checkin registration on backend
      const payRes = await client.post(`/frontdesk/appointments/${createdApptId}/pay-consultation`, {
        amount: applicableAmount,
        payment_method: methodName,
        symptoms: form.notes || "Consultation booking screening.",
        is_emergency: false
      });

      const updated = payRes.data;
      setCreatedApptObj(updated);

      // Fetch live queue details if applicable
      try {
        const queueRes = await client.get("/frontdesk/queue");
        const queueData = queueRes.data;
        const currentAppt = queueData.find(q => q.id === createdApptId);
        if (currentAppt) {
          const doctorQueue = queueData.filter(q => q.doctor_name === currentAppt.doctor_name);
          const index = doctorQueue.findIndex(q => q.id === createdApptId);
          setQueueNo(index >= 0 ? index + 1 : 1);
          setWaitTime(currentAppt.wait_time_estimate || 0);
        }
      } catch (qErr) {
        console.warn("Queue fetch notice:", qErr);
      }

      setPaymentDetails({
        amount: applicableAmount,
        category: selectedFeeCategory,
        method: methodName,
        transactionId: `TXN-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString("en-IN")
      });

      setPaymentState("success");
      setShowPrintablePass(true);
    } catch (err) {
      console.error("Finalize payment error:", err);
      setPaymentState("success");
      setShowPrintablePass(true);
    }
  };

  const handlePayNow = async () => {
    if (!createdApptId) return;
    setPaymentState("loading");
    setPaymentError("");

    try {
      // Step 1: Create order on backend → get Razorpay order details
      const order = await createPaymentOrder(createdApptId);

      // Step 2: Dynamically load the Razorpay checkout script
      await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(script);
      });

      // Step 3: Open the Razorpay payment popup
      const patientName =
        typeof window !== "undefined"
          ? localStorage.getItem("patient_name") || "Patient"
          : "Patient";

      await new Promise((resolve, reject) => {
        const options = {
          key: order.key_id,
          amount: Math.round(applicableAmount * 100), // amount in paise
          currency: order.currency,
          name: "SmileCare Dental Clinic",
          description: `${selectedFeeCategory} - Booking Charge`,
          order_id: order.razorpay_order_id,
          prefill: {
            name: patientName,
          },
          theme: { color: "#0d9488" },
          modal: {
            ondismiss: () => {
              setPaymentState("idle");
              resolve();
            },
          },
          handler: async (response) => {
            try {
              // Verify signature
              await verifyPayment({
                appointment_id: createdApptId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await finalizePaymentAndQueue("Razorpay Online");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    } catch (err) {
      setPaymentState("error");
      setPaymentError(err.message || "Payment could not be completed. Please try again.");
    }
  };

  if (autoSubmitting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-700">Finalizing your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget && step !== 4) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        {step !== 4 && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Book Appointment
              </h2>
              <p className="text-xs text-gray-500 mt-1">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {step !== 4 && (
          <div className="h-1 w-full bg-gray-100 shrink-0">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Select Doctor */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-semibold text-gray-800 mb-4">Select a Doctor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {doctors.map((d) => {
                  const isAvailable = d.status === "Available" || d.status === "On Duty";
                  return (
                    <button
                      key={d.id || d.name}
                      onClick={() => {
                        handleChange("doctor", d.name);
                        setErrors({});
                      }}
                      disabled={!isAvailable}
                      className={`text-left p-4 rounded-xl border transition-all ${form.doctor === d.name
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
                        } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="font-bold text-gray-900">{d.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{d.specialty}</div>
                      <div className="text-xs text-primary mt-2">
                        {SPECIALTY_DESCRIPTIONS[d.specialty] || "Specialized dental care."}
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.doctor && <p className="text-danger text-sm font-semibold">{errors.doctor}</p>}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {selectedDoctorObj?.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedDoctorObj?.name}</h4>
                  <p className="text-xs text-gray-500">{selectedDoctorObj?.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    min={today}
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Time</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {timeSlots.map((slot) => {
                      const pastTime = isPastTime(slot.time, form.date);

                      // Disable if slot is full OR time has already passed
                      const isDisabled = slot.is_full || pastTime;

                      return (
                        <button
                          key={slot.time}
                          disabled={isDisabled}
                          onClick={() => handleChange("time", slot.time)}
                          className={`py-2 text-sm font-semibold rounded-lg border transition-all ${isDisabled
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : form.time === slot.time
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-200 hover:border-primary"
                            }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                  {errors.time && <p className="mt-1 text-xs text-danger">{errors.time}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm Details */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Appointment Summary</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-semibold text-gray-900">{form.doctor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-gray-900">{form.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-semibold text-gray-900">{form.time}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Visit Reason <span className="text-danger">*</span></label>
                <select
                  value={form.treatment}
                  onChange={(e) => handleChange("treatment", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {VISIT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.treatment && <p className="mt-1 text-xs text-danger">{errors.treatment}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any specific symptoms?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Success / Tariff Payment & Printable Medical Pass */}
          {step === 4 && (
            counterPendingNotice ? (
              <div className="flex flex-col items-center text-center py-6 animate-fadeIn space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Appointment Confirmed — Payment Pending</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    Your appointment with <span className="font-bold text-gray-800">{form.doctor}</span> on <span className="font-bold text-gray-800">{form.date} at {form.time}</span> is reserved.
                  </p>
                </div>

                <div className="w-full max-w-md bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> Counter Payment Required for Medical Pass
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Please pay your consultation charge of <span className="font-bold">₹{applicableAmount.toLocaleString()}</span> at the Reception counter upon arrival. The receptionist will collect fee, check you into the queue, and print your physical A4 Medical Case Pass.
                  </p>
                </div>

                <div className="pt-2 w-full max-w-md">
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : showPrintablePass ? (
              <div className="space-y-4 animate-fadeIn">
                <PrintableTokenSheet
                  appointment={createdApptObj || {
                    id: createdApptId,
                    doctor: form.doctor,
                    treatment: form.treatment,
                    date: form.date,
                    time: form.time,
                    symptoms: form.notes
                  }}
                  paymentDetails={paymentDetails || {
                    amount: applicableAmount,
                    category: selectedFeeCategory,
                    method: "Online Payment",
                    transactionId: `TXN-${Date.now().toString().slice(-6)}`
                  }}
                  queueNo={queueNo}
                  waitTime={waitTime}
                  isEmergency={false}
                  patientProfile={{
                    name: typeof window !== 'undefined' ? localStorage.getItem("patient_name") || "Patient" : "Patient"
                  }}
                />
                <div className="flex justify-end pt-4 no-print">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-4 animate-fadeIn space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Appointment Booking Submitted!</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Pay your consultation charge now to receive your printable Medical Case Token Pass.</p>
                </div>

                {/* Appointment & Tariff Summary Card */}
                <div className="w-full max-w-md bg-slate-50 p-5 rounded-2xl text-left space-y-2.5 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-gray-500 font-semibold text-xs">Patient Name</span>
                    <span className="text-gray-900 font-bold text-xs">
                      {typeof window !== 'undefined' ? localStorage.getItem("patient_name") || "Patient" : "Patient"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-gray-500 font-semibold text-xs">Doctor</span>
                    <span className="text-gray-900 font-bold text-xs">{form.doctor}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-gray-500 font-semibold text-xs">Date & Time</span>
                    <span className="text-gray-900 font-bold text-xs">{form.date} at {form.time}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-gray-500 font-semibold text-xs">Fee Tariff Category</span>
                    <span className="text-teal-700 font-bold text-xs">{selectedFeeCategory}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-700 font-bold text-xs uppercase tracking-wider">Total Consultation Charge</span>
                    <span className="text-emerald-600 font-black text-lg">₹{applicableAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Error */}
                {paymentState === "error" && (
                  <div className="w-full max-w-md px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-left">
                    <p className="text-rose-600 text-xs font-bold">⚠ {paymentError}</p>
                  </div>
                )}

                {/* Pay / Pay Counter Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                  <button
                    onClick={() => finalizePaymentAndQueue("Counter Payment")}
                    className="flex-1 py-3 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Pay at Reception Counter
                  </button>
                  <button
                    onClick={handlePayNow}
                    disabled={paymentState === "loading"}
                    className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {paymentState === "loading" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" /> Pay ₹{applicableAmount.toLocaleString()} & Get Token Pass
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Actions (Steps 1-3) */}
        {step !== 4 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/20"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {submitting ? "Confirming..." : "Confirm Booking"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}