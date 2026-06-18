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
  Sparkles
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

const dummyCredentials = {
  patient: { identifier: "9876543210", password: "patient123" },
  doctor: { identifier: "anoop.nair", password: "doctor123" },
  lab: { identifier: "alen.john", password: "lab123" },
  frontdesk: { identifier: "desk.executive", password: "desk123" },
  admin: { identifier: "admin", password: "admin123" }
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
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && roles[roleParam]) {
      handleRoleSelect(roleParam);
    } else {
      setSelectedRole(null);
    }
  }, [searchParams]);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setAuthError("");
    
    // Auto-fill dummy credentials
    const credentials = dummyCredentials[roleKey];
    setLoginData({
      identifier: credentials ? credentials.identifier : "",
      password: credentials ? credentials.password : ""
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) {
      setAuthError("Please fill in all credentials.");
      return;
    }
    setAuthError("");
    setIsSubmitting(true);

    // Simulated short delay for professional feel
    setTimeout(() => {
      setIsSubmitting(false);
      const targetRole = roles[selectedRole];
      if (targetRole) {
        if (selectedRole === "patient") {
          localStorage.setItem("patient_token", "demo-token");
          localStorage.setItem("patient_name", "Demo Patient");
          localStorage.setItem("patient_phone", loginData.identifier);
        }
        router.push(targetRole.redirect);
      }
    }, 1200);
  };

  const clearRole = () => {
    setSelectedRole(null);
    setLoginData({ identifier: "", password: "" });
    setAuthError("");
    router.replace("/login");
  };

  return (
    <div className="w-full max-w-lg bg-slate-800/95 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[460px]">
      
      {/* ROLE SELECTION VIEW */}
      {!selectedRole && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Select Your Portal
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">Choose your workspace to sign in</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(roles).map(([key, role]) => {
              const Icon = role.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleRoleSelect(key)}
                  className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/40 text-left transition-all hover:scale-102 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-slate-650 transition-colors shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{role.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal line-clamp-1">{role.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LOGIN FORM VIEW */}
      {selectedRole && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div className="flex items-center justify-between">
            <button 
              onClick={clearRole}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/20 text-primary px-2.5 py-1 rounded">
              {roles[selectedRole].name}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Sign In</h3>
            <p className="text-slate-400 text-xs mt-1">Enter your credentials or use the pre-filled demo account</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {selectedRole === "patient" ? "Mobile Number" : "Username"}
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  required
                  value={loginData.identifier}
                  onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                  placeholder={selectedRole === "patient" ? "+91 XXXXX XXXXX" : "eg. anoop.nair"}
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
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary transition-all text-white placeholder:text-slate-650"
                />
              </div>
            </div>

            {/* Demo Credentials Box */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-[10px] text-slate-400 space-y-1 text-left">
              <p className="font-bold text-slate-350">Demo Credentials (Pre-filled):</p>
              <p>Login ID: <span className="text-primary font-mono select-all font-bold">{dummyCredentials[selectedRole]?.identifier}</span></p>
              <p>Password: <span className="text-primary font-mono select-all font-bold">{dummyCredentials[selectedRole]?.password}</span></p>
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

          {selectedRole === "patient" && (
            <div className="text-center pt-2">
              <Link 
                href="/register"
                className="text-xs text-secondary hover:text-secondary/80 font-bold transition-all cursor-pointer"
              >
                Not registered? Create Patient Account
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Card Footer */}
      <div className="border-t border-slate-700/60 pt-4 flex items-center gap-2 text-[10px] text-slate-500">
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
