"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  Shield,
  UserPlus
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

export default function RegisterPage() {
  const router = useRouter();

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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.phone || !registerData.password || !registerData.email || !registerData.age) {
      setAuthError("Please fill in all registration fields.");
      return;
    }
    setAuthError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/patient/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: registerData.name,
          phone: registerData.phone,
          email: registerData.email,
          password: registerData.password,
          age: parseInt(registerData.age, 10) || 0,
          gender: registerData.gender
        })
      });

      const data = await response.json();

      if (!response.ok) {
        let errMsg = "Registration failed. Please try again.";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errMsg = data.detail.map(err => err.msg).join(", ");
          } else {
            errMsg = data.detail;
          }
        }
        throw new Error(errMsg);
      }

      // Store registered patient info in localStorage
      localStorage.setItem("patient_token", data.token);
      localStorage.setItem("patient_name", data.name);
      localStorage.setItem("patient_phone", data.phone);
      localStorage.setItem("patient_email", data.email);

      // Redirect to dashboard
      router.push("/patient/dashboard");
    } catch (err) {
      setAuthError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="w-full max-w-lg bg-slate-800/95 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[460px] animate-fadeIn">
          <div className="space-y-5 w-full">
            <div className="flex items-center justify-between">
              <Link 
                href="/login?role=patient"
                className="flex items-center gap-1 text-slate-450 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-secondary/20 text-secondary px-2.5 py-1 rounded">
                Registration
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-secondary" /> Create Patient Account
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-medium">Register to start managing your records and booking history</p>
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
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600"
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
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600"
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
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600"
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
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600"
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
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gender</label>
                  <select 
                    value={registerData.gender}
                    onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl py-2 px-2 text-xs outline-none focus:border-primary text-white"
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

          {/* Card Footer */}
          <div className="border-t border-slate-700/60 pt-4 mt-5 flex items-center gap-2 text-[10px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Protected by SmileCare HIPAA Compliance Standard.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950/40 border-t border-slate-800/80 text-slate-500 py-6 px-6 text-center">
        <p className="text-xs font-semibold">© {new Date().getFullYear()} SmileCare Dental Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
