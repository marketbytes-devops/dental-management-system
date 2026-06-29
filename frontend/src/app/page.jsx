"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  Shield,
  Microscope,
  Sparkles,
  ChevronRight,
  UserPlus,
  Heart,
  Clock,
  CheckCircle2,
  X,
  Activity,
  ArrowRight
} from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";

export default function Home() {
  const router = useRouter();

  // Booking Modal & Auth Gate States
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);

  // Role Constants
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

  // Trigger Auth Gate actions
  const triggerAuthGateAction = (action) => {
    setIsAuthGateOpen(false);
    if (action === "login") {
      router.push("/login?role=patient");
    } else if (action === "register") {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <ToothIcon className="w-8 h-8 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SmileCare</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#portals" className="hover:text-primary transition-colors">Staff Portals</a>
            <button
              onClick={() => setIsAuthGateOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Book Appointment
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-primary text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-102 cursor-pointer"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-secondary/5 pt-10 md:pt-25 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center">

          <div className="space-y-6 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Premium Dental Care CRM
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Clinical Excellence <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Meets Smart Logistics</span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 max-w-4xl leading-relaxed mx-auto">
              SmileCare unites patients, doctors, lab specialists, and front desk operators in one real-time dental ecosystem. Check waitlists, coordinate crown productions, and view electronic health sheets instantly.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 justify-center">
              <button
                onClick={() => setIsAuthGateOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all hover:scale-102 cursor-pointer"
              >
                <Calendar className="w-5 h-5" /> Book Appointment
              </button>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 font-bold px-7 py-3.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Portal Sign In <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-8 max-w-lg">
              <div>
                <p className="text-lg font-black text-slate-800">10k+</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Patients Served</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">99.4%</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Satisfaction Rating</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">&lt;5 min</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Lobby Wait Time</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-15 px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fully Connected Clinic Workflow</h2>
          <p className="text-slate-700 text-lg max-w-4xl mx-auto font-medium">SmileCare integrates operations across five clinical roles to speed up treatment delivery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:scale-102 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Patient Transparency</h3>
            <p className="text-slate-600 text-md leading-relaxed">Book visits, read diagnosis logs, access active tooth restorations, and settle statements instantly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:scale-102 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Clinical Workdesk</h3>
            <p className="text-slate-600 text-md leading-relaxed">Interactive tooth charts, live chair timers, safety alerts for medical sensitivities, and instant prescriptions.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:scale-102 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Microscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Lab Order Pipeline</h3>
            <p className="text-slate-600 text-md leading-relaxed">Real-time tracker for prosthetic restorations, crown shade validations, and digital case dispatch boards.</p>
          </div>
        </div>
      </section>

      {/* Portals Selector Area */}
      <section id="portals" className="py-20 bg-slate-900 px-6 text-white relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e912_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e912_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          <div className="lg:col-span-5 text-left space-y-5">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              One Clinic System. <br />
              Five Interactive Roles.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              SmileCare operates a single unified database. Select your portal type to access your specialized interface. Patients can sign up instantly to review their status.
            </p>
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                <span>Zero manual syncing between front desk and chair.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                <span>Encrypted medical records database.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center">
            {/* Role Gateway Container */}
            <div className="bg-slate-800 border border-slate-700/60 rounded-3xl p-8 shadow-2xl max-w-lg w-full min-h-[420px] flex flex-col justify-between">

              <div className="space-y-6 w-full">
                <div>
                  <h3 className="text-xl font-bold text-white">Select Your Portal</h3>
                  <p className="text-slate-400 text-xs mt-1">Choose your workspace to sign in</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(roles).map(([key, role]) => {
                    const Icon = role.icon;
                    return (
                      <Link
                        key={key}
                        href={`/login?role=${key}`}
                        className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-700/60 hover:bg-slate-700/40 text-left transition-all hover:scale-102 group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-slate-650 transition-colors shrink-0">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{role.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{role.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Secure Stamp */}
              <div className="border-t border-slate-700/60 pt-4 flex items-center gap-2 text-[10px] text-slate-500">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected by SmileCare HIPAA Compliance Standard.</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Main Footer */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-slate-500 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ToothIcon className="w-6 h-6 text-slate-650" />
            <span className="font-black text-slate-450 tracking-tight">SmileCare Clinic Portal</span>
          </div>
          <p className="text-xs font-semibold">© {new Date().getFullYear()} SmileCare Dental Ltd. All rights reserved.</p>
        </div>
      </footer>

      {/* AUTHENTICATION GATE MODAL FOR BOOK APPOINTMENT */}
      {isAuthGateOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-sm w-full relative space-y-6 text-center animate-scaleIn">

            {/* Close Button */}
            <button
              onClick={() => setIsAuthGateOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Sign In to Book Appointment</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                To reserve an appointment slot with a SmileCare specialist, you must sign in as a patient or create a new registration record.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => triggerAuthGateAction("login")}
                className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In as Patient <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => triggerAuthGateAction("register")}
                className="w-full bg-secondary hover:bg-secondary/95 text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Register New Account <UserPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAuthGateOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold py-2.5 rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}