"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { getDoctorLeaves, getAvailableDoctors, createAppointment, createPaymentOrder, verifyPayment, getConsultationFees } from "@/services/api";

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
  consultSpecialty: "",
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
  // Payment state: idle | loading | success | error
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const [bookingFee, setBookingFee] = useState(100);

  useEffect(() => {
    getConsultationFees()
      .then(data => {
        if (data && data.online_booking_fee) {
          setBookingFee(data.online_booking_fee);
        }
      })
      .catch(e => console.warn("Failed to fetch active online booking fee tariff:", e));
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorsLoaded(false);
      try {
        // Fetch all doctors initially to populate Step 1
        const data = await getAvailableDoctors();
        setDoctors(data);
      } catch (e) {
        console.error("Failed to fetch doctors:", e);
        setDoctors([]);
      } finally {
        setDoctorsLoaded(true);
      }
    };
    fetchDoctors();
  }, []);

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

  const doctorSpecialties = selectedDoctorObj
    ? (Array.isArray(selectedDoctorObj.specialties) && selectedDoctorObj.specialties.length > 0
        ? selectedDoctorObj.specialties
        : (selectedDoctorObj.specialty ? selectedDoctorObj.specialty.split(",").map(s => s.trim()).filter(Boolean) : []))
    : [];

  const hasMultipleSpecialties = doctorSpecialties.length >= 2;

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
      if (hasMultipleSpecialties && !form.consultSpecialty) {
        errs.consultSpecialty = "Please select a specialty to consult.";
      }
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
        symptoms: form.consultSpecialty
          ? (form.notes ? `[Specialty: ${form.consultSpecialty}] ${form.notes}` : `Consultation Specialty: ${form.consultSpecialty}`)
          : (form.notes || null)
      });

      setSubmitting(false);
      setCreatedApptId(data.id);
      setStep(4); // Success step

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

  const handlePayNow = async () => {
    if (!createdApptId) return;
    setPaymentState("loading");
    setPaymentError("");

    try {
      // Step 1: Create order on backend → get Razorpay order details
      const order = await createPaymentOrder(createdApptId, bookingFee);

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
          amount: order.amount,           // already in paise
          currency: order.currency,
          name: "SmileCare Dental Clinic",
          description: "Consultation Booking Fee",
          order_id: order.razorpay_order_id,
          prefill: {
            name: patientName,
          },
          theme: { color: "#4f46e5" },
          modal: {
            // If user closes the popup, treat as cancelled (not an error)
            ondismiss: () => {
              setPaymentState("idle");
              resolve(); // don't reject — let the user retry
            },
          },
          handler: async (response) => {
            try {
              // Step 4: Verify payment signature on the backend
              await verifyPayment({
                appointment_id: createdApptId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setPaymentState("success");
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

              {/* Specialty Selection if Doctor has 2 Specialties */}
              {hasMultipleSpecialties && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Which specialty do you need to consult? <span className="text-danger">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doctorSpecialties.map((spec) => {
                      const isSelected = form.consultSpecialty === spec;
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleChange("consultSpecialty", spec)}
                          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-bold text-gray-900"
                              : "border-gray-200 bg-white text-gray-700 hover:border-primary/50"
                          }`}
                        >
                          <div className="text-sm font-semibold">{spec}</div>
                          <div className="text-xs text-gray-500 font-normal mt-0.5">
                            {SPECIALTY_DESCRIPTIONS[spec] || "Specialized dental care."}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.consultSpecialty && <p className="mt-1 text-xs text-danger">{errors.consultSpecialty}</p>}
                </div>
              )}

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
                {form.consultSpecialty && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Consultation Specialty</span>
                    <span className="font-semibold text-gray-900">{form.consultSpecialty}</span>
                  </div>
                )}
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

          {/* Step 4: Success / Payment */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center py-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Appointment Confirmed!</h3>
              <p className="text-sm text-gray-500 mb-6">Please pay ₹{bookingFee} to secure your slot.</p>

              {/* Appointment Summary Card */}
              <div className="w-full max-w-sm bg-gray-50 p-5 rounded-2xl text-left space-y-3 mb-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-semibold text-sm">Patient Name</span>
                  <span className="text-gray-900 font-bold text-sm">
                    {typeof window !== 'undefined' ? localStorage.getItem("patient_name") || "Patient" : "Patient"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-semibold text-sm">Doctor</span>
                  <span className="text-gray-900 font-bold text-sm">{form.doctor}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-semibold text-sm">Date</span>
                  <span className="text-gray-900 font-bold text-sm">{form.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-semibold text-sm">Time</span>
                  <span className="text-gray-900 font-bold text-sm">{form.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold text-sm">Consultation Fee</span>
                  <span className="text-primary font-extrabold text-sm">₹{Number(bookingFee).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Error */}
              {paymentState === "error" && (
                <div className="w-full max-w-sm mb-4 px-4 py-3 bg-danger/10 border border-danger/20 rounded-xl text-left">
                  <p className="text-danger text-sm font-semibold">⚠ {paymentError}</p>
                </div>
              )}

              {/* Payment Success */}
              {paymentState === "success" ? (
                <div className="w-full max-w-sm flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-success font-extrabold text-lg">Payment Successful!</p>
                  <p className="text-gray-500 text-sm">₹{bookingFee} paid · Slot confirmed</p>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm font-bold text-white bg-success rounded-xl hover:bg-success/90 transition-all shadow-md"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Pay / Pay Later buttons */
                <div className="flex gap-4 w-full max-w-sm">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 text-sm font-bold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Pay Later
                  </button>
                  <button
                    onClick={handlePayNow}
                    disabled={paymentState === "loading"}
                    className="flex-1 py-3.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {paymentState === "loading" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : paymentState === "error" ? (
                      "Retry Payment"
                    ) : (
                      `Pay ₹${bookingFee} Now`
                    )}
                  </button>
                </div>
              )}
            </div>
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