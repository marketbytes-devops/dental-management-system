"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserCheck, CheckCircle2, AlertCircle, Loader2, MapPin, X, CreditCard } from "lucide-react";
import client, { 
  getDoctorLeaves, 
  getAllPatients, 
  getFrontdeskDoctors, 
  registerPatient, 
  createAppointment, 
  directCheckin,
  payConsultation,
  getQueue,
  getConsultationFees,
  getDoctorAvailableSlots
} from "@/services/api";
import PrintableTokenSheet from "@/components/features/patients/check-in/printableTokenSheet";

// ─── Validation Helpers ────────────────────────────────────────────────────
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE  = /^[a-zA-Z\s\-'\.]{2,80}$/;

function validate(form) {
  const errs = {};

  // Full Name
  if (!form.name.trim()) {
    errs.name = "Full name is required.";
  } else if (!NAME_RE.test(form.name.trim())) {
    errs.name = "Name can only contain letters, spaces, hyphens, or apostrophes.";
  }

  // Date of Birth
  if (!form.date_of_birth) {
    errs.date_of_birth = "Date of birth is required.";
  } else {
    const dob = new Date(form.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dob >= today) {
      errs.date_of_birth = "Date of birth must be in the past.";
    } else {
      const ageDiff = today.getFullYear() - dob.getFullYear();
      if (ageDiff < 1) errs.date_of_birth = "Patient must be at least 1 year old.";
    }
  }

  // Phone
  if (!form.phone.trim()) {
    errs.phone = "Phone number is required.";
  } else if (!PHONE_RE.test(form.phone.replace(/\s+/g, ""))) {
    errs.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9).";
  }

  // Email
  if (!form.email.trim()) {
    errs.email = "Email address is required.";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errs.email = "Enter a valid email address.";
  }

  // Password
  if (!form.password) {
    errs.password = "Password is required.";
  } else if (form.password.length < 8) {
    errs.password = "Password must be at least 8 characters.";
  }

  // Confirm Password
  if (!form.confirm_password) {
    errs.confirm_password = "Please confirm the password.";
  } else if (form.password !== form.confirm_password) {
    errs.confirm_password = "Passwords do not match.";
  }

  // Pincode — optional but if provided must be 6 digits
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errs.pincode = "Pincode must be exactly 6 digits.";
  }

  // Emergency contact phone — optional but if provided must be valid
  if (form.emergency_contact_phone && !PHONE_RE.test(form.emergency_contact_phone.replace(/\s+/g, ""))) {
    errs.emergency_contact_phone = "Enter a valid 10-digit phone number.";
  }

  return errs;
}

