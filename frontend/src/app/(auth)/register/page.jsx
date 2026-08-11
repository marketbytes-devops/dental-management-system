"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  UserPlus,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { login } from "@/services/api";
import { registerPatient } from "@/services/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry",
];

// Form sections for step indicator
const STEPS = ["Personal Info", "Address", "Emergency Contact"];

// ─── Validation helpers ────────────────────────────────────────────────────
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE  = /^[a-zA-Z\s\-'\.]{2,80}$/;

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-success" },
  ];
  return { score, ...map[score] };
}

// ─── Field error helper ───────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1 font-semibold">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    // Step 0 — Personal Info
    name: "",
    date_of_birth: "",
    gender: "Female",
    blood_group: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    // Step 1 — Address
    pincode: "",
    area: "",
    city: "",
    state: "",
    address_line1: "",
    landmark: "",
    // Step 2 — Emergency Contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [errors, setErrors]           = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState("idle"); // idle|loading|success|error
  const [areaOptions, setAreaOptions]     = useState([]);

  // ── Field setter — clears error on change ──────────────────────────────
  const set = (field, value) => {
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset pincode-derived fields when pincode is cleared
    if (field === "pincode" && !value.trim()) {
      setPincodeStatus("idle");
      setAreaOptions([]);
      setFormData(prev => ({ ...prev, pincode: value, area: "", city: "", state: "" }));
    }
  };

  // ── Pincode auto-fill ──────────────────────────────────────────────────
  const handlePincodeLookup = async () => {
    const pin = formData.pincode.trim();
    if (!pin || !/^\d{6}$/.test(pin)) return;
    setPincodeStatus("loading");
    setAreaOptions([]);
    try {
      const res  = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      if (json[0]?.Status === "Success" && json[0].PostOffice?.length > 0) {
        const offices     = json[0].PostOffice;
        const first       = offices[0];
        const uniqueAreas = [...new Set(offices.map(o => o.Name))];
        setAreaOptions(uniqueAreas);
        setFormData(prev => ({
          ...prev,
          state: first.State  || prev.state,
          city:  first.District || prev.city,
          area:  uniqueAreas[0] || prev.area,
        }));
        setPincodeStatus("success");
        setErrors(prev => { const e = { ...prev }; delete e.pincode; return e; });
      } else {
        setPincodeStatus("error");
        setErrors(prev => ({ ...prev, pincode: "No results found for this pincode." }));
      }
    } catch {
      setPincodeStatus("error");
      setErrors(prev => ({ ...prev, pincode: "Could not fetch pincode. Please fill manually." }));
    }
  };

  // ── Per-step validation returning { field: message } map ──────────────
  const validateStep = () => {
    const errs = {};

    if (step === 0) {
      if (!formData.name.trim()) errs.name = "Full name is required.";
      else if (!NAME_RE.test(formData.name.trim())) errs.name = "Name can only contain letters, spaces, or hyphens.";

      if (!formData.date_of_birth) {
        errs.date_of_birth = "Date of birth is required.";
      } else {
        const dob   = new Date(formData.date_of_birth);
        const today = new Date(); today.setHours(0,0,0,0);
        if (dob >= today) errs.date_of_birth = "Date of birth must be in the past.";
        else if (today.getFullYear() - dob.getFullYear() < 1) errs.date_of_birth = "Must be at least 1 year old.";
      }

      if (!formData.phone.trim()) errs.phone = "Mobile number is required.";
      else if (!PHONE_RE.test(formData.phone.replace(/\s+/g, ""))) errs.phone = "Enter a valid 10-digit Indian mobile number (starts with 6–9).";

      if (!formData.email.trim()) errs.email = "Email address is required.";
      else if (!EMAIL_RE.test(formData.email.trim())) errs.email = "Enter a valid email address.";

      if (!formData.password) errs.password = "Password is required.";
      else if (formData.password.length < 8) errs.password = "Password must be at least 8 characters.";

      if (!formData.confirm_password) errs.confirm_password = "Please confirm your password.";
      else if (formData.password !== formData.confirm_password) errs.confirm_password = "Passwords do not match.";
    }

    if (step === 1) {
      if (!formData.pincode.trim()) errs.pincode = "Pincode is required.";
      else if (!/^\d{6}$/.test(formData.pincode)) errs.pincode = "Enter a valid 6-digit pincode.";

      if (!formData.address_line1.trim()) errs.address_line1 = "Street / building address is required.";
      if (!formData.city.trim()) errs.city = "City is required.";
      if (!formData.state) errs.state = "Please select a state.";
    }

    if (step === 2) {
      if (formData.emergency_contact_phone && !PHONE_RE.test(formData.emergency_contact_phone.replace(/\s+/g, "")))
        errs.emergency_contact_phone = "Enter a valid 10-digit mobile number.";
    }

    return errs;
  };

  const handleNext = () => {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  // ── Final submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        name:         formData.name.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender:       formData.gender,
        blood_group:  formData.blood_group || null,
        phone:        formData.phone.replace(/\s+/g, ""),
        email:        formData.email.trim(),
        password:     formData.password,
        address_line1: [
          formData.address_line1.trim(),
          formData.landmark.trim() ? `Landmark: ${formData.landmark.trim()}` : "",
          formData.area.trim(),
        ].filter(Boolean).join(", ") || null,
        city:         formData.city.trim() || null,
        state:        formData.state || null,
        pincode:      formData.pincode.trim() || null,
        emergency_contact_name:  formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        known_allergies: null,
      };

      const data = await registerPatient(payload);

      localStorage.setItem("patient_token",  data.token);
      localStorage.setItem("patient_name",   data.name);
      localStorage.setItem("patient_phone",  data.phone);
      localStorage.setItem("patient_email",  data.email);

      try {
        const loginData = await login({ username: formData.email.trim(), password: formData.password });
        localStorage.setItem("patient_jwt_token", loginData.access_token);
      } catch (loginErr) { console.error("Auto-login failed:", loginErr); }

      router.push("/patient/dashboard");
    } catch (err) {
      setErrors({ _global: err.message || "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared style helpers ───────────────────────────────────────────────
  const inputCls = (field) =>
    `w-full bg-slate-900 border ${errors[field] ? "border-red-500/70 bg-red-950/20" : "border-slate-700/60"} rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600 transition-colors`;
  const selectCls = (field) =>
    `w-full bg-slate-900 border ${errors[field] ? "border-red-500/70 bg-red-950/20" : "border-slate-700/60"} rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white transition-colors`;
  const labelCls = "text-[9px] uppercase font-bold text-slate-400 tracking-wider";

  const pwStrength = passwordStrength(formData.password);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans selection:bg-primary selection:text-white relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e912_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e912_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <ToothIcon className="w-8 h-8 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SmileCare
            </span>
          </Link>
          <Link href="/" className="text-slate-450 hover:text-white text-xs font-bold transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg bg-slate-800/95 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md animate-fadeIn">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            {step === 0 ? (
              <Link
                href="/login?role=patient"
                className="flex items-center gap-1 text-slate-450 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-slate-450 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <span className="text-[10px] font-bold tracking-widest uppercase bg-secondary/20 text-secondary px-2.5 py-1 rounded">
              Step {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Title */}
          <div className="mb-5">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-secondary" />
              {STEPS[step]}
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              {step === 0 && "Enter your basic personal details to get started"}
              {step === 1 && "Enter your pincode to auto-fill your address details"}
              {step === 2 && "Add an emergency contact for your safety (optional)"}
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-secondary" : "bg-slate-700"}`}
              />
            ))}
          </div>

          {/* Global error */}
          {errors._global && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400 font-semibold">{errors._global}</p>
            </div>
          )}

          {/* ── STEP 0: Personal Info ── */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Rahul Kumar"
                    className={inputCls("name")}
                  />
                  <FieldError msg={errors.name} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => set("date_of_birth", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className={inputCls("date_of_birth")}
                  />
                  <FieldError msg={errors.date_of_birth} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    className={selectCls("gender")}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => set("blood_group", e.target.value)}
                    className={selectCls("blood_group")}
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className={inputCls("phone")}
                />
                <FieldError msg={errors.phone} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="rahul@example.com"
                  className={inputCls("email")}
                />
                <FieldError msg={errors.email} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`${inputCls("password")} pr-8`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex gap-0.5 flex-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${pwStrength.score >= i ? pwStrength.color : "bg-slate-700"}`} />
                        ))}
                      </div>
                      {pwStrength.label && <span className="text-[9px] text-slate-400 font-bold">{pwStrength.label}</span>}
                    </div>
                  )}
                  <FieldError msg={errors.password} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => set("confirm_password", e.target.value)}
                      placeholder="Re-enter password"
                      className={`${inputCls("confirm_password")} pr-8`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {formData.confirm_password && formData.password === formData.confirm_password && (
                    <p className="text-[10px] text-success mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Passwords match</p>
                  )}
                  <FieldError msg={errors.confirm_password} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Address ── */}
          {step === 1 && (
            <div className="space-y-3">

              {/* Pincode — triggers auto-fill on blur */}
              <div className="space-y-1">
                <label className={`${labelCls} flex items-center gap-1.5`}>
                  <MapPin className="w-3 h-3" /> Pincode *
                  {pincodeStatus === "loading" && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
                  {pincodeStatus === "success" && <CheckCircle2 className="w-3 h-3 text-success ml-1" />}
                  {pincodeStatus === "error"   && <AlertCircle  className="w-3 h-3 text-red-400 ml-1" />}
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => set("pincode", e.target.value)}
                  onBlur={handlePincodeLookup}
                  placeholder="682001"
                  maxLength={6}
                  className={`${inputCls("pincode")} ${pincodeStatus === "success" ? "border-success/50" : ""}`}
                />
                {pincodeStatus === "success" && (
                  <p className="text-[10px] text-success mt-0.5">✓ City, state & area auto-filled from pincode</p>
                )}
                <FieldError msg={errors.pincode} />
              </div>

              {/* Area / Locality dropdown — shown after lookup */}
              {areaOptions.length > 0 && (
                <div className="space-y-1">
                  <label className={labelCls}>Area / Locality</label>
                  <select
                    value={formData.area}
                    onChange={(e) => set("area", e.target.value)}
                    className="w-full bg-slate-900 border border-success/40 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white transition-colors"
                  >
                    {areaOptions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* City & State — auto-filled but editable */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>City / District *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="e.g. Kochi"
                    className={`${inputCls("city")} ${pincodeStatus === "success" ? "border-success/40" : ""}`}
                  />
                  <FieldError msg={errors.city} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => set("state", e.target.value)}
                    className={`${selectCls("state")} ${pincodeStatus === "success" ? "border-success/40" : ""}`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.state} />
                </div>
              </div>

              {/* Street address */}
              <div className="space-y-1">
                <label className={labelCls}>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Street / Flat / Building *
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => set("address_line1", e.target.value)}
                  placeholder="Flat / House No., Street, Colony"
                  className={inputCls("address_line1")}
                />
                <FieldError msg={errors.address_line1} />
              </div>

              {/* Landmark */}
              <div className="space-y-1">
                <label className={labelCls}>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => set("landmark", e.target.value)}
                  placeholder="e.g. Near Apollo Hospital, Opp. HDFC Bank"
                  className={inputCls("landmark")}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Emergency Contact ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>
                    <Phone className="w-3 h-3 inline mr-1" />
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => set("emergency_contact_name", e.target.value)}
                    placeholder="Parent / Spouse"
                    className={inputCls("emergency_contact_name")}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Emergency Phone</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => set("emergency_contact_phone", e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className={inputCls("emergency_contact_phone")}
                  />
                  <FieldError msg={errors.emergency_contact_phone} />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-[10px] text-slate-400 font-medium">
                💡 <strong className="text-slate-300">Note:</strong> Medical history and known allergies can be added anytime in your secure Patient Profile after registration.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-secondary/95 transition-all shadow-md shadow-secondary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                ) : (
                  <>Register &amp; Sign In <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          )}

          {/* Next button for steps 0 and 1 */}
          {step < 2 && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full mt-4 bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-secondary/95 transition-all shadow-md shadow-secondary/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Footer */}
          <div className="border-t border-slate-700/60 pt-4 mt-5 flex items-center gap-2 text-[10px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Protected by SmileCare HIPAA Compliance Standard.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950/40 border-t border-slate-800/80 text-slate-500 py-6 px-6 text-center">
        <p className="text-xs font-semibold">
          © {new Date().getFullYear()} SmileCare Dental Ltd. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
