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
import ToothIcon from "@/components/ui/ToothIcon";

const dummyCredentials = {
  patient: { identifier: "9876543210", email: "patient@example.com", password: "patient123" }
};

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

  const detectRole = (emailOrId) => {
    if (!emailOrId) return null;
    const cleaned = emailOrId.trim().toLowerCase();
    
    // Check dummy credentials
    for (const [roleKey, creds] of Object.entries(dummyCredentials)) {
      if (
        cleaned === creds.identifier.toLowerCase() ||
        cleaned === creds.email.toLowerCase()
      ) {
        return roleKey;
      }
    }

    // Check localStorage registered patient
    if (typeof window !== "undefined") {
      const registeredEmail = localStorage.getItem("patient_email");
      const registeredPhone = localStorage.getItem("patient_phone");
      if (
        (registeredEmail && cleaned === registeredEmail.toLowerCase()) ||
        (registeredPhone && cleaned === registeredPhone.replace(/\s+/g, ""))
      ) {
        return "patient";
      }
    }

    return null;
  };

  const activeRole = detectRole(emailId);

  // Autofill disabled

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!emailId.trim() || !password) {
      setAuthError("Please fill in all credentials.");
      return;
    }
    setAuthError("");
    setIsSubmitting(true);

    const targetRoleKey = detectRole(emailId);

    // 1. Patient flow (stays local-only as requested)
    if (targetRoleKey === "patient") {
      setTimeout(() => {
        setIsSubmitting(false);
        const registeredEmail = localStorage.getItem("patient_email");
        const registeredPhone = localStorage.getItem("patient_phone");
        
        const isRegisteredPatient = (registeredEmail && emailId.trim().toLowerCase() === registeredEmail.toLowerCase()) ||
          (registeredPhone && emailId.trim().replace(/\s+/g, "") === registeredPhone.replace(/\s+/g, ""));
          
        if (!isRegisteredPatient && emailId.trim().toLowerCase() !== "patient@example.com") {
          setAuthError("Patient account not found. Please register first.");
          return;
        }
        
        localStorage.setItem("patient_token", "demo-token");
        if (!localStorage.getItem("patient_name")) {
          localStorage.setItem("patient_name", isRegisteredPatient ? localStorage.getItem("patient_name") || "Registered Patient" : "Demo Patient");
        }
        if (!localStorage.getItem("patient_phone")) {
          localStorage.setItem("patient_phone", emailId);
        }
        router.push("/patient/dashboard");
      }, 800);
      return;
    }

    // 2. Staff flow (hits real PostgreSQL database via backend API)
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: emailId.trim(),
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid credentials.");
      }

      const userData = await response.json();
      setIsSubmitting(false);

      // Save user details to localStorage
      localStorage.setItem("staff_user", JSON.stringify(userData));
      
      // Determine redirect path based on their roles
      const userRoles = userData.roles.map(r => r.toLowerCase());
      
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

      router.push(redirectPath);
    } catch (err) {
      setIsSubmitting(false);
      setAuthError(err.message || "Failed to log in. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-800/95 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[460px]">
      
      <div className="space-y-6 w-full animate-fadeIn">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-1 text-slate-450 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          {activeRole && (
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded ${
              activeRole === "patient" ? "bg-sky-500/20 text-sky-400" :
              activeRole === "doctor" ? "bg-teal-500/20 text-teal-400" :
              activeRole === "lab" ? "bg-amber-500/20 text-amber-400" :
              activeRole === "frontdesk" ? "bg-green-500/20 text-green-400" :
              "bg-indigo-500/20 text-indigo-400"
            }`}>
              {roles[activeRole].name} Portal
            </span>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Portal Login
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">Enter your credentials or choose a quick login option below</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Email Address or Username
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
                placeholder="eg. doctor@example.com or anoop.nair"
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

        {/* Quick Demo Accounts removed */}

        <div className="text-center pt-1">
          <Link 
            href="/register"
            className="text-xs text-secondary hover:text-secondary/80 font-bold transition-all cursor-pointer"
          >
            Not registered? Create Patient Account
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-700/60 pt-4 mt-4 flex items-center gap-2 text-[10px] text-slate-500">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <span>Protected by SmileCare HIPAA Compliance Standard.</span>
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