// ── PaymentModal (identical to appointments.jsx) ─────────────────────────────────────────────
function PaymentModal({ isOpen, onClose, onConfirm, patientName, doctorName, treatmentType }) {
  const [method, setMethod] = useState("Cash");
  const [amount, setAmount] = useState(500);
  const [fetchingTariff, setFetchingTariff] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFetchingTariff(true);
      client.get("/payment/consultation-fees")
        .then(res => {
          if (res.data) {
            const trLower = (treatmentType || "").toLowerCase();
            let fee = res.data.general_consultation_fee || 500;
            if (trLower.includes("follow") || trLower.includes("follow-up")) {
              fee = res.data.followup_consultation_fee || 300;
            } else if (trLower.includes("routine")) {
              fee = res.data.routine_checkup_fee || 400;
            }
            if (fee) setAmount(fee);
          }
        })
        .catch(err => console.error("Failed to fetch active consultation tariff:", err))
        .finally(() => setFetchingTariff(false));
    }
  }, [isOpen, treatmentType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Payment Collection</h3>
            <p className="text-xs text-gray-500 mt-0.5">Consultation &amp; Registration Fees</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition bg-white border border-gray-200 rounded-lg p-1.5 hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-left">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</p>
              <p className="font-bold text-gray-900 mt-0.5">{patientName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Consultation Fee</p>
              {fetchingTariff
                ? <p className="text-sm text-gray-400 mt-0.5">Loading...</p>
                : <p className="text-xl font-extrabold text-emerald-600 mt-0.5">₹{parseFloat(amount || 0).toFixed(2)}</p>
              }
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Collection Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 font-bold outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {["Cash", "Card", "Online"].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={"py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer " + (
                      method === m
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {m === "Online" ? "UPI / Net" : m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition shadow-sm cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(method, parseFloat(amount) || 0)}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            Confirm Payment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ReceptionistPatients() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const emptyForm = {
    name: "",
    date_of_birth: "",
    gender: "Female",
    blood_group: "",
    phone: "",
    email: "",
    password: "SmileCare123!",
    confirm_password: "SmileCare123!",
    address_line1: "",
    landmark: "",
    area: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    known_allergies: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [pincodeStatus, setPincodeStatus] = useState("idle"); // idle | loading | success | error
  const [areaOptions, setAreaOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(null); // { name, token }

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    doctor_name: "",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "",
    treatment_type: "Consultation",
    priority: "Routine"
  });
  const [bookingTimeSlots, setBookingTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Payment & print modal state (mirrors appointments.jsx)
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, treatmentType: "" });
  const [counterPrintModal, setCounterPrintModal] = useState({
    isOpen: false,
    appointment: null,
    paymentDetails: null,
    queueNo: 1,
    waitTime: 0
  });
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Puducherry"
  ];
  const [doctors, setDoctors] = useState([]);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const treatments = ["Consultation", "Follow-up Check-up", "Routine Check-up"];

  useEffect(() => {
    const fetchDoctorLeaves = async () => {
      if (!bookingForm.doctor_name) {
        setDoctorLeaves([]);
        return;
      }
      try {
        const data = await getDoctorLeaves(bookingForm.doctor_name);
        setDoctorLeaves(data);
      } catch (e) {
        console.error("Failed to fetch doctor leaves:", e);
      }
    };
    fetchDoctorLeaves();
  }, [bookingForm.doctor_name]);

  useEffect(() => {
    if (bookingForm.appointment_date && bookingForm.doctor_name && doctorLeaves.length > 0) {
      const selectedDate = new Date(bookingForm.appointment_date);
      selectedDate.setHours(0, 0, 0, 0);
      
      const isOnLeave = doctorLeaves.some(leave => {
        const start = new Date(leave.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.end_date);
        end.setHours(0, 0, 0, 0);
        return selectedDate >= start && selectedDate <= end;
      });
      
      if (isOnLeave) {
        setErrors(prev => ({ ...prev, appointment_date: `${bookingForm.doctor_name} is on leave on this day. Please select another date.` }));
        setBookingForm(prev => ({ ...prev, appointment_date: "" }));
      }
    }
  }, [bookingForm.appointment_date, doctorLeaves, bookingForm.doctor_name]);

  // Fetch available shift time slots for selected doctor & date
  useEffect(() => {
    const fetchSlots = async () => {
      if (!showBookingModal || !bookingForm.doctor_name || !bookingForm.appointment_date) {
        setBookingTimeSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const doc = doctors.find(d => d.name === bookingForm.doctor_name);
        if (doc && doc.id) {
          const data = await getDoctorAvailableSlots(doc.id, bookingForm.appointment_date);
          setBookingTimeSlots(data.available_slots || []);
        } else {
          setBookingTimeSlots([]);
        }
      } catch (err) {
        console.error("Failed to fetch slots for doctor:", err);
        setBookingTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [showBookingModal, bookingForm.doctor_name, bookingForm.appointment_date, doctors]);

  const isPastTime = (timeStr, selectedDate) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (!selectedDate || selectedDate !== todayStr) return false;
    const now = new Date();
    const [timePart, modifier] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate <= now;
  };

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch active doctors based on selected date
  useEffect(() => {
    const fetchDoctorsForDate = async () => {
      try {
        const doctorsData = await getFrontdeskDoctors(bookingForm.appointment_date);
        setDoctors(doctorsData);
        if (doctorsData.length > 0 && !doctorsData.some(d => d.name === bookingForm.doctor_name)) {
          setBookingForm(prev => ({ ...prev, doctor_name: doctorsData[0].name }));
        }
      } catch (err) {
        console.error("Error fetching doctors for date:", err);
      }
    };
    fetchDoctorsForDate();
  }, [bookingForm.appointment_date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Clear the error for this field as the user types
    if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e; });

    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate password from phone number
      if (name === "phone" && value.trim()) {
        const cleanPhone = value.replace(/\D/g, "");
        if (cleanPhone.length >= 6) {
          updated.password = `SmileCare${cleanPhone}`;
          updated.confirm_password = `SmileCare${cleanPhone}`;
        }
      }
      // Reset pincode-derived fields when pincode is manually cleared
      if (name === "pincode" && !value.trim()) {
        setPincodeStatus("idle");
        setAreaOptions([]);
        updated.area = "";
        updated.city = "";
        updated.district = "";
        updated.state = "";
      }
      return updated;
    });
  };

  // ─── Pincode Auto-fill ──────────────────────────────────────────────────
  const handlePincodeLookup = async () => {
    const pin = form.pincode.trim();
    if (!pin || !/^\d{6}$/.test(pin)) return;
    setPincodeStatus("loading");
    setAreaOptions([]);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      if (json[0]?.Status === "Success" && json[0].PostOffice?.length > 0) {
        const offices = json[0].PostOffice;
        const firstOffice = offices[0];
        // Extract unique area names for the dropdown
        const uniqueAreas = [...new Set(offices.map(o => o.Name))];
        setAreaOptions(uniqueAreas);
        setForm(prev => ({
          ...prev,
          state: firstOffice.State || prev.state,
          city: firstOffice.District || prev.city,
          district: firstOffice.District || prev.district,
          area: uniqueAreas[0] || prev.area
        }));
        setPincodeStatus("success");
        // Clear any pincode error
        setErrors(prev => { const e = { ...prev }; delete e.pincode; return e; });
      } else {
        setPincodeStatus("error");
        setErrors(prev => ({ ...prev, pincode: "No results found for this pincode." }));
      }
    } catch {
      setPincodeStatus("error");
      setErrors(prev => ({ ...prev, pincode: "Could not fetch pincode details. Please fill manually." }));
    }
  };

  const handleBookingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // ─── Submit patient registration ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        blood_group: form.blood_group || null,
        phone: form.phone.replace(/\s+/g, ""),
        email: form.email.trim(),
        password: form.password,
        address_line1: [
          form.address_line1.trim(),
          form.landmark.trim() ? `Landmark: ${form.landmark.trim()}` : "",
          form.area.trim()
        ].filter(Boolean).join(", ") || null,
        city: form.city.trim() || null,
        state: form.state || null,
        pincode: form.pincode.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        known_allergies: form.known_allergies.trim() || null,
      };

      const data = await registerPatient(payload);

      // Success toast instead of alert
      setSuccessToast({ name: data.name, token: data.token });
      setTimeout(() => setSuccessToast(null), 6000);
      setRegisteredPatient(data);
      fetchPatients();

      // Reset form
      setForm(emptyForm);
      setErrors({});
      setPincodeStatus("idle");
      setAreaOptions([]);

      // Show booking redirection modal
      setShowBookingModal(true);
    } catch (err) {
      setErrors({ _global: err.message || "An error occurred during registration." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit appointment booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!registeredPatient) return;

    // Clear any previous booking error
    setErrors(prev => { const e = { ...prev }; delete e._booking; return e; });

    const today = new Date().toISOString().split("T")[0];
    if (bookingForm.appointment_date < today) {
      setErrors(prev => ({ ...prev, _booking: "Appointment date cannot be in the past." }));
      return;
    }
    if (!bookingForm.doctor_name) {
      setErrors(prev => ({ ...prev, _booking: "Please select a doctor." }));
      return;
    }
    if (!bookingForm.appointment_time) {
      setErrors(prev => ({ ...prev, _booking: "Please select an available time slot." }));
      return;
    }

    const selectedSlot = bookingTimeSlots.find(s => s.time === bookingForm.appointment_time);
    if (selectedSlot) {
      if (selectedSlot.is_full) {
        setErrors(prev => ({ ...prev, _booking: "Selected time slot is fully booked. Please choose another." }));
        return;
      }
      if (isPastTime(selectedSlot.time, bookingForm.appointment_date)) {
        setErrors(prev => ({ ...prev, _booking: "Selected time slot has already passed." }));
        return;
      }
    }

    try {
      const payload = {
        patient_id: registeredPatient.id,
        doctor_name: bookingForm.doctor_name,
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time,
        treatment_type: bookingForm.treatment_type,
        status: "Confirmed",
        priority: bookingForm.priority
      };

      const data = await createAppointment(payload);
      setCreatedAppointment(data);

      // Close booking modal, open payment collection modal
      setShowBookingModal(false);
      setErrors({});
      setPaymentModal({ isOpen: true, treatmentType: bookingForm.treatment_type });

    } catch (err) {
      setErrors(prev => ({ ...prev, _booking: err.message || "An error occurred during booking." }));
    }
  };

  // Confirm payment and open counter print pass (mirrors appointments.jsx)
  const handlePayConsultationConfirm = async (method, amount) => {
    if (!createdAppointment) return;
    try {
      const updatedAppt = await payConsultation(createdAppointment.id, {
        amount: amount || 500.0,
        payment_method: method
      });

      // Patient is only checked in & enters queue once payment is completed!
      await directCheckin(createdAppointment.id, bookingForm.priority, bookingForm.doctor_name);

      let qNo = 1;
      let wTime = 0;
      try {
        const queueData = await getQueue();
        const cur = queueData.find(q => q.id === createdAppointment.id);
        if (cur) {
          const docQueue = queueData.filter(q => q.doctor_name === cur.doctor_name);
          const idx = docQueue.findIndex(q => q.id === createdAppointment.id);
          qNo = idx >= 0 ? idx + 1 : 1;
          wTime = cur.wait_time_estimate || 0;
        }
      } catch (qErr) {
        console.warn("Queue notice:", qErr);
      }

      setPaymentModal({ isOpen: false, treatmentType: "" });
      setCounterPrintModal({
        isOpen: true,
        appointment: updatedAppt,
        paymentDetails: {
          amount: amount || 500.0,
          category: `${bookingForm.treatment_type} Fee`,
          method: method,
          transactionId: `TXN-${Date.now().toString().slice(-6)}`
        },
        queueNo: qNo,
        waitTime: wTime
      });

      fetchPatients();
      setRegisteredPatient(null);
      setCreatedAppointment(null);
    } catch (err) {
      alert(err.message || "Payment failed.");
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search) || 
    p.token.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Register new patients and view EDR profile summaries.</p>
      </div>

      {/* ── PaymentModal Overlay ─────────────────────────────────────── */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, treatmentType: "" })}
        onConfirm={handlePayConsultationConfirm}
        patientName={registeredPatient?.name}
        doctorName={bookingForm.doctor_name}
        treatmentType={paymentModal.treatmentType}
      />

      {/* ── Counter Medical Case Pass Print Modal ────────────────────── */}
      {counterPrintModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center no-print border-b pb-3">
              <h3 className="text-lg font-extrabold text-gray-900">Counter Medical Case Pass Issued</h3>
              <button
                onClick={() => setCounterPrintModal({ isOpen: false, appointment: null, paymentDetails: null, queueNo: 1, waitTime: 0 })}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
            <PrintableTokenSheet
              appointment={counterPrintModal.appointment}
              paymentDetails={counterPrintModal.paymentDetails}
              queueNo={counterPrintModal.queueNo}
              waitTime={counterPrintModal.waitTime}
              isEmergency={counterPrintModal.appointment?.priority === "Emergency"}
              patientProfile={{
                name: counterPrintModal.appointment?.patient?.name || counterPrintModal.appointment?.patient_name || "Patient",
                phone: counterPrintModal.appointment?.patient?.phone
              }}
            />
          </div>
        </div>
      )}

      {/* ── Success Toast ─────────────────────────────────────────────── */}
      {successToast && (
        <div className="fixed top-5 right-5 z-[9999] flex items-start gap-3 bg-white border border-success/30 rounded-2xl shadow-2xl p-4 w-80 animate-slide-in">
          <div className="p-2 bg-success/10 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Patient Registered!</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{successToast.name}</p>
            <p className="text-xs font-mono text-primary mt-0.5">Token: {successToast.token}</p>
          </div>
          <button onClick={() => setSuccessToast(null)} className="shrink-0 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registration Form (4 cols) */}
        <form onSubmit={handleSubmit} noValidate className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Register New Patient</h3>

          {/* Global error */}
          {errors._global && (
            <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              <p className="text-xs text-danger font-medium">{errors._global}</p>
            </div>
          )}

          <div className="max-h-[68vh] overflow-y-auto pr-1 space-y-4">
            
            {/* ── Section 1: Personal Info ─────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider border-b border-gray-100 pb-1">Personal Info</p>
              
              <div id="field-name" className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Rahul Kumar"
                  value={form.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.name ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                />
                {errors.name && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div id="field-date_of_birth" className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">DOB *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.date_of_birth ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                  />
                  {errors.date_of_birth && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.date_of_birth}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Gender *</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Blood Group</label>
                  <select
                    name="blood_group"
                    value={form.blood_group}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div id="field-phone" className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    maxLength={10}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.phone ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                  />
                  {errors.phone && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                </div>
              </div>

              <div id="field-email" className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. patient@example.com"
                  value={form.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.email ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                />
                {errors.email && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div id="field-password" className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.password ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                  />
                  {errors.password && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>
                <div id="field-confirm_password" className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Confirm *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.confirm_password ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                  />
                  {errors.confirm_password && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirm_password}</p>}
                </div>
              </div>
            </div>

            {/* ── Section 2: Address Details ────────────────────────────── */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider border-b border-gray-100 pb-1">Address Details</p>

              {/* Pincode — triggers auto-fill on blur */}
              <div id="field-pincode" className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Pincode
                  {pincodeStatus === "loading" && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
                  {pincodeStatus === "success" && <CheckCircle2 className="w-3 h-3 text-success ml-1" />}
                  {pincodeStatus === "error" && <AlertCircle className="w-3 h-3 text-danger ml-1" />}
                </label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="6-digit pincode"
                  value={form.pincode}
                  maxLength={6}
                  onChange={handleInputChange}
                  onBlur={handlePincodeLookup}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.pincode ? "border-danger/60 bg-danger/5" : pincodeStatus === "success" ? "border-success/50 bg-success/5" : "border-gray-200 focus:border-primary"}`}
                />
                {errors.pincode && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.pincode}</p>}
                {pincodeStatus === "success" && <p className="text-[10px] text-success mt-0.5">✓ Location details auto-filled from pincode</p>}
              </div>

              {/* Area / Locality dropdown — shown after pincode lookup */}
              {areaOptions.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Area / Locality</label>
                  <select
                    name="area"
                    value={form.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-success/40 bg-success/5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  >
                    {areaOptions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* City & State — auto-filled, editable */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">City / District</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${pincodeStatus === "success" ? "border-success/40 bg-success/5" : "border-gray-200 focus:border-primary"}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">State</label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${pincodeStatus === "success" ? "border-success/40 bg-success/5" : "border-gray-200 focus:border-primary"}`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Street / Flat / Building</label>
                <input
                  type="text"
                  name="address_line1"
                  placeholder="e.g. 12B, Shivaji Nagar, Flat 4"
                  value={form.address_line1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>

              {/* Landmark */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-400" /> Landmark (Optional)
                </label>
                <input
                  type="text"
                  name="landmark"
                  placeholder="e.g. Near Apollo Hospital, Opp. HDFC Bank"
                  value={form.landmark}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                />
              </div>
            </div>

            {/* ── Section 3: Emergency & Medical ───────────────────────── */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider border-b border-gray-100 pb-1">Emergency &amp; Medical</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    placeholder="Name"
                    value={form.emergency_contact_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
                  />
                </div>
                <div id="field-emergency_contact_phone" className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    name="emergency_contact_phone"
                    placeholder="Phone"
                    maxLength={10}
                    value={form.emergency_contact_phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 transition-colors ${errors.emergency_contact_phone ? "border-danger/60 bg-danger/5" : "border-gray-200 focus:border-primary"}`}
                  />
                  {errors.emergency_contact_phone && <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.emergency_contact_phone}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Known Allergies (Optional)</label>
                <textarea
                  name="known_allergies"
                  placeholder="e.g. Penicillin, Latex, None — Optional (patient can add via portal)"
                  value={form.known_allergies}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 resize-none"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : "Register Patient"}
          </button>
        </form>

        {/* Patient Directory List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-base font-extrabold text-gray-900">Patient Database</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search by ID, name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-center py-10 text-xs text-gray-400 animate-pulse">Loading patient records...</p>
            ) : filteredPatients.length === 0 ? (
              <p className="text-center py-10 text-xs text-gray-400 font-bold">No patients found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Patient Details</th>
                    <th className="py-3 px-2">Contact Info</th>
                    <th className="py-3 px-2">DOB &amp; Allergies</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2 font-mono text-xs text-gray-500 font-bold">{p.token}</td>
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{calculateAge(p.date_of_birth)} years • {p.gender}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs">
                        <div>{p.phone}</div>
                        <div className="text-gray-400 mt-0.5">{p.email}</div>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-gray-500">
                        <div>{p.date_of_birth || "N/A"}</div>
                        <div className="text-danger font-semibold mt-0.5 text-[10px] truncate max-w-[150px]" title={p.known_allergies}>
                          {p.known_allergies ? `Allergies: ${p.known_allergies}` : "No allergies"}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          p.is_active ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
                        }`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Upgraded Walk-In Booking Modal ────────────────────────────────────────── */}
      {showBookingModal && registeredPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Book Appointment</h3>
                  <p className="text-xs text-gray-500">Token: <span className="font-mono font-bold text-gray-700">{registeredPatient.token}</span></p>
                </div>
              </div>
              <button
                onClick={() => { setShowBookingModal(false); setRegisteredPatient(null); setErrors({}); }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

              {/* Patient Summary Card */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm shrink-0 uppercase">
                  {registeredPatient.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{registeredPatient.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{registeredPatient.phone} &middot; {registeredPatient.gender}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">New Walk-In</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded-full">
                    Registered ✓
                  </span>
                </div>
              </div>

              {/* Booking-level error */}
              {errors._booking && (
                <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  <p className="text-xs text-danger font-medium">{errors._booking}</p>
                </div>
              )}

              <form id="booking-form" onSubmit={handleBookingSubmit} className="space-y-4">

                {/* Date + Doctor */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Assign Doctor <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="doctor_name"
                      value={bookingForm.doctor_name}
                      onChange={handleBookingInputChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition appearance-none"
                    >
                      <option value="">Select a doctor...</option>
                      {doctors.map(d => (
                        <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={bookingForm.appointment_date}
                      onChange={handleBookingInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                    />
                    {errors.appointment_date && (
                      <p className="text-[10px] text-danger mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.appointment_date}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dynamic Time Slots Grid */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                    <span>Available Time Slots <span className="text-red-400">*</span></span>
                    {loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                  </label>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-150 text-xs text-gray-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      Loading doctor's available slots...
                    </div>
                  ) : bookingTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                      {bookingTimeSlots.map((slot) => {
                        const isPast = isPastTime(slot.time, bookingForm.appointment_date);
                        const isDisabled = slot.is_full || isPast;
                        const isSelected = bookingForm.appointment_time === slot.time;

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setBookingForm(prev => ({ ...prev, appointment_time: slot.time }));
                              setErrors(prev => { const e = { ...prev }; delete e._booking; return e; });
                            }}
                            className={`text-xs font-semibold py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                              isDisabled
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30 font-bold"
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                            }`}
                          >
                            {slot.time}
                            {slot.is_full && <span className="block text-[9px] text-gray-400 font-normal">Full</span>}
                            {isPast && !slot.is_full && <span className="block text-[9px] text-gray-400 font-normal">Passed</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs font-medium space-y-1">
                      <p className="font-bold">No active time slots available on this date.</p>
                      <p className="text-[11px] text-amber-700">Please choose another date or doctor.</p>
                    </div>
                  )}
                </div>

                {/* Treatment + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Treatment Type</label>
                    <select
                      name="treatment_type"
                      value={bookingForm.treatment_type}
                      onChange={handleBookingInputChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition appearance-none"
                    >
                      {treatments.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                    <select
                      name="priority"
                      value={bookingForm.priority}
                      onChange={handleBookingInputChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition appearance-none"
                    >
                      <option value="Routine">Routine</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowBookingModal(false); setRegisteredPatient(null); setErrors({}); }}
                className="flex-1 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                form="booking-form"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
              >
                <CreditCard className="w-4 h-4" />
                Confirm &amp; Collect Payment
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

