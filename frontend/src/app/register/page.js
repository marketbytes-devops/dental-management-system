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
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

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
const STEPS = ["Personal Info", "Address", "Emergency & Medical"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0, 1, 2

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
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    // Step 2 — Emergency & Medical
    emergency_contact_name: "",
    emergency_contact_phone: "",
    known_allergies: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const set = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Validation per step ──────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!formData.name.trim()) return "Full name is required.";
      if (!formData.date_of_birth) return "Date of birth is required.";
      if (!formData.phone.trim()) return "Mobile number is required.";
      if (!/^\d{10}$/.test(formData.phone.replace(/\s+/g, "")))
        return "Enter a valid 10-digit mobile number.";
      if (!formData.email.trim()) return "Email address is required.";
      if (!formData.password) return "Password is required.";
      if (formData.password.length < 6)
        return "Password must be at least 6 characters.";
      if (formData.password !== formData.confirm_password)
        return "Passwords do not match.";
    }
    if (step === 1) {
      if (!formData.address_line1.trim()) return "Address is required.";
      if (!formData.city.trim()) return "City is required.";
      if (!formData.state) return "Please select a state.";
      if (!formData.pincode.trim()) return "Pincode is required.";
      if (!/^\d{6}$/.test(formData.pincode)) return "Enter a valid 6-digit pincode.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setAuthError(err); return; }
    setAuthError("");
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setAuthError("");
    setStep((s) => s - 1);
  };

  // ── Final submit ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        blood_group: formData.blood_group || null,
        phone: formData.phone.replace(/\s+/g, ""),
        email: formData.email.trim(),
        password: formData.password,
        address_line1: formData.address_line1.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        pincode: formData.pincode.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        known_allergies: formData.known_allergies.trim() || null,
      };

      const response = await fetch("http://localhost:8000/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        let errMsg = "Registration failed. Please try again.";
        if (data.detail) {
          errMsg = Array.isArray(data.detail)
            ? data.detail.map((e) => e.msg).join(", ")
            : data.detail;
        }
        throw new Error(errMsg);
      }

      // Save session info
      localStorage.setItem("patient_token", data.token);
      localStorage.setItem("patient_name", data.name);
      localStorage.setItem("patient_phone", data.phone);
      localStorage.setItem("patient_email", data.email);

      // Automatically log in to get JWT token
      try {
        const loginResponse = await fetch("http://localhost:8000/patient/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password
          })
        });
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem("patient_jwt_token", loginData.access_token);
        }
      } catch (loginErr) {
        console.error("Auto-login failed:", loginErr);
      }

      router.push("/patient/dashboard");
    } catch (err) {
      setAuthError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Input class helper ───────────────────────────────────
  const inputCls =
    "w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600 transition-colors";
  const selectCls =
    "w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white transition-colors";
  const labelCls = "text-[9px] uppercase font-bold text-slate-400 tracking-wider";

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
              {step === 1 && "Add your address so we can keep your records complete"}
              {step === 2 && "Optional but important for your safety during treatment"}
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-secondary" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* ── STEP 0: Personal Info ── */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Rahul Kumar"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => set("date_of_birth", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    className={selectCls}
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
                    className={selectCls}
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
                  required
                  value={formData.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="rahul@example.com"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.confirm_password}
                    onChange={(e) => set("confirm_password", e.target.value)}
                    placeholder="Re-enter password"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Address ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={(e) => set("address_line1", e.target.value)}
                  placeholder="Flat / House No., Street, Area"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="e.g. Kochi"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Pincode *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => set("pincode", e.target.value)}
                    placeholder="682001"
                    maxLength={6}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>State *</label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => set("state", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 2: Emergency & Medical ── */}
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
                    className={inputCls}
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
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Known Allergies
                </label>
                <textarea
                  value={formData.known_allergies}
                  onChange={(e) => set("known_allergies", e.target.value)}
                  placeholder="e.g. Penicillin, Latex, Aspirin — or write None"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-[9px] text-slate-500">
                  Mention any drug or material allergies important for dental treatment.
                </p>
              </div>

              {authError && (
                <p className="text-red-400 text-[11px] font-semibold">{authError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-secondary/95 transition-all shadow-md shadow-secondary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Register &amp; Sign In <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          )}

          {/* Next button for steps 0 and 1 */}
          {step < 2 && (
            <>
              {authError && (
                <p className="text-red-400 text-[11px] font-semibold mt-3">{authError}</p>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="w-full mt-4 bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-secondary/95 transition-all shadow-md shadow-secondary/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
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
