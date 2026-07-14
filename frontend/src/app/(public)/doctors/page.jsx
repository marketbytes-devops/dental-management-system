"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PublicFooter from "@/components/layout/PublicFooter";
import DoctorGrid from "@/components/features/public/DoctorGrid";

export default function DoctorsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-600">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-primary text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-md hover:bg-primary/95 transition-all"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
              <p>Expert Care</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Meet Our Specialists</h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Browse through our team of experienced professionals dedicated to providing you with the best dental care possible. Choose a doctor to view their profile or book an appointment.
            </p>
          </div>
          
          <DoctorGrid />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
