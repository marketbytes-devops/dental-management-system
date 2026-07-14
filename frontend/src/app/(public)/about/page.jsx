"use client";

import { useState, useEffect } from "react";
import PublicFooter from "@/components/layout/PublicFooter";
import Link from "next/link";
import {
  Heart,
  Award,
  Users,
  Shield,
  Star,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Sparkles,
  Microscope,
  Activity,
  Smile,
  Stethoscope,
  Loader2,
} from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Accent colours cycled for doctor cards
const CARD_STYLES = [
  { gradient: "from-primary/20 to-secondary/10", accent: "bg-primary" },
  { gradient: "from-teal-100 to-emerald-50", accent: "bg-teal-500" },
  { gradient: "from-amber-100 to-yellow-50", accent: "bg-amber-500" },
  { gradient: "from-indigo-100 to-blue-50", accent: "bg-indigo-500" },
  { gradient: "from-rose-100 to-pink-50", accent: "bg-rose-500" },
  { gradient: "from-violet-100 to-purple-50", accent: "bg-violet-500" },
];

function getInitials(name) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const values = [
  {
    icon: Shield,
    title: "Patient Safety First",
    desc: "Every procedure follows the highest sterilization and safety protocols. Your health is never compromised.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Microscope,
    title: "Technology-Driven Care",
    desc: "From digital X-rays to CAD/CAM crown milling, we use cutting-edge tools for precise, painless treatment.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Activity,
    title: "Holistic Wellness",
    desc: "We treat beyond teeth — understanding your full medical history to deliver comprehensive oral health care.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Smile,
    title: "Gentle & Compassionate",
    desc: "Dental anxiety is real. Our team is trained to make every visit calm, reassuring, and comfortable.",
    color: "bg-pink-50 text-pink-600",
  },
];

export default function AboutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/public/about-stats`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load clinic data");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
      { value: `${data.total_patients}+`, label: "Patients Treated", icon: Users },
      { value: `${data.total_doctors}+`, label: "Specialist Doctors", icon: Heart },
      { value: `${data.total_staff}+`, label: "Clinic Staff", icon: Stethoscope },
      { value: "98%", label: "Satisfaction Rate", icon: Star },
    ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ToothIcon className="w-8 h-8 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SmileCare
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/about" className="text-primary">About Us</Link>
            <Link href="/" className="hover:text-primary transition-colors">Book Appointment</Link>
          </nav>

          <Link
            href="/login"
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-102"
          >
            Portal Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-secondary/5 pt-16 pb-20 px-6">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            About SmileCare
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            Redefining Dental Care{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              One Smile at a Time
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            SmileCare was founded on the belief that premium dental care should be accessible,
            transparent, and deeply personal. We blend clinical excellence with intelligent
            technology to deliver the finest oral health experience.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all hover:scale-102"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#team"
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 font-bold px-7 py-3.5 rounded-2xl hover:bg-slate-50 transition-all"
            >
              Meet Our Team
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {loading ? (
            <div className="col-span-4 flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="col-span-4 text-center text-xs text-red-400 font-semibold py-4">{error}</div>
          ) : (
            stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Mission & Story */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wide">
              Our Story
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Built by Dentists,<br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Designed for Patients
              </span>
            </h2>
            <p className="text-slate-600 leading-relaxed">
              SmileCare was established by a group of passionate dental professionals who were
              frustrated by the fragmented state of clinic management. They envisioned a place where
              cutting-edge diagnostics, real-time lab coordination, and patient empowerment would all
              live under one roof.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Today, SmileCare has grown into a full-spectrum dental ecosystem — serving patients
              with the same founding philosophy: precision, compassion, and transparency at every step.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {["ISO 9001 Certified", "NABH Accredited", "Digital-First Clinic"].map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/8 px-3 py-1.5 rounded-full"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Contact card */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/15 to-secondary/10 rounded-3xl p-8 border border-primary/10 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl shadow flex items-center justify-center">
                  <ToothIcon className="w-7 h-7 text-primary" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg">SmileCare Clinic</p>
                  <p className="text-xs text-slate-500 font-semibold">Premium Dental Practice</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MapPin, text: "Chennai, Tamil Nadu", label: "Location" },
                  { icon: Clock, text: "Mon – Sat, 9am – 7pm", label: "Hours" },
                  { icon: Phone, text: "+91 98765 43210", label: "Phone" },
                  { icon: Mail, text: "hello@smilecare.in", label: "Email" },
                ].map(({ icon: Icon, text, label }) => (
                  <div key={label} className="bg-white/70 backdrop-blur rounded-xl p-3 space-y-0.5 border border-white/80 shadow-sm">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white border border-amber-200 rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="text-xs font-black text-slate-800">4.9 / 5 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
              Our Values
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">What We Stand For</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Every decision we make — clinical or operational — is guided by these core principles.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-6 space-y-3 transition-all hover:shadow-md hover:scale-[1.02]"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team — live from DB */}
      <section id="team" className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wide">
              Our Specialists
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meet the Team</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Board-certified dental specialists dedicated to transforming your oral health journey.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-red-400 font-semibold text-sm">{error}</p>
          ) : data?.doctors?.length === 0 ? (
            <p className="text-center text-slate-400 font-semibold text-sm py-10">No doctors registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(data?.doctors || []).map((doc, idx) => {
                const style = CARD_STYLES[idx % CARD_STYLES.length];
                const initials = getInitials(doc.name);
                return (
                  <div
                    key={doc.id}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <div className={`bg-gradient-to-br ${style.gradient} h-36 flex items-center justify-center relative`}>
                      <div className={`w-20 h-20 rounded-2xl ${style.accent} text-white flex items-center justify-center text-2xl font-black shadow-lg`}>
                        {initials}
                      </div>
                    </div>
                    <div className="p-5 space-y-1.5">
                      <p className="font-black text-slate-900 text-sm">{doc.name}</p>
                      <p className="text-[11px] text-primary font-bold">Specialist</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{doc.specialty}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-3xl font-black text-white">Ready to Experience SmileCare?</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Book an appointment today and join our growing community of patients who trust SmileCare for their dental wellness.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login?role=patient"
              className="bg-white text-primary font-bold px-7 py-3.5 rounded-2xl hover:bg-slate-50 transition-all hover:scale-102 shadow-lg"
            >
              Book Appointment
            </Link>
            <Link
              href="/login"
              className="border border-white/40 text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-white/10 transition-all"
            >
              Staff Portal Login
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
