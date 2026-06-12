"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  User, 
  Shield, 
  Microscope, 
  Key, 
  Phone, 
  Lock, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Heart,
  Clock,
  CheckCircle2,
  X,
  Activity,
  ChevronRight,
  UserPlus
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

export default function Home() {
  const router = useRouter();

  // Booking Modal States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Form, 2: Success
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    service: "General Dentistry",
    doctor: "Dr. Anoop Nair",
    date: "",
    slot: "Morning (09:00 AM - 12:00 PM)"
  });

  // Auth States
  const [authView, setAuthView] = useState("role-select"); // role-select | login | register
  const [selectedRole, setSelectedRole] = useState(null); // patient | doctor | lab | frontdesk | admin
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    age: "",
    gender: "Female"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

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
      redirect: "/frontdesk/receptionist/dashboard"
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

  // Handlers
  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setAuthError("");
    setLoginData({ identifier: "", password: "" });
    setAuthView("login");
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
        router.push(targetRole.redirect);
      }
    }, 1200);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.phone || !registerData.password) {
      setAuthError("Please fill in Name, Phone, and Password.");
      return;
    }
    setAuthError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      // Simulate registering patient and sending to dashboard
      router.push("/patient/dashboard");
    }, 1200);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.phone || !bookingData.date) {
      alert("Please fill in Name, Phone, and Appointment Date.");
      return;
    }
    setBookingStep(2); // Show success screen
  };

  const resetBooking = () => {
    setBookingData({
      name: "",
      phone: "",
      service: "General Dentistry",
      doctor: "Dr. Anoop Nair",
      date: "",
      slot: "Morning (09:00 AM - 12:00 PM)"
    });
    setBookingStep(1);
    setIsBookingOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setAuthView("role-select"); setSelectedRole(null); }}>
            <ToothIcon className="w-8 h-8 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SmileCare</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#portals" className="hover:text-primary transition-colors">Staff Portals</a>
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Book Appointment
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <a 
              href="#portals" 
              className="bg-primary text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-102 cursor-pointer"
            >
              Portal Login
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-secondary/5 pt-12 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Premium Dental Care CRM
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Clinical Excellence <br/>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Meets Smart Logistics</span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              SmileCare unites patients, doctors, lab specialists, and front desk operators in one real-time dental ecosystem. Check waitlists, coordinate crown productions, and view electronic health sheets instantly.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all hover:scale-102 cursor-pointer"
              >
                <Calendar className="w-5 h-5" /> Book Appointment
              </button>
              <a 
                href="#portals"
                className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 font-bold px-7 py-3.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Portal Sign In <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-8 max-w-lg">
              <div>
                <p className="text-2xl font-black text-slate-800">10k+</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Patients Served</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">99.4%</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Satisfaction Rating</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">&lt;5 min</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Lobby Wait Time</p>
              </div>
            </div>

          </div>

          {/* Premium Preview Component Graphic */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10"></div>
            
            <div className="bg-white/80 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl max-w-sm w-full space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">LIVE METRIC</p>
                    <p className="text-sm font-black text-slate-800">Chair occupancy</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">In Chair</span>
                  <span className="font-bold text-slate-700">Sneha Joseph (#003)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Treatment</span>
                  <span className="font-bold text-slate-700">Scaling & Extraction</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-4/5 rounded-full"></div>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">Dr. Anoop Nair</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">Operatory 1</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fully Connected Clinic Workflow</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">SmileCare integrates operations across five clinical roles to speed up treatment delivery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:scale-102 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Patient Transparency</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Book visits, read diagnosis logs, access active tooth restorations, and settle statements instantly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:scale-102 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Clinical Workdesk</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Interactive tooth charts, live chair timers, safety alerts for medical sensitivities, and instant prescriptions.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:scale-102 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Microscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Lab Order Pipeline</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Real-time tracker for prosthetic restorations, crown shade validations, and digital case dispatch boards.</p>
          </div>
        </div>
      </section>

      {/* Portals / Authentication Area */}
      <section id="portals" className="py-20 bg-slate-900 px-6 text-white relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e912_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e912_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-5 text-left space-y-5">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              One Clinic System. <br/>
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
            {/* Main Auth Card Container */}
            <div className="bg-slate-800 border border-slate-700/60 rounded-3xl p-8 shadow-2xl max-w-lg w-full min-h-[420px] flex flex-col justify-between">
              
              {/* VIEW 1: ROLE SELECTION */}
              {authView === "role-select" && (
                <div className="space-y-6 w-full">
                  <div>
                    <h3 className="text-xl font-bold text-white">Select Your Portal</h3>
                    <p className="text-slate-400 text-xs mt-1">Choose your workspace to sign in</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(roles).map(([key, role]) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => handleRoleSelect(key)}
                          className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-700/60 hover:bg-slate-700/40 text-left transition-all hover:scale-102 group cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-slate-650 transition-colors shrink-0">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{role.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{role.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 2: LOGIN CREDENTIALS */}
              {authView === "login" && selectedRole && (
                <div className="space-y-6 w-full">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setAuthView("role-select")}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/20 text-primary px-2.5 py-1 rounded">
                      {roles[selectedRole].name}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">Sign In</h3>
                    <p className="text-slate-400 text-xs mt-1">Enter your {selectedRole === "patient" ? "Mobile Number" : "Username"} and Password</p>
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
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary transition-all text-white placeholder:text-slate-600"
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
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary transition-all text-white placeholder:text-slate-600"
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

                  {selectedRole === "patient" && (
                    <div className="text-center pt-2">
                      <button 
                        onClick={() => { setAuthView("register"); setAuthError(""); }}
                        className="text-xs text-secondary hover:text-secondary/80 font-bold transition-all cursor-pointer"
                      >
                        Not registered? Create Patient Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: PATIENT REGISTRATION */}
              {authView === "register" && (
                <div className="space-y-5 w-full">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setAuthView("login")}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                    </button>
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-secondary/20 text-secondary px-2.5 py-1 rounded">
                      Registration
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">Create Patient Account</h3>
                    <p className="text-slate-400 text-xs mt-1">Register to start managing your records and booking history</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          placeholder="Rahul Kumar"
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Mobile Number</label>
                        <input 
                          type="text" 
                          required
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="rahul@example.com"
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
                        <input 
                          type="password" 
                          required
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          placeholder="••••••"
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Age</label>
                        <input 
                          type="number" 
                          required
                          value={registerData.age}
                          onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                          placeholder="32"
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gender</label>
                        <select 
                          value={registerData.gender}
                          onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 px-2 text-xs outline-none focus:border-primary text-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {authError && <p className="text-danger text-[11px] font-semibold">{authError}</p>}

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-secondary/95 transition-all shadow-md shadow-secondary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>Register & Sign In <ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Dynamic Footer Information in Auth Card */}
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

      {/* APPOINTMENT BOOKING MODAL */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-md w-full relative space-y-6 animate-scaleIn text-left">
            
            {/* Close Button */}
            <button 
              onClick={resetBooking}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: FORM */}
            {bookingStep === 1 ? (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                    Request Appointment
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Schedule Your Roster Slot</h3>
                  <p className="text-slate-400 text-xs">Fill in your information to reserve a clinical consultation.</p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                      placeholder="eg. Rahul Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mobile Number</label>
                    <input 
                      type="tel" 
                      required
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      placeholder="eg. +91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Type</label>
                      <select 
                        value={bookingData.service}
                        onChange={(e) => setBookingData({ ...bookingData, service: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-primary focus:bg-white text-slate-700"
                      >
                        <option value="General Dentistry">General Dentistry</option>
                        <option value="Endodontics">Endodontics</option>
                        <option value="Orthodontics">Orthodontics</option>
                        <option value="Oral Surgery">Oral Surgery</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Specialist</label>
                      <select 
                        value={bookingData.doctor}
                        onChange={(e) => setBookingData({ ...bookingData, doctor: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-primary focus:bg-white text-slate-700"
                      >
                        <option value="Dr. Anoop Nair">Dr. Anoop Nair</option>
                        <option value="Dr. James Kurt">Dr. James Kurt</option>
                        <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</label>
                      <input 
                        type="date" 
                        required
                        value={bookingData.date}
                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-primary focus:bg-white text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Preferred Slot</label>
                      <select 
                        value={bookingData.slot}
                        onChange={(e) => setBookingData({ ...bookingData, slot: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-primary focus:bg-white text-slate-700"
                      >
                        <option value="Morning (09:00 AM - 12:00 PM)">Morning</option>
                        <option value="Afternoon (02:00 PM - 05:00 PM)">Afternoon</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white text-xs font-bold py-3 rounded-2xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    Confirm Booking Request <Check className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              /* STEP 2: SUCCESS VIEW */
              <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Request Received!</h3>
                  <p className="text-slate-500 text-xs max-w-sm">
                    Thank you <span className="font-bold text-slate-800">{bookingData.name}</span>. Your request for <span className="font-bold text-slate-800">{bookingData.service}</span> with <span className="font-bold text-slate-800">{bookingData.doctor}</span> is queued.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-1.5 w-full">
                  <div className="flex justify-between">
                    <span className="text-slate-450">Date:</span>
                    <span className="font-bold text-slate-700">{bookingData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Preferred Slot:</span>
                    <span className="font-bold text-slate-700">{bookingData.slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Contact:</span>
                    <span className="font-bold text-slate-700">{bookingData.phone}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-semibold italic">A confirmation SMS and reminder will be sent to your phone number shortly.</p>

                <button 
                  onClick={resetBooking}
                  className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer mt-4"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}