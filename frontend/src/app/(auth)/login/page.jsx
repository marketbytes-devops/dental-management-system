"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Shield,
  Microscope,
  Lock,
  ArrowRight,
  ArrowLeft,
  Heart,
  Clock,
  Sparkles,
  Mail
} from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { login, getProfile } from "@/services/api";
import { getPatientProfile } from "@/services/api";


const roles = {
  patient: {
    name: "Patient",
    description: "Access your dental history, prescriptions, and billing statements",
    icon: User,
    color: "border-sky-200 hover:border-sky-400 bg-sky-50/50 text-sky-600",
    accent: "bg-sky-500",
    redirect: "/patient/dashboard"
  },
  doctor: {
    name: "Doctor",
    description: "Manage clinical sheets, chair queues, and digitize prescriptions",
    icon: Heart,
    color: "border-teal-200 hover:border-teal-400 bg-teal-50/50 text-teal-600",
    accent: "bg-teal-500",
    redirect: "/doctor/dashboard"
  },
  lab: {
    name: "Lab Technician",
    description: "Track milling orders, CAD designs, and update case schedules",
    icon: Microscope,
    color: "border-amber-200 hover:border-amber-400 bg-amber-50/50 text-amber-600",
    accent: "bg-amber-500",
    redirect: "/labtechnicians/dashboard"
  },
  frontdesk: {
    name: "Front Desk",
    description: "Coordinate check-ins, manage lobby queue, and execute checkouts",
    icon: Clock,
    color: "border-green-200 hover:border-green-400 bg-green-50/50 text-green-600",
    accent: "bg-green-500",
    redirect: "/frontdesk"
  },
  admin: {
    name: "Administrator",
    description: "Configure clinic settings, manage doctor rosters, and access billing audits",
    icon: Shield,
    color: "border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 text-indigo-600",
    accent: "bg-indigo-500",
    redirect: "/admin/dashboard"
  }
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [portalType, setPortalType] = useState(null); // 'patient', 'staff', or null

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "patient") {
      setPortalType("patient");
    } else if (roleParam === "staff") {
      setPortalType("staff");
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!emailId.trim() || !password) {
      setAuthError("Please fill in all credentials.");
      return;
    }
    setAuthError("");
    setIsSubmitting(true);

    try {
      // Call the unified login endpoint
      const tokenData = await login({
        username: emailId.trim(),
        password: password
      });
      const jwtToken = tokenData.access_token;
      const roleType = tokenData.role_type;

      // Validate portal type selection matches the account type
      if (roleType === "patient" && portalType === "staff") {
        throw new Error("This is a Patient account. Please log in through the Patient Portal.");
      }
      if (roleType === "staff" && portalType === "patient") {
        throw new Error("This is a Staff account. Please log in through the Staff Portal.");
      }

      if (roleType === "patient") {
        // Clear staff items to avoid layout/sidebar contamination
        localStorage.removeItem("staff_jwt_token");
        localStorage.removeItem("staff_user");

        // Save token to localStorage first so getPatientProfile interceptor can use it
        localStorage.setItem("patient_jwt_token", jwtToken);

        // Fetch patient profile details
        const patientProfile = await getPatientProfile();

        // Save details to localStorage
        localStorage.setItem("patient_token", patientProfile.token);
        localStorage.setItem("patient_name", patientProfile.name);
        localStorage.setItem("patient_phone", patientProfile.phone);
        localStorage.setItem("patient_email", patientProfile.email);
        localStorage.setItem("patient_profile_picture", patientProfile.profile_picture || "");

        // Check for appointment booking parameters
        const bookingDoctorId = searchParams.get("doctorId");
        const bookingDate = searchParams.get("date");
        const bookingTime = searchParams.get("time");

        setIsSubmitting(false);

        if (bookingDoctorId && bookingDate && bookingTime) {
          router.push(`/patient/appointments?action=book&doctorId=${bookingDoctorId}&date=${bookingDate}&time=${bookingTime}`);
        } else {
          router.push("/patient/dashboard");
        }
      } else {
        // Clear patient items to avoid layout/sidebar contamination
        localStorage.removeItem("patient_jwt_token");
        localStorage.removeItem("patient_token");
        localStorage.removeItem("patient_name");
        localStorage.removeItem("patient_phone");
        localStorage.removeItem("patient_email");
        localStorage.removeItem("patient_user");
        localStorage.removeItem("patient_profile_picture");

        // Save token to localStorage first so getProfile interceptor can use it
        localStorage.setItem("staff_jwt_token", jwtToken);

        // Fetch staff profile details
        const staffProfile = await getProfile();

        // Save details to localStorage
        localStorage.setItem("staff_user", JSON.stringify(staffProfile));

        // Determine redirect path based on their roles
        const userRoles = staffProfile.roles.map(r => r.toLowerCase());

        let redirectPath = "/";
        if (userRoles.includes("admin")) {
          redirectPath = "/admin/dashboard";
        } else if (userRoles.includes("doctor")) {
          redirectPath = "/doctor/dashboard";
        } else if (userRoles.includes("lab tech")) {
          redirectPath = "/labtechnicians/dashboard";
        } else if (userRoles.includes("receptionist")) {
          redirectPath = "/frontdesk";
        } else if (userRoles.includes("accountant")) {
          redirectPath = userRoles.includes("receptionist") ? "/frontdesk" : "/frontdesk/accountant/dashboard";
        }

        setIsSubmitting(false);
        router.push(redirectPath);
      }
    } catch (err) {
      setIsSubmitting(false);
      setAuthError(err.message || "Failed to log in. Please try again.");
    }
  };

  if (!portalType) {
    return (
      <div className="w-full max-w-xl bg-slate-800/95 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[460px] animate-fadeIn">
        <div className="space-y-6 w-full">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1 text-blue-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Welcome to SmileCare
            </h3>
            <p className="text-slate-400 text-xs font-semibold">Please select your portal to continue</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Patient Option Card */}
            <button
              onClick={() => {
                setPortalType("patient");
                setAuthError("");
              }}
              className="group flex flex-col items-center text-center p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 hover:border-sky-500/80 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-sky-500/10 text-left"
            >
              <div className="p-4 bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400 rounded-2xl transition-all duration-300 mb-4 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-sky-400 transition-colors text-center w-full">Patient Portal</h4>
              <p className="text-slate-400 text-xs leading-relaxed text-center">
                Access your dental history, view prescriptions, book appointments, and check billing statements.
              </p>
            </button>

            {/* Staff Option Card */}
            <button
              onClick={() => {
                setPortalType("staff");
                setAuthError("");
              }}
              className="group flex flex-col items-center text-center p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 hover:border-indigo-500/80 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-500/10 text-left"
            >
              <div className="p-4 bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 rounded-2xl transition-all duration-300 mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors text-center w-full">Staff Portal</h4>
              <p className="text-slate-400 text-xs leading-relaxed text-center">
                Access practitioner dashboards, manage receptionist desk, patient queues, and execute billing audits.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-slate-800/95 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[460px] animate-fadeIn">
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setPortalType(null);
              setEmailId("");
              setPassword("");
              setAuthError("");
              router.replace("/login");
            }}
            className="flex items-center gap-1 text-blue-400 hover:text-white text-xs font-bold transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Selection
          </button>
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded ${portalType === "patient" ? "bg-orange-500/20 text-orange-400" : "bg-orange-500/20 text-orange-400"
            }`}>
            {portalType === "patient" ? "Patient" : "Staff"} Portal
          </span>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> {portalType === "patient" ? "Patient Login" : "Staff Login"}
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            {portalType === "patient"
              ? "Enter your registered email address or phone number to sign in"
              : "Enter your clinic credentials or username to sign in"
            }
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {portalType === "patient" ? "Phone Number or Email" : "Username or Email"}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-slate-500 w-4 h-4" />
              <input
                type="text"
                required
                value={emailId}
                onChange={(e) => {
                  setEmailId(e.target.value);
                  setAuthError("");
                }}
                placeholder={portalType === "patient" ? "Username" : "Username"}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary transition-all text-white placeholder:text-slate-650"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-slate-500 w-4 h-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError("");
                }}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary transition-all text-white placeholder:text-slate-650"
              />
            </div>
          </div>

          {authError && <p className="text-danger text-[11px] font-semibold">{authError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white text-xs font-bold py-3 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>Sign In <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </form>

        {portalType === "patient" && (
          <div className="text-center pt-1 animate-fadeIn">
            <Link
              href="/register"
              className="text-xs text-secondary hover:text-secondary/80 font-bold transition-all cursor-pointer"
            >
              Not registered? Create Patient Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans selection:bg-primary selection:text-white relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e912_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e912_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <ToothIcon className="w-8 h-8 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SmileCare</span>
          </Link>
          <Link
            href="/"
            className="text-slate-450 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Suspense fallback={
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-3xl p-8 min-h-[460px] flex items-center justify-center">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950/40 border-t border-slate-800/80 text-slate-500 py-6 px-6 text-center">
        <p className="text-xs font-semibold">© {new Date().getFullYear()} SmileCare Dental Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
